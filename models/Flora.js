const mongoose = require("mongoose");

const floraSchema = new mongoose.Schema({
  name: { en: { type: String, required: true }, hi: { type: String, required: true } },
  scientificName: String,
  description: { en: String, hi: String },
  image: String,
  active: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  contentVerified: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Flora", floraSchema);
