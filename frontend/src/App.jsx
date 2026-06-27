import { createContext, useState } from 'react';
import './App.css';

export const OrderContext = createContext();

function App({ children }) {
  const [orders, setOrders] = useState([]);

  const [menuItems, setMenuItems] = useState([
    { id: 1, name: "Paneer Butter Masala", price: 250, description: "Creamy tomato-based curry with paneer", category: "Main Course", emoji: "🍛" },
    { id: 2, name: "Garlic Naan", price: 40, description: "Fresh baked bread with garlic butter", category: "Bread", emoji: "🫓" },
    { id: 3, name: "Chicken Biryani", price: 300, description: "Aromatic basmati rice with tender chicken", category: "Main Course", emoji: "🍗" },
    { id: 4, name: "Raita", price: 50, description: "Cool yogurt with cucumber and spices", category: "Side Dish", emoji: "🥛" },
    { id: 5, name: "Veg Thali", price: 180, description: "Complete vegetarian meal with rice, dal, and vegetables", category: "Thali", emoji: "🍽️" },
    { id: 6, name: "Masala Dosa", price: 120, description: "Crispy crepe filled with potato masala", category: "South Indian", emoji: "🥞" },
    { id: 7, name: "Butter Chicken", price: 280, description: "Rich and creamy chicken curry", category: "Main Course", emoji: "🍗" },
    { id: 8, name: "Gulab Jamun", price: 80, description: "Sweet dumplings in rose syrup", category: "Dessert", emoji: "🍬" },
    { id: 9, name: "Lassi", price: 60, description: "Refreshing yogurt drink", category: "Beverage", emoji: "🥤" },
    { id: 10, name: "Chili Paneer", price: 220, description: "Spicy Indo-Chinese paneer dish", category: "Starter", emoji: "🌶️" }
  ]);

  return (
    <OrderContext.Provider value={{ orders, setOrders, menuItems, setMenuItems }}>
      {children}
    </OrderContext.Provider>
  );
}

export default App;