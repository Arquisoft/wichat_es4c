// user-service.js
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
const User = require('./user-model'); // Importar el modelo de usuario

const port = 8001;

// Middleware para parsear JSON en el cuerpo de las peticiones
app.use(express.json());
app.use(cors());

// Conectar a MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/userdb';
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Conectado a MongoDB'))
    .catch(err => console.error('Error al conectar a MongoDB:', err));

// Función para validar campos requeridos en el cuerpo de la petición
function validateRequiredFields(req, requiredFields) {
    for (const field of requiredFields) {
        if (!(field in req.body)) {
            throw new Error(`Falta el campo requerido: ${field}`);
        }
    }
}

// **Crear un usuario**
app.post('/adduser', async (req, res) => {
    try {
        validateRequiredFields(req, ['username', 'password']);

        // Encriptar la contraseña antes de guardarla
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        const newUser = new User({
            username: req.body.username,
            password: hashedPassword,
            gamesPlayed: 0,
            correctAnswers: 0,
            wrongAnswers: 0,
            totalTimePlayed: 0,
            gameHistory: [],
            role: 'user'
        });

        await newUser.save();
        res.json(newUser);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// **Obtener el perfil de un usuario**
app.get('/profile/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });

        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        res.json({
            username: user.username,
            gamesPlayed: user.gamesPlayed,
            correctAnswers: user.correctAnswers,
            wrongAnswers: user.wrongAnswers,
            totalTimePlayed: user.totalTimePlayed,
            gameHistory: user.gameHistory
        });
    } catch (error) {
        console.error(`Error al obtener el perfil del usuario ${req.params.username}:`, error);
        res.status(500).json({ error: `Error al obtener el perfil del usuario ${req.params.username}` });
    }
});

// **Actualizar estadísticas del usuario**
app.post('/updateStats', async (req, res) => {
    try {
        const { username, isCorrect, timeTaken } = req.body;

        if (!username) {
            return res.status(400).json({ error: "El nombre de usuario es obligatorio" });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        if (isCorrect) {
            user.correctAnswers += 1;
        } else {
            user.wrongAnswers += 1;
        }

        user.totalTimePlayed += timeTaken;

        user.gameHistory.push({
            date: new Date(),
            correct: isCorrect ? 1 : 0,
            wrong: isCorrect ? 0 : 1,
            timePlayed: timeTaken
        });

        await user.save();
        res.json({ message: "Estadísticas actualizadas", user });
    } catch (error) {
        console.error("Error al actualizar estadísticas:", error);
        res.status(500).json({ error: "Error al actualizar estadísticas" });
    }
});

// **Registrar partidas jugadas**
app.post('/incrementGamesPlayed', async (req, res) => {
    try {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({ error: "El nombre de usuario es obligatorio" });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        user.gamesPlayed += 1;

        await user.save();
        res.json({ message: "Partida registrada", gamesPlayed: user.gamesPlayed });
    } catch (error) {
        console.error("Error al registrar la partida:", error);
        res.status(500).json({ error: "Error al registrar la partida" });
    }
});

app.post('/saveSettings/:username', async (req, res) => {
  try {
    const username = req.params.username; // Corrige cómo se obtiene el username
    const settings = req.body; // Obtén los ajustes desde req.body

    if (!username) {
      return res.status(400).json({ error: "El nombre de usuario es obligatorios" });
    }

    if (!settings) {
      return res.status(400).json({ error: "Los ajustes son obligatorios" });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Actualizar los ajustes del usuario
    user.settings = settings;
    await user.save();
    res.json({ message: "Ajustes guardados", settings });
  } catch (error) {
    console.error("Error al guardar los ajustes:", error);
    res.status(500).json({ error: "Error al guardar los ajustes" });
  }
});

app.get('/getSettings/:username', async (req, res) => {
  try {
    const username = req.params.username;

    if (!username) {
      return res.status(400).json({ error: "El nombre de usuario es obligatorio" });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Devolver los ajustes del usuario
    res.json(user.settings);
  } catch (error) {
    console.error("Error al obtener los ajustes:", error);
    res.status(500).json({ error: "Error al obtener los ajustes" });
  }
});

// **Obtener el ranking de usuarios**
app.get('/ranking', async (req, res) => {
    try {
        const sortBy = req.query.sortBy || "correctAnswers";
        const validSortFields = ["correctAnswers", "wrongAnswers", "gamesPlayed"];

        if (!validSortFields.includes(sortBy)) {
            return res.status(400).json({ error: "Criterio de ordenación inválido" });
        }

        const players = await User.find().sort({ [sortBy]: -1 }).limit(20);
        res.json(players);
    } catch (error) {
        console.error("Error al obtener el ranking:", error);
        res.status(500).json({ error: "Error al obtener el ranking" });
    }
});

// Iniciar el servidor
const server = app.listen(port, () => {
    console.log(`User Service escuchando en http://localhost:${port}`);
});

// Cerrar la conexión de MongoDB al detener el servidor
server.on('close', () => {
    mongoose.connection.close();
});

module.exports = server;
