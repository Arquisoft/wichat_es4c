const request = require('supertest');
const axios = require('axios');
const server = require('./gateway-service');

jest.mock('axios');

afterAll(() => {
  server.close();
});

// Función auxiliar para simular respuestas exitosas
const mockAxiosSuccess = (method, url, responseData) => {
  axios[method].mockResolvedValueOnce({ data: responseData });
};

// Función auxiliar para simular errores
const mockAxiosError = (method, url, status, errorMessage) => {
  axios[method].mockRejectedValueOnce({
    response: { status, data: { error: errorMessage } },
  });
};

// Función auxiliar para realizar solicitudes y verificar respuestas
const testEndpoint = async (method, endpoint, requestData, expectedStatus, expectedResponse) => {
  const res = await request(server)[method](endpoint).send(requestData);
  expect(res.status).toBe(expectedStatus);
  expect(res.body).toEqual(expectedResponse);
};

describe('Gateway Service API', () => {
  test('GET /health should return status OK', async () => {
    await testEndpoint('get', '/health', null, 200, { status: 'OK' });
  });

  test('POST /login should forward request and return response', async () => {
    const mockResponse = { token: 'fake-token' };
    mockAxiosSuccess('post', '/login', mockResponse);

    await testEndpoint('post', '/login', { username: 'test' }, 200, mockResponse);
    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/login'), { username: 'test' });
  });

  test('POST /login should handle service errors', async () => {
    mockAxiosError('post', '/login', 500, 'Internal Server Error');

    await testEndpoint('post', '/login', { username: 'test' }, 500, { error: 'Internal Server Error' });
  });

  test('POST /adduser should forward request and return response', async () => {
    const mockResponse = { username: 'testuser' };
    mockAxiosSuccess('post', '/adduser', mockResponse);

    await testEndpoint('post', '/adduser', { username: 'testuser' }, 200, mockResponse);
  });

  test('POST /adduser should handle service errors', async () => {
    mockAxiosError('post', '/adduser', 500, 'Internal Server Error');

    await testEndpoint('post', '/adduser', { username: 'testuser' }, 500, { error: 'Internal Server Error' });
  });

  test('GET /profile/:username should return user profile', async () => {
    const mockResponse = { username: 'testuser', gamesPlayed: 10 };
    mockAxiosSuccess('get', '/profile/testuser', mockResponse);

    await testEndpoint('get', '/profile/testuser', null, 200, mockResponse);
  });

  test('GET /profile/:username should handle service errors', async () => {
    mockAxiosError('get', '/profile/testuser', 404, 'User not found');

    await testEndpoint('get', '/profile/testuser', null, 404, { error: 'User not found' });
  });

  test('POST /incrementGamesPlayed should forward request and return response', async () => {
    const mockResponse = { success: true };
    mockAxiosSuccess('post', '/incrementGamesPlayed', mockResponse);

    await testEndpoint('post', '/incrementGamesPlayed', { username: 'testuser' }, 200, mockResponse);
  });

  test('POST /incrementGamesPlayed should handle service errors', async () => {
    mockAxiosError('post', '/incrementGamesPlayed', 500, 'Internal Server Error');

    await testEndpoint('post', '/incrementGamesPlayed', { username: 'testuser' }, 500, { error: 'Internal Server Error' });
  });

  test('GET /question should return a question', async () => {
    const mockResponse = { question: 'What is 2 + 2?', answer: '4' };
    mockAxiosSuccess('get', '/question', mockResponse);

    await testEndpoint('get', '/question', null, 200, mockResponse);
  });

  test('GET /question should handle service errors', async () => {
    mockAxiosError('get', '/question', 500, 'Error al obtener pregunta');

    await testEndpoint('get', '/question', null, 500, { error: 'Error al obtener pregunta' });
  });

  test('GET /ranking should return ranking data', async () => {
    const mockResponse = [{ username: 'user1', score: 100 }];
    mockAxiosSuccess('get', '/ranking', mockResponse);

    await testEndpoint('get', '/ranking', null, 200, mockResponse);
  });

  test('GET /ranking should handle service errors', async () => {
    mockAxiosError('get', '/ranking', 500, 'Error al obtener ranking');

    await testEndpoint('get', '/ranking', null, 500, { error: 'Error al obtener ranking' });
  });
});