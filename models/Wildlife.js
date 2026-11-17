const mongoose = require("mongoose");

const wildlifeSchema = new mongoose.Schema({
  name: { en: { type: String, required: true }, hi: { type: String, required: true } },
  scientificName: String,
  description: { en: String, hi: String },
  category: { type: String, enum: ["mammal", "bird", "reptile", "other"], default: "mammal" },
  image: String,
  active: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  contentVerified: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Wildlife", wildlifeSchema);
