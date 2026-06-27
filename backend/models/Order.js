import mongoose from 'mongoose';

const generateOrderNumber = () => `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

const orderItemSchema = new mongoose.Schema({
  menuItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true
  },
  name: String,
  price: Number,
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  specialInstructions: String
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: true,
      default: generateOrderNumber
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Delivered', 'Cancelled'],
      default: 'Pending'
    },
    orderType: {
      type: String,
      enum: ['Dine-In', 'Takeaway', 'Delivery'],
      default: 'Dine-In'
    },
    tableNumber: String, // For dine-in orders
    deliveryAddress: String, // For delivery orders
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed'],
      default: 'Pending'
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Card', 'UPI', 'Wallet'],
      default: 'Cash'
    },
    estimatedDeliveryTime: Date,
    actualDeliveryTime: Date,
    staffAssigned: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    staffNotifiedAdmin: {
      type: Boolean,
      default: false
    },
    staffNotifiedAt: Date,
    notes: String,
    discount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { timestamps: true }
);

// Fallback for edge cases where orderNumber is explicitly unset.
orderSchema.pre('validate', function(next) {
  if (this.isNew && !this.orderNumber) {
    this.orderNumber = generateOrderNumber();
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);
export default Order;
