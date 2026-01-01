import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaTruck, FaFilePdf } from "react-icons/fa";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "bootstrap/dist/css/bootstrap.min.css";

function Institute_manufacture() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const BACKEND_PORT_NO = import.meta.env.VITE_BACKEND_PORT || 5000;

  // ---------- PAGINATION ----------
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;

  const currentRows = orders.slice(indexOfFirstRow, indexOfLastRow);

  const totalPages = Math.ceil(orders.length / rowsPerPage);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // ---------- FETCH ORDERS ----------
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const storedInstitute = localStorage.getItem("institute");
        if (!storedInstitute) return;

        const institute = JSON.parse(storedInstitute);

        const res = await axios.get(
          `http://localhost:${BACKEND_PORT_NO}/institute-api/orders/${institute._id}`
        );

        if (!Array.isArray(res.data)) {
          console.error("Unexpected orders response:", res.data);
          return;
        }

        const ordersWithDisplay = res.data.map((order) => ({
          ...order,
          Display_Status: order.institute_Status || "PENDING",
          Manufacturer_Name: order.Manufacturer_ID?.Manufacturer_Name || "N/A",
          Medicine_Name: order.Medicine_ID?.Medicine_Name || "N/A",
        }));

        setOrders(ordersWithDisplay);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setLoading(false);
      }
    };

    fetchOrders();
  }, [BACKEND_PORT_NO]);

  // ---------- MARK AS DELIVERED ----------
  const markAsDelivered = async (manufacturerId, orderId) => {
    try {
      const manId =
        typeof manufacturerId === "object" && manufacturerId._id
          ? manufacturerId._id
          : manufacturerId;

      const res = await axios.put(
        `http://localhost:${BACKEND_PORT_NO}/institute-api/orders/${encodeURIComponent(
          manId
        )}/${encodeURIComponent(orderId)}/delivered`
      );

      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId
            ? {
                ...o,
                Display_Status: res.data.instituteDelivered
                  ? "DELIVERED"
                  : o.Display_Status,
                Delivery_Date: res.data.instituteDelivered
                  ? new Date().toISOString()
                  : o.Delivery_Date,
              }
            : o
        )
      );

      alert(res.data.message || "Order updated successfully!");
    } catch (err) {
      console.error("Error marking as delivered:", err);
      alert(
        err.response?.data?.message ||
          "Error updating delivery status. Please try again."
      );
    }
  };

  // ---------- GENERATE RECEIPT ----------
  const generateReceipt = (order) => {
    if (order.Display_Status !== "DELIVERED") {
      alert("Receipt is available only for delivered orders!");
      return;
    }

    try {
      const doc = new jsPDF();
      const now = new Date();
      const billDate = now.toLocaleString();

      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("OUT-PATIENT PHARMACY", 70, 20);

      doc.setFontSize(14);
      doc.text("PHARMACY SALE RECEIPT", 75, 27);

      doc.line(10, 30, 200, 30);

      doc.setFontSize(11);
      doc.text(`Receipt No: ${order._id.slice(-6).toUpperCase()}`, 12, 38);
      doc.text(`Bill Date: ${billDate}`, 150, 38);
      doc.text(`Manufacturer: ${order.Manufacturer_Name}`, 12, 46);
      doc.text(`Medicine: ${order.Medicine_Name}`, 12, 53);
      doc.text(`Quantity: ${order.Quantity_Requested}`, 150, 46);
      doc.text(`Status: ${order.Display_Status}`, 150, 53);

      doc.line(10, 58, 200, 58);

      autoTable(doc, {
        startY: 65,
        head: [["Batch No", "Expiry", "Qty"]],
        body: [
          [
            "LOT" + Math.floor(Math.random() * 90 + 10),
            "31/12/2026",
            order.Quantity_Requested,
          ],
        ],
        theme: "grid",
        styles: { halign: "center", fontSize: 11 },
        headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
      });

      const finalY = doc.lastAutoTable.finalY + 10;

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("DELIVERED", 90, finalY + 20);

      doc.setFont("helvetica", "normal");
      doc.text(now.toDateString(), 85, finalY + 27);

      doc.setFontSize(9);
      doc.text(
        "AP Police Health Institute\nSystem Generated Receipt\nwww.appolicehealth.in",
        14,
        finalY + 40
      );

      doc.save(`Pharmacy_Receipt_${order._id.slice(-6)}.pdf`);
    } catch (err) {
      console.error("Error generating receipt:", err);
      alert("Failed to generate PDF receipt.");
    }
  };

  // ---------- UI ----------
  if (loading) {
    return (
      <div className="text-center mt-5">
        <strong>Loading orders...</strong>
      </div>
    );
  }

  return (
    <div
      className="container-fluid pb-5"
      style={{ backgroundColor: "#fafafa", minHeight: "100vh" }}
    >
      {/* HEADER */}
      <div
        className="text-center py-4 position-sticky top-0 z-3 bg-white"
        style={{ boxShadow: "0 3px 10px rgba(0,0,0,0.08)" }}
      >
        <h2 className="fw-bold text-dark mb-2">Orders Placed to Manufacturers</h2>

        <div
          style={{
            width: "80px",
            height: "3px",
            backgroundColor: "#000",
            margin: "0 auto 10px",
          }}
        ></div>

        <p className="text-muted">
          Review, track, and confirm deliveries for your medicine orders
        </p>
      </div>

      {/* TABLE */}
      {orders.length === 0 ? (
        <p className="text-center text-muted mt-5">No orders found.</p>
      ) : (
        <div
          className="table-responsive shadow-sm rounded-4 mx-auto mt-4"
          style={{ maxWidth: "90%", background: "#fff" }}
        >
          <table className="table align-middle text-center mb-0">
            <thead className="bg-dark text-white sticky-top">
              <tr>
                <th>#</th>
                <th>Medicine</th>
                <th>Manufacturer</th>
                <th>Quantity</th>
                <th>Order Date</th>
                <th>Delivery Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {currentRows.map((order, idx) => (
                <tr key={order._id}>
                  <td>{indexOfFirstRow + idx + 1}</td>
                  <td>{order.Medicine_Name}</td>
                  <td>{order.Manufacturer_Name}</td>
                  <td>{order.Quantity_Requested}</td>

                  <td>{new Date(order.Order_Date).toLocaleDateString()}</td>

                  <td>
                    {order.Delivery_Date
                      ? new Date(order.Delivery_Date).toLocaleDateString()
                      : "—"}
                  </td>

                  <td>
                    <span
                      className={`badge px-3 py-2 ${
                        order.Display_Status === "DELIVERED"
                          ? "bg-success"
                          : order.Display_Status === "APPROVED"
                          ? "bg-dark"
                          : order.Display_Status === "PENDING"
                          ? "bg-secondary"
                          : "bg-warning text-dark"
                      }`}
                    >
                      {order.Display_Status}
                    </span>
                  </td>

                  <td>
                    <div className="d-flex justify-content-center gap-2">
                      {order.institute_Status === "APPROVED" && (
                        <button
                          className="btn btn-sm btn-dark d-flex align-items-center gap-2"
                          onClick={() =>
                            markAsDelivered(order.Manufacturer_ID, order._id)
                          }
                        >
                          <FaTruck size={13} /> Delivered
                        </button>
                      )}

                      {order.Display_Status === "DELIVERED" && (
                        <button
                          className="btn btn-sm btn-outline-dark d-flex align-items-center gap-2"
                          onClick={() => generateReceipt(order)}
                        >
                          <FaFilePdf size={14} /> Receipt
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ---------- PAGINATION BAR ---------- */}
          <div className="d-flex justify-content-between align-items-center p-3">

            {/* Rows per page */}
            <div className="d-flex align-items-center gap-2">
              <span>Rows per page:</span>

              <select
                className="form-select"
                style={{ width: "90px" }}
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            {/* Range info */}
            <span>
              Showing <b>{indexOfFirstRow + 1}</b> –
              <b>{Math.min(indexOfLastRow, orders.length)}</b> of{" "}
              <b>{orders.length}</b>
            </span>

            {/* Page buttons */}
            <div className="btn-group">
              <button
                className="btn btn-outline-dark"
                disabled={currentPage === 1}
                onClick={() => goToPage(currentPage - 1)}
              >
                ‹ Prev
              </button>

              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  className={`btn ${
                    currentPage === i + 1
                      ? "btn-dark"
                      : "btn-outline-dark"
                  }`}
                  onClick={() => goToPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}

              <button
                className="btn btn-outline-dark"
                disabled={currentPage === totalPages}
                onClick={() => goToPage(currentPage + 1)}
              >
                Next ›
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Institute_manufacture;
