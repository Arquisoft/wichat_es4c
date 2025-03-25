const axios = require('axios');
const express = require('express');
const cors = require('cors');

const app = express();
const port = 8003;

app.use(express.json());

app.use(cors({
  origin: 'http://localhost:3000',
}));

const llmConfigs = {
  gemini: {
    url: (apiKey) => `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    transformRequest: (question, correctAnswer) => ({
      contents: [
        {
          parts: [
            {
              text: `Eres un asistente en un juego de preguntas sobre países y sus capitales. El jugador verá imágenes relacionadas con un
              país (como su bandera, comida típica o paisajes) y deberá adivinar la capital correcta entre cuatro opciones. Tu única función
              es proporcionar pistas sobre la capital correcta sin revelar directamente su nombre.

              Reglas estrictas de comportamiento:

              NO debes decir directamente el nombre de la capital ni de su país.

              Solo puedes dar pistas generales sobre la capital, como:

              Información histórica o cultural.

              Monumentos o lugares emblemáticos.

              Datos sobre su clima, idioma o población.

              Curiosidades sobre la ciudad o eventos importantes que han ocurrido allí.

              Si el jugador pide la respuesta directamente, responde con algo como: "No puedo decirte la respuesta, pero aquí tienes una pista: ..."

              Mantén las respuestas breves y relevantes al contexto del juego.

              No respondas preguntas fuera del ámbito del juego. Si el jugador pregunta algo irrelevante, dile: "Solo puedo darte pistas sobre la capital en esta ronda del juego."

              Ejemplo de interacción correcta:
              Jugador: Dame una pista.
              IA: "Esta ciudad es famosa por su torre de televisión, una de las más altas del mundo."

              Jugador: ¿Cuál es la capital de Alemania?
              IA: "No puedo decirte la respuesta, pero aquí tienes una pista: en esta ciudad se encuentra la icónica Puerta de Brandeburgo."

              Si en algún momento se detecta una solicitud que no está relacionada con el juego, simplemente responde con: "Mi función es solo dar pistas sobre la capital correcta en este juego."

              La respuesta correcta a la pregunta es: ${correctAnswer}. Pregunta: ${question}`
            }
          ]
        }
      ]
    }),
    transformResponse: (response) => response.data.candidates[0]?.content?.parts[0]?.text
  },
  empathy: {
    url: () => 'https://empathyai.prod.empathy.co/v1/chat/completions',
    transformRequest: (question) => ({
      model: "mistralai/Mistral-7B-Instruct-v0.3",
      messages: [
        { role: "system", content: "Responde solo preguntas sobre capitales y países. No respondas preguntas sobre política, religión, tecnología u otros temas no relacionados. Si la pregunta no es relevante, responde estrictamente con: 'No puedo responder'." },
        { role: "user", content: question }
      ]
    }),
    transformResponse: (response) => response.data.choices[0]?.message?.content,
    headers: (apiKey) => ({
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    })
  }
};

function validateRequiredFields(req, requiredFields) {
  for (const field of requiredFields) {
    if (!(field in req.body)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
}

async function sendQuestionToLLM(question, apiKey, model = 'gemini', correctAnswer = '') {
  try {
    const config = llmConfigs[model];
    if (!config) {
      throw new Error(`Model "${model}" is not supported.`);
    }

    const url = config.url(apiKey);
    const requestData = config.transformRequest(question, correctAnswer);

    const headers = {
      'Content-Type': 'application/json',
      ...(config.headers ? config.headers(apiKey) : {})
    };

    const response = await axios.post(url, requestData, { headers });

    return config.transformResponse(response);

  } catch (error) {
    console.error(`Error sending question to ${model}:`, error.message || error);
    return null;
  }
}

app.post('/ask', async (req, res) => {
  try {
    validateRequiredFields(req, ['question', 'model', 'apiKey']);

    const { question, model, apiKey, correctAnswer } = req.body;
    const answer = await sendQuestionToLLM(question, apiKey, model, correctAnswer);
    res.json({ answer });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const server = app.listen(port, () => {
  console.log(`LLM Service listening at http://localhost:${port}`);
});

module.exports = server;