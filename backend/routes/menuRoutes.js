import express from 'express';
import MenuItem from '../models/MenuItem.js';
import { protectRoute, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// Get all menu items
router.get('/', async (req, res) => {
  try {
    const { category, available } = req.query;
    let filter = {};

    if (category) filter.category = category;
    if (available !== undefined) filter.isAvailable = available === 'true';

    const items = await MenuItem.find(filter).sort({ category: 1, name: 1 });
    res.status(200).json({ items });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get menu categories
router.get('/categories/all', async (req, res) => {
  try {
    const categories = await MenuItem.distinct('category');
    res.status(200).json({ categories });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single menu item
router.get('/:id', async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.status(200).json({ item });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create menu item (Admin only)
router.post('/', protectRoute, authorizeRole('admin'), async (req, res) => {
  const { name, description, price, category, emoji, image, preparationTime, isAvailable, isVegetarian, spicyLevel } = req.body;

  if (!name || !description || !price || !category) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  try {
    const item = new MenuItem({
      name,
      description,
      price,
      category,
      emoji,
      image,
      preparationTime,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      isVegetarian: isVegetarian !== undefined ? isVegetarian : true,
      spicyLevel: spicyLevel || 1
    });

    await item.save();
    res.status(201).json({ message: 'Menu item created successfully', item });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: error.message });
  }
});

// Update menu item (Admin only)
router.put('/:id', protectRoute, authorizeRole('admin'), async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.status(200).json({ message: 'Menu item updated successfully', item });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete menu item (Admin only)
router.delete('/:id', protectRoute, authorizeRole('admin'), async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.status(200).json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
