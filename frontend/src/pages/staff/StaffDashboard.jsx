import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { OrderContext } from "../../App";
import api from "../../services/api";

function StaffDashboard() {
  const navigate = useNavigate();
  const { orders, setOrders, menuItems, setMenuItems } = useContext(OrderContext);
  const currentUserId = localStorage.getItem("userId");
  const [staffStatus, setStaffStatus] = useState("Available");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    const loadMyOrders = async () => {
      try {
        const response = await api.getOrders();
        setOrders(response.orders || []);
      } catch (error) {
        console.error("Failed to load staff orders:", error);
      }
    };

    loadMyOrders();

    const intervalId = setInterval(() => {
      loadMyOrders();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [setOrders]);

  useEffect(() => {
    const loadStaffStatus = async () => {
      try {
        const response = await api.getCurrentUser();
        if (response?.user?.staffStatus) {
          setStaffStatus(response.user.staffStatus);
        }
      } catch (error) {
        console.error("Failed to load staff status:", error);
      }
    };

    loadStaffStatus();
  }, []);

  const updateStatus = (id) => {
    const updatedOrders = orders.map((order) => {
      const currentId = order._id || order.id;
      if (currentId === id) {
        if (order.status === "Pending") {
          return { ...order, status: "Preparing" };
        }
        if (order.status === "Preparing") {
          return { ...order, status: "Completed" };
        }
      }
      return order;
    });

    setOrders(updatedOrders);
  };

  const isAssignedToCurrentStaff = (order) => {
    const assignedId = typeof order.staffAssigned === "object"
      ? order.staffAssigned?._id
      : order.staffAssigned;

    if (!currentUserId || !assignedId) return false;
    return String(assignedId) === String(currentUserId);
  };

  const handleViewOrders = () => {
    navigate("/staff/orders");
  };

  const handleCleanStation = () => {
    alert("Station cleaning logged. Stay safe!");
  };

  const handleCallSupport = () => {
    alert("Support team has been notified. They'll be with you shortly.");
  };

  const handleEndShift = () => {
    if (window.confirm("Are you sure you want to end your shift?")) {
      (async () => {
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
      })();
    }
  };

  const updateMyStatus = async (nextStatus) => {
    setUpdatingStatus(true);
    try {
      await api.updateMyStaffStatus(nextStatus);
      setStaffStatus(nextStatus);
    } catch (error) {
      alert(error.message || "Failed to update staff status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const myOrders = orders.filter(isAssignedToCurrentStaff);
  const activeOrders = myOrders.filter((order) => !["Completed", "Delivered", "Cancelled"].includes(order.status));
  const pendingOrders = myOrders.filter((order) => order.status === "Pending");
  const preparingOrders = myOrders.filter((order) => order.status === "Preparing");
  const completedToday = myOrders.filter((order) => order.status === "Completed" || order.status === "Delivered");

  const myPerformance = {
    ordersHandled: completedToday.length,
    avgPrepTime: "12 min", // Mock data
    customerRating: 4.8, // Mock data
  };

  const urgentTasks = [
    { id: 1, task: "Table 5 order waiting", priority: "high", time: "2 min ago" },
    { id: 2, task: "Special dietary request", priority: "medium", time: "5 min ago" },
    { id: 3, task: "Clean prep station", priority: "low", time: "15 min ago" },
  ];

  const stats = [
    {
      title: "Active Orders",
      value: activeOrders.length,
      icon: "🔄",
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      textColor: "text-green-600"
    },
    {
      title: "Pending Orders",
      value: pendingOrders.length,
      icon: "⏳",
      color: "from-yellow-500 to-yellow-600",
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-600"
    },
    {
      title: "In Preparation",
      value: preparingOrders.length,
      icon: "👨‍🍳",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600"
    },
    {
      title: "Completed Today",
      value: completedToday.length,
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Staff Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back! Here's your shift overview and tasks.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="text-sm text-gray-500">Current Shift</p>
            <p className="text-sm font-medium text-gray-900">
              {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      <div className="card-shadow p-4 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">My Availability Status</h3>
            <p className="text-sm text-gray-500">Admin uses this status to assign incoming customer orders.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {["Available", "Busy", "Offline"].map((status) => (
              <button
                key={status}
                onClick={() => updateMyStatus(status)}
                disabled={updatingStatus}
                className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                  staffStatus === status
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                } disabled:opacity-70`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Performance & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Performance */}
        <div className="card-shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">My Performance</h3>
            <p className="text-sm text-gray-500">Today's shift summary</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Orders Handled</span>
              <span className="text-lg font-semibold text-gray-900">{myPerformance.ordersHandled}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Avg Prep Time</span>
              <span className="text-lg font-semibold text-gray-900">{myPerformance.avgPrepTime}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Customer Rating</span>
              <div className="flex items-center">
                <span className="text-lg font-semibold text-gray-900 mr-1">{myPerformance.customerRating}</span>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-4 h-4 ${i < Math.floor(myPerformance.customerRating) ? 'text-yellow-400' : 'text-gray-300'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Urgent Tasks */}
        <div className="card-shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Urgent Tasks</h3>
            <p className="text-sm text-gray-500">Items requiring immediate attention</p>
          </div>
          <div className="divide-y divide-gray-200">
            {urgentTasks.map((task) => (
              <div key={task.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      task.priority === 'high' ? 'bg-red-400' :
                      task.priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                    }`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{task.task}</p>
                      <p className="text-xs text-gray-500">{task.time}</p>
                    </div>
                  </div>
                  <button className="text-sm text-green-600 hover:text-green-700 font-medium">
                    Handle
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Current Orders Overview */}
      <div className="card-shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Current Orders</h3>
          <p className="text-sm text-gray-500">Orders requiring your attention</p>
        </div>
        <div className="p-6">
          {activeOrders.length > 0 ? (
            <div className="space-y-4">
              {activeOrders.slice(0, 5).map((order) => (
                <div key={order._id || order.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${
                      order.status === 'Pending' ? 'bg-red-400' :
                      order.status === 'Preparing' ? 'bg-yellow-400' : 'bg-green-400'
                    }`}></div>
                    <div>
                      <p className="font-medium text-gray-900">Order #{order.orderNumber || order._id || order.id}</p>
                      <p className="text-sm text-gray-600">{order.customer} • Table {order.table}</p>
                    </div>
                  </div>
                  <div className="flex items-center flex-wrap gap-2 sm:gap-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      order.status === 'Pending' ? 'bg-red-100 text-red-800' :
                      order.status === 'Preparing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {order.status}
                    </span>
                    <button
                      onClick={() => updateStatus(order._id || order.id)}
                      className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                    >
                      Update
                    </button>
                  </div>
                </div>
              ))}
              {activeOrders.length > 5 && (
                <p className="text-center text-sm text-gray-500 pt-2">
                  And {activeOrders.length - 5} more orders...
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🎉</div>
              <p className="text-gray-500">No active orders right now</p>
              <p className="text-sm text-gray-400">Take a moment to prepare your station</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card-shadow p-4 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <button
            onClick={handleViewOrders}
            className="flex items-center justify-center px-4 py-3 bg-linear-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105"
          >
            <span className="mr-2">📋</span>
            View Orders
          </button>
          <button
            onClick={handleCleanStation}
            className="flex items-center justify-center px-4 py-3 bg-linear-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105"
          >
            <span className="mr-2">🧹</span>
            Clean Station
          </button>
          <button
            onClick={handleCallSupport}
            className="flex items-center justify-center px-4 py-3 bg-linear-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all transform hover:scale-105"
          >
            <span className="mr-2">📞</span>
            Call Support
          </button>
          <button
            onClick={handleEndShift}
            className="flex items-center justify-center px-4 py-3 bg-linear-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-105"
          >
            <span className="mr-2">⏰</span>
            End Shift
          </button>
        </div>
      </div>
    </div>
  );
}

export default StaffDashboard;
