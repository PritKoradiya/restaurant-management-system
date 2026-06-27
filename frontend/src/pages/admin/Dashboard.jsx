import { useContext, useEffect } from "react";
import { OrderContext } from "../../App";
import api from "../../services/api";

function Dashboard() {
  const { orders, setOrders, menuItems } = useContext(OrderContext);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const response = await api.getOrders();
        setOrders(response.orders || []);
      } catch (error) {
        console.error("Failed to load admin orders:", error);
      }
    };

    loadOrders();
  }, [setOrders]);

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + (Number(order.totalAmount) || Number(order.total) || 0), 0);
  const activeOrders = orders.filter((order) => !["Delivered", "Completed", "Cancelled"].includes(order.status)).length;
  const completedOrders = orders.filter((order) => ["Delivered", "Completed"].includes(order.status)).length;
  const averageOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0;

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt || b.timestamp || 0) - new Date(a.createdAt || a.timestamp || 0))
    .slice(0, 5);

  const stats = [
    {
      title: "Total Orders",
      value: totalOrders,
      icon: "📋",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600"
    },
    {
      title: "Total Revenue",
      value: `₹${totalRevenue.toLocaleString()}`,
      icon: "💰",
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      textColor: "text-green-600"
    },
    {
      title: "Active Orders",
      value: activeOrders,
      icon: "🔄",
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      textColor: "text-orange-600"
    },
    {
      title: "Completed Orders",
      value: completedOrders,
      icon: "✅",
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back! Here's what's happening with your restaurant today.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="text-sm text-gray-500">Last updated</p>
            <p className="text-sm font-medium text-gray-900">
              {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="card-shadow p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <span className="text-2xl">{stat.icon}</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Average Order Value */}
        <div className="card-shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Order Value</p>
              <p className="text-2xl font-bold text-gray-900">₹{averageOrderValue}</p>
            </div>
            <div className="h-12 w-12 bg-linear-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">📈</span>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="card-shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Menu Items</p>
              <p className="text-2xl font-bold text-gray-900">{menuItems.length}</p>
            </div>
            <div className="h-12 w-12 bg-linear-to-r from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">🍽️</span>
            </div>
          </div>
        </div>

        {/* Today's Performance */}
        <div className="card-shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Performance</p>
              <p className="text-2xl font-bold text-gray-900">
                {completedOrders > 0 ? 'Excellent' : 'Getting Started'}
              </p>
            </div>
            <div className="h-12 w-12 bg-linear-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">⭐</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card-shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
          <p className="text-sm text-gray-500">Latest order activity</p>
        </div>
        <div className="divide-y divide-gray-200">
          {recentOrders.length > 0 ? (
            recentOrders.map((order) => {
              const orderId = order.orderNumber || order._id || order.id || "-";
              const customerName = order.customerId?.username || order.customer || "Guest";
              const amount = Number(order.totalAmount) || Number(order.total) || 0;
              const table = order.tableNumber || order.table || "N/A";

              return (
              <div key={order._id || order.id} className="px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`w-3 h-3 rounded-full ${
                      ["Completed", "Delivered"].includes(order.status) ? 'bg-green-400' :
                      ["Preparing", "Confirmed", "Ready"].includes(order.status) ? 'bg-yellow-400' : 'bg-red-400'
                    }`}></div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        Order #{orderId}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {customerName} • Table {table}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">₹{amount.toLocaleString()}</p>
                    <p className={`text-xs px-2 py-1 rounded-full ${
                      ["Completed", "Delivered"].includes(order.status) ? 'bg-green-100 text-green-800' :
                      ["Preparing", "Confirmed", "Ready"].includes(order.status) ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {order.status}
                    </p>
                  </div>
                </div>
              </div>
            )})
          ) : (
            <div className="px-6 py-8 text-center">
              <div className="text-4xl mb-4">📋</div>
              <p className="text-gray-500">No orders yet</p>
              <p className="text-sm text-gray-400">Orders will appear here once customers start placing them</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card-shadow p-4 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <button className="flex items-center justify-center px-4 py-3 bg-linear-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105">
            <span className="mr-2">➕</span>
            Add Menu Item
          </button>
          <button className="flex items-center justify-center px-4 py-3 bg-linear-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105">
            <span className="mr-2">📋</span>
            View All Orders
          </button>
          <button className="flex items-center justify-center px-4 py-3 bg-linear-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all transform hover:scale-105">
            <span className="mr-2">💰</span>
            Generate Report
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
