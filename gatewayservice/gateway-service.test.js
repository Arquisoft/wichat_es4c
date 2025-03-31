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

    const res = await request(server).post('/login').send({ username: 'test' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockResponse.data);
    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/login'), { username: 'test' });
  });

  test('POST /login should handle service errors', async () => {
    axios.post.mockRejectedValue({ response: { status: 500, data: { error: 'Internal Server Error' } } });

    const res = await request(server).post('/login').send({ username: 'test' });
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Internal Server Error' });
  });

  test('POST /adduser should forward request and return response', async () => {
    const mockResponse = { data: { username: 'testuser' } };
    axios.post.mockResolvedValue(mockResponse);

    const res = await request(server).post('/adduser').send({ username: 'testuser' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockResponse.data);
  });

  test('POST /adduser should handle service errors', async () => {
    axios.post.mockRejectedValue({ response: { status: 500, data: { error: 'Internal Server Error' } } });

    const res = await request(server).post('/adduser').send({ username: 'testuser' });
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Internal Server Error' });
  });

  test('GET /profile/:username should return user profile', async () => {
    const mockResponse = { data: { username: 'testuser', gamesPlayed: 10 } };
    axios.get.mockResolvedValue(mockResponse);

    const res = await request(server).get('/profile/testuser');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockResponse.data);
  });

  test('GET /profile/:username should handle service errors', async () => {
    axios.get.mockRejectedValue({ response: { status: 404, data: { error: 'User not found' } } });

    const res = await request(server).get('/profile/testuser');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'User not found' });
  });

  test('POST /incrementGamesPlayed should forward request and return response', async () => {
    const mockResponse = { data: { success: true } };
    axios.post.mockResolvedValue(mockResponse);

    const res = await request(server).post('/incrementGamesPlayed').send({ username: 'testuser' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockResponse.data);
  });

  test('POST /incrementGamesPlayed should handle service errors', async () => {
    axios.post.mockRejectedValue({ response: { status: 500, data: { error: 'Internal Server Error' } } });

    const res = await request(server).post('/incrementGamesPlayed').send({ username: 'testuser' });
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Internal Server Error' });
  });

  test('GET /question should return a question', async () => {
    const mockResponse = { data: { question: 'What is 2 + 2?', answer: '4' } };
    axios.get.mockResolvedValue(mockResponse);

    const res = await request(server).get('/question');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockResponse.data);
  });

  test('GET /question should handle service errors', async () => {
    axios.get.mockRejectedValue({ response: { status: 500, data: { error: 'Error al obtener pregunta' } } });

    const res = await request(server).get('/question');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Error al obtener pregunta' });
  });

  test('GET /ranking should return ranking data', async () => {
    const mockResponse = { data: [{ username: 'user1', score: 100 }] };
    axios.get.mockResolvedValue(mockResponse);

    const res = await request(server).get('/ranking');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockResponse.data);
  });

  test('GET /ranking should handle service errors', async () => {
    axios.get.mockRejectedValue({ response: { status: 500, data: { error: 'Error al obtener ranking' } } });

    const res = await request(server).get('/ranking');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Error al obtener ranking' });
  });
});