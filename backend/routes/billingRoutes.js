import express from 'express';
import mongoose from 'mongoose';
import Billing from '../models/Billing.js';
import Order from '../models/Order.js';
import { protectRoute, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// Create billing (Admin only)
router.post('/', protectRoute, authorizeRole('admin'), async (req, res) => {
  const { orderId, paymentMethod, discount, deliveryCharges } = req.body;

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if billing already exists
    const existingBilling = await Billing.findOne({ orderId });
    if (existingBilling) {
      return res.status(400).json({ message: 'Billing already exists for this order' });
    }

    const subtotal = order.totalAmount;
    const tax = Math.round(subtotal * 0.05); // 5% tax
    const totalAmount = subtotal + tax + (deliveryCharges || 0) - (discount || 0);

    const isOrderPaid = order.paymentStatus === 'Paid';

    const billing = new Billing({
      orderId,
      customerId: order.customerId,
      subtotal,
      tax,
      discount: discount || 0,
      deliveryCharges: deliveryCharges || 0,
      totalAmount,
      paymentMethod: paymentMethod || order.paymentMethod || 'Cash',
      paymentStatus: isOrderPaid ? 'Paid' : 'Pending',
      paymentDate: isOrderPaid ? new Date() : undefined
    });

    await billing.save();

    res.status(201).json({
      message: 'Billing created successfully',
      billing
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get billing for order
router.get('/order/:orderId', protectRoute, async (req, res) => {
  try {
    const billing = await Billing.findOne({ orderId: req.params.orderId })
      .populate('orderId')
      .populate('customerId', 'username email');

    if (!billing) {
      return res.status(404).json({ message: 'Billing not found' });
    }

    // Check permission
    if (String(billing.customerId._id) !== req.userId && !['admin', 'staff'].includes(req.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.status(200).json({ billing });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all billings (Admin only)
router.get('/', protectRoute, authorizeRole('admin'), async (req, res) => {
  try {
    const { paymentStatus, dateFrom, dateTo } = req.query;
    let filter = {};

    if (paymentStatus) filter.paymentStatus = paymentStatus;

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const billings = await Billing.find(filter)
      .sort({ createdAt: -1 })
      .populate('orderId', 'orderNumber')
      .populate('customerId', 'username email');

    res.status(200).json({ billings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update payment status
router.patch('/:id/payment-status', protectRoute, authorizeRole('admin'), async (req, res) => {
  const { paymentStatus, transactionId } = req.body;

  const validStatuses = ['Pending', 'Paid', 'Failed', 'Refunded'];
  if (!validStatuses.includes(paymentStatus)) {
    return res.status(400).json({ message: 'Invalid payment status' });
  }

  const session = await mongoose.startSession();

  try {
    let billing;
    await session.withTransaction(async () => {
      billing = await Billing.findByIdAndUpdate(
        req.params.id,
        {
          paymentStatus,
          transactionId: transactionId || undefined,
          paymentDate: paymentStatus === 'Paid' ? new Date() : undefined
        },
        { new: true, session }
      );

      if (!billing) {
        return;
      }

      if (paymentStatus === 'Paid') {
        await Order.findByIdAndUpdate(billing.orderId, { paymentStatus: 'Paid' }, { session });
      }
    });

    if (!billing) {
      return res.status(404).json({ message: 'Billing not found' });
    }

    res.status(200).json({ message: 'Payment status updated', billing });
  } catch (error) {
    res.status(500).json({ message: error.message });
  } finally {
    await session.endSession();
  }
});

// Get billing statistics (Admin)
router.get('/stats/revenue', protectRoute, authorizeRole('admin'), async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    let filter = { paymentStatus: 'Paid' };

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const stats = await Billing.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalTax: { $sum: '$tax' },
          totalDiscount: { $sum: '$discount' },
          transactionCount: { $sum: 1 },
          avgOrderValue: { $avg: '$totalAmount' }
        }
      }
    ]);

    res.status(200).json({
      stats: stats[0] || {
        totalRevenue: 0,
        totalTax: 0,
        totalDiscount: 0,
        transactionCount: 0,
        avgOrderValue: 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
