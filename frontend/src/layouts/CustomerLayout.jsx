import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState, useContext } from "react";
import { OrderContext } from "../App";
import api from "../services/api";

function CustomerLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { orders } = useContext(OrderContext);

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("username");
      localStorage.removeItem("userId");
      navigate("/");
    }
  };

  const navItems = [
    { path: "/customer/menu", label: "Menu", icon: "🍽️" },
    { path: "/customer/orders", label: "My Orders", icon: "📋" },
    { path: "/customer/cart", label: "Cart", icon: "🛒" },
    { path: "/customer/profile", label: "Profile", icon: "👤" },
  ];

  // Get current user's orders
  const currentUsername = localStorage.getItem("username");
  const currentUserId = localStorage.getItem("userId");
  const myOrders = orders.filter(order => {
    if (order.customer === currentUsername) return true;
    if (order.customerId?.username === currentUsername) return true;
    if (order.customerId?._id === currentUserId) return true;
    if (order.customerId === currentUserId) return true;
    return false;
  });

  return (
    <div className="min-h-screen bg-linear-to-br from-orange-50 via-red-50 to-yellow-100 overflow-x-hidden">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="flex items-center ml-2 sm:ml-4 md:ml-0 min-w-0">
                <div className="h-8 w-8 bg-linear-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">🍽️</span>
                </div>
                <div className="ml-2 sm:ml-3 min-w-0">
                  <h1 className="text-base sm:text-xl font-bold text-gray-900 truncate">RestaurantPro</h1>
                  <p className="text-xs text-gray-500">Customer Portal</p>
                </div>
              </div>
            </div>

            {/* User Menu & Cart */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="hidden lg:flex items-center gap-2 min-w-0 max-w-40">
                <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-orange-600">
                    {localStorage.getItem("username")?.charAt(0).toUpperCase() || "C"}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700 truncate">
                  {localStorage.getItem("username") || "Customer"}
                </span>
              </div>

              {/* Cart Badge */}
              <div className="relative">
                <NavLink
                  to="/customer/cart"
                  className={({ isActive }) =>
                    `inline-flex h-10 w-10 items-center justify-center rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      isActive
                        ? 'border-orange-200 bg-orange-50 text-orange-600'
                        : 'border-gray-200 bg-white text-gray-500 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50'
                    }`
                  }
                  aria-label="Open cart"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5H19M7 13l-1.1 5M7 13l1.1-5m8.9 5L17 18" />
                  </svg>
                </NavLink>
                {myOrders.filter(order => order.status !== "Completed").length > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {myOrders.filter(order => order.status !== "Completed").length}
                  </span>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="inline-flex items-center px-2 sm:px-3 py-2 border border-gray-300 shadow-sm text-xs sm:text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
              >
                <svg className="sm:mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-w-0">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-0`}>
          <div className="flex flex-col h-full pt-16 md:pt-0">
            {/* Close button for mobile */}
            <div className="md:hidden absolute top-4 right-4">
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-orange-50 text-orange-700 border-r-2 border-orange-500'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Restaurant Info */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-linear-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-gray-900">Restaurant Open</p>
                  <p className="text-xs text-green-600">11:00 AM - 11:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0 md:ml-0">
          <div className="p-3 sm:p-4 lg:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default CustomerLayout;