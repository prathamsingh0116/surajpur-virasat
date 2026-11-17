const mongoose = require("mongoose");

const sanctuarySchema = new mongoose.Schema({
  slug: { type: String, default: "main", unique: true },
  name: { en: String, hi: String },
  tagline: { en: String, hi: String },
  district: { en: String, hi: String },
  area: { type: String, default: "608.51 sq km" },
  established: { type: String, default: "1978" },
  coordinates: { type: String, default: "23°39' N, 82°54' E" },
  mapUrl: { type: String, default: "https://maps.google.com/?q=Tamor+Pingla+Wildlife+Sanctuary+Surajpur" },
  mapEmbedUrl: { type: String, default: "https://maps.google.com/maps?q=Tamor+Pingla+Wildlife+Sanctuary+Surajpur&t=&z=11&ie=UTF8&iwloc=&output=embed" },
  about: {
    en: [{ type: String }],
    hi: [{ type: String }]
  },
  geography: [{
    title: { en: String, hi: String },
    description: { en: String, hi: String },
    icon: String
  }],
  tigerReserve: {
    title: { en: String, hi: String },
    description: { en: String, hi: String }
  },
  ramkola: {
    title: { en: String, hi: String },
    subtitle: { en: String, hi: String },
    description: { en: String, hi: String },
    points: [{
      title: { en: String, hi: String },
      description: { en: String, hi: String },
      icon: String
    }]
  },
  distances: [{
    label: { en: String, hi: String },
    distance: String,
    description: { en: String, hi: String }
  }],
  bestSeason: { en: String, hi: String },
  speechText: { en: String, hi: String },
  heroImage: String,
  factsVerified: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Sanctuary", sanctuarySchema);
