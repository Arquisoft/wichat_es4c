const request = require('supertest');
const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const { app, server, llmConfigs, sendQuestionToLLM } = require('./llm-service');

describe('LLM Service API (Gemini only)', () => {
  let mockAxios;
  const TEST_PORT = 8003;

  beforeAll(() => {
    mockAxios = new MockAdapter(axios);
    process.env.LLM_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    mockAxios.reset();
  });

  afterAll(async () => {
    mockAxios.restore();
    await new Promise(resolve => server.close(resolve));
  });

  describe('POST /ask', () => {
    it('should return 400 when required fields are missing', async () => {
      const testCases = [
        { body: { model: 'gemini', correctAnswer: 'Madrid' }, missing: 'question' },
        { body: { question: 'Dame una pista', correctAnswer: 'Madrid' }, missing: 'model' },
        { body: { question: 'Dame una pista', model: 'gemini' }, missing: 'correctAnswer' }
      ];

      for (const testCase of testCases) {
        const response = await request(app)
          .post('/ask')
          .send(testCase.body);

        expect(response.status).toBe(400);
        expect(response.body.error).toContain(`Missing required field: ${testCase.missing}`);
      }
    });

    it('should return 400 when model is not supported', async () => {
      const response = await request(app)
        .post('/ask')
        .send({
          question: 'Dame una pista',
          model: 'unsupported-model',
          correctAnswer: 'Madrid'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('not supported');
    });

    it('should successfully get a response from Gemini', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{ text: "Esta ciudad es famosa por su torre de televisión." }]
          }
        }]
      };
      
  
      mockAxios.onPost(/generativelanguage.googleapis.com/).reply(200, mockResponse, {
        'Content-Type': 'application/json'
      });
      
  
      process.env.LLM_API_KEY = 'test-api-key';
  
      const response = await request(app)
        .post('/ask')
        .send({
          question: 'Dame una pista',
          model: 'gemini',
          correctAnswer: 'Madrid'
        });
  
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        answer: "Esta ciudad es famosa por su torre de televisión."
      });
    });

    it('should handle Gemini API errors', async () => {
      mockAxios.onPost(/generativelanguage.googleapis.com/).reply(500, { error: 'Internal Server Error' });

      const response = await request(app)
        .post('/ask')
        .send({
          question: 'Dame una pista',
          model: 'gemini',
          correctAnswer: 'Madrid'
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Failed to get response from LLM');
    });
  });

  describe('Gemini Configuration', () => {
    it('should correctly transform Gemini requests', () => {
      const result = llmConfigs.gemini.transformRequest("Test prompt");
      expect(result).toEqual({
        contents: [{ parts: [{ text: "Test prompt" }] }]
      });
    });

    it('should correctly transform Gemini responses', () => {
      const response = {
        data: {
          candidates: [{
            content: {
              parts: [{ text: "Test response" }]
            }
          }]
        }
      };
      const result = llmConfigs.gemini.transformResponse(response);
      expect(result).toBe("Test response");
    });

    it('should return null for malformed Gemini responses', () => {
      const testCases = [
        { data: {} },
        { data: { candidates: [] } },
        { data: { candidates: [{}] } },
        { data: { candidates: [{ content: {} }] } },
        { data: { candidates: [{ content: { parts: [] } }] } }
      ];

      testCases.forEach(response => {
        expect(llmConfigs.gemini.transformResponse(response)).toBeNull();
      });
    });
  });

  describe('Server Setup', () => {
    it('should start the server on the correct port', (done) => {
      const testServer = app.listen(0, () => { // Usar 0 para puerto automático
        const port = testServer.address().port;
        expect(port).toBeGreaterThan(0);
        testServer.close(done);
      });
    });
  });
});