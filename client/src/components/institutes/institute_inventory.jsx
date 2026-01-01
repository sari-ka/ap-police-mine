import React, { useEffect, useState } from "react";
import axios from "axios";

function InstituteInventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  const BACKEND_PORT_NO = import.meta.env.VITE_BACKEND_PORT;

  // ---------- PAGINATION ----------
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const storedInstitute = localStorage.getItem("institute");
        if (!storedInstitute) return;

        const institute = JSON.parse(storedInstitute);
        const instituteId = institute._id;

        const res = await axios.get(
          `http://localhost:${BACKEND_PORT_NO}/institute-api/inventory/${instituteId}`
        );

        setInventory(res.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching inventory:", error);
        setLoading(false);
      }
    };

    fetchInventory();
  }, [BACKEND_PORT_NO]);

  // ---------- PAGINATION VALUES ----------
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;

  const currentRows = inventory.slice(indexOfFirstRow, indexOfLastRow);

  const totalPages = Math.ceil(inventory.length / rowsPerPage);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <strong>Loading inventory...</strong>
      </div>
    );
  }

  return (
    <div className="p-6">

      <h2 className="text-2xl font-bold mb-4 text-center">
        Institute Inventory
      </h2>

      {inventory.length === 0 ? (
        <p className="text-center text-gray-600">
          No medicines found.
        </p>
      ) : (
        <>
          {/* TABLE */}
          <table className="w-full border border-gray-300 rounded-lg shadow-md">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 border">S.No</th>
                <th className="p-3 border">Medicine Name</th>
                <th className="p-3 border">Manufacturer</th>
                <th className="p-3 border">Quantity Available</th>
                <th className="p-3 border">Threshold Quantity</th>
              </tr>
            </thead>

            <tbody>
              {currentRows.map((item, index) => (
                <tr key={index} className="text-center">
                  <td className="p-2 border">
                    {indexOfFirstRow + index + 1}
                  </td>
                  <td className="p-2 border">{item.medicineName}</td>
                  <td className="p-2 border">{item.manufacturerName}</td>
                  <td className="p-2 border">{item.quantity}</td>
                  <td className="p-2 border">{item.threshold}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* PAGINATION BAR */}
          <div className="flex justify-between items-center mt-4">

            {/* Rows per page selector */}
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                className="border px-2 py-1 rounded"
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

            {/* Showing range */}
            <span>
              Showing <b>{indexOfFirstRow + 1}</b> –
              <b>{Math.min(indexOfLastRow, inventory.length)}</b> of{" "}
              <b>{inventory.length}</b>
            </span>

            {/* Pagination buttons */}
            <div className="flex gap-1">

              <button
                className="px-3 py-1 border rounded disabled:opacity-50"
                disabled={currentPage === 1}
                onClick={() => goToPage(currentPage - 1)}
              >
                ‹ Prev
              </button>

              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  className={`px-3 py-1 border rounded ${
                    currentPage === i + 1
                      ? "bg-blue-600 text-white"
                      : "bg-white"
                  }`}
                  onClick={() => goToPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}

              <button
                className="px-3 py-1 border rounded disabled:opacity-50"
                disabled={currentPage === totalPages}
                onClick={() => goToPage(currentPage + 1)}
              >
                Next ›
              </button>

            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default InstituteInventory;
