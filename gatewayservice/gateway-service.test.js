const request = require('supertest');
const axios = require('axios');
const server = require('./gateway-service'); 

jest.mock('axios');

// Obtenemos las URLs de los servicios tal como están definidas en el gateway
// (o las definimos aquí si no están exportadas, asegurando que coincidan)
const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:8002';
const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:8001';



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

  describe('Existing Endpoints', () => {
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
        const questionServiceUrl = process.env.QUESTION_SERVICE_URL || 'http://localhost:8004';
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

        // Para GET con query params, supertest los añade así: .get('/ranking?param=value')
        // o axios los recibe como { params: req.query }
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
});