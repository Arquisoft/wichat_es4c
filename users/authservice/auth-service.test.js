const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // Necesario para generar tokens o analizar respuestas
const User = require('./auth-model');

let mongoServer;
let app;

// Test users
const regularUser = {
  username: 'testuser',
  password: 'testpassword',
  role: 'user' // Añadimos rol para claridad
};

const adminUser = {
  username: 'adminuser',
  password: 'adminpassword',
  role: 'admin' // Rol de administrador
};

// Helper para añadir usuarios con roles
async function addUser(userData) {
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  const newUser = new User({
    username: userData.username,
    password: hashedPassword,
    role: userData.role || 'user' // Rol por defecto 'user' si no se especifica
  });
  await newUser.save();
  // Devolvemos el usuario guardado por si necesitamos el _id, etc.
  return newUser;
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  process.env.MONGODB_URI = mongoUri;
  app = require('./auth-service');

  // Limpia la base de datos y añade usuarios de prueba
  await User.deleteMany({}); // Limpia por si acaso
  await addUser(regularUser);
  await addUser(adminUser);
});

afterAll(async () => {
  app.close();
  await mongoServer.stop();
});

describe('Auth Service', () => {

  describe('/login endpoint', () => {
    it('Should perform a login operation for regular user', async () => {
      const response = await request(app).post('/login').send({
        username: regularUser.username,
        password: regularUser.password
      });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('username', regularUser.username);
      expect(response.body).toHaveProperty('role', regularUser.role); // Verifica rol en respuesta
    });

    it('Should perform a login operation for admin user', async () => {
        const response = await request(app).post('/login').send({
          username: adminUser.username,
          password: adminUser.password
        });
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
        expect(response.body).toHaveProperty('username', adminUser.username);
        expect(response.body).toHaveProperty('role', adminUser.role); // Verifica rol 'admin'
      });

    it('Should return 401 for invalid credentials', async () => {
      const response = await request(app).post('/login').send({
        username: regularUser.username,
        password: 'wrongpassword'
      });
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

     it('Should return 400 for missing fields', async () => {
        const response = await request(app).post('/login').send({
          username: regularUser.username
          // Falta password
        });
        expect(response.status).toBe(400); 
     });
  });

  // --- Tests para /adminPanel GET ---
  describe('/adminPanel GET endpoint', () => {
    let adminToken;
    let userToken;

    // Obtenemos tokens válidos antes de los tests de este bloque
    beforeAll(async () => {
      const adminLoginResponse = await request(app).post('/login').send({
        username: adminUser.username,
        password: adminUser.password
      });
      adminToken = adminLoginResponse.body.token;

      const userLoginResponse = await request(app).post('/login').send({
        username: regularUser.username,
        password: regularUser.password
      });
      userToken = userLoginResponse.body.token;
    });

    it('should return 200 and user list for admin user', async () => {
      const response = await request(app)
        .get('/adminPanel')
        .set('Authorization', `Bearer ${adminToken}`); // Usa el token de admin

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true); // Debe devolver un array
      expect(response.body.length).toBeGreaterThanOrEqual(2); // Al menos admin y user

      // Verifica que los usuarios esperados están en la lista y no tienen contraseña
      const receivedUsernames = response.body.map(u => u.username);
      expect(receivedUsernames).toContain(adminUser.username);
      expect(receivedUsernames).toContain(regularUser.username);

      // Verifica que ningún usuario en la respuesta tenga el campo password
      response.body.forEach(user => {
        expect(user).not.toHaveProperty('password');
      });
    });

    it('should return 403 Forbidden for non-admin user', async () => {
      const response = await request(app)
        .get('/adminPanel')
        .set('Authorization', `Bearer ${userToken}`); // Usa el token de usuario normal

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Acceso denegado. Se requiere rol de administrador.');
    });

    it('should return 401 Unauthorized if no token is provided', async () => {
      const response = await request(app).get('/adminPanel'); // Sin cabecera Authorization

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'No token provided');
    });

    it('should return 401 Unauthorized if token is invalid or malformed', async () => {
      const response = await request(app)
        .get('/adminPanel')
        .set('Authorization', 'Bearer invalid.token.string'); // Token inválido

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Token inválido o expirado');
    });

     it('should return 403 Forbidden if user role changes after token issuance', async () => {
        // 1. Obtener un token de admin válido (ya lo tenemos en adminToken)

        // 2. Cambiar el rol del admin a 'user' directamente en la BD
        await User.findOneAndUpdate(
            { username: adminUser.username },
            { $set: { role: 'user' } }
        );

        // 3. Intentar acceder con el token *original* de admin
        const response = await request(app)
          .get('/adminPanel')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty('error', 'Acceso denegado. Se requiere rol de administrador.');

        // 4. Restaurar el rol para no afectar otros tests 
         await User.findOneAndUpdate(
            { username: adminUser.username },
            { $set: { role: 'admin' } }
        );
     });
  });

  describe('/login endpoint additional tests', () => {
    it('should return 400 for invalid username format', async () => {
      const response = await request(app).post('/login').send({
        username: 'a', 
        password: 'validpassword'
      });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should return 400 for invalid password format', async () => {
      const response = await request(app).post('/login').send({
        username: 'validuser',
        password: 'ab' 
      });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should return 401 for non-existent user', async () => {
      const response = await request(app).post('/login').send({
        username: 'nonexistentuser',
        password: 'somepassword'
      });
      
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });
    
    it('should sanitize input properly', async () => {
      const response = await request(app).post('/login').send({
        username: '<script>alert("XSS")</script>',
        password: 'password123'
      });
      
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('JWT token handling', () => {
    it('should generate token with correct payload structure', async () => {
      // Hacer login para obtener token
      const response = await request(app).post('/login').send({
        username: regularUser.username,
        password: regularUser.password
      });
      
      const token = response.body.token;
      expect(token).toBeTruthy();
      
      // Decodificar el token para verificar su estructura
      const decoded = jwt.verify(token, 'your-secret-key');
      
      // Verificar la estructura del payload
      expect(decoded).toHaveProperty('userId');
      expect(decoded).toHaveProperty('role', regularUser.role);
      expect(decoded).toHaveProperty('iat'); // issued at
      expect(decoded).toHaveProperty('exp'); // expiration
      
      // Verificar que la expiración es aproximadamente en 1 hora
      const oneHourInSeconds = 3600;
      expect(decoded.exp - decoded.iat).toBe(oneHourInSeconds);
    });
  });


  describe('Error handling', () => {
  it('should handle internal errors in login endpoint', async () => {
    // Mockear User.findOne para simular un error de BD
    const originalFindOne = User.findOne;
    User.findOne = jest.fn().mockRejectedValue(new Error('Database error'));
    
    try {
      const response = await request(app).post('/login').send({
        username: regularUser.username,
        password: regularUser.password
      });
      
      // Verificar respuesta de error
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Internal Server Error');
    } finally {
      // Restaurar la función original
      User.findOne = originalFindOne;
    }
  });
  
  it('should handle internal errors in adminPanel endpoint', async () => {
    let adminToken;
    
    // Obtener token de admin
    const adminLogin = await request(app).post('/login').send({
      username: adminUser.username,
      password: adminUser.password
    });
    adminToken = adminLogin.body.token;
    
    // Mockear User.find para simular error
    const originalFind = User.find;
    User.find = jest.fn().mockRejectedValue(new Error('Database error'));
    
    try {
      const response = await request(app)
        .get('/adminPanel')
        .set('Authorization', `Bearer ${adminToken}`);
      
      // Verificar respuesta de error
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    } finally {
      // Restaurar la función original
      User.find = originalFind;
    }
  });
});
  
});