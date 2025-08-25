const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

const connectDB = async () => {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set');
    process.exit(1);
  }

  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    try {
      const conn = await mongoose.connect(MONGODB_URI, {
        // modern mongoose no longer needs the old flags
        serverSelectionTimeoutMS: 10000,
        maxPoolSize: 10,
      });
      console.log(`📊 MongoDB Connected: ${conn.connection.host}`);
      break;
    } catch (err) {
      attempts += 1;
      console.error(`❌ DB connect attempt ${attempts} failed: ${err.message}`);
      if (attempts >= maxAttempts) {
        process.exit(1);
      }
      await new Promise(r => setTimeout(r, 2000 * attempts));
    }
  }

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('📊 MongoDB disconnected');
  });

  const close = async (signal) => {
    try {
      await mongoose.connection.close();
      console.log(`📊 MongoDB connection closed on ${signal}`);
      process.exit(0);
    } catch (e) {
      process.exit(1);
    }
  };

  process.on('SIGINT', () => close('SIGINT'));
  process.on('SIGTERM', () => close('SIGTERM'));
};

module.exports = connectDB;
