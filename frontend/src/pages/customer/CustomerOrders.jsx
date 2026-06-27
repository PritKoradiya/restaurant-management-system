import { useContext, useEffect, useState } from "react";
import { OrderContext } from "../../App";
import api from "../../services/api";

function CustomerOrders() {
  const { orders, setOrders } = useContext(OrderContext);
  const currentUsername = localStorage.getItem("username");
  const currentUserId = localStorage.getItem("userId");
  const [payingOrderId, setPayingOrderId] = useState(null);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    window.setTimeout(() => {
      setToast(null);
    }, 2500);
  };

  useEffect(() => {
    const loadMyOrders = async () => {
      try {
        const response = await api.getMyOrders();
        setOrders(response.orders || []);
      } catch (error) {
        console.error("Failed to load customer orders:", error);
      }
    };

    loadMyOrders();
  }, [setOrders]);

  const myOrders = orders
    .filter((order) => {
      if (order.customer === currentUsername) return true;
      if (order.customerId?.username === currentUsername) return true;
      if (order.customerId?._id === currentUserId) return true;
      if (order.customerId === currentUserId) return true;
      return false;
    })
    .sort((a, b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt));

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Preparing":
        return "bg-blue-100 text-blue-800";
      case "Ready":
        return "bg-green-100 text-green-800";
      case "Completed":
      case "Delivered":
        return "bg-gray-100 text-gray-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString();
  };

  const rateOrder = (orderId, rating) => {
    const updatedOrders = orders.map((order) => {
      const currentId = order._id || order.id;
      if (currentId === orderId) {
        return { ...order, rating };
      }
      return order;
    });

    setOrders(updatedOrders);
  };

  const payOnline = async (order) => {
    const orderId = order._id || order.id;
    if (!orderId) return;

    setPayingOrderId(orderId);
    try {
      const response = await api.payOrderOnline(orderId);
      const updatedOrder = response.order;

      setOrders((prevOrders) =>
        prevOrders.map((currentOrder) => {
          const currentId = currentOrder._id || currentOrder.id;
          if (currentId === orderId) {
            return { ...currentOrder, ...updatedOrder };
          }
          return currentOrder;
        })
      );

      showToast("Payment successful", "success");
    } catch (error) {
      showToast(error.message || "Failed to complete payment", "error");
    } finally {
      setPayingOrderId(null);
    }
  };

  const cancelOrder = async (order) => {
    const orderId = order._id || order.id;
    if (!orderId) return;

    const canCancel = ["Pending", "Confirmed", "Preparing"].includes(order.status);
    if (!canCancel) {
      showToast("This order can no longer be cancelled", "error");
      return;
    }

    const confirmed = window.confirm("Are you sure you want to cancel this order?");
    if (!confirmed) return;

    setCancellingOrderId(orderId);
    try {
      const response = await api.cancelOrder(orderId);
      const updatedOrder = response.order;

      setOrders((prevOrders) =>
        prevOrders.map((currentOrder) => {
          const currentId = currentOrder._id || currentOrder.id;
          if (currentId === orderId) {
            return { ...currentOrder, ...updatedOrder };
          }
          return currentOrder;
        })
      );
    } catch (error) {
      showToast(error.message || "Failed to cancel order", "error");
    } finally {
      setCancellingOrderId(null);
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-3 left-3 right-3 sm:top-4 sm:left-auto sm:right-4 z-50">
          <div
            className={`rounded-md px-4 py-3 text-sm font-medium shadow-lg ${
              toast.type === "error"
                ? "bg-red-100 text-red-800 border border-red-200"
                : "bg-emerald-100 text-emerald-800 border border-emerald-200"
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Orders</h1>
        <p className="text-gray-600 mt-1">Track your order history and status</p>
      </div>

      {myOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-12 text-center">
          <div className="text-6xl mb-4">Orders</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
          <p className="text-gray-600">
            Your order history will appear here once you place your first order.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {myOrders.map((order) => (
            <div
              key={order._id || order.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Order #{order.orderNumber || order._id?.slice(-8) || order.id}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {formatDate(order.createdAt || order.timestamp)}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                    <p className="text-lg font-bold text-gray-900 mt-1">
                      ${(order.totalAmount || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-4 sm:px-6 py-4">
                <div className="space-y-3">
                  {(order.items || []).map((item, index) => (
                    <div key={index} className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-center">
                      <div className="flex items-center space-x-3">
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                          {item.specialInstructions && (
                            <p className="text-sm text-orange-600">
                              Note: {item.specialInstructions}
                            </p>
                          )}
                        </div>
                      </div>
                      <p className="font-medium text-gray-900">
                        ${((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
                  <div className="text-sm text-gray-600">
                    Total Items: {(order.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0)}
                    {order.orderType ? ` | ${order.orderType}` : ""}
                    {order.tableNumber ? ` | Table ${order.tableNumber}` : ""}
                  </div>
                  <div className="flex items-center gap-2">
                    {["Pending", "Confirmed", "Preparing"].includes(order.status) && (
                      <button
                        type="button"
                        onClick={() => cancelOrder(order)}
                        disabled={cancellingOrderId === (order._id || order.id)}
                        className="inline-flex items-center px-4 py-2 border border-red-200 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-70"
                      >
                        {cancellingOrderId === (order._id || order.id) ? "Cancelling..." : "Cancel Order"}
                      </button>
                    )}

                    {order.status === "Ready" && (
                      <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                        Mark as Picked Up
                      </button>
                    )}
                  </div>
                </div>

                {order.status === "Delivered" && order.paymentStatus !== "Paid" && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Payment Available</p>
                        <p className="text-xs text-gray-600">Only Online Payment is available after delivery.</p>
                      </div>
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        Online Payment (UPI)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center rounded-lg border border-gray-200 bg-white p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(`PAYMENT|merchant=RestaurantPro|amount=${Number(order.totalAmount || 0).toFixed(2)}|currency=USD|method=UPI|order=${order.orderNumber || order._id || order.id}`)}`}
                          alt={`Payment QR for order ${order.orderNumber || order._id || order.id}`}
                          className="h-20 w-20 sm:h-24 sm:w-24 rounded-md border border-gray-300 bg-white p-1"
                        />
                        <div>
                          <p className="text-sm text-gray-600">Payable Amount</p>
                          <p className="text-xl font-bold text-gray-900">${Number(order.totalAmount || 0).toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="md:text-right">
                        <button
                          type="button"
                          onClick={() => payOnline(order)}
                          disabled={payingOrderId === (order._id || order.id)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70"
                        >
                          {payingOrderId === (order._id || order.id) ? "Processing..." : "Pay Online"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {order.status === "Delivered" && order.paymentStatus === "Paid" && (
                  <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm text-gray-700">Payment Method: {order.paymentMethod || "UPI"}</span>
                    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                      Paid
                    </span>
                  </div>
                )}

                {(order.status === "Completed" || order.status === "Delivered") && (
                  <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap items-center gap-3">
                    <p className="text-sm font-medium text-gray-700">Rate this order:</p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => rateOrder(order._id || order.id, star)}
                          className="text-2xl leading-none transition-transform hover:scale-110"
                          aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                        >
                          {star <= (order.rating || 0) ? "★" : "☆"}
                        </button>
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      {order.rating ? `${order.rating}/5` : "Not rated yet"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {myOrders.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{myOrders.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {myOrders.filter((order) => order.status === "Completed" || order.status === "Delivered").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {myOrders.filter((order) => order.status === "Pending").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${myOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerOrders;
