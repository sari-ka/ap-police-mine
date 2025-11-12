const mongoose = require("mongoose");
const { Schema } = mongoose;

const FamilyMemberSchema = new Schema({
  Family_ID: { type: Number, unique: true },
  Employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
  Name: { type: String, required: true },
  Relationship: { type: String, required: true },
  DOB: { type: Date },
  Gender: { type: String, required: true, enum: ["Male", "Female"] },
  Medical_History: [
  {
    Date: { type: Date, default: Date.now },
    Diagnosis: String,
    Medicines: [
      {
        Medicine_Name: String,
        Quantity: Number
      }
    ],
    Notes: String
  }
]

});

module.exports = mongoose.model("FamilyMember", FamilyMemberSchema);
