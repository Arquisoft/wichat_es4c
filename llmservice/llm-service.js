const axios = require('axios');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('LLM Service starting...');
console.log('LLM_API_KEY present:', !!process.env.LLM_API_KEY);

// Cargar prompts desde archivo JSON
let prompts;
try {
  const promptsPath = path.join(__dirname, 'prompts.json');
  prompts = JSON.parse(fs.readFileSync(promptsPath, 'utf8'));
  console.log('Prompts loaded successfully');
} catch (error) {
  console.error('Error loading prompts.json:', error.message);

  prompts = { gamePrompt: "Default game prompt" };
  console.log('Using default prompts');
}

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

// Función para sustituir variables en un template
function renderTemplate(template, variables) {
  return Object.entries(variables).reduce((text, [key, value]) => {
    return text.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }, template);
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

    // Renderizar el prompt con los valores dinámicos
    const gamePrompt = renderTemplate(prompts.gamePrompt, {
      question,
      correctAnswer
    });

    const answer = await sendQuestionToLLM(gamePrompt, apiKey, model);

    if (answer === null) {
      console.error('LLM returned null answer');
      return res.status(500).json({ 
        error: 'Failed to get response from LLM.',
        details: 'Check LLM service connection and API key'
      });
    }
    
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
  validateRequiredFields,
  renderTemplate,
  prompts
};