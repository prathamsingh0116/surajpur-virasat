const mongoose = require("mongoose");

const emergencyContactSchema = new mongoose.Schema({
  label: { en: String, hi: String },
  phone: { type: String, required: true },
  description: { en: String, hi: String },
  active: { type: Boolean, default: true },
  verified: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("EmergencyContact", emergencyContactSchema);
