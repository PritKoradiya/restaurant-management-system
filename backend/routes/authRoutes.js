import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protectRoute } from '../middleware/auth.js';
import { getJwtSecret } from '../utils/env.js';

const router = express.Router();

const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    getJwtSecret(),
    { expiresIn: '24h' }
  );
};

// Register
router.post('/register', async (req, res) => {
  const { username, email, password, role, firstName, lastName, phone } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  try {
    let user = await User.findOne({ $or: [{ username }, { email }] });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    user = new User({
      username,
      email,
      password,
      role: role || 'customer',
      firstName,
      lastName,
      phone
    });

    await user.save();

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Please provide username and password' });
  }

  try {
    const user = await User.findOne({ username }).select('+password');
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is inactive' });
    }

    const isPasswordCorrect = await user.matchPassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user role matches (for staff/admin)
    if (role && user.role !== role) {
      return res.status(403).json({ message: 'Invalid role for this user' });
    }

    if (user.role === 'staff') {
      user.isLoggedIn = true;
      user.lastLoginAt = new Date();
      await user.save();
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current user
router.get('/me', protectRoute, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Logout
router.post('/logout', protectRoute, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, { isLoggedIn: false });
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
