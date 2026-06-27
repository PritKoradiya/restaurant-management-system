import express from 'express';
import { logRequest } from '../utils/helpers.js';

export const setupMiddleware = (app) => {
  // Request logging
  app.use(logRequest);

  // Rate limiting mock (can be replaced with express-rate-limit)
  const requestLimits = new Map();

  const rateLimitMiddleware = (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    
    if (!requestLimits.has(ip)) {
      requestLimits.set(ip, []);
    }
    
    const times = requestLimits.get(ip).filter(t => now - t < 60000);
    
    if (times.length > 100) {
      return res.status(429).json({ message: 'Too many requests. Please try again later.' });
    }
    
    times.push(now);
    requestLimits.set(ip, times);
    next();
  };

  app.use(rateLimitMiddleware);
};

// Export for use in server.js
export default setupMiddleware;
