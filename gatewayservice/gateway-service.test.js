const request = require('supertest');
const axios = require('axios');
const server = require('./gateway-service');

jest.mock('axios');

afterAll(() => {
  server.close();
});

describe('Gateway Service API', () => {
  test('GET /health should return status OK', async () => {
    const res = await request(server).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'OK' });
  });

  test('POST /login should forward request and return response', async () => {
    const mockResponse = { data: { token: 'fake-token' } };
    axios.post.mockResolvedValue(mockResponse);

    const res = await request(server).post('/login').send({ username: 'test', password: '1234' });
    
    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockResponse.data);
  });

  test('POST /incrementGamesPlayed should forward request to user service', async () => {
    const mockResponse = { data: { success: true } };
    axios.post.mockResolvedValue(mockResponse);

    const response = await request(server).post('/incrementGamesPlayed').send({ username: 'testUser' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockResponse.data);
    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/incrementGamesPlayed'), { username: 'testUser' });
  });

  test('POST /updateStats should forward request to user service', async () => {
    const mockResponse = { data: { success: true } };
    axios.post.mockResolvedValue(mockResponse);

    const response = await request(server).post('/updateStats').send({ username: 'testUser', isCorrect: true, timeTaken: 5 });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockResponse.data);
    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/updateStats'), { username: 'testUser', isCorrect: true, timeTaken: 5 });
  });

  test('GET /profile/:username should return user profile', async () => {
    const mockResponse = { data: { username: 'test', score: 100 } };
    axios.get.mockResolvedValue(mockResponse);

    const res = await request(server).get('/profile/test');
    
    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockResponse.data);
  });

  test('GET /ranking should return ranking data', async () => {
    const mockResponse = { data: [{ username: 'user1', score: 200 }] };
    axios.get.mockResolvedValue(mockResponse);

    const res = await request(server).get('/ranking');
    
    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockResponse.data);
  });

  test('POST /askllm should forward request to LLM service', async () => {
    const mockResponse = { data: { answer: 'Response from LLM' } };
    axios.post.mockResolvedValue(mockResponse);

    const res = await request(server).post('/askllm').send({ question: 'What is AI?' });
    
    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockResponse.data);
  });

  test('POST /login should handle service errors', async () => {
    axios.post.mockRejectedValue({ response: { status: 401, data: { error: 'Unauthorized' } } });

    const res = await request(server).post('/login').send({ username: 'invalid', password: 'wrong' });
    
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Unauthorized' });
  });
});
