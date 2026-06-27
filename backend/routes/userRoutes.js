import express from 'express';
import User from '../models/User.js';
import Order from '../models/Order.js';
import { protectRoute, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// Get staff list with workload (Admin)
router.get('/role/staff', protectRoute, authorizeRole('admin'), async (req, res) => {
  try {
    const { onlineOnly } = req.query;
    const staffFilter = { role: 'staff', isActive: true };

    if (onlineOnly === 'true') {
      staffFilter.isLoggedIn = true;
    }

    const staff = await User.find(staffFilter)
      .select('-password')
      .sort({ isLoggedIn: -1, staffStatus: 1, staffStatusUpdatedAt: -1, username: 1 });

    const activeAssignments = await Order.aggregate([
      {
        $match: {
          staffAssigned: { $ne: null },
          status: { $nin: ['Delivered', 'Completed', 'Cancelled'] }
        }
      },
      {
        $group: {
          _id: '$staffAssigned',
          activeOrderCount: { $sum: 1 }
        }
      }
    ]);

    const assignmentMap = new Map(
      activeAssignments.map((entry) => [String(entry._id), entry.activeOrderCount])
    );

    const staffWithWorkload = staff.map((member) => ({
      ...member.toObject(),
      activeOrderCount: assignmentMap.get(String(member._id)) || 0
    }));

    res.status(200).json({ staff: staffWithWorkload });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update own staff status (Staff)
router.patch('/me/staff-status', protectRoute, authorizeRole('staff'), async (req, res) => {
  try {
    const { staffStatus } = req.body;
    const validStatuses = ['Available', 'Busy', 'Offline'];

    if (!validStatuses.includes(staffStatus)) {
      return res.status(400).json({ message: 'Invalid staff status' });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { staffStatus, staffStatusUpdatedAt: new Date(), isLoggedIn: true },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'Staff status updated', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all users (Admin only)
router.get('/', protectRoute, authorizeRole('admin'), async (req, res) => {
  try {
    const { role, isActive } = req.query;
    let filter = {};

    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single user (Admin or self)
router.get('/:id', protectRoute, async (req, res) => {
  try {
    if (req.params.id !== req.userId && req.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user profile
router.put('/:id', protectRoute, async (req, res) => {
  try {
    if (req.params.id !== req.userId && req.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { firstName, lastName, phone, address, email } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { firstName, lastName, phone, address, email },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Change password
router.post('/:id/change-password', protectRoute, async (req, res) => {
  try {
    if (req.params.id !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide current and new password' });
    }

    const user = await User.findById(req.params.id).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isPasswordCorrect = await user.matchPassword(currentPassword);

    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Deactivate user (Admin only)
router.patch('/:id/deactivate', protectRoute, authorizeRole('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User deactivated successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Activate user (Admin only)
router.patch('/:id/activate', protectRoute, authorizeRole('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User activated successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
