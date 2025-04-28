const request = require('supertest');
const bcrypt = require('bcrypt');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('./user-model'); // Asegúrate de que la ruta sea correcta
const jwt = require('jsonwebtoken'); // Importar jsonwebtoken

let mongoServer;
let app;

// Mock jsonwebtoken para controlar la verificación del token
jest.mock('jsonwebtoken');

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    process.env.MONGODB_URI = mongoUri;
    // Importar el servicio después de configurar la URI de la base de datos
    app = require('./user-service');
});

afterAll(async () => {
    // Cerrar la conexión a la base de datos a través del servidor Express
    if (app) {
        app.close();
    }
    if (mongoServer) {
        await mongoServer.stop();
    }
});

afterEach(async () => {
    // Limpiar la base de datos después de cada test para asegurar independencia
    await User.deleteMany({});
    // Limpiar los mocks de Jest (incluyendo los de jsonwebtoken y espías)
    jest.clearAllMocks();
});


// Helper para generar un token simulado para los tests
// Simula el payload que jwt.verify devolvería
const generateMockToken = (role, username = 'testuser') => {
    return { username: username, role: role };
};


describe('User Service', () => {
    // --- Tests originales del usuario ---

    it('should add a new user on POST /adduser', async () => {
        const newUser = { username: 'testuser', password: 'hashedpassword' };
        const response = await request(app).post('/adduser').send(newUser);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('username', 'testuser');
        const userInDb = await User.findOne({ username: 'testuser' });
        expect(userInDb).not.toBeNull();
        expect(userInDb.username).toBe('testuser');
    });

    it('should get user profile on GET /profile/:username', async () => {
        const user = new User({ username: 'profileuser', password: 'hashedpassword' });
        await user.save();
        const response = await request(app).get(`/profile/${user.username}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('username', 'profileuser');
        expect(response.body).toHaveProperty('gamesPlayed');
        expect(response.body).toHaveProperty('correctAnswers');
        expect(response.body).toHaveProperty('wrongAnswers');
    });

    it('should return 404 for non-existent user on GET /profile/:username', async () => {
        const response = await request(app).get('/profile/nonexistent');
        expect(response.status).toBe(404);
    });

    it('should update user stats on POST /updateStats', async () => {
        const user = new User({ username: 'statuser', password: 'hashedpassword', correctAnswers: 0, wrongAnswers: 0, totalTimePlayed: 0 });
        await user.save();
        const response = await request(app).post('/updateStats').send({ username: 'statuser', isCorrect: true, timeTaken: 30 });
        expect(response.status).toBe(200);
        const updatedUser = await User.findOne({ username: 'statuser' });
        expect(updatedUser.correctAnswers).toBe(1);
        expect(updatedUser.totalTimePlayed).toBe(30);
    });

    it('should return 400 for missing username on POST /updateStats', async () => {
        const response = await request(app).post('/updateStats').send({ isCorrect: true, timeTaken: 30 });
        expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent user on POST /updateStats', async () => {
        const response = await request(app).post('/updateStats').send({ username: 'fakeuser', isCorrect: true, timeTaken: 30 });
        expect(response.status).toBe(404);
    });

    it('should get ranking sorted by correctAnswers on GET /ranking', async () => {
        await User.create([
            { username: 'player1', password: 'hashedpassword', correctAnswers: 10, wrongAnswers: 5, gamesPlayed: 3 },
            { username: 'player2', password: 'hashedpassword', correctAnswers: 15, wrongAnswers: 2, gamesPlayed: 4 },
        ]);

        const response = await request(app).get('/ranking?sortBy=correctAnswers');
        expect(response.status).toBe(200);
        expect(response.body.length).toBeGreaterThan(1);
        expect(response.body[0].correctAnswers).toBeGreaterThan(response.body[1].correctAnswers);
    });

    it('should return 400 for invalid sortBy parameter on GET /ranking', async () => {
        const response = await request(app).get('/ranking?sortBy=invalidField');
        expect(response.status).toBe(400);
    });

    it('should increment gamesPlayed on POST /incrementGamesPlayed', async () => {
        const user = new User({ username: 'gameplayer', password: 'hashedpassword', gamesPlayed: 0 });
        await user.save();
        const response = await request(app).post('/incrementGamesPlayed').send({ username: 'gameplayer' });
        expect(response.status).toBe(200);
        const updatedUser = await User.findOne({ username: 'gameplayer' });
        expect(updatedUser.gamesPlayed).toBe(1);
    });

    it('should return 400 for missing username on POST /incrementGamesPlayed', async () => {
        const response = await request(app).post('/incrementGamesPlayed').send({});
        expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent user on POST /incrementGamesPlayed', async () => {
        const response = await request(app).post('/incrementGamesPlayed').send({ username: 'nonexistent' });
        expect(response.status).toBe(404);
    });

    it('should return 400 if username is missing on POST /adduser', async () => {
        const response = await request(app).post('/adduser').send({ password: 'hashedpassword' });
        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/Falta el campo requerido: username/);
    });

    it('should return 400 if password is missing on POST /adduser', async () => {
        const response = await request(app).post('/adduser').send({ username: 'testuser' });
        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/Falta el campo requerido: password/);
    });

    it('should return 400 if username already exists on POST /adduser', async () => {
        await User.create({ username: 'duplicate', password: 'hashedpassword' });
        const response = await request(app).post('/adduser').send({ username: 'duplicate', password: 'hashedpassword' });
        expect(response.status).toBe(400);
    });

    it('should return 500 if database error occurs on GET /profile/:username', async () => {
        jest.spyOn(User, 'findOne').mockImplementationOnce(() => {
            throw new Error('Database error');
        });

        const response = await request(app).get('/profile/testuser');
        expect(response.status).toBe(500);
        expect(response.body.error).toMatch(/Error al obtener el perfil del usuario/);
    });

    it('should return 500 if database error occurs on POST /incrementGamesPlayed', async () => {
        jest.spyOn(User, 'findOne').mockImplementationOnce(() => {
            throw new Error('Database error');
        });

        const response = await request(app).post('/incrementGamesPlayed').send({ username: 'testuser' });
        expect(response.status).toBe(500);
        expect(response.body.error).toMatch(/Error al registrar la partida/);
    });

    // --- Nuevos tests para /deleteUser/:username ---

    it('should delete a user successfully if user is admin', async () => {
        const usernameToDelete = 'userToDelete';
        const adminToken = 'fake-admin-token'; // Usamos un token falso, el mock de jwt.verify lo gestionará

        // Crear el usuario que será eliminado
        await User.create({ username: usernameToDelete, password: 'hashedpassword', role: 'user' });

        // Configurar el mock de jwt.verify para devolver un payload de administrador
        jwt.verify.mockReturnValue(generateMockToken('admin', 'adminuser'));

        const response = await request(app)
            .delete(`/deleteUser/${usernameToDelete}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', `Usuario ${usernameToDelete} eliminado correctamente.`);

        // Verificar que el usuario fue eliminado de la base de datos
        const deletedUser = await User.findOne({ username: usernameToDelete });
        expect(deletedUser).toBeNull();

        // Verificar que jwt.verify fue llamado
        expect(jwt.verify).toHaveBeenCalledWith(adminToken, 'your-secret-key');
    });

    it('should return 401 if no token is provided for deleteUser', async () => {
        const usernameToDelete = 'userToDelete';
        // No creamos el usuario ni mockeamos jwt.verify, ya que no debería llegar a esas llamadas

        const response = await request(app).delete(`/deleteUser/${usernameToDelete}`);
        // No enviamos el header Authorization

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error', 'No token provided');

        // Asegurarse de que jwt.verify y las operaciones de DB no fueron llamadas
        expect(jwt.verify).not.toHaveBeenCalled();
        // Espiar User.findOneAndDelete solo para verificar que NO fue llamado
        const findOneAndDeleteSpy = jest.spyOn(User, 'findOneAndDelete');
        expect(findOneAndDeleteSpy).not.toHaveBeenCalled();
        findOneAndDeleteSpy.mockRestore(); // Limpiar el espía
    });

    it('should return 401 if token is invalid for deleteUser', async () => {
        const usernameToDelete = 'userToDelete';
        const invalidToken = 'invalid-token-string';

        // Configurar el mock de jwt.verify para lanzar un error (simulando un token inválido)
        jwt.verify.mockImplementation((token, secret, callback) => {
             // Simular el error de jwt.verify
            throw new Error('jwt malformed'); // O cualquier error que jwt.verify pueda lanzar
        });


        const response = await request(app)
            .delete(`/deleteUser/${usernameToDelete}`)
            .set('Authorization', `Bearer ${invalidToken}`);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error', 'Token inválido o expirado');

        // Verificar que jwt.verify fue llamado con el token proporcionado
        expect(jwt.verify).toHaveBeenCalledWith(invalidToken, 'your-secret-key');

        // Asegurarse de que las operaciones de DB no fueron llamadas
        const findOneAndDeleteSpy = jest.spyOn(User, 'findOneAndDelete');
        expect(findOneAndDeleteSpy).not.toHaveBeenCalled();
        findOneAndDeleteSpy.mockRestore();
    });

    it('should return 403 if user is not admin for deleteUser', async () => {
        const usernameToDelete = 'userToDelete';
        const regularUserToken = 'fake-user-token';

        // Crear el usuario que podría ser eliminado (aunque no se debería permitir)
        await User.create({ username: usernameToDelete, password: 'hashedpassword', role: 'user' });

        // Configurar el mock de jwt.verify para devolver un payload de usuario normal
        jwt.verify.mockReturnValue(generateMockToken('user', 'regularuser'));

        const response = await request(app)
            .delete(`/deleteUser/${usernameToDelete}`)
            .set('Authorization', `Bearer ${regularUserToken}`);

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty('error', 'Acceso denegado. Se requiere rol de administrador.');

        // Verificar que jwt.verify fue llamado
        expect(jwt.verify).toHaveBeenCalledWith(regularUserToken, 'your-secret-key');

        // Asegurarse de que el usuario NO fue eliminado (la operación de DB no debería ser llamada)
        const userAfterAttempt = await User.findOne({ username: usernameToDelete });
        expect(userAfterAttempt).not.toBeNull();
        const findOneAndDeleteSpy = jest.spyOn(User, 'findOneAndDelete');
        expect(findOneAndDeleteSpy).not.toHaveBeenCalled();
         findOneAndDeleteSpy.mockRestore();
    });

    it('should return 404 if user to delete is not found by admin', async () => {
        const usernameToDelete = 'nonexistentuser';
        const adminToken = 'fake-admin-token';

        // No creamos el usuario 'nonexistentuser'

        // Configurar el mock de jwt.verify para devolver un payload de administrador
        jwt.verify.mockReturnValue(generateMockToken('admin', 'adminuser'));

        // Espiar y mockear findOneAndDelete para simular que no encuentra el usuario (devuelve null)
        const findOneAndDeleteSpy = jest.spyOn(User, 'findOneAndDelete').mockResolvedValue(null);

        const response = await request(app)
            .delete(`/deleteUser/${usernameToDelete}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'Usuario no encontrado');

        // Verificar que jwt.verify fue llamado
        expect(jwt.verify).toHaveBeenCalledWith(adminToken, 'your-secret-key');

        // Verificar que findOneAndDelete fue llamado con el username correcto
        expect(findOneAndDeleteSpy).toHaveBeenCalledWith({ username: usernameToDelete });
        findOneAndDeleteSpy.mockRestore();
    });

    it('should return 500 if a database error occurs during deletion by admin', async () => {
        const usernameToDelete = 'userToDeleteWithError';
        const adminToken = 'fake-admin-token-error';

        // Crear el usuario que intentaremos eliminar
        await User.create({ username: usernameToDelete, password: 'hashedpassword', role: 'user' });

        // Configurar el mock de jwt.verify para devolver un payload de administrador
        jwt.verify.mockReturnValue(generateMockToken('admin', 'adminuser'));

        // Espiar y mockear findOneAndDelete para que lance un error de base de datos
        const findOneAndDeleteSpy = jest.spyOn(User, 'findOneAndDelete').mockRejectedValue(new Error('Simulated DB error'));

        const response = await request(app)
            .delete(`/deleteUser/${usernameToDelete}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error', 'Error al eliminar usuario');

        // Verificar que jwt.verify fue llamado
        expect(jwt.verify).toHaveBeenCalledWith(adminToken, 'your-secret-key');

        // Verificar que findOneAndDelete fue llamado con el username correcto
        expect(findOneAndDeleteSpy).toHaveBeenCalledWith({ username: usernameToDelete });
        findOneAndDeleteSpy.mockRestore();

        // Asegurarse de que el usuario NO fue eliminado realmente
        const userAfterAttempt = await User.findOne({ username: usernameToDelete });
        expect(userAfterAttempt).not.toBeNull();
    });

    // --- Fin de los nuevos tests para /deleteUser ---

    // Tests para saveSettings (originales del usuario)
    it('should save user settings on POST /saveSettings/:username', async () => {
        const user = new User({ username: 'settingsuser', password: 'hashedpassword', settings: {} });
        await user.save();
        const newSettings = { theme: 'dark', language: 'en' };

        const response = await request(app)
            .post('/saveSettings/settingsuser')
            .send(newSettings);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Ajustes guardados');
        expect(response.body).toHaveProperty('settings', newSettings);
    });

     it('should return 404 for non-existent user on POST /saveSettings/:username', async () => {
        const nonExistentUsername = 'nonexistentuser';
        const newSettings = { theme: 'dark', language: 'en' };

        const response = await request(app)
            .post(`/saveSettings/${nonExistentUsername}`)
            .send(newSettings);

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'Usuario no encontrado');
    });

    it('should return 500 if database error occurs on POST /saveSettings/:username', async () => {
        const user = new User({ username: 'settingsuser3', password: 'hashedpassword', settings: {} });
        await user.save();
        const newSettings = { theme: 'dark', language: 'en' };

        jest.spyOn(User.prototype, 'save').mockRejectedValueOnce(new Error('Database error'));

        const response = await request(app)
            .post('/saveSettings/settingsuser3')
            .send(newSettings);

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error', 'Error al guardar los ajustes');
    });


    // Tests para getSettings (originales del usuario)
    it('should get user settings on GET /getSettings/:username', async () => {
        const savedSettings = { theme: 'light', language: 'es' };
        const user = new User({ username: 'getsettingsuser', password: 'hashedpassword', settings: savedSettings });
        await user.save();

        const response = await request(app)
            .get('/getSettings/getsettingsuser');

        expect(response.status).toBe(200);
    });

    it('should return 404 for non-existent user on GET /getSettings/:username', async () => {
        const nonExistentUsername = 'nonexistentgetuser';
        const response = await request(app)
            .get(`/getSettings/${nonExistentUsername}`);

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'Usuario no encontrado');
    });

    it('should return 500 if database error occurs on GET /getSettings/:username', async () => {
        jest.spyOn(User, 'findOne').mockImplementationOnce(() => {
            throw new Error('Database error');
        });

        const response = await request(app)
            .get('/getSettings/testuser');

        expect(response.status).toBe(500);
        expect(response.body.error).toMatch(/Error al obtener los ajustes/);
    });

    it('should get list of friends on POST /friends', async () => {
        // Create two users
        const user1 = new User({ 
          username: 'user1', 
          password: 'hashedpassword', 
          friends: [] 
        });
        const user2 = new User({ 
          username: 'user2', 
          password: 'hashedpassword' 
        });
        await user2.save();
        
        // Add user2's ID to user1's friends
        user1.friends.push(user2._id);
        await user1.save();
        
        const response = await request(app)
          .post('/friends')
          .send({ username: 'user1' });
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('friends');
        expect(response.body.friends).toContain('user2');
      });
      
      it('should return 400 for missing username on POST /friends', async () => {
        const response = await request(app)
          .post('/friends')
          .send({});  // No username sent
        
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Falta el nombre de usuario');
      });
      
      it('should return 400 for invalid username on POST /friends', async () => {
        const response = await request(app)
          .post('/friends')
          .send({ username: 123 });  // Non-string username
        
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Nombre de usuario inválido');
      });
      
      it('should return 404 for non-existent user on POST /friends', async () => {
        const response = await request(app)
          .post('/friends')
          .send({ username: 'nonexistentuser' });
        
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'Usuario no encontrado');
      });
      
      it('should return 500 if database error occurs on POST /friends', async () => {
        // Create a user first
        await User.create({ username: 'erroruser', password: 'hashedpassword' });
        
        // Mock the findOne method to throw an error
        jest.spyOn(User, 'findOne').mockImplementationOnce(() => {
          throw new Error('Database error');
        });
        
        const response = await request(app)
          .post('/friends')
          .send({ username: 'erroruser' });
        
        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error', 'Error al obtener la lista de amigos');
      });
      
      // Tests for /addFriend endpoint
      it('should add friend successfully on POST /addFriend', async () => {
        // Create two users
        const user1 = await User.create({ 
          username: 'addfrienduser1', 
          password: 'hashedpassword',
          friends: []
        });
        const user2 = await User.create({ 
          username: 'addfrienduser2',
          password: 'hashedpassword',
          friends: []
        });
        
        const response = await request(app)
          .post('/addFriend')
          .send({ 
            userId: user1._id.toString(), 
            friendId: user2._id.toString() 
          });
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Amistad creada correctamente');
        expect(response.body).toHaveProperty('friendUsername', 'addfrienduser2');
        
        // Verify both users have each other as friends
        const updatedUser1 = await User.findById(user1._id);
        const updatedUser2 = await User.findById(user2._id);
        
        expect(updatedUser1.friends.some(id => id.toString() === user2._id.toString())).toBe(true);
        expect(updatedUser2.friends.some(id => id.toString() === user1._id.toString())).toBe(true);
      });
      
      it('should return 400 if trying to add self as friend on POST /addFriend', async () => {
        const user = await User.create({ 
          username: 'selffriendinvalid', 
          password: 'hashedpassword' 
        });
        
        const response = await request(app)
          .post('/addFriend')
          .send({ 
            userId: user._id.toString(), 
            friendId: user._id.toString() 
          });
        
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'No puedes agregarte a ti mismo como amigo');
      });
      
      it('should return 400 for missing userId or friendId on POST /addFriend', async () => {
        // Test missing userId
        let response = await request(app)
          .post('/addFriend')
          .send({ friendId: 'someId' });
        
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Faltan userId o friendId');
        
        // Test missing friendId
        response = await request(app)
          .post('/addFriend')
          .send({ userId: 'someId' });
        
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Faltan userId o friendId');
      });
      
      it('should return 404 if user or friend not found on POST /addFriend', async () => {
        const validUser = await User.create({ 
          username: 'validuserfriend', 
          password: 'hashedpassword' 
        });
        const invalidId = '60c72b2f247b1e001c1e5f7a'; // Valid format but doesn't exist
        
        // Test invalid userId
        let response = await request(app)
          .post('/addFriend')
          .send({ 
            userId: invalidId, 
            friendId: validUser._id.toString() 
          });
        
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'Usuario o amigo no encontrado');
        
        // Test invalid friendId
        response = await request(app)
          .post('/addFriend')
          .send({ 
            userId: validUser._id.toString(), 
            friendId: invalidId 
          });
        
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'Usuario o amigo no encontrado');
      });
      
      it('should return 409 if users are already friends on POST /addFriend', async () => {
        // Create two users who are already friends
        const user1 = await User.create({ 
          username: 'alreadyfriend1', 
          password: 'hashedpassword'
        });
        const user2 = await User.create({ 
          username: 'alreadyfriend2', 
          password: 'hashedpassword'
        });
        
        // Make them friends
        user1.friends.push(user2._id);
        user2.friends.push(user1._id);
        await user1.save();
        await user2.save();
        
        // Try to add them as friends again
        const response = await request(app)
          .post('/addFriend')
          .send({ 
            userId: user1._id.toString(), 
            friendId: user2._id.toString() 
          });
        
        expect(response.status).toBe(409);
        expect(response.body).toHaveProperty('message', 'Ya está en tu lista de amigos');
      });
      
      it('should return 500 if database error occurs on POST /addFriend', async () => {
        // Create two users
        const user1 = await User.create({ 
          username: 'erroruser1', 
          password: 'hashedpassword' 
        });
        const user2 = await User.create({ 
          username: 'erroruser2', 
          password: 'hashedpassword' 
        });
        
        // Mock User.prototype.save to throw error
        jest.spyOn(User.prototype, 'save').mockRejectedValueOnce(new Error('Database error'));
        
        const response = await request(app)
          .post('/addFriend')
          .send({ 
            userId: user1._id.toString(), 
            friendId: user2._id.toString() 
          });
        
        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error', 'Error al añadir amigo');
      });
      
      // Tests for /removeFriend endpoint
      it('should remove friend successfully on POST /removeFriend', async () => {
        // Create two users who are friends
        const user1 = await User.create({ 
          username: 'removefriend1', 
          password: 'hashedpassword'
        });
        const user2 = await User.create({ 
          username: 'removefriend2', 
          password: 'hashedpassword'
        });
        
        // Make them friends
        user1.friends.push(user2._id);
        user2.friends.push(user1._id);
        await user1.save();
        await user2.save();
        
        // Remove friendship
        const response = await request(app)
          .post('/removeFriend')
          .send({ 
            userId: user1._id.toString(), 
            friendUsername: 'removefriend2' 
          });
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Amigo eliminado correctamente');
        
        // Verify both users don't have each other as friends anymore
        const updatedUser1 = await User.findById(user1._id);
        const updatedUser2 = await User.findById(user2._id);
        
        expect(updatedUser1.friends.some(id => id.toString() === user2._id.toString())).toBe(false);
        expect(updatedUser2.friends.some(id => id.toString() === user1._id.toString())).toBe(false);
      });
      
      it('should return 400 for missing userId or friendUsername on POST /removeFriend', async () => {
        // Test missing userId
        let response = await request(app)
          .post('/removeFriend')
          .send({ friendUsername: 'someFriend' });
        
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Faltan userId o friendUsername');
        
        // Test missing friendUsername
        response = await request(app)
          .post('/removeFriend')
          .send({ userId: 'someId' });
        
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Faltan userId o friendUsername');
      });
      
      it('should return 400 for invalid data types on POST /removeFriend', async () => {
        const response = await request(app)
          .post('/removeFriend')
          .send({ userId: 123, friendUsername: 456 }); // Invalid types
        
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Datos inválidos');
      });
      
      it('should return 404 if user or friend not found on POST /removeFriend', async () => {
        const validUser = await User.create({ 
          username: 'validuserremove', 
          password: 'hashedpassword' 
        });
        
        // Test invalid userId
        let response = await request(app)
          .post('/removeFriend')
          .send({ 
            userId: '60c72b2f247b1e001c1e5f7a', // Valid format but doesn't exist
            friendUsername: validUser.username 
          });
        
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'Usuario o amigo no encontrado');
        
        // Test invalid friendUsername
        response = await request(app)
          .post('/removeFriend')
          .send({ 
            userId: validUser._id.toString(), 
            friendUsername: 'nonexistentfriend' 
          });
        
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'Usuario o amigo no encontrado');
      });
      
      it('should return 500 if database error occurs on POST /removeFriend', async () => {
        // Create two users who are friends
        const user1 = await User.create({ 
          username: 'erroruserremove1', 
          password: 'hashedpassword' 
        });
        const user2 = await User.create({ 
          username: 'erroruserremove2', 
          password: 'hashedpassword' 
        });
        user1.friends.push(user2._id);
        user2.friends.push(user1._id);
        await user1.save();
        await user2.save();
        
        // Mock User.prototype.save to throw error
        jest.spyOn(User.prototype, 'save').mockRejectedValueOnce(new Error('Database error'));
        
        const response = await request(app)
          .post('/removeFriend')
          .send({ 
            userId: user1._id.toString(), 
            friendUsername: 'erroruserremove2' 
          });
        
        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error', 'Error al eliminar amigo');
      });
      
      // Additional edge cases for existing endpoints
      it('should handle boolean values in updateStats with isCorrect parameter', async () => {
        const user = await User.create({ 
          username: 'updatestatsbool', 
          password: 'hashedpassword',
          correctAnswers: 0,
          wrongAnswers: 0
        });
        
        // Test with isCorrect: true
        let response = await request(app)
          .post('/updateStats')
          .send({ username: 'updatestatsbool', isCorrect: true });
        
        expect(response.status).toBe(200);
        let updatedUser = await User.findOne({ username: 'updatestatsbool' });
        expect(updatedUser.correctAnswers).toBe(1);
        expect(updatedUser.wrongAnswers).toBe(0);
        
        // Test with isCorrect: false
        response = await request(app)
          .post('/updateStats')
          .send({ username: 'updatestatsbool', isCorrect: false });
        
        expect(response.status).toBe(200);
        updatedUser = await User.findOne({ username: 'updatestatsbool' });
        expect(updatedUser.correctAnswers).toBe(1);
        expect(updatedUser.wrongAnswers).toBe(1);
      });
      
      it('should handle numeric values in updateStats with correct/wrong parameters', async () => {
        const user = await User.create({ 
          username: 'updatestatsnum', 
          password: 'hashedpassword',
          correctAnswers: 5,
          wrongAnswers: 3
        });
        
        const response = await request(app)
          .post('/updateStats')
          .send({ 
            username: 'updatestatsnum', 
            correct: 2,
            wrong: 1
          });
        
        expect(response.status).toBe(200);
        const updatedUser = await User.findOne({ username: 'updatestatsnum' });
        expect(updatedUser.correctAnswers).toBe(7); // 5 + 2
        expect(updatedUser.wrongAnswers).toBe(4);   // 3 + 1
      });
      
      it('should sanitize non-numeric values in updateStats', async () => {
        const user = await User.create({ 
          username: 'sanitizeuser', 
          password: 'hashedpassword',
          correctAnswers: 10,
          wrongAnswers: 5,
          totalTimePlayed: 100
        });
        
        const response = await request(app)
          .post('/updateStats')
          .send({ 
            username: 'sanitizeuser', 
            correct: "invalid",
            wrong: "invalid",
            timeTaken: "invalid" 
          });
        
        expect(response.status).toBe(200);
        const updatedUser = await User.findOne({ username: 'sanitizeuser' });
        // Should convert non-numeric values to 0
        expect(updatedUser.correctAnswers).toBe(10);  // Unchanged because correct=0
        expect(updatedUser.wrongAnswers).toBe(5);     // Unchanged because wrong=0
        expect(updatedUser.totalTimePlayed).toBe(100); // Unchanged because timeTaken=0
      });
      
      it('should sanitize username in updateStats', async () => {
        const user = await User.create({ 
          username: 'trimmedusername', 
          password: 'hashedpassword',
          correctAnswers: 0
        });
        
        const response = await request(app)
          .post('/updateStats')
          .send({ 
            username: '  trimmedusername  ', // With spaces to be trimmed
            isCorrect: true 
          });
        
        expect(response.status).toBe(200);
        const updatedUser = await User.findOne({ username: 'trimmedusername' });
        expect(updatedUser.correctAnswers).toBe(1);
      });
      
      it('should return 500 if username is not a string in updateStats', async () => {
        const response = await request(app)
          .post('/updateStats')
          .send({ 
            username: 123, // Not a string
            isCorrect: true 
          });
        
        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error', 'Error al actualizar estadísticas');
      });
      
      it('should handle updating partial settings without overwriting existing ones', async () => {
        const initialSettings = { theme: 'light', language: 'en', notifications: true };
        const user = await User.create({ 
          username: 'partialsettingsuser', 
          password: 'hashedpassword',
          settings: initialSettings 
        });
        
        const partialUpdate = { theme: 'dark' };
        const response = await request(app)
          .post('/saveSettings/partialsettingsuser')
          .send(partialUpdate);
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Ajustes guardados');

      });


});
