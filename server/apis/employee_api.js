// routes/employeeRoutes.js
const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const employeeApp = express.Router();
const Employee = require("../models/employee");

// ==============================
// GET all employees (used for dropdowns/search)
// ==============================
employeeApp.get(
  "/employees",
  expressAsyncHandler(async (req, res) => {
    const employees = await Employee.find({}, "_id ABS_NO Name Email Designation");
    res.status(200).json(employees);
  })
);

// ==============================
// POST - Register Employee
// ==============================
employeeApp.post(
  "/register",
  expressAsyncHandler(async (req, res) => {
    const empData = req.body;

    if (!empData.ABS_NO || !empData.Name || !empData.Email || !empData.Password) {
      return res.status(400).json({
        message: "ABS_NO, Name, Email, and Password are required",
      });
    }

    const existing = await Employee.findOne({ Email: empData.Email.trim() });
    if (existing)
      return res.status(409).json({ message: "Employee already exists with this email" });

    const hashedPassword = await bcrypt.hash(empData.Password, 10);

    const newEmp = new Employee({
      ABS_NO: empData.ABS_NO,
      Name: empData.Name,
      Email: empData.Email,
      Password: hashedPassword,
      Designation: empData.Designation || "",
      Address: empData.Address || {},
      Blood_Group: empData.Blood_Group || "",
      Medical_History: [],
    });

    const saved = await newEmp.save();
    res.status(201).json({ message: "Employee Registered Successfully", payload: saved });
  })
);

// ==============================
// POST - Employee Login
// ==============================
employeeApp.post(
  "/login",
  expressAsyncHandler(async (req, res) => {
    const { Email, Password } = req.body;
    const emp = await Employee.findOne({ Email: Email.trim() });

    if (!emp) return res.status(401).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(Password, emp.Password);
    if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

    const token = jwt.sign({ id: emp._id }, "empsecret123", { expiresIn: "2h" });

    res.status(200).json({
      message: "Login successful",
      payload: {
        token,
        id: emp._id,
        Name: emp.Name,
        Designation: emp.Designation,
      },
    });
  })
);

// ==============================
// GET - Employee Profile by ID
// ==============================
employeeApp.get(
  "/profile/:id",
  expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid Employee ID" });

    const emp = await Employee.findById(id).populate({
      path: "Medical_History.Disease",
      select: "Disease_Name Category Severity_Level",
    });

    if (!emp) return res.status(404).json({ message: "Employee not found" });
    res.status(200).json(emp);
  })
);

// ==============================
// GET - Employee by ABS_NO with Diseases + Family Members
// ==============================
employeeApp.get("/by-abs/:absNo", async (req, res) => {
  try {
    const emp = await Employee.findOne({ ABS_NO: req.params.absNo })
      .populate({
        path: "Medical_History.Disease",
        select: "Disease_Name Category Severity_Level",
      })
      .populate({
        path: "FamilyMembers",
        select: "Name Relationship",
      });

    if (!emp) return res.status(404).json({ message: "Employee not found" });
    res.json(emp);
  } catch (err) {
    console.error("Error fetching employee:", err);
    res.status(500).json({ error: err.message });
  }
});

// ==============================
// PUT - Update Employee Profile
// ==============================
employeeApp.put(
  "/profile/:id",
  expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    const allowed = [
      "Name",
      "Designation",
      "Email",
      "Address",
      "Blood_Group",
      "Medical_History",
    ];
    const update = {};

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) update[field] = req.body[field];
    });

    const emp = await Employee.findByIdAndUpdate(id, update, { new: true });
    if (!emp) return res.status(404).json({ message: "Employee not found" });

    res.status(200).json({ message: "Profile updated successfully", profile: emp });
  })
);

// ==============================
// DELETE - Remove Employee
// ==============================
employeeApp.delete(
  "/delete/:id",
  expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid Employee ID" });

    const emp = await Employee.findByIdAndDelete(id);
    if (!emp) return res.status(404).json({ message: "Employee not found" });

    res.status(200).json({ message: "Employee deleted successfully" });
  })
);

module.exports = employeeApp;
