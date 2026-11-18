const Sanctuary = require("../models/Sanctuary");
const Wildlife = require("../models/Wildlife");
const Flora = require("../models/Flora");
const Gallery = require("../models/Gallery");
const Checkpoint = require("../models/Checkpoint");
const EmergencyContact = require("../models/EmergencyContact");

async function getExplorerData(slug, isHome) {
  const [sanctuary, wildlife, flora, checkpoints, contacts, checkpoint, gallery] = await Promise.all([
    Sanctuary.findOne({ slug: "main" }).lean(),
    Wildlife.find({ active: true }).sort({ sortOrder: 1 }).lean(),
    Flora.find({ active: true }).sort({ sortOrder: 1 }).lean(),
    Checkpoint.find({ active: true }).sort({ sortOrder: 1 }).lean(),
    EmergencyContact.find({ active: true }).sort({ sortOrder: 1 }).lean(),
    isHome ? Promise.resolve(null) : Checkpoint.findOne({ slug }).lean(),
    Gallery.find({ active: true, checkpointSlug: isHome ? "main" : slug }).sort({ sortOrder: 1 }).lean()
  ]);
  return { sanctuary, wildlife, flora, checkpoints, contacts, checkpoint, gallery };
}

exports.index = async (req, res) => {
  const data = await getExplorerData(null, true);
  const lang = req.query.lang === "hi" ? "hi" : "en";
  res.render("home/explorer", {
    title: "Surajpur Virasat | Heritage & Nature Explorer",
    ...data,
    lang,
    isHome: true
  });
};

exports.location = async (req, res) => {
  const data = await getExplorerData(req.params.slug, false);
  if (!data.checkpoint) {
    return res.status(404).render("error", {
      title: "Location not found",
      message: "This QR location is unavailable. Please choose a location from the Explore menu."
    });
  }
  const lang = req.query.lang === "hi" ? "hi" : "en";
  res.render("home/explorer", {
    title: `${data.checkpoint.name?.[lang] || data.checkpoint.slug} | Surajpur Virasat`,
    ...data,
    lang,
    isHome: false
  });
};
