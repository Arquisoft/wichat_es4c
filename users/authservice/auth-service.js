require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./auth-model');
const { check, matchedData, validationResult } = require('express-validator');
const app = express();
const port = 8002; 

// Middleware to parse JSON in request body
app.use(express.json());

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/userdb';
mongoose.connect(mongoUri);

// Crear usuario admin al iniciar si no existe
async function createAdminIfNotExists() {
  const adminName = process.env.ADMIN_NAME;
  const adminPswd = process.env.ADMIN_PSWD;

  if (!adminName || !adminPswd) {
    console.warn("ADMIN_NAME o ADMIN_PSWD no definido en .env");
    return;
  }

  const existingAdmin = await User.findOne({ username: adminName });
  if (!existingAdmin) {
    const hashedPswd = await bcrypt.hash(adminPswd, 10);
    await User.create({
      username: adminName,
      password: hashedPswd,
      role: 'admin',
      createdAt: new Date()
    });
    console.log(`Administrador ${adminName} creado`);
  } else if (existingAdmin.role !== 'admin') {
    existingAdmin.role = 'admin';
    await existingAdmin.save();
    console.log(`Usuario ${adminName} actualizado a administrador`);
  }
}

// Llama a la función una vez conectada la base de datos
mongoose.connection.once('open', () => {
  createAdminIfNotExists();
});

// Function to validate required fields in the request body
function validateRequiredFields(req, requiredFields) {
    for (const field of requiredFields) {
      if (!(field in req.body)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
}


// Endpoint: login
app.post('/login',  [
  check('username').isLength({ min: 3 }).trim().escape(),
  check('password').isLength({ min: 3 }).trim().escape()
],async (req, res) => {
  try {
    validateRequiredFields(req, ['username', 'password']);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array().toString()});
    }
    let username = req.body.username.toString();
    let password = req.body.password.toString();
    const user = await User.findOne({ username });
    if (user && await bcrypt.compare(password, user.password)) {
      // Incluimos el atributo role en el JWT
      const token = jwt.sign(
        { userId: user._id, role: user.role }, // Incluye el rol
        'your-secret-key',
        { expiresIn: '1h' }
      );
      res.json({ token: token, username: username, role: user.role, createdAt: user.createdAt });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/adminPanel', async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error interno en auth-service' });
  }
});

// Start server
const server = app.listen(port, () => {
  console.log(`Auth Service listening at http://localhost:${port}`);
});

server.on('close', () => {
    mongoose.connection.close();
});

module.exports = server;
