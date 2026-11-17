const mongoose = require("mongoose");

const gallerySchema = new mongoose.Schema({
  image: { type: String, required: true },
  checkpointSlug: { type: String, default: "main", lowercase: true, trim: true, index: true },
  caption: { en: String, hi: String },
  alt: { en: String, hi: String },
  active: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  photoVerified: { type: Boolean, default: false },
  photoType: { type: String, enum: ["official-site", "illustrative", "local-upload"], default: "illustrative" },
  credit: { type: String, default: "" },
  license: { type: String, default: "" },
  sourceUrl: { type: String, default: "" },
  isLocalPhoto: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Gallery", gallerySchema);
