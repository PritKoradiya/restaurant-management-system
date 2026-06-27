import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import 'express-async-errors';
import { connectDB } from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import menuRoutes from './routes/menuRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import userRoutes from './routes/userRoutes.js';
import billingRoutes from './routes/billingRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'Server is running',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Keep API reachable when DB is down and return explicit 503 for DB-dependent routes.
app.use('/api', async (req, res, next) => {
  if (req.path === '/health') {
    return next();
  }

  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch (error) {
      return res.status(503).json({
        message: 'Database not connected. Please retry in a few seconds.'
      });
    }
  }

  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/billing', billingRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const wait = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

const connectWithRetry = async (maxAttempts = 5, delayMs = 5000) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await connectDB();
      return;
    } catch (error) {
      console.error(`MongoDB connection attempt ${attempt}/${maxAttempts} failed:`, error.message);

      if (attempt === maxAttempts) {
        throw error;
      }

      console.log(`Retrying MongoDB connection in ${Math.floor(delayMs / 1000)} seconds...`);
      await wait(delayMs);
    }
  }
};

const startServer = async () => {
  try {
    await connectWithRetry();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error('DB connection failed:', error.message);
    process.exit(1);
  }

};

if (process.env.VERCEL) {
  // On Vercel serverless, requests may hit cold instances before startup hooks finish.
  // The /api middleware above ensures a connection attempt per request when needed.
} else {
  startServer();
}

export default app;
