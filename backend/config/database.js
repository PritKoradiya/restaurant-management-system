import mongoose from 'mongoose';

let connectionPromise = null;

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (mongoose.connection.readyState === 2 && connectionPromise) {
    return connectionPromise;
  }

  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    throw new Error('MONGODB_URI is not set in environment variables');
  }

  const redactedUri = mongoURI.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@');
  console.log('Using MongoDB URI:', redactedUri);

  connectionPromise = mongoose.connect(mongoURI, {
    dbName: 'restaurant-management',
    serverSelectionTimeoutMS: 10000,
    family: 4
  });

  try {
    await connectionPromise;
    console.log('MongoDB connected successfully');
    return mongoose.connection;
  } catch (error) {
    connectionPromise = null;
    throw error;
  }
};
export default connectDB;