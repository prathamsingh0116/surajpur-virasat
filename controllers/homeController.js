const Sanctuary = require("../models/Sanctuary");
const Wildlife = require("../models/Wildlife");
const Flora = require("../models/Flora");
const Gallery = require("../models/Gallery");
const Checkpoint = require("../models/Checkpoint");
const EmergencyContact = require("../models/EmergencyContact");

exports.index = async (req, res) => {
  const [sanctuary, wildlife, flora, gallery, checkpoints, contacts] = await Promise.all([
    Sanctuary.findOne({ slug: "main" }).lean(),
    Wildlife.find({ active: true }).sort({ sortOrder: 1 }).lean(),
    Flora.find({ active: true }).sort({ sortOrder: 1 }).lean(),
    Gallery.find({ active: true, checkpointSlug: "main" }).sort({ sortOrder: 1 }).lean(),
    Checkpoint.find({ active: true }).sort({ sortOrder: 1 }).lean(),
    EmergencyContact.find({ active: true }).sort({ sortOrder: 1 }).lean()
  ]);
  const lang = req.query.lang === "hi" ? "hi" : "en";
  res.render("home/index", {
    title: "Surajpur Virasat | Heritage & Nature Explorer",
    sanctuary, wildlife, flora, gallery, checkpoints, contacts, lang, checkpoint: null
  });
};

exports.location = async (req, res) => {
  const [checkpoint, checkpoints, gallery, contacts] = await Promise.all([
    Checkpoint.findOne({ slug: req.params.slug }).lean(),
    Checkpoint.find({ active: true }).sort({ sortOrder: 1 }).lean(),
    Gallery.find({ active: true, checkpointSlug: req.params.slug }).sort({ sortOrder: 1 }).lean(),
    EmergencyContact.find({ active: true }).sort({ sortOrder: 1 }).lean()
  ]);
  if (!checkpoint) return res.status(404).render("error", {
    title: "Location not found",
    message: "This QR location is unavailable. Please choose a location from the Explore menu."
  });
  const lang = req.query.lang === "hi" ? "hi" : "en";
  res.render("home/location", {
    title: `${checkpoint.name?.[lang] || checkpoint.slug} | Surajpur Virasat`,
    checkpoint, checkpoints, gallery, contacts, lang
  });
};
