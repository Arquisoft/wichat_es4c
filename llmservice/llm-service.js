const axios = require('axios');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 8003;

app.use(cors());
app.use(express.json());

// Configuración de Gemini
const llmConfigs = {
  gemini: {
    url: (apiKey) => `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    transformRequest: (fullPrompt) => ({
      contents: [{ parts: [{ text: fullPrompt }] }]
    }),
    transformResponse: (response) => {
      if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        return null;
      }
      return response.data.candidates[0].content.parts[0].text;
    }
  }
};

// Validación de campos requeridos
function validateRequiredFields(req, requiredFields) {
  for (const field of requiredFields) {
    if (!(field in req.body)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
}

// Función para enviar preguntas al LLM
async function sendQuestionToLLM(question, apiKey, model = 'gemini') {
  const config = llmConfigs[model];
  if (!config) {
    throw new Error(`Model "${model}" is not supported.`);
  }

  try {
    const url = config.url(apiKey);
    const requestData = config.transformRequest(question);
    const headers = {
      'Content-Type': 'application/json',
      ...(config.headers ? config.headers(apiKey) : {})
    };

    const response = await axios.post(url, requestData, { headers });
    const result = config.transformResponse(response);
    
    if (result === null) {
      throw new Error('Invalid response structure from Gemini API');
    }
    
    return result;
  } catch (error) {
    console.error(`Error sending question to ${model}:`, error.message);
    throw new Error('Failed to get response from LLM');
  }
}

// Endpoint para preguntas
app.post('/ask', async (req, res) => {
  try {
    validateRequiredFields(req, ['question', 'model', 'correctAnswer']);
    
    const { question, model, correctAnswer } = req.body;
    const apiKey = process.env.LLM_API_KEY;
    
    // Validación adicional del modelo
    if (model !== 'gemini') {
      return res.status(400).json({ 
        error: `Model "${model}" is not supported. Only "gemini" is available.`
      });
    }

    if (!apiKey) {
      console.error('API key is missing on the server');
      return res.status(500).json({ 
        error: 'API key is missing on the server.',
        details: 'Check your .env file for LLM_API_KEY'
      });
    }

    const gamePrompt = `Eres un asistente en un juego de preguntas sobre países y sus capitales. El jugador verá imágenes relacionadas con un
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

              La respuesta correcta a la pregunta es: ${correctAnswer}. Pregunta: ${question}`;

    const answer = await sendQuestionToLLM(gamePrompt, apiKey, model);

    if (answer === null) {
      console.error('LLM returned null answer');
      return res.status(500).json({ 
        error: 'Failed to get response from LLM.',
        details: 'Check LLM service connection and API key'
      });
    }
    
    console.log('Received answer from LLM:', answer);
    return res.json({ answer });
    
  } catch (error) {
    console.error('Error in /ask endpoint:', error);
    const statusCode = error.message.includes('Missing required field') ? 400 : 500;
    return res.status(statusCode).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Iniciar servidor
const server = app.listen(port, () => {
  console.log(`LLM Service listening at http://localhost:${port}`);
});

// Exportar para pruebas
module.exports = {
  app,
  server,
  llmConfigs,
  sendQuestionToLLM,
  validateRequiredFields
};