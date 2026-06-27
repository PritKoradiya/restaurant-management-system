import { useContext, useEffect, useState } from "react";
import { OrderContext } from "../../App";
import api from "../../services/api";

function Orders() {
  const { orders, setOrders } = useContext(OrderContext);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [staffMembers, setStaffMembers] = useState([]);
  const [selectedStaffByOrder, setSelectedStaffByOrder] = useState({});
  const [assigningOrderId, setAssigningOrderId] = useState(null);
  const [refreshingStaff, setRefreshingStaff] = useState(false);

  const isOrderActive = (status) => !["Completed", "Delivered", "Cancelled"].includes(status);

  const loadOrders = async () => {
    try {
      const ordersResponse = await api.getOrders();
      setOrders(ordersResponse.orders || []);
    } catch (error) {
      console.error("Failed to load orders:", error);
    }
  };

  const loadStaff = async () => {
    setRefreshingStaff(true);
    try {
      const staffResponse = await api.getStaffList({ onlineOnly: "true" });
      setStaffMembers(staffResponse.staff || []);
    } catch (error) {
      console.error("Failed to load staff:", error);
    } finally {
      setRefreshingStaff(false);
    }
  };

  useEffect(() => {
    const loadOrdersAndStaff = async () => {
      try {
        const [ordersResponse, staffResponse] = await Promise.all([
          api.getOrders(),
          api.getStaffList({ onlineOnly: "true" }),
        ]);

        setOrders(ordersResponse.orders || []);
        setStaffMembers(staffResponse.staff || []);
      } catch (error) {
        console.error("Failed to load orders/staff:", error);
      }
    };

    loadOrdersAndStaff();
  }, [setOrders]);

  useEffect(() => {
    const ordersIntervalId = setInterval(() => {
      loadOrders();
    }, 5000);

    const intervalId = setInterval(() => {
      loadStaff();
    }, 20000);

    return () => {
      clearInterval(intervalId);
      clearInterval(ordersIntervalId);
    };
  }, []);

  const canAdvanceStatus = (order, nextStatus) => {
    if (order.status === "Pending" && nextStatus === "Confirmed" && !order.staffAssigned?._id) {
      return { allowed: false, message: "Assign this order to staff before accepting it." };
    }

    if (order.status === "Ready" && nextStatus === "Delivered" && !order.staffNotifiedAdmin) {
      return { allowed: false, message: "Staff has not notified admin yet. Wait for staff notification before completion." };
    }

    return { allowed: true };
  };

  const updateStatus = async (id, newStatus) => {
    const orderToUpdate = orders.find((order) => (order._id || order.id) === id);
    if (!orderToUpdate) return;

    const statusCheck = canAdvanceStatus(orderToUpdate, newStatus);
    if (!statusCheck.allowed) {
      alert(statusCheck.message);
      return;
    }

    try {
      const response = await api.updateOrderStatus(id, newStatus);
      const updatedOrder = response.order;

      const updatedOrders = orders.map((order) => {
        if ((order._id || order.id) === id) {
          return { ...order, ...updatedOrder };
        }
        return order;
      });

      setOrders(updatedOrders);
    } catch (error) {
      console.error("Failed to update order status:", error);
      alert(error.message || "Failed to update order status");
    }
  };

  const cancelOrder = async (id) => {
    const orderToCancel = orders.find((order) => (order._id || order.id) === id);
    if (!orderToCancel) return;

    const canCancel = ["Pending", "Confirmed", "Preparing"].includes(orderToCancel.status);
    if (!canCancel) {
      alert("This order can no longer be cancelled");
      return;
    }

    const confirmed = window.confirm("Are you sure you want to cancel this order?");
    if (!confirmed) return;

    setCancellingOrderId(id);
    try {
      const response = await api.cancelOrder(id);
      const updatedOrder = response.order;

      setOrders((prevOrders) =>
        prevOrders.map((order) => {
          if ((order._id || order.id) === id) {
            return { ...order, ...updatedOrder };
          }
          return order;
        })
      );
    } catch (error) {
      console.error("Failed to cancel order:", error);
      alert(error.message || "Failed to cancel order");
    } finally {
      setCancellingOrderId(null);
    }
  };

  const assignOrderToStaff = async (orderId) => {
    const staffId = selectedStaffByOrder[orderId];
    if (!staffId) {
      alert("Please select a staff member first");
      return;
    }

    setAssigningOrderId(orderId);
    try {
      const response = await api.assignStaffToOrder(orderId, staffId);
      const updatedOrder = response.order;

      setOrders((prevOrders) =>
        prevOrders.map((order) => {
          if ((order._id || order.id) === orderId) {
            return { ...order, ...updatedOrder };
          }
          return order;
        })
      );

      await loadStaff();
    } catch (error) {
      console.error("Failed to assign staff:", error);
      alert(error.message || "Failed to assign staff");
    } finally {
      setAssigningOrderId(null);
    }
  };

  const getStaffStatusClass = (status) => {
    switch (status) {
      case "Available":
        return "bg-emerald-100 text-emerald-800";
      case "Busy":
        return "bg-amber-100 text-amber-800";
      case "Offline":
        return "bg-slate-100 text-slate-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getLoginClass = (isLoggedIn) => {
    return isLoggedIn
      ? "bg-green-100 text-green-800"
      : "bg-gray-100 text-gray-700";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending": return "bg-red-100 text-red-800";
      case "Confirmed": return "bg-blue-100 text-blue-800";
      case "Preparing": return "bg-yellow-100 text-yellow-800";
      case "Ready": return "bg-purple-100 text-purple-800";
      case "Completed": return "bg-green-100 text-green-800";
      case "Delivered": return "bg-green-100 text-green-800";
      case "Cancelled": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case "Pending": return "Confirmed";
      case "Confirmed": return "Preparing";
      case "Preparing": return "Ready";
      case "Ready": return "Delivered";
      default: return currentStatus;
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesFilter = filter === "all" || order.status.toLowerCase() === filter;
    const customerName = order.customerId?.username || order.customer || "";
    const orderId = order.orderNumber || order._id || order.id || "";
    const matchesSearch = customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         String(orderId).toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const statusCounts = {
    all: orders.length,
    pending: orders.filter(o => o.status === "Pending").length,
    preparing: orders.filter(o => o.status === "Preparing").length,
    completed: orders.filter(o => o.status === "Delivered" || o.status === "Completed").length,
  };

  const availableStaff = staffMembers.filter((member) => member.isLoggedIn && member.staffStatus === "Available");
  const loggedInStaff = staffMembers;
  const staffNotifications = orders
    .filter((order) => order.staffNotifiedAdmin && order.status === "Ready")
    .sort((a, b) => new Date(b.staffNotifiedAt || b.updatedAt || 0) - new Date(a.staffNotifiedAt || a.updatedAt || 0));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Orders Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and track all customer orders
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-left sm:text-right">
            <p className="text-sm text-gray-500">Total Orders</p>
            <p className="text-lg font-bold text-gray-900">{orders.length}</p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card-shadow p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Status Filters */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "All Orders", count: statusCounts.all },
              { key: "pending", label: "Pending", count: statusCounts.pending },
              { key: "preparing", label: "Preparing", count: statusCounts.preparing },
              { key: "completed", label: "Completed", count: statusCounts.completed },
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === key
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 w-full sm:w-64"
            />
          </div>
        </div>
      </div>

      {/* Staff Status Overview */}
      <div className="card-shadow p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Staff Status</h2>
            <p className="text-sm text-gray-500">Assign only from logged-in staff. Admin cannot accept order before assignment.</p>
          </div>
          <div className="text-sm text-gray-600 text-right">
            <div>Logged In Staff: <span className="font-semibold text-blue-700">{loggedInStaff.length}</span></div>
            <div>Available: <span className="font-semibold text-emerald-700">{availableStaff.length}</span></div>
          </div>
        </div>

        {staffMembers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {staffMembers.map((member) => (
              <div key={member._id} className="rounded-lg border border-gray-200 p-4 bg-white">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {member.firstName || member.lastName
                        ? `${member.firstName || ""} ${member.lastName || ""}`.trim()
                        : member.username}
                    </p>
                    <p className="text-xs text-gray-500">@{member.username}</p>
                  </div>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${getStaffStatusClass(member.staffStatus)}`}>
                    {member.staffStatus || "Available"}
                  </span>
                </div>
                <div className="mt-2">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${getLoginClass(member.isLoggedIn)}`}>
                    {member.isLoggedIn ? "Logged In" : "Logged Out"}
                  </span>
                </div>
                <p className="mt-3 text-xs text-gray-600">
                  Active Orders: <span className="font-semibold text-gray-800">{member.activeOrderCount || 0}</span>
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No active staff found.</p>
        )}

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={loadStaff}
            disabled={refreshingStaff}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-70"
          >
            {refreshingStaff ? "Refreshing..." : "Refresh Staff"}
          </button>
        </div>
      </div>

      {/* Staff Notifications */}
      <div className="card-shadow p-4 sm:p-6 border-l-4 border-l-indigo-500">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Staff Notifications</h2>
            <p className="text-sm text-gray-500">Orders where staff has notified admin and are waiting for completion</p>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
            {staffNotifications.length} Notification{staffNotifications.length === 1 ? "" : "s"}
          </span>
        </div>

        {staffNotifications.length === 0 ? (
          <p className="text-sm text-gray-500">No new staff notifications.</p>
        ) : (
          <div className="space-y-2">
            {staffNotifications.slice(0, 5).map((order) => (
              <div key={order._id || order.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Order #{order.orderNumber || order._id || order.id}
                  </p>
                  <p className="text-xs text-gray-600">
                    Staff: {order.staffAssigned?.username || "Assigned Staff"} | Customer: {order.customerId?.username || "Guest"}
                  </p>
                </div>
                <div className="text-xs text-gray-600">
                  {order.staffNotifiedAt
                    ? `Notified at ${new Date(order.staffNotifiedAt).toLocaleTimeString()}`
                    : "Notified recently"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="card-shadow overflow-hidden">
        {filteredOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Table
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order._id || order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          Order #{order.orderNumber || order._id || order.id}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.createdAt || order.timestamp
                            ? new Date(order.createdAt || order.timestamp).toLocaleDateString()
                            : "-"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-linear-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-white">
                            {(order.customerId?.username || order.customer || "G").charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {order.customerId?.username || order.customer || "Guest"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Table {order.tableNumber || order.table || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{(Number(order.totalAmount) || Number(order.total) || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      {isOrderActive(order.status) && (
                        <div className="flex flex-wrap items-center gap-2">
                          {order.staffAssigned ? (
                            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                              Assigned: {order.staffAssigned.username}
                            </span>
                          ) : (
                            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                              Unassigned
                            </span>
                          )}

                          {order.status === "Ready" && (
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${order.staffNotifiedAdmin ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                              {order.staffNotifiedAdmin ? "Staff Notified" : "Waiting Staff Notify"}
                            </span>
                          )}

                          <button
                            onClick={() => updateStatus(order._id || order.id, getNextStatus(order.status))}
                            disabled={
                              (order.status === "Pending" && !order.staffAssigned?._id) ||
                              (order.status === "Ready" && !order.staffNotifiedAdmin)
                            }
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors disabled:opacity-60"
                          >
                            {order.status === "Pending" && "Confirm Order"}
                            {order.status === "Confirmed" && "Start Preparing"}
                            {order.status === "Preparing" && "Mark Ready"}
                            {order.status === "Ready" && "Complete Order"}
                          </button>

                          {["Pending", "Confirmed", "Preparing"].includes(order.status) && (
                            <button
                              onClick={() => cancelOrder(order._id || order.id)}
                              disabled={cancellingOrderId === (order._id || order.id)}
                              className="inline-flex items-center px-3 py-1 border border-red-200 text-sm leading-4 font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-70"
                            >
                              {cancellingOrderId === (order._id || order.id) ? "Cancelling..." : "Cancel"}
                            </button>
                          )}

                          <select
                            value={selectedStaffByOrder[order._id || order.id] || order.staffAssigned?._id || ""}
                            onChange={(e) =>
                              setSelectedStaffByOrder((prev) => ({
                                ...prev,
                                [order._id || order.id]: e.target.value,
                              }))
                            }
                            className="border border-gray-300 rounded-md px-2 py-1 text-sm w-full sm:w-auto"
                          >
                            <option value="">Select Staff</option>
                            {staffMembers
                              .filter((member) => member.staffStatus !== "Offline")
                              .map((member) => (
                                <option key={member._id} value={member._id}>
                                  {member.username} ({member.staffStatus || "Available"}, {member.activeOrderCount || 0} active)
                                </option>
                              ))}
                          </select>

                          <button
                            onClick={() => assignOrderToStaff(order._id || order.id)}
                            disabled={assigningOrderId === (order._id || order.id)}
                            className="inline-flex items-center px-3 py-1 border border-blue-200 text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-70"
                          >
                            {assigningOrderId === (order._id || order.id)
                              ? "Assigning..."
                              : order.staffAssigned
                              ? "Reassign"
                              : "Assign"}
                          </button>
                        </div>
                      )}
                      {["Completed", "Delivered"].includes(order.status) && (
                        <span className="text-green-600 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Delivered
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500">
              {searchTerm || filter !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Orders will appear here once customers start placing them"
              }
            </p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {orders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card-shadow p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{statusCounts.pending}</div>
            <div className="text-sm text-gray-500">Pending Orders</div>
          </div>
          <div className="card-shadow p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{statusCounts.preparing}</div>
            <div className="text-sm text-gray-500">In Preparation</div>
          </div>
          <div className="card-shadow p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{statusCounts.completed}</div>
            <div className="text-sm text-gray-500">Completed Today</div>
          </div>
          <div className="card-shadow p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">
              ₹{orders.reduce((sum, order) => sum + (Number(order.totalAmount) || Number(order.total) || 0), 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">Total Revenue</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;
