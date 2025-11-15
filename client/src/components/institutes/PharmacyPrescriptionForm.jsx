import React, { useEffect, useState } from "react";
import axios from "axios";

const PharmacyPrescriptionForm = () => {
  const [employees, setEmployees] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [instituteName, setInstituteName] = useState("");
  const [employeeDiseases, setEmployeeDiseases] = useState({ communicable: [], nonCommunicable: [] });
  const [familyDiseases, setFamilyDiseases] = useState({ communicable: [], nonCommunicable: [] });

  const [formData, setFormData] = useState({
    Institute_ID: "",
    Employee_ID: "",
    IsFamilyMember: false,
    FamilyMember_ID: "",
    Medicines: [{ medicineId: "", medicineName: "", quantity: 0 }],
    Notes: "",
  });

  const BACKEND_PORT_NO = import.meta.env.VITE_BACKEND_PORT || "6100";

  // 🟢 Load institute info and employees on mount
  useEffect(() => {
    const localInstituteId = localStorage.getItem("instituteId");
    if (localInstituteId) {
      setFormData((s) => ({ ...s, Institute_ID: localInstituteId }));
      fetchInstituteName(localInstituteId);
      fetchInventory(localInstituteId);
    }
    fetchEmployees();
  }, []);

  const fetchInstituteName = async (id) => {
    try {
      const res = await axios.get(
        `http://localhost:${BACKEND_PORT_NO}/institute-api/institution/${id}`
      );
      setInstituteName(res.data?.Institute_Name || "Unknown Institute");
    } catch (err) {
      console.error("Error fetching institute name:", err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(
        `http://localhost:${BACKEND_PORT_NO}/employee-api/employees`
      );
      setEmployees(res.data || []);
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  const fetchInventory = async (id) => {
    try {
      const res = await axios.get(
        `http://localhost:${BACKEND_PORT_NO}/institute-api/inventory/${id}`
      );
      setInventory(res.data || []);
    } catch (err) {
      console.error("Error fetching inventory:", err);
    }
  };

  // 🟢 Filter employees based on ABS_NO
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredEmployees([]);
    } else {
      const filtered = employees.filter((emp) =>
        String(emp.ABS_NO || "")
          .toLowerCase()
          .startsWith(searchTerm.toLowerCase())
      );
      setFilteredEmployees(filtered);
    }
  }, [searchTerm, employees]);

  // 🟢 Disease categorization (Communicable recent < 14 days)
  const categorizeDiseases = (diseaseList) => {
    if (!diseaseList.length) return { communicable: [], nonCommunicable: [] };

    const now = new Date();
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000); // last 14 days

    const communicable = diseaseList.filter(
      (d) =>
        d.Category === "Communicable" &&
        new Date(d.createdAt || d.updatedAt || now) >= twoWeeksAgo
    );

    const nonCommunicable = diseaseList.filter(
      (d) => d.Category === "Non-Communicable"
    );

    return { communicable, nonCommunicable };
  };

  // 🟢 Handle employee select
  const handleEmployeeSelect = async (emp) => {
    setFormData((prev) => ({ ...prev, Employee_ID: emp._id }));
    setSearchTerm(emp.ABS_NO || "");
    setFilteredEmployees([]);

    try {
      const famRes = await axios.get(
        `http://localhost:${BACKEND_PORT_NO}/family-api/family/${emp._id}`
      );
      setFamilyMembers(famRes.data || []);
    } catch (err) {
      console.error("Error fetching family members:", err);
    }

    try {
      const res = await axios.get(
        `http://localhost:${BACKEND_PORT_NO}/employee-api/by-abs/${emp.ABS_NO}`
      );
      const history = res.data?.Medical_History || [];
      const allDiseases = history.flatMap((mh) => mh.Disease);
      setEmployeeDiseases(categorizeDiseases(allDiseases));
    } catch (err) {
      console.error("Error fetching employee diseases:", err);
    }
  };

  // 🟢 Handle family select
  const handleFamilySelect = async (id) => {
    setFormData((prev) => ({ ...prev, FamilyMember_ID: id }));

    try {
      const res = await axios.get(
        `http://localhost:${BACKEND_PORT_NO}/family-api/family-report/${id}`
      );
      const history = res.data?.Medical_History || [];
      const allDiseases = history.flatMap((mh) => mh.Disease);
      setFamilyDiseases(categorizeDiseases(allDiseases));
    } catch (err) {
      console.error("Error fetching family diseases:", err);
    }
  };

  // 🟢 Medicine Handlers
  const handleMedicineChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.Medicines];
      if (field === "medicineId") {
        const selected = inventory.find((m) => m.medicineId === value);
        if (selected) {
          updated[index] = {
            medicineId: selected.medicineId,
            medicineName: selected.medicineName,
            quantity: 0,
          };
        }
      } else if (field === "quantity") {
        updated[index].quantity = value;
      }
      return { ...prev, Medicines: updated };
    });
  };

  const addMedicine = () =>
    setFormData((prev) => ({
      ...prev,
      Medicines: [
        ...prev.Medicines,
        { medicineId: "", medicineName: "", quantity: 0 },
      ],
    }));

  const removeMedicine = (index) =>
    setFormData((prev) => ({
      ...prev,
      Medicines: prev.Medicines.filter((_, i) => i !== index),
    }));

  // 🟢 Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.Institute_ID || !formData.Employee_ID) {
      alert("Please fill all required fields.");
      return;
    }

    const payload = {
      Institute_ID: formData.Institute_ID,
      Employee_ID: formData.Employee_ID,
      IsFamilyMember: formData.IsFamilyMember,
      FamilyMember_ID: formData.FamilyMember_ID || null,
      Medicines: formData.Medicines.map((m) => ({
        Medicine_ID: m.medicineId,
        Medicine_Name: m.medicineName,
        Quantity: Number(m.quantity),
      })),
      Notes: formData.Notes,
    };

    try {
      await axios.post(
        `http://localhost:${BACKEND_PORT_NO}/prescription-api/add`,
        payload
      );
      alert("✅ Prescription saved successfully!");
      window.location.reload();
    } catch (err) {
      console.error("Error saving prescription:", err);
      alert("❌ Error saving prescription");
    }
  };

  // ✅ Disease Table Component
  const DiseaseTable = ({ title, diseases }) => (
    <>
      {diseases.length > 0 && (
        <div style={{ marginTop: 15 }}>
          <h5>{title}</h5>
          <table className="table table-bordered mt-2">
            <thead className="table-light">
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Severity</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {diseases.map((d, i) => (
                <tr
                  key={i}
                  style={{
                    backgroundColor:
                      d.Category === "Communicable" ? "#ffecec" : "inherit",
                  }}
                >
                  <td>{d.Disease_Name}</td>
                  <td>{d.Category}</td>
                  <td>{d.Severity_Level}</td>
                  <td>
                    {new Date(d.createdAt || d.updatedAt || Date.now()).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );

  return (
    <div
      style={{
        maxWidth: 650,
        margin: "40px auto",
        padding: 24,
        background: "#fff",
        borderRadius: 8,
      }}
    >
      <h2 style={{ textAlign: "center" }}>Pharmacy Prescription Entry</h2>

      <form onSubmit={handleSubmit} autoComplete="off">
        {/* Institute Info */}
        <label>Institute</label>
        <input
          type="text"
          value={instituteName || "Loading..."}
          readOnly
          style={{
            width: "100%",
            padding: 8,
            borderRadius: 6,
            border: "1px solid #ccc",
            marginBottom: 10,
          }}
        />

        {/* Employee ABS_NO */}
        <label>Employee ABS_NO</label>
        <input
          type="text"
          placeholder="Type ABS_NO..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: "100%", padding: 8, borderRadius: 6 }}
        />

        {searchTerm && filteredEmployees.length > 0 && (
          <div
            style={{
              border: "1px solid #ccc",
              maxHeight: 150,
              overflowY: "auto",
              marginTop: 6,
            }}
          >
            {filteredEmployees.map((emp) => (
              <div
                key={emp._id}
                onClick={() => handleEmployeeSelect(emp)}
                style={{
                  padding: "8px 10px",
                  cursor: "pointer",
                  borderBottom: "1px solid #eee",
                }}
              >
                {emp.ABS_NO} — {emp.Name}
              </div>
            ))}
          </div>
        )}

        {/* Employee Diseases */}
        {employeeDiseases.communicable.length > 0 ||
        employeeDiseases.nonCommunicable.length > 0 ? (
          <div style={{ marginTop: 20 }}>
            <h4>🧬 Employee Diseases</h4>
            <DiseaseTable
              title="Communicable (Recent — Last 2 Weeks)"
              diseases={employeeDiseases.communicable}
            />
            <DiseaseTable
              title="Non-Communicable (All)"
              diseases={employeeDiseases.nonCommunicable}
            />
          </div>
        ) : null}

        {/* Family Member Option */}
        <label style={{ marginTop: 12 }}>
          <input
            type="checkbox"
            checked={formData.IsFamilyMember}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                IsFamilyMember: e.target.checked,
                FamilyMember_ID: "",
              }))
            }
          />{" "}
          Prescription for Family Member?
        </label>

        {formData.IsFamilyMember && (
          <>
            <label style={{ marginTop: 10 }}>Select Family Member</label>
            <select
              value={formData.FamilyMember_ID}
              onChange={(e) => handleFamilySelect(e.target.value)}
              style={{ width: "100%", padding: 8, borderRadius: 6 }}
            >
              <option value="">Select Family Member</option>
              {familyMembers.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.Name} ({f.Relationship})
                </option>
              ))}
            </select>

            {/* Family Member Diseases */}
            {familyDiseases.communicable.length > 0 ||
            familyDiseases.nonCommunicable.length > 0 ? (
              <div style={{ marginTop: 20 }}>
                <h4>👨‍👩‍👧 Family Member Diseases</h4>
                <DiseaseTable
                  title="Communicable (Recent — Last 2 Weeks)"
                  diseases={familyDiseases.communicable}
                />
                <DiseaseTable
                  title="Non-Communicable (All)"
                  diseases={familyDiseases.nonCommunicable}
                />
              </div>
            ) : null}
          </>
        )}

        {/* Medicines Section */}
        <h4 style={{ marginTop: 20 }}>Medicines</h4>
        {formData.Medicines.map((med, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <select
              value={med.medicineId}
              onChange={(e) =>
                handleMedicineChange(i, "medicineId", e.target.value)
              }
              required
              style={{
                width: "70%",
                padding: 8,
                borderRadius: 6,
                marginRight: 8,
              }}
            >
              <option value="">Select Medicine</option>
              {inventory.map((m) => (
                <option key={m.medicineId} value={m.medicineId}>
                  {m.medicineName} ({m.manufacturerName}) — Available:{" "}
                  {m.quantity}
                </option>
              ))}
            </select>

            <input
              type="number"
              value={med.quantity}
              placeholder="Qty"
              onChange={(e) =>
                handleMedicineChange(i, "quantity", e.target.value)
              }
              required
              style={{ width: "20%", padding: 8, borderRadius: 6 }}
            />
            <button
              type="button"
              onClick={() => removeMedicine(i)}
              style={{
                marginLeft: 5,
                background: "red",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "6px 10px",
              }}
            >
              X
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addMedicine}
          style={{
            background: "#007bff",
            color: "#fff",
            border: "none",
            padding: 8,
            borderRadius: 6,
          }}
        >
          + Add Medicine
        </button>

        {/* Notes */}
        <label style={{ display: "block", marginTop: 16 }}>Notes</label>
        <textarea
          name="Notes"
          value={formData.Notes}
          onChange={(e) =>
            setFormData({ ...formData, Notes: e.target.value })
          }
          rows={3}
          style={{ width: "100%", padding: 8, borderRadius: 6 }}
        />

        <button
          type="submit"
          style={{
            marginTop: 20,
            width: "100%",
            padding: 10,
            background: "black",
            color: "white",
            border: "none",
            borderRadius: 8,
          }}
        >
          Submit Prescription
        </button>
      </form>
    </div>
  );
};

export default PharmacyPrescriptionForm;
