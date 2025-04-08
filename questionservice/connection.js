const mongoose = require('mongoose');

const connectToDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/questiondb';
  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

module.exports = connectToDatabase;