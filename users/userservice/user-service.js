// user-service.js
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
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

// Pequeña función para sanear el username
function sanitizeUsername(username) {
    if (typeof username !== 'string') {
        throw new Error('Invalid username');
    }
    return username.trim();
}

// Función para sanear valores numéricos
function sanitizeNumber(value) {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
}

// **Crear un usuario**
app.post('/adduser', async (req, res) => {
    try {
        validateRequiredFields(req, ['username', 'password']);

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

app.get('/profile/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({
      _id: user._id,
      username: user.username,
      gamesPlayed: user.gamesPlayed,
      correctAnswers: user.correctAnswers,
      wrongAnswers: user.wrongAnswers,
      totalTimePlayed: user.totalTimePlayed,
      gameHistory: user.gameHistory,
      challengeRequest: user.challengeRequest || null 
    });
  } catch (error) {
    console.error(`Error al obtener el perfil del usuario ${req.params.username}:`, error);
    res.status(500).json({ error: `Error al obtener el perfil del usuario ${req.params.username}` });
  }
});


// **Actualizar estadísticas del usuario** 
app.post('/updateStats', async (req, res) => {
    try {
      const { username, correct, wrong, timeTaken } = req.body;
  
      if (!username) {
        return res.status(400).json({ error: "El nombre de usuario es obligatorio" });
      }

      // Sanitize inputs
      const sanitizedUsername = sanitizeUsername(username);
      const sanitizedCorrect = sanitizeNumber(correct);
      const sanitizedWrong = sanitizeNumber(wrong);
      const sanitizedTimeTaken = sanitizeNumber(timeTaken);
  
      // Use sanitizedUsername in the query
      const user = await User.findOne({ username: sanitizedUsername });
      if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
  
      user.correctAnswers += sanitizedCorrect;
      user.wrongAnswers += sanitizedWrong;
      user.totalTimePlayed += sanitizedTimeTaken;
  
      // Agrega una única entrada al historial
      user.gameHistory.push({
        date: new Date(),
        correct: sanitizedCorrect,
        wrong: sanitizedWrong,
        timePlayed: sanitizedTimeTaken
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

        const sanitizedUsername = sanitizeUsername(username);
        const user = await User.findOne({ username: sanitizedUsername });
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

app.post('/friends', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Falta el nombre de usuario' });
    }

    // Validación y sanitización
    if (typeof username !== 'string') {
      return res.status(400).json({ error: 'Nombre de usuario inválido' });
    }

    const sanitizedUsername = sanitizeUsername(username);

    const user = await User.findOne({ username: sanitizedUsername }).populate('friends', 'username');

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const friendUsernames = user.friends.map(friend => friend.username);
    res.json({ friends: friendUsernames });
  } catch (error) {
    console.error("Error al obtener amigos:", error.message);
    res.status(500).json({ error: 'Error al obtener la lista de amigos' });
  }
});


app.post('/addFriend', async (req, res) => {
  try {
    const { userId, friendId } = req.body;

    if (!userId || !friendId) {
      return res.status(400).json({ error: "Faltan userId o friendId" });
    }

    if (userId === friendId) {
      return res.status(400).json({ error: "No puedes agregarte a ti mismo como amigo" });
    }

    const user = await User.findById(userId);
    const friend = await User.findById(friendId);

    if (!user || !friend) {
      return res.status(404).json({ error: "Usuario o amigo no encontrado" });
    }

    // Verificar si ya son amigos (en cualquiera de las direcciones)
    const alreadyFriends = user.friends.some(id => id.toString() === friendId);
    const alreadyMutual = friend.friends.some(id => id.toString() === userId);

    if (alreadyFriends && alreadyMutual) {
      return res.status(409).json({ message: "Ya está en tu lista de amigos" });
    }

    if (!alreadyFriends) {
      user.friends.push(friend._id);
    }

    if (!alreadyMutual) {
      friend.friends.push(user._id);
    }

    await user.save();
    await friend.save();

    res.json({ message: "Amistad creada correctamente", friendUsername: friend.username });
  } catch (error) {
    console.error("Error al añadir amigo:", error);
    res.status(500).json({ error: "Error al añadir amigo" });
  }
});

app.post('/removeFriend', async (req, res) => {
  try {
    const { userId, friendUsername } = req.body;

    if (!userId || !friendUsername) {
      return res.status(400).json({ error: "Faltan userId o friendUsername" });
    }

    // Validación y sanitización
    if (typeof userId !== 'string' || typeof friendUsername !== 'string') {
      return res.status(400).json({ error: "Datos inválidos" });
    }

    const sanitizedFriendUsername = sanitizeUsername(friendUsername);

    // Buscar usuarios usando valores saneados
    const user = await User.findById(userId); // userId es un ObjectId, validarlo si quieres más seguridad
    const friend = await User.findOne({ username: sanitizedFriendUsername });

    if (!user || !friend) {
      return res.status(404).json({ error: "Usuario o amigo no encontrado" });
    }

    // Filtrar para eliminar del array de amigos en ambos sentidos
    user.friends = user.friends.filter(id => id.toString() !== friend._id.toString());
    friend.friends = friend.friends.filter(id => id.toString() !== user._id.toString());

    await user.save();
    await friend.save();

    res.json({ message: "Amigo eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar amigo:", error);
    res.status(500).json({ error: "Error al eliminar amigo" });
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

app.delete('/deleteUser/:username', async (req, res) => {
  try {
    // Verifica el token y el rol admin
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, 'your-secret-key'); // Usa la misma clave que en auth-service
    } catch (err) {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }

    if (!decoded || decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador.' });
    }

    const { username } = req.params;
    const deletedUser = await User.findOneAndDelete({ username });

    if (!deletedUser) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({ message: `Usuario ${username} eliminado correctamente.` });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    res.status(500).json({ error: "Error al eliminar usuario" });
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
