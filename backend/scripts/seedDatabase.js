import User from '../models/User.js';
import MenuItem from '../models/MenuItem.js';
import Order from '../models/Order.js';
import { connectDB } from '../config/database.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const seedDatabase = async () => {
  try {
    await connectDB();
    
    // Clear existing data
    await User.deleteMany({});
    await MenuItem.deleteMany({});
    await Order.deleteMany({});

    // Create default users
    const users = await User.create([
      {
        username: 'admin',
        email: 'admin@restaurant.com',
        password: 'admin123',
        role: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        phone: '+91 9876543210',
        isActive: true
      },
      {
        username: 'staff1',
        email: 'staff1@restaurant.com',
        password: 'staff123',
        role: 'staff',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+91 9876543211',
        isActive: true
      },
      {
        username: 'staff2',
        email: 'staff2@restaurant.com',
        password: 'staff123',
        role: 'staff',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+91 9876543212',
        isActive: true
      },
      {
        username: 'customer1',
        email: 'customer1@example.com',
        password: 'customer123',
        role: 'customer',
        firstName: 'Alice',
        lastName: 'Johnson',
        phone: '+91 9876543213',
        address: '123 Main St, City',
        isActive: true
      },
      {
        username: 'customer2',
        email: 'customer2@example.com',
        password: 'customer123',
        role: 'customer',
        firstName: 'Bob',
        lastName: 'Williams',
        phone: '+91 9876543214',
        address: '456 Oak Ave, Town',
        isActive: true
      }
    ]);

    console.log('✓ Users created successfully');

    // Create menu items
    const menuItems = await MenuItem.create([
      {
        name: "Paneer Butter Masala",
        description: "Creamy tomato-based curry with paneer",
        price: 250,
        category: "Main Course",
        emoji: "🍛",
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=1200&q=80",
        isAvailable: true,
        preparationTime: 20,
        isVegetarian: true,
        spicyLevel: 2
      },
      {
        name: "Garlic Naan",
        description: "Fresh baked bread with garlic butter",
        price: 40,
        category: "Bread",
        emoji: "🫓",
        image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1200&q=80",
        isAvailable: true,
        preparationTime: 5,
        isVegetarian: true,
        spicyLevel: 1
      },
      {
        name: "Chicken Biryani",
        description: "Aromatic basmati rice with tender chicken",
        price: 300,
        category: "Main Course",
        emoji: "🍗",
        image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=1200&q=80",
        isAvailable: true,
        preparationTime: 25,
        isVegetarian: false,
        spicyLevel: 3
      },
      {
        name: "Raita",
        description: "Cool yogurt with cucumber and spices",
        price: 50,
        category: "Side Dish",
        emoji: "🥛",
        image: "https://images.unsplash.com/photo-1617364509844-f7f3f3f7d4e8?auto=format&fit=crop&w=1200&q=80",
        isAvailable: true,
        preparationTime: 3,
        isVegetarian: true,
        spicyLevel: 0
      },
      {
        name: "Veg Thali",
        description: "Complete vegetarian meal with rice, dal, and vegetables",
        price: 180,
        category: "Thali",
        emoji: "🍽️",
        image: "https://images.unsplash.com/photo-1683533697016-32d018f5e6bd?auto=format&fit=crop&w=1200&q=80",
        isAvailable: true,
        preparationTime: 20,
        isVegetarian: true,
        spicyLevel: 2
      },
      {
        name: "Masala Dosa",
        description: "Crispy crepe filled with potato masala",
        price: 120,
        category: "South Indian",
        emoji: "🥞",
        image: "https://images.unsplash.com/photo-1630409346824-4f0e7b080087?auto=format&fit=crop&w=1200&q=80",
        isAvailable: true,
        preparationTime: 15,
        isVegetarian: true,
        spicyLevel: 2
      },
      {
        name: "Butter Chicken",
        description: "Rich and creamy chicken curry",
        price: 280,
        category: "Main Course",
        emoji: "🍗",
        image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=1200&q=80",
        isAvailable: true,
        preparationTime: 22,
        isVegetarian: false,
        spicyLevel: 2
      },
      {
        name: "Gulab Jamun",
        description: "Sweet dumplings in rose syrup",
        price: 80,
        category: "Dessert",
        emoji: "🍬",
        image: "https://images.unsplash.com/photo-1605197161470-5f7f33f9f1f9?auto=format&fit=crop&w=1200&q=80",
        isAvailable: true,
        preparationTime: 5,
        isVegetarian: true,
        spicyLevel: 0
      },
      {
        name: "Lassi",
        description: "Refreshing yogurt drink",
        price: 60,
        category: "Beverage",
        emoji: "🥤",
        image: "https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=1200&q=80",
        isAvailable: true,
        preparationTime: 2,
        isVegetarian: true,
        spicyLevel: 0
      },
      {
        name: "Chili Paneer",
        description: "Spicy Indo-Chinese paneer dish",
        price: 220,
        category: "Starter",
        emoji: "🌶️",
        image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=1200&q=80",
        isAvailable: true,
        preparationTime: 15,
        isVegetarian: true,
        spicyLevel: 4
      },
      {
        name: "Tandoori Chicken",
        description: "Marinated chicken cooked in tandoor",
        price: 320,
        category: "Starter",
        emoji: "🍗",
        image: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=1200&q=80",
        isAvailable: true,
        preparationTime: 25,
        isVegetarian: false,
        spicyLevel: 3
      },
      {
        name: "Vegetable Fried Rice",
        description: "Stir-fried rice with mixed vegetables",
        price: 150,
        category: "Main Course",
        emoji: "🍚",
        image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=1200&q=80",
        isAvailable: true,
        preparationTime: 12,
        isVegetarian: true,
        spicyLevel: 2
      }
    ]);

    console.log('✓ Menu items created successfully');

    // Skip order creation for now - can be added later
    console.log('✓ Skipping sample orders creation (can be added later)');

    console.log('\n✅ Database seeded successfully!');
    console.log('\nDefault Credentials:');
    console.log('Admin:    username: admin,      password: admin123');
    console.log('Staff:    username: staff1,     password: staff123');
    console.log('Customer: username: customer1,  password: customer123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  }
};

seedDatabase();
