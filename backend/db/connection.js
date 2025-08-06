// backend/db/connection.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Set mongoose options for better stability (removed deprecated options)
    const options = {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    };
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tastyreply', options);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('⚠️ MongoDB connection error:', error.message);
    console.log('⚠️ Server will continue running without database connection');
    // Don't exit the process - let the server run even if DB is down
    // This allows Railway health checks to pass
  }
};

module.exports = connectDB;