const request = require('supertest');
const axios = require('axios');
const server = require('./gateway-service'); 
const fs = require('fs');

jest.mock('axios');

// Obtenemos las URLs de los servicios tal como están definidas en el gateway
const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:8002';
const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:8001';
const llmServiceUrl = process.env.LLM_SERVICE_URL || 'http://localhost:8003';
const questionServiceUrl = process.env.QUESTION_SERVICE_URL || 'http://localhost:8004';

afterAll((done) => {
  server.close(done);
});

afterEach(() => {
  jest.clearAllMocks();
});

const mockAxiosSuccess = (method, responseData) => {
  axios[method].mockResolvedValueOnce({ data: responseData });
};

// Función auxiliar para simular errores
const mockAxiosError = (method, status, errorMessage) => {
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

  describe('Basic Endpoints', () => {
    test('GET /health should return status OK', async () => {
      await testEndpoint('get', '/health', null, 200, { status: 'OK' });
    });

    test('POST /login should forward request and return response', async () => {
      const mockResponse = { token: 'fake-token' };
      mockAxiosSuccess('post', mockResponse);

      await testEndpoint('post', '/login', { username: 'test' }, 200, mockResponse);
      expect(axios.post).toHaveBeenCalledWith(`${authServiceUrl}/login`, { username: 'test' });
    });

    test('POST /login should handle service errors', async () => {
      mockAxiosError('post', 500, 'Internal Server Error');

      await testEndpoint('post', '/login', { username: 'test' }, 500, { error: 'Internal Server Error' });
    });

    test('POST /adduser should forward request and return response', async () => {
      const mockResponse = { username: 'testuser' };
      mockAxiosSuccess('post', mockResponse);

      await testEndpoint('post', '/adduser', { username: 'testuser' }, 200, mockResponse);
      expect(axios.post).toHaveBeenCalledWith(`${userServiceUrl}/adduser`, { username: 'testuser' });
    });

    test('POST /adduser should handle service errors', async () => {
      mockAxiosError('post', 500, 'Internal Server Error');

      await testEndpoint('post', '/adduser', { username: 'testuser' }, 500, { error: 'Internal Server Error' });
    });

    test('GET /profile/:username should return user profile', async () => {
      const mockResponse = { username: 'testuser', gamesPlayed: 10 };
      mockAxiosSuccess('get', mockResponse);

      await testEndpoint('get', '/profile/testuser', null, 200, mockResponse);
      expect(axios.get).toHaveBeenCalledWith(`${userServiceUrl}/profile/testuser`);
    });

    test('GET /profile/:username should handle service errors', async () => {
      mockAxiosError('get', 404, 'User not found');

      await testEndpoint('get', '/profile/testuser', null, 404, { error: 'User not found' });
    });

    test('POST /incrementGamesPlayed should forward request and return response', async () => {
      const mockResponse = { success: true };
      mockAxiosSuccess('post', mockResponse);

      await testEndpoint('post', '/incrementGamesPlayed', { username: 'testuser' }, 200, mockResponse);
      expect(axios.post).toHaveBeenCalledWith(`${userServiceUrl}/incrementGamesPlayed`, { username: 'testuser' });
    });

    test('POST /incrementGamesPlayed should handle service errors', async () => {
      mockAxiosError('post', 500, 'Internal Server Error');

      await testEndpoint('post', '/incrementGamesPlayed', { username: 'testuser' }, 500, { error: 'Internal Server Error' });
    });

    test('GET /question should return a question', async () => {
      const mockResponse = { question: 'What is 2 + 2?', answer: '4' };
      mockAxiosSuccess('get', mockResponse);

      await testEndpoint('get', '/question', null, 200, mockResponse);
      expect(axios.get).toHaveBeenCalledWith(`${questionServiceUrl}/question`, { params: {} });
    });

    test('GET /question should handle service errors', async () => {
      mockAxiosError('get', 500, 'Error al obtener pregunta');

      await testEndpoint('get', '/question', null, 500, { error: 'Error al obtener pregunta' });
    });

    test('GET /ranking should return ranking data', async () => {
      const mockResponse = [{ username: 'user1', score: 100 }];
      mockAxiosSuccess('get', mockResponse);

      const response = await request(server).get('/ranking?sortBy=score');
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
      expect(axios.get).toHaveBeenCalledWith(`${userServiceUrl}/ranking`, { params: { sortBy: 'score' } });
    });

    test('GET /ranking should handle service errors', async () => {
      mockAxiosError('get', 500, 'Error al obtener ranking');

      await testEndpoint('get', '/ranking', null, 500, { error: 'Error al obtener ranking' });
    });
  });

  // --- Nuevos Tests para /adminPanel ---
  describe('Admin Panel Endpoints', () => {
    // Tests para GET /adminPanel
    describe('GET /adminPanel', () => {
      const fakeToken = 'Bearer fake-admin-token';
      const mockUserList = [{ username: 'admin', role: 'admin' }, { username: 'user1', role: 'user' }];

      it('should return user list on success with valid token', async () => {
        // Simula respuesta exitosa del auth-service
        mockAxiosSuccess('get', mockUserList);

        // Realiza la solicitud al gateway con el header
        const response = await request(server)
          .get('/adminPanel')
          .set('Authorization', fakeToken);

        // Verifica la respuesta del gateway
        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockUserList);

        // Verifica que axios.get fue llamado correctamente hacia auth-service
        expect(axios.get).toHaveBeenCalledWith(`${authServiceUrl}/adminPanel`, {
          headers: {
            Authorization: fakeToken,
          },
        });
      });

      it('should return error from auth-service if token is invalid/forbidden', async () => {
        // Simula respuesta de error (ej: 403 Forbidden) desde auth-service
        const errorMessage = 'Acceso denegado.';
        mockAxiosError('get', 403, errorMessage);

        // Realiza la solicitud al gateway con el header
        const response = await request(server)
          .get('/adminPanel')
          .set('Authorization', fakeToken); // El token en sí no importa aquí, el mock decide

        // Verifica la respuesta del gateway (debe reflejar el error)
        expect(response.status).toBe(403);
        expect(response.body).toEqual({ error: errorMessage });

        // Verifica que axios.get fue llamado
        expect(axios.get).toHaveBeenCalledWith(`${authServiceUrl}/adminPanel`, {
          headers: {
            Authorization: fakeToken,
          },
        });
      });

      it('should return 500 if auth-service call fails unexpectedly', async () => {
        // Simula un error genérico sin respuesta definida (ej: network error)
        axios.get.mockRejectedValueOnce(new Error("Network error"));

        // Realiza la solicitud al gateway
        const response = await request(server)
          .get('/adminPanel')
          .set('Authorization', fakeToken);

        // Verifica la respuesta del gateway (debe ser un 500 genérico)
        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Error al obtener lista de usuarios' }); // El error por defecto del gateway

        // Verifica que axios.get fue llamado
        expect(axios.get).toHaveBeenCalledWith(`${authServiceUrl}/adminPanel`, {
          headers: {
            Authorization: fakeToken,
          },
        });
      });
    });

    // Tests para DELETE /adminPanel/deleteUser/:username
    describe('DELETE /adminPanel/deleteUser/:username', () => {
      const usernameToDelete = 'userToDelete';
      const fakeAdminToken = 'Bearer fake-admin-token-for-delete';
      const mockSuccessResponse = { message: 'User deleted successfully' };

      it('should delete user on success with valid token and username', async () => {
        // Simula respuesta exitosa del user-service
        mockAxiosSuccess('delete', mockSuccessResponse);

        // Realiza la solicitud DELETE al gateway
        const response = await request(server)
          .delete(`/adminPanel/deleteUser/${usernameToDelete}`)
          .set('Authorization', fakeAdminToken);

        // Verifica la respuesta del gateway
        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockSuccessResponse);

        // Verifica que axios.delete fue llamado correctamente hacia user-service
        expect(axios.delete).toHaveBeenCalledWith(`${userServiceUrl}/deleteUser/${usernameToDelete}`, {
          headers: {
            Authorization: fakeAdminToken,
          },
        });
      });

      it('should return error from user-service if deletion fails (e.g., 403 Forbidden)', async () => {
        // Simula respuesta de error (ej: 403) desde user-service
        const errorMessage = 'Permission denied';
        mockAxiosError('delete', 403, errorMessage);

        // Realiza la solicitud DELETE al gateway
        const response = await request(server)
          .delete(`/adminPanel/deleteUser/${usernameToDelete}`)
          .set('Authorization', fakeAdminToken); // Token no importa, el mock decide

        // Verifica la respuesta del gateway
        expect(response.status).toBe(403);
        expect(response.body).toEqual({ error: errorMessage });

        // Verifica que axios.delete fue llamado
        expect(axios.delete).toHaveBeenCalledWith(`${userServiceUrl}/deleteUser/${usernameToDelete}`, {
          headers: {
            Authorization: fakeAdminToken,
          },
        });
      });

      it('should return error from user-service if user not found (e.g., 404)', async () => {
        // Simula respuesta de error 404 desde user-service
        const errorMessage = 'User not found';
        mockAxiosError('delete', 404, errorMessage);

        // Realiza la solicitud DELETE al gateway
        const response = await request(server)
          .delete(`/adminPanel/deleteUser/${usernameToDelete}`)
          .set('Authorization', fakeAdminToken);

        // Verifica la respuesta del gateway
        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: errorMessage });

        // Verifica que axios.delete fue llamado
        expect(axios.delete).toHaveBeenCalledWith(`${userServiceUrl}/deleteUser/${usernameToDelete}`, {
          headers: {
            Authorization: fakeAdminToken,
          },
        });
      });

      it('should return 500 if user-service call fails unexpectedly', async () => {
        // Simula un error genérico sin respuesta definida
        axios.delete.mockRejectedValueOnce(new Error("Something went wrong"));

        // Realiza la solicitud DELETE al gateway
        const response = await request(server)
          .delete(`/adminPanel/deleteUser/${usernameToDelete}`)
          .set('Authorization', fakeAdminToken);

        // Verifica la respuesta del gateway (debe ser un 500 genérico)
        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Error al eliminar usuario' }); // Error por defecto del gateway

        // Verifica que axios.delete fue llamado
        expect(axios.delete).toHaveBeenCalledWith(`${userServiceUrl}/deleteUser/${usernameToDelete}`, {
          headers: {
            Authorization: fakeAdminToken,
          },
        });
      });
    });
  });

  // --- Tests para endpoints de LLM Service ---
  describe('LLM Service Endpoints', () => {
    test('POST /askllm should forward request to LLM service', async () => {
      const mockRequest = { message: 'Tell me about Madrid', correctAnswer: 'Madrid' };
      const mockResponse = { response: 'Madrid is the capital of Spain' };
      
      mockAxiosSuccess('post', mockResponse);
      
      await testEndpoint('post', '/askllm', mockRequest, 200, mockResponse);
      expect(axios.post).toHaveBeenCalledWith(`${llmServiceUrl}/ask`, mockRequest);
    });
    
    test('POST /askllm should handle LLM service errors', async () => {
      mockAxiosError('post', 500, 'LLM service unavailable');
      
      await testEndpoint(
        'post', 
        '/askllm', 
        { message: 'Tell me about Madrid' }, 
        500, 
        { error: 'LLM service unavailable' }
      );
    });
    
    test('POST /askllm should handle LLM service unexpected errors', async () => {
      // Simula error sin respuesta estructurada
      axios.post.mockRejectedValueOnce(new Error('Network error'));
      
      const response = await request(server)
        .post('/askllm')
        .send({ message: 'Tell me about Madrid' });
        
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal Server Error' });
    });
  });

  // --- Tests para endpoints de Social/Friends ---
  describe('Social/Friends Endpoints', () => {
    test('POST /friends should return friends list', async () => {
      const mockResponse = [{ username: 'friend1' }, { username: 'friend2' }];
      mockAxiosSuccess('post', mockResponse);
      
      await testEndpoint('post', '/friends', { username: 'testuser' }, 200, mockResponse);
      expect(axios.post).toHaveBeenCalledWith(`${userServiceUrl}/friends`, { username: 'testuser' });
    });
    
    test('POST /friends should handle service errors', async () => {
      mockAxiosError('post', 404, 'User not found');
      
      await testEndpoint(
        'post', 
        '/friends', 
        { username: 'nonexistent' }, 
        404, 
        { error: 'User not found' }
      );
    });
    
    test('POST /addFriend should add friend successfully', async () => {
      const mockResponse = { success: true, message: 'Friend added successfully' };
      mockAxiosSuccess('post', mockResponse);
      
      await testEndpoint(
        'post', 
        '/addFriend', 
        { username: 'testuser', friendUsername: 'newfriend' }, 
        200, 
        mockResponse
      );
      expect(axios.post).toHaveBeenCalledWith(
        `${userServiceUrl}/addFriend`, 
        { username: 'testuser', friendUsername: 'newfriend' }
      );
    });
    
    test('POST /addFriend should handle service errors', async () => {
      mockAxiosError('post', 400, 'Cannot add yourself as friend');
      
      await testEndpoint(
        'post', 
        '/addFriend', 
        { username: 'testuser', friendUsername: 'testuser' }, 
        400, 
        { error: 'Cannot add yourself as friend' }
      );
    });
    
    test('POST /removeFriend should remove friend successfully', async () => {
      const mockResponse = { success: true, message: 'Friend removed successfully' };
      mockAxiosSuccess('post', mockResponse);
      
      await testEndpoint(
        'post', 
        '/removeFriend', 
        { username: 'testuser', friendUsername: 'exfriend' }, 
        200, 
        mockResponse
      );
      expect(axios.post).toHaveBeenCalledWith(
        `${userServiceUrl}/removeFriend`, 
        { username: 'testuser', friendUsername: 'exfriend' }
      );
    });
    
    test('POST /removeFriend should handle service errors', async () => {
      mockAxiosError('post', 404, 'Friend not found');
      
      await testEndpoint(
        'post', 
        '/removeFriend', 
        { username: 'testuser', friendUsername: 'nonexistent' }, 
        404, 
        { error: 'Friend not found' }
      );
    });
  });

  // --- Tests para endpoints de Statistics ---
  describe('Statistics and Game Data Endpoints', () => {
    test('POST /updateStats should update user statistics', async () => {
      const mockRequest = { username: 'testuser', correct: 5, wrong: 2, timeTaken: 120 };
      const mockResponse = { success: true };
      mockAxiosSuccess('post', mockResponse);
      
      await testEndpoint('post', '/updateStats', mockRequest, 200, mockResponse);
      expect(axios.post).toHaveBeenCalledWith(`${userServiceUrl}/updateStats`, mockRequest);
    });
    
    test('POST /updateStats should handle service errors', async () => {
      const mockRequest = { username: 'nonexistent', correct: 5, wrong: 2, timeTaken: 120 };
      mockAxiosError('post', 404, 'User not found');
      
      await testEndpoint('post', '/updateStats', mockRequest, 404, { error: 'User not found' });
    });
    
    test('GET /question with parameters should return filtered question', async () => {
      const mockResponse = { question: '¿Cuál es la capital de España?', answer: 'Madrid' };
      mockAxiosSuccess('get', mockResponse);
      
      const response = await request(server)
        .get('/question')
        .query({ capital: 'true', flag: 'false', monument: 'false', food: 'false' });
        
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
      expect(axios.get).toHaveBeenCalledWith(`${questionServiceUrl}/question`, { 
        params: {
          capital: 'true',
          flag: 'false',
          monument: 'false',
          food: 'false'
        } 
      });
    });
  });

  // --- Tests para endpoints de Settings ---
  describe('User Settings Endpoints', () => {
    test('GET /getSettings/:username should return user settings', async () => {
      const mockResponse = {
        answerTime: 30,
        questionAmount: 10,
        capitalQuestions: true,
        flagQuestions: true,
        monumentQuestions: true,
        foodQuestions: false
      };
      mockAxiosSuccess('get', mockResponse);
      
      await testEndpoint('get', '/getSettings/testuser', null, 200, mockResponse);
      expect(axios.get).toHaveBeenCalledWith(`${userServiceUrl}/getSettings/testuser`);
    });
    
    test('GET /getSettings/:username should handle service errors', async () => {
      mockAxiosError('get', 404, 'User settings not found');
      
      await testEndpoint('get', '/getSettings/nonexistent', null, 404, { error: 'User settings not found' });
    });
    
    test('POST /saveSettings/:username should save user settings', async () => {
      const mockSettings = {
        answerTime: 45,
        questionAmount: 15,
        capitalQuestions: true,
        flagQuestions: false,
        monumentQuestions: true,
        foodQuestions: true
      };
      const mockResponse = { success: true, message: 'Settings saved' };
      mockAxiosSuccess('post', mockResponse);
      
      await testEndpoint('post', '/saveSettings/testuser', mockSettings, 200, mockResponse);
      expect(axios.post).toHaveBeenCalledWith(`${userServiceUrl}/saveSettings/testuser`, mockSettings);
    });
    
    test('POST /saveSettings/:username should handle service errors', async () => {
      const mockSettings = { answerTime: 45 };
      mockAxiosError('post', 400, 'Invalid settings');
      
      await testEndpoint('post', '/saveSettings/testuser', mockSettings, 400, { error: 'Invalid settings' });
    });
  });

  // --- Tests para errores genéricos ---
  describe('Generic Error Handling', () => {
    test('should handle errors with no response object', async () => {
      // Simula un error de red sin objeto response
      axios.post.mockRejectedValueOnce(new Error('Network error'));
      
      const res = await request(server).post('/login').send({ username: 'test' });
      
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Internal Server Error' });
    });
    
    test('should handle errors with no error message in response', async () => {
      // Simula un error con status pero sin mensaje de error específico
      axios.post.mockRejectedValueOnce({
        response: { status: 503 } // Sin data.error
      });
      
      const res = await request(server).post('/login').send({ username: 'test' });
      
      expect(res.status).toBe(503);
      expect(res.body).toEqual({ error: 'Internal Server Error' });
    });
  });
  
});