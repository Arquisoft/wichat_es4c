const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
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
    default: 0,
  },
  correctAnswers: { 
    type: Number, 
    default: 0,
  },
  wrongAnswers: { 
    type: Number, 
    default: 0,
  },
  totalTimePlayed: { 
    type: Number, 
    default: 0,
  },
  gameHistory: [
    {
      date: { type: Date, default: Date.now },
      correct: { type: Number, default: 0 },
      wrong: { type: Number, default: 0 },
      timePlayed: { type: Number, default: 0 }
    }
  ],
  // 🔹 Lista de amigos (referencias a otros usuarios)
  friends: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ]
});

const User = mongoose.model('User', userSchema);

module.exports = User;
