const mongoose = require("mongoose");

const checkpointSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { en: String, hi: String },
  description: { en: String, hi: String },
  overview: { en: String, hi: String },
  visitorTips: { en: String, hi: String },
  history: { en: String, hi: String },
  storyTitle: { en: String, hi: String },
  story: { en: String, hi: String },
  railway: {
    stationName: { type: String, default: "Surajpur Road" },
    stationCode: { type: String, default: "SJPR" },
    distanceKm: { type: Number, default: null },
    villageReferenceKm: { type: Number, default: null },
    distanceBasis: { type: String, default: "" },
    note: { en: String, hi: String }
  },
  destination: { type: String, default: "" },
  coordinates: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null }
  },
  sources: [{ title: String, url: String }],
  heroImage: { type: String, default: "" },
  mapUrl: { type: String, default: "" },
  mapEmbedUrl: { type: String, default: "" },
  icon: { type: String, default: "map-pin" },
  active: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  contentVerified: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Checkpoint", checkpointSchema);
