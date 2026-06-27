import { useState, useContext } from "react";
import { OrderContext } from "../../App";

function CustomerCart() {
  const { orders, setOrders } = useContext(OrderContext);
  const [paymentMethod, setPaymentMethod] = useState("Cash");

  // Get current user's pending orders (acting as cart)
  const myPendingOrders = orders.filter(order =>
    order.customer === localStorage.getItem("username") &&
    order.status === "Pending"
  );

  // Flatten cart items from pending orders
  const cartItems = myPendingOrders.flatMap(order =>
    order.items.map(item => ({ ...item, orderId: order.id }))
  );

  // Group items by id and sum quantities
  const groupedCartItems = cartItems.reduce((acc, item) => {
    const existing = acc.find(cartItem => cartItem.id === item.id);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      acc.push({ ...item });
    }
    return acc;
  }, []);

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      // Remove item from all pending orders
      const updatedOrders = orders.map(order => {
        if (order.customer === localStorage.getItem("username") && order.status === "Pending") {
          const filteredItems = order.items.filter(item => item.id !== itemId);
          if (filteredItems.length === 0) {
            return null; // Mark for removal
          }
          return { ...order, items: filteredItems };
        }
        return order;
      }).filter(order => order !== null);

      setOrders(updatedOrders);
    } else {
      // Update quantity in pending orders
      const updatedOrders = orders.map(order => {
        if (order.customer === localStorage.getItem("username") && order.status === "Pending") {
          const updatedItems = order.items.map(item =>
            item.id === itemId ? { ...item, quantity: newQuantity } : item
          );
          const newTotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          return { ...order, items: updatedItems, total: newTotal, totalAmount: newTotal };
        }
        return order;
      });

      setOrders(updatedOrders);
    }
  };

  const clearCart = () => {
    const updatedOrders = orders.filter(order =>
      !(order.customer === localStorage.getItem("username") && order.status === "Pending")
    );
    setOrders(updatedOrders);
  };

  const placeOrder = () => {
    if (groupedCartItems.length === 0) return;

    // Update all pending orders to "Preparing" status
    const updatedOrders = orders.map(order => {
      if (order.customer === localStorage.getItem("username") && order.status === "Pending") {
        return {
          ...order,
          status: "Preparing",
          paymentMethod,
          paymentStatus: paymentMethod === "UPI" ? "Paid" : "Pending",
        };
      }
      return order;
    });

    setOrders(updatedOrders);
    alert("Order placed successfully! You can track its status in My Orders.");
  };

  const totalAmount = groupedCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = groupedCartItems.reduce((sum, item) => sum + item.quantity, 0);
  const taxAmount = totalAmount * 0.085;
  const deliveryFee = 2.99;
  const finalPayableAmount = Number((totalAmount + taxAmount + deliveryFee).toFixed(2));
  const qrPaymentPayload = `PAYMENT|merchant=RestaurantPro|amount=${finalPayableAmount.toFixed(2)}|currency=USD|method=UPI|customer=${localStorage.getItem("username") || "guest"}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrPaymentPayload)}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-gray-600 mt-1">Review your items before placing the order</p>
        </div>
        {groupedCartItems.length > 0 && (
          <button
            onClick={clearCart}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear Cart
          </button>
        )}
      </div>

      {/* Cart Items */}
      {groupedCartItems.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-12 text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
          <p className="text-gray-600">Add some delicious items from our menu to get started!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedCartItems.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="text-4xl">{item.emoji}</div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-gray-600 text-sm">{item.description}</p>
                    <p className="text-sm text-gray-500 mt-1">${item.price} each</p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 sm:space-x-4">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="text-lg font-semibold text-gray-900 w-12 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Summary */}
      {groupedCartItems.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Items:</span>
              <span className="font-medium">{totalItems}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">${totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax (8.5%):</span>
              <span className="font-medium">${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Delivery Fee:</span>
              <span className="font-medium">${deliveryFee.toFixed(2)}</span>
            </div>

            <div className="border-t border-gray-200 pt-3">
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-orange-600">
                  ${finalPayableAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="UPI">Online Payment (UPI QR)</option>
              <option value="Wallet">Wallet</option>
            </select>
          </div>

          {paymentMethod === "UPI" && (
            <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-900">Scan to Pay</p>
              <p className="mt-1 text-sm text-gray-600">QR is generated automatically for your exact bill amount.</p>
              <div className="mt-4 flex flex-col items-center justify-center">
                <img
                  src={qrCodeUrl}
                  alt={`Payment QR for $${finalPayableAmount.toFixed(2)}`}
                  className="h-36 w-36 sm:h-44 sm:w-44 rounded-lg border border-gray-300 bg-white p-2"
                />
                <p className="mt-3 text-sm font-medium text-gray-800">Pay ${finalPayableAmount.toFixed(2)}</p>
              </div>
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={placeOrder}
              className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Place Order
            </button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              By placing your order, you agree to our terms and conditions.
            </p>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {groupedCartItems.length > 0 && (
        <div className="bg-linear-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200 p-6">
          <div className="flex items-center mb-4">
            <div className="text-2xl mr-3">💡</div>
            <h3 className="text-lg font-semibold text-gray-900">Recommended for you</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Based on your current order, you might also like:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-3xl mb-2">🥤</div>
              <h4 className="font-medium text-gray-900">Fresh Juice</h4>
              <p className="text-sm text-gray-600">Refreshing beverages</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-3xl mb-2">🍰</div>
              <h4 className="font-medium text-gray-900">Desserts</h4>
              <p className="text-sm text-gray-600">Sweet endings</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-3xl mb-2">☕</div>
              <h4 className="font-medium text-gray-900">Coffee</h4>
              <p className="text-sm text-gray-600">Perfect with your meal</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerCart;