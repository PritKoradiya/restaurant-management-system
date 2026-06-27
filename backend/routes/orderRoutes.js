import express from 'express';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Billing from '../models/Billing.js';
import MenuItem from '../models/MenuItem.js';
import User from '../models/User.js';
import { protectRoute, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// Create order
router.post('/', protectRoute, async (req, res) => {
  const { items, orderType, tableNumber, deliveryAddress, paymentMethod, notes, discount } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'Order must contain at least one item' });
  }

  try {
    const normalizedItemsInput = items.map((item) => ({
      menuItemId: item.menuItemId || item._id || item.id,
      quantity: Number(item.quantity) || 1,
      specialInstructions: item.specialInstructions || ''
    }));

    const hasInvalidMenuItemId = normalizedItemsInput.some(
      (item) => !mongoose.Types.ObjectId.isValid(item.menuItemId)
    );

    if (hasInvalidMenuItemId) {
      return res.status(400).json({ message: 'Each order item must contain a valid menu item ID' });
    }

    const invalidQuantity = normalizedItemsInput.some((item) => !Number.isFinite(item.quantity) || item.quantity < 1);
    if (invalidQuantity) {
      return res.status(400).json({ message: 'Each order item must have quantity of at least 1' });
    }

    const menuItemIds = normalizedItemsInput.map((item) => new mongoose.Types.ObjectId(item.menuItemId));
    const menuItems = await MenuItem.find({ _id: { $in: menuItemIds }, isAvailable: true })
      .select('_id name price');

    if (menuItems.length !== menuItemIds.length) {
      return res.status(400).json({ message: 'One or more menu items are invalid or unavailable' });
    }

    const menuItemById = new Map(menuItems.map((menuItem) => [String(menuItem._id), menuItem]));
    const normalizedItems = normalizedItemsInput.map((item) => {
      const menuItem = menuItemById.get(String(item.menuItemId));
      return {
        menuItemId: menuItem._id,
        name: menuItem.name,
        price: Number(menuItem.price) || 0,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions
      };
    });

    const discountValue = Number(discount) || 0;
    const safeDiscount = discountValue > 0 ? discountValue : 0;

    // Calculate total amount
    const subtotal = normalizedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalAmount = Math.max(0, subtotal - safeDiscount);

    const order = new Order({
      customerId: req.userId,
      items: normalizedItems,
      totalAmount,
      orderType: orderType || 'Dine-In',
      tableNumber,
      deliveryAddress,
      paymentMethod: paymentMethod || 'Cash',
      notes,
      discount: safeDiscount
    });

    await order.save();

    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: error.message });
  }
});

// Get customer's orders
router.get('/my-orders', protectRoute, async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.userId })
      .sort({ createdAt: -1 })
      .populate('customerId', 'username email')
      .populate('staffAssigned', 'username firstName lastName');

    res.status(200).json({ orders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all orders (Staff/Admin)
router.get('/', protectRoute, authorizeRole('admin', 'staff'), async (req, res) => {
  try {
    const { status, orderType, dateFrom, dateTo } = req.query;
    let filter = {};

    if (req.role === 'staff') {
      if (!mongoose.Types.ObjectId.isValid(req.userId)) {
        return res.status(200).json({ orders: [] });
      }
      filter.staffAssigned = new mongoose.Types.ObjectId(req.userId);
    }

    if (status) filter.status = status;
    if (orderType) filter.orderType = orderType;

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .populate('customerId', 'username email phone')
      .populate('staffAssigned', 'username firstName lastName staffStatus isLoggedIn');

    res.status(200).json({ orders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get order statistics (Admin/Staff)
router.get('/stats/daily', protectRoute, authorizeRole('admin', 'staff'), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const matchStage = {
      createdAt: { $gte: today }
    };

    // Staff can only view their assigned orders in stats.
    if (req.role === 'staff') {
      matchStage.staffAssigned = new mongoose.Types.ObjectId(req.userId);
    }

    const stats = await Order.aggregate([
      {
        $match: matchStage
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' }
        }
      }
    ]);

    res.status(200).json({ stats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single order
router.get('/:id', protectRoute, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customerId', 'username email phone address')
      .populate('staffAssigned', 'username firstName lastName');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check permission
    if (req.role === 'staff') {
      if (!order.staffAssigned || String(order.staffAssigned) !== req.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (String(order.customerId._id) !== req.userId && req.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.status(200).json({ order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update order status (Staff/Admin)
router.patch('/:id/status', protectRoute, authorizeRole('admin', 'staff'), async (req, res) => {
  const { status } = req.body;

  const validStatuses = ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Delivered', 'Cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (req.role === 'admin') {
      if (status === 'Confirmed' && !order.staffAssigned) {
        return res.status(400).json({ message: 'Assign staff before accepting the order' });
      }

      if (status === 'Delivered' && !order.staffNotifiedAdmin) {
        return res.status(400).json({ message: 'Staff must notify admin before completing the order' });
      }
    }

    if (req.role === 'staff') {
      if (!order.staffAssigned || String(order.staffAssigned) !== req.userId) {
        return res.status(403).json({ message: 'Only assigned staff can update this order' });
      }

      if (status === 'Confirmed' || status === 'Delivered') {
        return res.status(403).json({ message: 'Staff cannot set this status' });
      }
    }

    order.status = status;

    // Once admin completes order, reset notify flag.
    if (status === 'Delivered') {
      order.staffNotifiedAdmin = false;
      order.staffNotifiedAt = null;
    }

    await order.save();

    res.status(200).json({ message: 'Order status updated', order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Staff notify admin that assigned order is ready
router.patch('/:id/notify-admin', protectRoute, authorizeRole('staff'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!order.staffAssigned || String(order.staffAssigned) !== req.userId) {
      return res.status(403).json({ message: 'Only assigned staff can notify admin' });
    }

    if (!['Preparing', 'Ready'].includes(order.status)) {
      return res.status(400).json({ message: 'Order must be preparing or ready before notifying admin' });
    }

    order.status = 'Ready';
    order.staffNotifiedAdmin = true;
    order.staffNotifiedAt = new Date();
    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate('customerId', 'username email phone')
      .populate('staffAssigned', 'username firstName lastName staffStatus isLoggedIn');

    res.status(200).json({ message: 'Admin has been notified by staff', order: populatedOrder });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update order payment status (Admin)
router.patch('/:id/payment-status', protectRoute, authorizeRole('admin'), async (req, res) => {
  const { paymentStatus } = req.body;

  const validStatuses = ['Pending', 'Paid', 'Failed'];
  if (!validStatuses.includes(paymentStatus)) {
    return res.status(400).json({ message: 'Invalid payment status' });
  }

  const session = await mongoose.startSession();

  try {
    let order;
    await session.withTransaction(async () => {
      order = await Order.findByIdAndUpdate(
        req.params.id,
        { paymentStatus },
        { new: true, session }
      );

      if (!order) {
        return;
      }

      const billingUpdate = {
        paymentStatus,
        paymentMethod: order.paymentMethod || 'Cash',
        paymentDate: paymentStatus === 'Paid' ? new Date() : undefined
      };

      await Billing.findOneAndUpdate(
        { orderId: order._id },
        billingUpdate,
        { session }
      );
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json({ message: 'Payment status updated', order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  } finally {
    await session.endSession();
  }
});

// Customer online payment (Delivered orders only)
router.patch('/:id/pay-online', protectRoute, async (req, res) => {
  const session = await mongoose.startSession();

  try {
    let order;

    // Atomic update prevents double payment success from rapid repeated requests.
    await session.withTransaction(async () => {
      order = await Order.findOneAndUpdate(
        {
          _id: req.params.id,
          customerId: req.userId,
          status: 'Delivered',
          paymentStatus: { $ne: 'Paid' }
        },
        {
          paymentMethod: 'UPI',
          paymentStatus: 'Paid'
        },
        { new: true, session }
      );

      if (!order) {
        return;
      }

      await Billing.findOneAndUpdate(
        { orderId: order._id },
        {
          $set: {
            paymentStatus: 'Paid',
            paymentMethod: 'UPI',
            paymentDate: new Date(),
            transactionId: `UPI-${Date.now()}-${String(order._id).slice(-6)}`,
            totalAmount: order.totalAmount,
            discount: order.discount || 0
          },
          $setOnInsert: {
            orderId: order._id,
            customerId: order.customerId,
            subtotal: order.totalAmount,
            tax: 0,
            deliveryCharges: 0
          }
        },
        { new: true, upsert: true, session, setDefaultsOnInsert: true }
      );
    });

    if (!order) {
      const existingOrder = await Order.findById(req.params.id);

      if (!existingOrder) {
        return res.status(404).json({ message: 'Order not found' });
      }

      if (String(existingOrder.customerId) !== req.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      if (existingOrder.status !== 'Delivered') {
        return res.status(400).json({ message: 'Online payment is available only after delivery' });
      }

      if (existingOrder.paymentStatus === 'Paid') {
        return res.status(400).json({ message: 'Order is already paid' });
      }

      return res.status(400).json({ message: 'Unable to process payment for this order' });
    }

    res.status(200).json({ message: 'Payment completed successfully', order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  } finally {
    await session.endSession();
  }
});

// Assign staff to order (Admin)
router.patch('/:id/assign-staff', protectRoute, authorizeRole('admin'), async (req, res) => {
  const { staffId } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(staffId)) {
      return res.status(400).json({ message: 'Invalid staff ID' });
    }

    const staffMember = await User.findOne({ _id: staffId, role: 'staff', isActive: true });
    if (!staffMember) {
      return res.status(404).json({ message: 'Active staff member not found' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { staffAssigned: staffId, staffNotifiedAdmin: false, staffNotifiedAt: null },
      { new: true }
    )
      .populate('customerId', 'username email phone')
      .populate('staffAssigned', 'username firstName lastName staffStatus isLoggedIn');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json({ message: 'Staff assigned to order', order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Cancel order
router.patch('/:id/cancel', protectRoute, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check permission
    if (String(order.customerId) !== req.userId && req.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Can't cancel if order is already delivered
    if (['Ready', 'Delivered'].includes(order.status)) {
      return res.status(400).json({ message: 'Cannot cancel this order' });
    }

    order.status = 'Cancelled';
    await order.save();

    res.status(200).json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
