const request = require('supertest');
const express = require('express');
const cors = require('cors');

jest.mock('./connection', () => jest.fn());
jest.mock('./question-gen', () => ({
  generateQuestion: jest.fn()
}));
jest.mock('./question-model', () => ({
  countDocuments: jest.fn()
}));

const { generateQuestion } = require('./question-gen');
const Question = require('./question-model');


const app = express();
app.use(cors());
app.use(express.json());


const PORT = 8004;


const toBool = (val) => val === 'true';


app.get('/question', async (req, res) => {
  try {
    const allowedTypes = {
      capital: toBool(req.query.capital),
      flag: toBool(req.query.flag),
      monument: toBool(req.query.monument),
      food: toBool(req.query.food),
    };
    

    const hasEnabledType = Object.values(allowedTypes).some(value => value === true);
    if (!hasEnabledType) {
      return res.status(400).json({ error: 'At least one question type must be enabled' });
    }
    

    const count = await Question.countDocuments();
    if (count === 0) {
      return res.json({
        type: "capital",
        question: "¿Cuál es la capital de España?",
        choices: ["Madrid", "Barcelona", "Sevilla", "Valencia"],
        answer: "Madrid",
        image: null,
      });
    }
    
    const question = await generateQuestion(allowedTypes);
    const formattedQuestion = {
      type: question.type,
      question: question.question,
      choices: question.choices,
      answer: question.answer,
      image: question.image || null,
    };
    res.json(formattedQuestion);
  } catch (error) {
    console.error("Error fetching question:", error.message);
    res.status(500).json({ error: 'Failed to fetch question' });
  }
});

describe('Question Service API', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Default mock implementations
    Question.countDocuments.mockResolvedValue(10);
    generateQuestion.mockResolvedValue({
      type: 'capital',
      question: '¿Cuál es la capital de Francia?',
      choices: ['París', 'Lyon', 'Marsella', 'Niza'],
      answer: 'París',
      image: 'https://example.com/paris.jpg'
    });
    
    // Silence console logs and errors during tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  describe('GET /question', () => {
    it('should return a question when at least one type is enabled', async () => {
      const response = await request(app)
        .get('/question')
        .query({ capital: 'true', flag: 'false' });
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        type: 'capital',
        question: '¿Cuál es la capital de Francia?',
        choices: ['París', 'Lyon', 'Marsella', 'Niza'],
        answer: 'París',
        image: 'https://example.com/paris.jpg'
      });
      
      // Verify we called generateQuestion with the right parameters
      expect(generateQuestion).toHaveBeenCalledWith({
        capital: true,
        flag: false,
        monument: false,
        food: false
      });
    });
    
    it('should return 400 error when no question types are enabled', async () => {
      const response = await request(app)
        .get('/question')
        .query({ capital: 'false', flag: 'false', monument: 'false', food: 'false' });
      
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'At least one question type must be enabled' });
      expect(generateQuestion).not.toHaveBeenCalled();
    });
    
    it('should default to false for missing query parameters', async () => {
      const response = await request(app)
        .get('/question')
        .query({ capital: 'true' }); // Only specify capital
      
      expect(response.status).toBe(200);
      expect(generateQuestion).toHaveBeenCalledWith({
        capital: true,
        flag: false,
        monument: false,
        food: false
      });
    });
    
    it('should return a predefined question when database is empty', async () => {
      // Mock empty database
      Question.countDocuments.mockResolvedValue(0);
      
      const response = await request(app)
        .get('/question')
        .query({ capital: 'true' });
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        type: "capital",
        question: "¿Cuál es la capital de España?",
        choices: ["Madrid", "Barcelona", "Sevilla", "Valencia"],
        answer: "Madrid",
        image: null,
      });
      
      // Verify generateQuestion was not called
      expect(generateQuestion).not.toHaveBeenCalled();
    });
    
    it('should handle errors when generating questions', async () => {
      // Mock generateQuestion to throw an error
      generateQuestion.mockRejectedValue(new Error('Database error'));
      
      const response = await request(app)
        .get('/question')
        .query({ capital: 'true' });
      
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to fetch question' });
    });
    
    it('should set image to null when question has no image', async () => {
      // Mock a question without an image
      generateQuestion.mockResolvedValue({
        type: 'capital',
        question: '¿Cuál es la capital de Alemania?',
        choices: ['Berlín', 'Munich', 'Hamburgo', 'Colonia'],
        answer: 'Berlín',
        image: undefined // No image provided
      });
      
      const response = await request(app)
        .get('/question')
        .query({ capital: 'true' });
      
      expect(response.status).toBe(200);
      expect(response.body.image).toBeNull();
    });
  });

  it('should pass all enabled question types to generateQuestion', async () => {
    await request(app)
      .get('/question')
      .query({ 
        capital: 'true', 
        flag: 'true', 
        monument: 'false', 
        food: 'true' 
      });
    
    expect(generateQuestion).toHaveBeenCalledWith({
      capital: true,
      flag: true,
      monument: false,
      food: true
    });
  });
});