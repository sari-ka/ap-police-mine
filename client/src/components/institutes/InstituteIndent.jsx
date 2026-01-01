import React, { useEffect, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const InstituteIndent = () => {
  const BACKEND_PORT = import.meta.env.VITE_BACKEND_PORT || 6100;

  const [manufacturers, setManufacturers] = useState([]);
  const instituteId = localStorage.getItem("instituteId");

  /* ---------------- FETCH MANUFACTURERS ---------------- */
  useEffect(() => {
    axios
      .get(`http://localhost:${BACKEND_PORT}/indent-api/manufacturers`)
      .then((res) => setManufacturers(res.data || []))
      .catch((err) => {
        console.error("Failed to load manufacturers", err);
        setManufacturers([]);
      });
  }, [BACKEND_PORT]);

  /* ---------------- PDF GENERATION ---------------- */
  const generatePDF = async (manufacturerId) => {
    if (!instituteId) {
      alert("Institute not logged in");
      return;
    }

    try {
      const res = await axios.get(
        `http://localhost:${BACKEND_PORT}/indent-api/generate/${manufacturerId}`,
        { params: { instituteId } }
      );

      const indent = res.data;
      const doc = new jsPDF("p", "mm", "a4");

      /* ------------ PAGE BORDER ------------ */
      doc.rect(10, 10, 190, 277);

      /* ------------ HEADER ------------ */
      doc.setFontSize(12);
      doc.text("GENERATED INDENT", 105, 20, { align: "center" });

      doc.setFontSize(11);
      doc.text(indent.Institute_Name || "-", 105, 28, { align: "center" });
      doc.text(indent.Institute_Address || "-", 105, 34, { align: "center" });

      doc.text(
        `DATE: ${new Date(indent.Date).toLocaleDateString()}`,
        150,
        42
      );

      doc.setFontSize(13);
      doc.text("INDENT", 105, 52, { align: "center" });

      /* ------------ TABLE ------------ */
      autoTable(doc, {
        startY: 60,
        head: [[
          "S.NO",
          "MEDICINE ID",
          "MEDICINE NAME",
          "STOCK ON HAND",
          "REQUIRED QUANTITY",
          "REMARKS"
        ]],
        body: (indent.Items || []).map((item, i) => [
          i + 1,
          item.Medicine_Code || item.Medicine_ID || "-", // ✅ FIXED
          item.Medicine_Name || "-",
          item.Stock_On_Hand ?? "-",
          item.Required_Quantity ?? "-",
          item.Remarks || ""
        ]),
        styles: {
          fontSize: 9,
          halign: "center",
          valign: "middle",
          lineWidth: 0.1,
          lineColor: [0, 0, 0]
        },
        headStyles: {
          fillColor: [220, 220, 220],
          textColor: [0, 0, 0],
          fontStyle: "bold"
        }
      });

      /* ------------ FOOTER / SIGNATURES ------------ */
      const y = doc.lastAutoTable.finalY + 30;

      doc.setFontSize(11);
      doc.text("Pharmacy Officer", 30, y);
      doc.text("Unit Medical Officer", 140, y);

      doc.text(indent.Institute_Name || "-", 30, y + 8);
      doc.text(indent.Institute_Name || "-", 140, y + 8);

      doc.text(indent.Institute_Address || "-", 30, y + 14);
      doc.text(indent.Institute_Address || "-", 140, y + 14);

      doc.save("Indent.pdf");

    } catch (err) {
      console.error("Failed to generate indent PDF", err);
      alert("Failed to generate indent PDF");
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="container mt-4">
      <h4 className="mb-3">Manufacturers – Generate Indent</h4>

      <table className="table table-bordered table-hover">
        <thead className="table-dark">
          <tr>
            <th style={{ width: "80px" }}>S.NO</th>
            <th>Manufacturer Name</th>
            <th style={{ width: "180px" }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {manufacturers.length === 0 && (
            <tr>
              <td colSpan="3" className="text-center">
                No manufacturers found
              </td>
            </tr>
          )}

          {manufacturers.map((m, i) => (
            <tr key={m._id}>
              <td>{i + 1}</td>
              <td>{m.Manufacturer_Name}</td>
              <td>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => generatePDF(m._id)}
                >
                  📄 Generate PDF
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InstituteIndent;
