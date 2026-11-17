require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Sanctuary = require("../models/Sanctuary");
const Gallery = require("../models/Gallery");
const Checkpoint = require("../models/Checkpoint");
const { sanctuary, gallery, checkpoints } = require("../utils/seedData");

async function enrichContent() {
  try {
    await connectDB();

    // Update only the curated fields for the known QR locations. QR slugs never change.
    for (const row of checkpoints) {
      const { slug, ...fields } = row;
      await Checkpoint.findOneAndUpdate(
        { slug },
        { $set: fields, $setOnInsert: { slug } },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
      );
    }

    // Upsert by image URL so this command can safely be re-run without duplicating these 20 starter photographs.
    for (const photo of gallery) {
      await Gallery.findOneAndUpdate(
        { image: photo.image, checkpointSlug: photo.checkpointSlug },
        { $set: photo },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
      );
    }

    // Refresh the main sanctuary facts without replacing unrelated administrator-managed fields.
    const sanctuaryUpdate = {
      tagline: sanctuary.tagline,
      area: sanctuary.area,
      established: sanctuary.established,
      about: sanctuary.about,
      geography: sanctuary.geography,
      tigerReserve: sanctuary.tigerReserve,
      ramkola: sanctuary.ramkola,
      distances: sanctuary.distances,
      speechText: sanctuary.speechText,
      factsVerified: false
    };
    await Sanctuary.findOneAndUpdate(
      { slug: "main" },
      { $set: sanctuaryUpdate, $setOnInsert: { slug: "main", name: sanctuary.name, district: sanctuary.district } },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    const [checkpointCount, photoCount] = await Promise.all([
      Checkpoint.countDocuments({ slug: { $in: checkpoints.map(item => item.slug) } }),
      Gallery.countDocuments({ active: true })
    ]);
    console.log(`Surajpur Virasat enrichment complete: ${checkpointCount} QR locations updated; ${gallery.length} gallery records upserted; ${photoCount} active gallery photos now in database.`);
    console.log("Note: the Gallery entries include official district-site images where available and clearly labelled illustrative reference images elsewhere. Obtain reuse permission for government-site images and replace illustrative references with authorised, location-authentic photos before public launch.");
  } catch (error) {
    console.error("Content enrichment failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

enrichContent();
