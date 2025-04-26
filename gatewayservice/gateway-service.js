const express = require('express');
const axios = require('axios');
const cors = require('cors');
const promBundle = require('express-prom-bundle');
const swaggerUi = require('swagger-ui-express');
const fs = require("fs");
const YAML = require('yaml');

const app = express();
const port = 8000;

const llmServiceUrl = process.env.LLM_SERVICE_URL || 'http://localhost:8003';
const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:8002';
const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:8001';
const questionServiceUrl = process.env.QUESTION_SERVICE_URL || 'http://localhost:8004';

app.use(cors());
app.use(express.json());

// Prometheus configuration
const metricsMiddleware = promBundle({ includeMethod: true });
app.use(metricsMiddleware);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Forward login request
app.post('/login', async (req, res) => {
  try {
    const authResponse = await axios.post(`${authServiceUrl}/login`, req.body);
    res.json(authResponse.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.error || "Internal Server Error" });
  }
});

// Forward add user request
app.post('/adduser', async (req, res) => {
  try {
    const userResponse = await axios.post(`${userServiceUrl}/adduser`, req.body);
    res.json(userResponse.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.error || "Internal Server Error" });
  }
});

// Forward ask LLM request
app.post('/askllm', async (req, res) => {
  try {
    const llmResponse = await axios.post(`${llmServiceUrl}/ask`, req.body);
    res.json(llmResponse.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.error || "Internal Server Error" });
  }
});

// Obtener perfil de usuario
app.get('/profile/:username', async (req, res) => {
  try {
    const response = await axios.get(`${userServiceUrl}/profile/${req.params.username}`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.error || "Error al obtener perfil" });
  }
});

// Obtener ranking de jugadores
app.get('/ranking', async (req, res) => {
  try {
    const response = await axios.get(`${userServiceUrl}/ranking`, { params: req.query });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.error || "Error al obtener ranking" });
  }
});

// Obtener lista de amigos
app.post('/friends', async (req, res) => {
  try {
    const response = await axios.post(`${userServiceUrl}/friends`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || "Error al obtener la lista de amigos"
    });
  }
});

// Añadir un amigo
app.post('/addFriend', async (req, res) => {
  try {
    const response = await axios.post(`${userServiceUrl}/addFriend`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || "Error al añadir amigo"
    });
  }
});

// Borrar un amigo
app.post('/removeFriend', async (req, res) => {
  try {
    const response = await axios.post(`${userServiceUrl}/removeFriend`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || "Error al borrar amigo"
    });
  }
});

// Retar un amigo
app.post('/challengeFriend', async (req, res) => {
  try {
    const response = await axios.post(`${userServiceUrl}/challengeFriend`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || "Error al retar a un amigo"
    });
  }
});

// Retar un amigo
app.post('/rejectChallenge', async (req, res) => {
  try {
    const response = await axios.post(`${userServiceUrl}/rejectChallenge`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || "Error al rechazar reto"
    });
  }
});

// Retar un amigo
app.post('/acceptChallenge', async (req, res) => {
  try {
    const response = await axios.post(`${userServiceUrl}/acceptChallenge`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || "Error al aceptar reto"
    });
  }
});

// Comprobar si un reto fue aceptado
app.get('/checkChallengeStatus/:username', async (req, res) => {
  try {
    const response = await axios.get(`${userServiceUrl}/checkChallengeStatus/${req.params.username}`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || "Error al comprobar el estado del reto"
    });
  }
});

// Enviar resultado de duelo
app.post('/submitDuelResult', async (req, res) => {
  try {
    const response = await axios.post(`${userServiceUrl}/submitDuelResult`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500)
       .json({ error: error.response?.data?.error || "Error al enviar resultado de duelo" });
  }
});

// Comprobar resultado de duelo
app.post('/checkDuelResult', async (req, res) => {
  try {
    const response = await axios.post(`${userServiceUrl}/checkDuelResult`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500)
       .json({ error: error.response?.data?.error || "Error al comprobar resultado de duelo" });
  }
});


// Actualizar estadísticas del usuario
app.post('/updateStats', async (req, res) => {
  try {
    const response = await axios.post(`${userServiceUrl}/updateStats`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.error || "Error al actualizar estadísticas" });
  }
});

// Incrementar partidas jugadas
app.post('/incrementGamesPlayed', async (req, res) => {
  try {
    const response = await axios.post(`${userServiceUrl}/incrementGamesPlayed`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.error || "Error al incrementar partidas" });
  }
});

// Obtener una pregunta
app.get('/question', async (req, res) => {
  try {
    const response = await axios.get(`${questionServiceUrl}/question`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: "Error al obtener pregunta" });
  }
});

app.get('/adminPanel', async (req, res) => {
  try {
    const authHeader = req.headers.authorization; 
    const authResponse = await axios.get(`${authServiceUrl}/adminPanel`, {
      headers: {
        Authorization: authHeader,
      },
    });
    res.json(authResponse.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || "Error al obtener lista de usuarios"
    });
  }
});

app.delete('/adminPanel/deleteUser/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const authHeader = req.headers.authorization;

    const response = await axios.delete(`${userServiceUrl}/deleteUser/${username}`, {
      headers: {
        Authorization: authHeader,
      },
    });

    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || "Error al eliminar usuario"
    });
  }
});


// OpenAPI - Swagger Documentation
const openapiPath = './openapi.yaml';
if (fs.existsSync(openapiPath)) {
  const file = fs.readFileSync(openapiPath, 'utf8');
  const swaggerDocument = YAML.parse(file);
  app.use('/api-doc', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} else {
  console.log("Not configuring OpenAPI. Configuration file not present.");
}

// Start the gateway service
const server = app.listen(port, () => {
  console.log(`Gateway Service listening at http://localhost:${port}`);
});

module.exports = server;
