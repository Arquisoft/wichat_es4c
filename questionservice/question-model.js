const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  type: { type: String, required: true },
  question: { type: String, required: true },
  choices: { type: [String], required: true },
  answer: { type: String, required: true },
  image: { type: String, default: null },
});

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;