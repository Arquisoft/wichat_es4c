const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
      type: String,
      required: true,
      unique: true, // 🔹 Evita que dos usuarios tengan el mismo nombre
    },
    password: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now, 
    },
    gamesPlayed: { 
      type: Number, 
      default: 0, // 🔹 Número de partidas jugadas
    },
    correctAnswers: { 
      type: Number, 
      default: 0, // 🔹 Número total de preguntas acertadas
    },
    wrongAnswers: { 
      type: Number, 
      default: 0, // 🔹 Número total de preguntas falladas
    },
    totalTimePlayed: { 
      type: Number, 
      default: 0, // 🔹 Tiempo total jugado en segundos
    },
    gameHistory: [
      {
        date: { type: Date, default: Date.now }, // 🔹 Fecha de la partida
        correct: { type: Number, default: 0 },  // 🔹 Preguntas acertadas en esa partida
        wrong: { type: Number, default: 0 },    // 🔹 Preguntas falladas en esa partida
        timePlayed: { type: Number, default: 0 } // 🔹 Tiempo jugado en esa partida (segundos)
      }
    ]
});

const User = mongoose.model('User', userSchema);

module.exports = User;
