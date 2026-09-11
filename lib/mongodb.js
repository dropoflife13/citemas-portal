import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null, status: 'disconnected' };
}

async function connectDB() {
  // If already connected, return the connection
  if (cached.conn) {
    cached.status = 'connected';
    return cached.conn;
  }

  // If connection is in progress, wait for it
  if (cached.promise) {
    cached.status = 'connecting';
    cached.conn = await cached.promise;
    cached.status = 'connected';
    return cached.conn;
  }

  try {
    cached.status = 'connecting';
    console.log('🔄 Connecting to MongoDB Atlas...');
    
    cached.promise = mongoose.connect(MONGODB_URI, {
      // These options help with connection stability
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
      socketTimeoutMS: 45000,
    }).then((mongoose) => {
      console.log('✅ MongoDB Atlas connected successfully!');
      cached.status = 'connected';
      return mongoose;
    });

    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.status = 'error';
    console.error('❌ MongoDB connection error:', error.message);
    throw error;
  }
}

// Helper function to get connection status
export function getConnectionStatus() {
  return {
    status: cached.status,
    isConnected: cached.status === 'connected',
    isConnecting: cached.status === 'connecting',
    hasError: cached.status === 'error'
  };
}

// Helper function to test connection
export async function testConnection() {
  try {
    await connectDB();
    return { connected: true, status: cached.status };
  } catch (error) {
    return { 
      connected: false, 
      status: cached.status,
      error: error.message 
    };
  }
}

export default connectDB;