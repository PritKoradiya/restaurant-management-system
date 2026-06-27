import { useState, useContext, useEffect } from "react";
import { OrderContext } from "../../App";
import { jsPDF } from "jspdf";
import api from "../../services/api";

function Billing() {
  const { orders } = useContext(OrderContext);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedBilling, setSelectedBilling] = useState(null);
  const [billingMap, setBillingMap] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const loadBillings = async () => {
      try {
        const response = await api.getBillingRecords();
        const records = response.billings || [];
        const map = records.reduce((acc, billing) => {
          const orderId = billing.orderId?._id || billing.orderId;
          if (orderId) {
            acc[String(orderId)] = billing;
          }
          return acc;
        }, {});

        setBillingMap(map);
      } catch (error) {
        console.error("Failed to load billing records:", error);
      }
    };

    loadBillings();
  }, []);

  const completedOrders = orders.filter(
    (order) => order.status === "Completed" || order.status === "Delivered"
  );

  const gstRate = 0.05;

  const calculateBill = (order) => {
    const subtotal = Number(order.totalAmount ?? order.total ?? 0);
    const gst = subtotal * gstRate;
    const finalTotal = subtotal + gst;

    return { subtotal, gst, finalTotal };
  };

  const totalRevenue = completedOrders.reduce(
    (sum, order) => sum + Number(order.totalAmount ?? order.total ?? 0),
    0
  );
  const averageBill = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

  const downloadBillPdf = (order, billingRecord) => {
    const bill = billingRecord
      ? {
          subtotal: Number(billingRecord.subtotal || 0),
          gst: Number(billingRecord.tax || 0),
          finalTotal: Number(billingRecord.totalAmount || 0),
        }
      : calculateBill(order);
    const orderId = order.id || order._id || "N/A";
    const customerName = order.customerName || order.customer || "Guest";
    const now = new Date().toLocaleString();

    const doc = new jsPDF();
    let y = 18;

    doc.setFontSize(20);
    doc.text("Restaurant Invoice", 14, y);
    y += 10;

    doc.setFontSize(11);
    doc.text(`Generated: ${now}`, 14, y);
    y += 7;
    if (billingRecord?.invoiceNumber) {
      doc.text(`Invoice #: ${billingRecord.invoiceNumber}`, 14, y);
      y += 7;
    }
    doc.text(`Order ID: #${orderId}`, 14, y);
    y += 7;
    doc.text(`Customer: ${customerName}`, 14, y);
    y += 10;

    doc.setDrawColor(220);
    doc.line(14, y, 196, y);
    y += 8;

    doc.setFontSize(12);
    doc.text("Items", 14, y);
    y += 8;
    doc.setFontSize(10);

    const items = order.items || [];
    if (items.length === 0) {
      doc.text("No item details available.", 14, y);
      y += 8;
    } else {
      items.forEach((item, index) => {
        const itemName = item.name || `Item ${index + 1}`;
        const qty = Number(item.quantity || 0);
        const price = Number(item.price || 0);
        const lineTotal = qty * price;
        doc.text(`${index + 1}. ${itemName} (x${qty})`, 14, y);
        doc.text(`Rs ${lineTotal.toFixed(2)}`, 180, y, { align: "right" });
        y += 7;

        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      });
    }

    y += 4;
    doc.line(14, y, 196, y);
    y += 9;

    doc.setFontSize(11);
    doc.text("Subtotal", 14, y);
    doc.text(`Rs ${bill.subtotal.toFixed(2)}`, 180, y, { align: "right" });
    y += 7;

    doc.text("GST (5%)", 14, y);
    doc.text(`Rs ${bill.gst.toFixed(2)}`, 180, y, { align: "right" });
    y += 9;

    doc.setFontSize(13);
    doc.text("Final Total", 14, y);
    doc.text(`Rs ${bill.finalTotal.toFixed(2)}`, 180, y, { align: "right" });

    doc.save(`invoice-${orderId}.pdf`);
  };

  const handleGenerateBill = async (order) => {
    const orderId = String(order._id || order.id);
    setSelectedOrder(order);

    if (billingMap[orderId]) {
      setSelectedBilling(billingMap[orderId]);
      return;
    }

    setIsGenerating(true);
    try {
      const response = await api.createBill({
        orderId,
        paymentMethod: order.paymentMethod || "Cash",
        discount: Number(order.discount || 0),
        deliveryCharges: order.orderType === "Delivery" ? 2.99 : 0,
      });

      const createdBilling = response.billing;
      setBillingMap((prev) => ({ ...prev, [orderId]: createdBilling }));
      setSelectedBilling(createdBilling);
    } catch (error) {
      if ((error.message || "").toLowerCase().includes("already exists")) {
        try {
          const existingResponse = await api.getBillingForOrder(orderId);
          const existingBilling = existingResponse.billing;
          setBillingMap((prev) => ({ ...prev, [orderId]: existingBilling }));
          setSelectedBilling(existingBilling);
        } catch (fetchError) {
          alert(fetchError.message || "Unable to load existing billing record");
        }
      } else {
        alert(error.message || "Failed to create billing");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-amber-50 via-white to-orange-50 p-3 sm:p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="rounded-2xl bg-white/80 backdrop-blur border border-amber-100 p-6 shadow-sm">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Billing Dashboard</h1>
          <p className="text-gray-600 mt-1">Generate bills and track completed order revenue.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-600">Completed Orders</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{completedOrders.length}</p>
          </div>
          <div className="rounded-xl border border-green-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-600">Total Revenue</p>
            <p className="text-2xl font-bold text-green-700 mt-1">₹ {totalRevenue.toFixed(2)}</p>
          </div>
          <div className="rounded-xl border border-purple-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-600">Average Bill</p>
            <p className="text-2xl font-bold text-purple-700 mt-1">₹ {averageBill.toFixed(2)}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Completed Orders</h2>
          </div>

          {completedOrders.length === 0 ? (
            <div className="p-10 text-center text-gray-500">No completed orders yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-160">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Order</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Customer</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Amount</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {completedOrders.map((order) => {
                    const orderAmount = Number(order.totalAmount ?? order.total ?? 0);
                    const orderId = order.id || order._id;
                    const existingBilling = billingMap[String(order._id || order.id)];
                    return (
                      <tr key={orderId} className="border-t border-gray-100 hover:bg-amber-50/50">
                        <td className="px-5 py-4 font-medium text-gray-900">#{orderId}</td>
                        <td className="px-5 py-4 text-gray-700">{order.customerName || order.customer || "Guest"}</td>
                        <td className="px-5 py-4 text-gray-900 font-semibold">₹ {orderAmount.toFixed(2)}</td>
                        <td className="px-5 py-4">
                          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            {order.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            className="inline-flex items-center px-3 py-2 rounded-md bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition"
                            onClick={() => handleGenerateBill(order)}
                            disabled={isGenerating}
                          >
                            {existingBilling ? "View Bill" : "Generate Bill"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedOrder && (
          <div className="rounded-2xl border border-amber-200 bg-white shadow-sm p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-xl font-bold text-gray-900">Bill Summary</h3>
              <span className="text-sm text-gray-500">GST Rate: 5%</span>
            </div>

            {selectedBilling && (
              <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2 text-sm text-emerald-800">
                Stored in MongoDB | Invoice: {selectedBilling.invoiceNumber || "Pending"} | Payment: {selectedBilling.paymentStatus}
              </div>
            )}

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <p><span className="text-gray-500">Order ID:</span> <span className="font-medium text-gray-900">#{selectedOrder.id || selectedOrder._id}</span></p>
              <p><span className="text-gray-500">Customer:</span> <span className="font-medium text-gray-900">{selectedOrder.customerName || selectedOrder.customer || "Guest"}</span></p>
            </div>

            <div className="mt-6 border-t border-gray-100 pt-4 space-y-2">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal</span>
                <span>₹ {(selectedBilling ? Number(selectedBilling.subtotal || 0) : calculateBill(selectedOrder).subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>GST (5%)</span>
                <span>₹ {(selectedBilling ? Number(selectedBilling.tax || 0) : calculateBill(selectedOrder).gst).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 border-t border-gray-100 pt-3 mt-3">
                <span>Final Total</span>
                <span>₹ {(selectedBilling ? Number(selectedBilling.totalAmount || 0) : calculateBill(selectedOrder).finalTotal).toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-start sm:justify-end">
              <button
                onClick={() => downloadBillPdf(selectedOrder, selectedBilling)}
                className="inline-flex items-center px-4 py-2 rounded-md bg-gray-900 text-white text-sm font-medium hover:bg-black transition"
              >
                Download PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Billing;
