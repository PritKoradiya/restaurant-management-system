import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

export const requireEnv = (key) => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

let hasWarnedMissingJwtSecret = false;

export const getJwtSecret = () => {
  const jwtSecret = process.env.JWT_SECRET;

  if (jwtSecret) {
    return jwtSecret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Missing required environment variable: JWT_SECRET');
  }

  if (!hasWarnedMissingJwtSecret) {
    hasWarnedMissingJwtSecret = true;
    console.warn('JWT_SECRET is not set. Using an insecure development fallback secret.');
  }

  return 'dev-insecure-jwt-secret-change-me';
};
