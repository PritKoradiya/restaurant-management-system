import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";

function StaffOrders() {
  const currentUserId = localStorage.getItem("userId");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [notifyingOrderId, setNotifyingOrderId] = useState(null);

  const loadOrders = async () => {
    try {
      const response = await api.getOrders();
      setOrders(response.orders || []);
    } catch (error) {
      console.error("Failed to load staff orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();

    const intervalId = setInterval(() => {
      loadOrders();
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  const assignedOrders = useMemo(
    () =>
      orders
        .filter((order) => {
          const assignedId = typeof order.staffAssigned === "object"
            ? order.staffAssigned?._id
            : order.staffAssigned;

          if (!currentUserId || !assignedId) return false;
          return String(assignedId) === String(currentUserId);
        })
        .filter((order) => !["Delivered", "Cancelled"].includes(order.status))
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
    [orders, currentUserId]
  );

  const updateOrderStatus = async (orderId, status) => {
    setUpdatingOrderId(orderId);
    try {
      const response = await api.updateOrderStatus(orderId, status);
      const updatedOrder = response.order;

      setOrders((prev) =>
        prev.map((order) => ((order._id || order.id) === orderId ? { ...order, ...updatedOrder } : order))
      );
    } catch (error) {
      alert(error.message || "Failed to update order status");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const notifyAdmin = async (orderId) => {
    setNotifyingOrderId(orderId);
    try {
      const response = await api.notifyAdminOrderReady(orderId);
      const updatedOrder = response.order;

      setOrders((prev) =>
        prev.map((order) => ((order._id || order.id) === orderId ? { ...order, ...updatedOrder } : order))
      );
      alert("Admin notified successfully. Admin can now complete the order.");
    } catch (error) {
      alert(error.message || "Failed to notify admin");
    } finally {
      setNotifyingOrderId(null);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Confirmed":
        return "bg-blue-100 text-blue-800";
      case "Preparing":
        return "bg-yellow-100 text-yellow-800";
      case "Ready":
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="card-shadow p-6 bg-linear-to-r from-emerald-700 to-green-700 text-white">
        <h1 className="text-2xl font-bold">Staff Orders Panel</h1>
        <p className="text-sm text-emerald-100 mt-1">
          Handle your assigned orders and notify admin once an order is ready.
        </p>
      </div>

      {loading ? (
        <div className="card-shadow p-6 text-gray-600">Loading assigned orders...</div>
      ) : assignedOrders.length === 0 ? (
        <div className="card-shadow p-6 text-gray-600">No assigned orders right now.</div>
      ) : (
        <div className="grid gap-4">
          {assignedOrders.map((order) => {
            const orderId = order._id || order.id;
            const total = Number(order.totalAmount || order.total || 0);
            const customer = order.customerId?.username || order.customer || "Guest";

            return (
              <div key={orderId} className="card-shadow p-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">Order #{order.orderNumber || orderId}</p>
                    <p className="text-sm text-gray-600">Customer: {customer}</p>
                    <p className="text-sm text-gray-600">Amount: ₹{total.toLocaleString()}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusClass(order.status)}`}>
                      {order.status}
                    </span>

                    {order.staffNotifiedAdmin ? (
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                        Admin Notified
                      </span>
                    ) : (
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                        Not Notified
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 border-t border-gray-200 pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Items</p>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {(order.items || []).map((item, index) => (
                      <li key={index}>
                        {item.name || "Item"} x{item.quantity || 1}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {order.status === "Confirmed" && (
                    <button
                      onClick={() => updateOrderStatus(orderId, "Preparing")}
                      disabled={updatingOrderId === orderId}
                      className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-70"
                    >
                      {updatingOrderId === orderId ? "Updating..." : "Start Preparing"}
                    </button>
                  )}

                  {order.status === "Preparing" && (
                    <button
                      onClick={() => updateOrderStatus(orderId, "Ready")}
                      disabled={updatingOrderId === orderId}
                      className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70"
                    >
                      {updatingOrderId === orderId ? "Updating..." : "Mark Ready"}
                    </button>
                  )}

                  {["Preparing", "Ready"].includes(order.status) && !order.staffNotifiedAdmin && (
                    <button
                      onClick={() => notifyAdmin(orderId)}
                      disabled={notifyingOrderId === orderId}
                      className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70"
                    >
                      {notifyingOrderId === orderId ? "Notifying..." : "Notify Admin"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={loadOrders}
          className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
        >
          Refresh Orders
        </button>
      </div>
    </div>
  );
}

export default StaffOrders;
