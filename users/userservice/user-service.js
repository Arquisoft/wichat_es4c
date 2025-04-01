// user-service.js
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
const app = express();



const User = require('./user-model')


const port = 8001;

// Middleware to parse JSON in request body
app.use(express.json());
app.use(cors());

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/userdb';
mongoose.connect(mongoUri);

app.use

// Function to validate required fields in the request body
function validateRequiredFields(req, requiredFields) {
    for (const field of requiredFields) {
      if (!(field in req.body)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
}

app.post('/adduser', async (req, res) => {
    try {
        // Check if required fields are present in the request body
        validateRequiredFields(req, ['username', 'password']);

        // Encrypt the password before saving it
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        const newUser = new User({
            username: req.body.username,
            password: hashedPassword,
        });

        await newUser.save();
        res.json(newUser);
    } catch (error) {
        res.status(400).json({ error: error.message }); 
    }});

const server = app.listen(port, () => {
  console.log(`User Service listening at http://localhost:${port}`);
});

// 🔹 NUEVO: Endpoint para obtener los datos del perfil de un usuario
app.get('/profile/:username', async (req, res) => {
  try {
      // 🔹 Buscar usuario en la base de datos por el nombre de usuario
      const user = await User.findOne({ username: req.params.username });

      if (!user) {
          return res.status(404).json({ error: "Usuario no encontrado" }); // 🔹 Devolver error si el usuario no existe
      }

      // 🔹 Devolver solo los datos necesarios del usuario (sin la contraseña)
      res.json({
          username: user.username,
          gamesPlayed: user.gamesPlayed,
          correctAnswers: user.correctAnswers,
          wrongAnswers: user.wrongAnswers,
          totalTimePlayed: user.totalTimePlayed,
          gameHistory: user.gameHistory
      });
  } catch (error) {
    console.error(`Error al obtener el perfil del usuario ${req.params.username}:`, error); // 🔹 NUEVO: Log de error con username
    res.status(500).json({ error: `Error al obtener el perfil del usuario ${req.params.username}ww` });
  }
});

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


app.get('/ranking', async (req, res) => {
  try {
    const sortBy = req.query.sortBy || "correctAnswers"; 
    const validSortFields = ["correctAnswers", "wrongAnswers", "gamesPlayed"];
    
    if (!validSortFields.includes(sortBy)) {
      return res.status(400).json({ error: "Criterio de ordenación inválido" });
    }

    const players = await User.find().sort({ [sortBy]: -1 }).limit(10); 
    res.json(players);
  } catch (error) {
    console.error("Error al obtener el ranking:", error);
    res.status(500).json({ error: "Error al obtener el ranking" });
  }
});

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

    // 🔹 Incrementar las partidas jugadas
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
    const settings = req.body.settings; // Obtén los ajustes desde req.body

    if (!username || !settings) {
      return res.status(400).json({ error: "El nombre de usuario y los ajustes son obligatorios" });
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


// Listen for the 'close' event on the Express.js server
server.on('close', () => {
    // Close the Mongoose connection
    mongoose.connection.close();
  });

module.exports = server