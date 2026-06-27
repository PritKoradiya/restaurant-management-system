import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    category: {
      type: String,
      enum: ['Main Course', 'Bread', 'South Indian', 'Starter', 'Side Dish', 'Beverage', 'Dessert', 'Thali'],
      required: true
    },
    emoji: String,
    isAvailable: {
      type: Boolean,
      default: true
    },
    image: String,
    preparationTime: Number, // in minutes
    isVegetarian: {
      type: Boolean,
      default: true
    },
    spicyLevel: {
      type: Number,
      min: 0,
      max: 5,
      default: 1
    }
  },
  { timestamps: true }
);

const MenuItem = mongoose.model('MenuItem', menuItemSchema);
export default MenuItem;
