const request = require('supertest');
const bcrypt = require('bcrypt');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('./user-model');

let mongoServer;
let app;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  process.env.MONGODB_URI = mongoUri;
  app = require('./user-service');
});

afterAll(async () => {
  app.close();
  await mongoServer.stop();
});

describe('User Service', () => {
  it('should add a new user on POST /adduser', async () => {
    const newUser = { username: 'testuser', password: 'testpassword' };
    const response = await request(app).post('/adduser').send(newUser);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('username', 'testuser');
    const userInDb = await User.findOne({ username: 'testuser' });
    expect(userInDb).not.toBeNull();
    expect(userInDb.username).toBe('testuser');
    const isPasswordValid = await bcrypt.compare('testpassword', userInDb.password);
    expect(isPasswordValid).toBe(true);
  });

  it('should get user profile on GET /profile/:username', async () => {
    const user = new User({ username: 'profileuser', password: await bcrypt.hash('pass', 10) });
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
    const user = new User({ username: 'statuser', password: await bcrypt.hash('pass', 10), correctAnswers: 0, wrongAnswers: 0, totalTimePlayed: 0 });
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
      { username: 'player1', password: await bcrypt.hash('pass', 10), correctAnswers: 10, wrongAnswers: 5, gamesPlayed: 3 },
      { username: 'player2', password: await bcrypt.hash('pass', 10), correctAnswers: 15, wrongAnswers: 2, gamesPlayed: 4 },
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
    const user = new User({ username: 'gameplayer', password: await bcrypt.hash('pass', 10), gamesPlayed: 0 });
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
});
