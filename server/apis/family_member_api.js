// routes/familyRoutes.js
const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const FamilyMember = require("../models/family_member");
const Employee = require("../models/employee");

const familyApp = express.Router();

// ==============================
// POST - Register New Family Member
// ==============================
familyApp.post(
  "/register",
  expressAsyncHandler(async (req, res) => {
    const { Name, Relationship, DOB, Gender, Medical_History, EmployeeId } = req.body;

    if (!Name || !Relationship || !EmployeeId)
      return res.status(400).json({
        message: "Name, Relationship, and EmployeeId are required",
      });

    const employee = await Employee.findById(EmployeeId);
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });

    // Auto-increment Family_ID
    const last = await FamilyMember.findOne().sort({ Family_ID: -1 });
    const nextId = last?.Family_ID ? last.Family_ID + 1 : 1;

    const familyMember = new FamilyMember({
      Family_ID: nextId,
      Employee: EmployeeId,
      Name,
      Relationship,
      DOB,
      Gender,
      Medical_History: Medical_History || [],
    });

    const saved = await familyMember.save();

    // Link family member to employee
    employee.FamilyMembers.push(saved._id);
    await employee.save();

    res.status(201).json({
      message: "Family member registered successfully",
      payload: saved,
    });
  })
);

// ==============================
// GET - Family Members by Employee ID
// ==============================
familyApp.get(
  "/family/:employeeId",
  expressAsyncHandler(async (req, res) => {
    const employee = await Employee.findById(req.params.employeeId).populate(
      "FamilyMembers"
    );
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });

    res.json(employee.FamilyMembers || []);
  })
);

// ==============================
// GET - Family Member Detailed Report
// ==============================
familyApp.get(
  "/family-report/:id",
  expressAsyncHandler(async (req, res) => {
    const fam = await FamilyMember.findById(req.params.id).populate({
      path: "Medical_History.Disease",
      select: "Disease_Name Category Severity_Level",
    });

    if (!fam)
      return res.status(404).json({ message: "Family member not found" });

    res.json(fam);
  })
);

module.exports = familyApp;
