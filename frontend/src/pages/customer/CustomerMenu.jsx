import { useState, useContext, useEffect } from "react";
import { OrderContext } from "../../App";
import api from "../../services/api";

const getItemImage = (item) => {
  if (item.image && item.image.trim()) {
    return item.image;
  }

  return `https://source.unsplash.com/900x700/?${encodeURIComponent(item.category || "food")}`;
};

function CustomerMenu() {
  const { menuItems, setMenuItems, orders, setOrders } = useContext(OrderContext);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState([]);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState("");

  useEffect(() => {
    const loadMenuItems = async () => {
      try {
        const response = await api.getMenuItems({ available: true });
        const normalizedMenuItems = (response.items || []).map((item) => ({
          ...item,
          id: item.id || item._id,
        }));

        setMenuItems(normalizedMenuItems);
      } catch (error) {
        console.error("Failed to load menu items:", error);
      }
    };

    loadMenuItems();
  }, [setMenuItems]);

  // Get unique categories
  const categories = ["All", ...new Set(menuItems.map(item => item.category))];

  // Filter items based on category and search
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity === 0) {
      setCart(cart.filter(item => item.id !== itemId));
    } else {
      setCart(cart.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const placeOrder = async () => {
    if (cart.length === 0) return;
    setOrderError("");
    setIsPlacingOrder(true);

    try {
      const payloadItems = cart.map((item) => ({
        menuItemId: item.menuItemId || item._id || item.id,
        name: item.name,
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1,
        specialInstructions: item.specialInstructions || "",
      }));

      const response = await api.createOrder({
        items: payloadItems,
        orderType: "Takeaway",
        paymentMethod: "UPI",
      });

      const createdOrder = response.order;
      setOrders([{ ...createdOrder, customer: localStorage.getItem("username") }, ...orders]);
      setCart([]);
      alert("Order placed successfully!");
    } catch (error) {
      setOrderError(error.message || "Failed to place order.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const getItemQuantity = (itemId) => {
    const item = cart.find(cartItem => cartItem.id === itemId);
    return item ? item.quantity : 0;
  };

  const subtotalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const taxAmount = subtotalAmount * 0.085;
  const deliveryFee = 2.99;
  const finalPayableAmount = Number((subtotalAmount + taxAmount + deliveryFee).toFixed(2));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Our Menu</h1>
          <p className="text-gray-600 mt-1">Discover delicious dishes crafted with care</p>
        </div>
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-start">
          <span className="text-sm text-gray-600">Cart:</span>
          <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
            {cart.reduce((sum, item) => sum + item.quantity, 0)} items
          </span>
        </div>
      </div>

      {/* Search and Filter */}
      {orderError && (
        <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {orderError}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="sm:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {filteredItems.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="aspect-w-16 aspect-h-9 bg-gray-200">
              <img
                src={getItemImage(item)}
                alt={item.name}
                className="w-full h-44 sm:h-48 object-cover"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = `https://source.unsplash.com/900x700/?${encodeURIComponent(item.name || "food")}`;
                }}
              />
            </div>
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-start mb-2 gap-3">
                <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                <span className="text-lg font-bold text-orange-600">${item.price}</span>
              </div>
              <p className="text-gray-600 text-sm mb-4">{item.description}</p>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {item.category}
                </span>
                <div className="flex items-center space-x-2">
                  {getItemQuantity(item.id) > 0 ? (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.id, getItemQuantity(item.id) - 1)}
                        className="p-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <span className="text-sm font-medium text-gray-900 w-8 text-center">
                        {getItemQuantity(item.id)}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, getItemQuantity(item.id) + 1)}
                        className="p-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(item)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
                    >
                      Add to Cart
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cart Summary */}
      {cart.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 sticky bottom-2 sm:bottom-4">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Order Summary</h3>
                <p className="text-gray-600">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)} items in your order
                </p>
                <p className="text-xs text-gray-500 mt-1">Payment will be available after your order is delivered (Online Payment only).</p>
              </div>
              <div className="text-right text-sm">
                <p className="text-gray-600">Subtotal: ${subtotalAmount.toFixed(2)}</p>
                <p className="text-gray-600">Tax (8.5%): ${taxAmount.toFixed(2)}</p>
                <p className="text-gray-600">Delivery: ${deliveryFee.toFixed(2)}</p>
                <p className="text-lg font-bold text-orange-600 mt-1">Total: ${finalPayableAmount.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex justify-stretch sm:justify-end w-full">
              <button
                onClick={placeOrder}
                disabled={isPlacingOrder}
                className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                {isPlacingOrder ? "Placing..." : "Place Order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  );
}

export default CustomerMenu;