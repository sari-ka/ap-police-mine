import React, { useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import { IoClose, IoMenu } from "react-icons/io5";

const Institute_home = () => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleProfileClick = () => navigate("/institutes/profile");
  const handleSignout = () => {
    localStorage.removeItem("institute");
    navigate("/");
  };
  const handleOrderClick = () => navigate("/institutes/placeorder");
  const handleAnalyticsClick = () => navigate("/institutions/analytics"); // ✅ New

  return (
    <div
      className="d-flex min-vh-100"
      style={{
        fontFamily: "Inter, sans-serif",
        backgroundColor: "#f5f6f7",
        overflowX: "hidden",
      }}
    >
      {/* Sidebar */}
      <div
        className={`bg-white text-dark p-4 border-end shadow-sm position-fixed h-100 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-100"
        }`}
        style={{
          width: "260px",
          minHeight: "100vh",
          transition: "all 0.4s ease",
          zIndex: 1050,
        }}
      >
        {/* Close Button */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="fw-bold mb-0">Institute Panel</h5>
          <IoClose
            size={28}
            className="text-dark cursor-pointer"
            onClick={() => setSidebarOpen(false)}
          />
        </div>

        {/* Sidebar Items */}
        <ul className="list-unstyled mt-4">
          <li
            className="mb-3 p-2 rounded hover-item"
            onClick={() => navigate("/institutes/manufacturer-orders")}
          >
            📦 Orders Medicines
          </li>
          <li
            className="mb-3 p-2 rounded hover-item"
            onClick={() => navigate("/institutes/inventory")}
          >
            🧾 Inventory
          </li>
          <li
            className="mb-3 p-2 rounded hover-item"
            onClick={() => navigate("/institutions/diseases")}
          >
            🧬 Diseases
          </li>
          <li
            className="mb-3 p-2 rounded hover-item"
            onClick={() => navigate("/institutions/prescriptions")}
          >
            💊 Prescriptions
          </li>
          <li
            className="mb-3 p-2 rounded hover-item"
            onClick={() => navigate("/institutions/reports")}
          >
            📋 View Employee Reports
          </li>
        </ul>

        <p
          className="text-center small mt-auto"
          style={{
            color: "#777",
            marginTop: "100px",
            fontSize: "0.85rem",
          }}
        >
          © 2025 AP Police Health
        </p>
      </div>

      {/* Main Content */}
      <div
        className="flex-grow-1"
        style={{
          marginLeft: sidebarOpen ? "260px" : "0px",
          transition: "all 0.4s ease",
          width: "100%",
        }}
      >
        {/* Header */}
        <div
          className="d-flex justify-content-between align-items-center p-3 bg-white shadow-sm"
          style={{ position: "sticky", top: 0, zIndex: 10 }}
        >
          <div className="d-flex align-items-center gap-3">
            {!sidebarOpen && (
              <IoMenu
                size={30}
                className="text-dark cursor-pointer"
                onClick={() => setSidebarOpen(true)}
              />
            )}
            <h3 className="fw-bold mb-0" style={{ color: "#111" }}>
              Institute Dashboard
            </h3>
          </div>

          {/* Profile */}
          <div className="position-relative">
            <FaUserCircle
              size={38}
              className="text-dark cursor-pointer"
              onClick={() => setShowDropdown(!showDropdown)}
            />
            {showDropdown && (
              <div
                className="position-absolute bg-white border rounded shadow p-2"
                style={{
                  right: 0,
                  top: "45px",
                  width: "160px",
                  zIndex: 100,
                }}
              >
                <p
                  className="mb-2 fw-semibold text-black small"
                  onClick={handleProfileClick}
                >
                  Profile
                </p>
                <hr className="my-1" />
                <p
                  className="mb-0 fw-semibold text-black small"
                  onClick={handleSignout}
                >
                  Sign Out
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="container py-4">
          <div className="row g-4">
            <div className="col-md-4">
              <div className="card text-center p-3 border-0 shadow-sm rounded-4">
                <h6 className="text-muted mb-1">Total Employees</h6>
                <h3 className="fw-bold text-dark">25</h3>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card text-center p-3 border-0 shadow-sm rounded-4">
                <h6 className="text-muted mb-1">Total Orders Placed</h6>
                <h3 className="fw-bold text-dark">40</h3>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card text-center p-3 border-0 shadow-sm rounded-4">
                <h6 className="text-muted mb-1">Medicines in Stock</h6>
                <h3 className="fw-bold text-dark">18</h3>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="text-center mt-5 d-flex flex-column align-items-center gap-3">
            <button
              className="btn px-5 py-2 fw-semibold"
              onClick={handleOrderClick}
              style={{
                background: "linear-gradient(180deg, #1c1c1c, #000)",
                color: "#fff",
                borderRadius: "10px",
                letterSpacing: "0.3px",
              }}
            >
              ➕ Place New Order
            </button>

            {/* ✅ New Analytics Button */}
            <button
              className="btn btn-outline-dark px-5 py-2 fw-semibold"
              onClick={handleAnalyticsClick}
              style={{
                borderRadius: "10px",
                letterSpacing: "0.3px",
              }}
            >
              📊 View Analytics
            </button>
          </div>

          <div className="mt-5">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Institute_home;
