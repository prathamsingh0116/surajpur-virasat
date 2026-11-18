require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");
const Sanctuary = require("../models/Sanctuary");
const Wildlife = require("../models/Wildlife");
const Flora = require("../models/Flora");
const Gallery = require("../models/Gallery");
const Checkpoint = require("../models/Checkpoint");
const EmergencyContact = require("../models/EmergencyContact");
const Admin = require("../models/Admin");
const data = require("../utils/seedData");

async function seed() {
  try {
    await connectDB();
    // Never overwrite an administrator-edited sanctuary profile when seeding again.
    if (!(await Sanctuary.exists({ slug: "main" }))) {
      await Sanctuary.create(data.sanctuary);
    }
    for (const [Model, rows] of [[Wildlife,data.wildlife],[Flora,data.flora],[Gallery,data.gallery],[Checkpoint,data.checkpoints],[EmergencyContact,data.contacts]]) {
      if (await Model.countDocuments() === 0) await Model.insertMany(rows);
    }
    if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
      const existingAdmin = await Admin.findOne({ email });
      if (!existingAdmin) {
        await Admin.create({
          name: process.env.ADMIN_NAME || "Forest Admin",
          email,
          password: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12)
        });
        console.log(`Admin created: ${email}`);
      }
    } else {
      console.log("Admin creation skipped. Use `npm run admin:create` to create the first administrator securely.");
    }
    console.log("Seed completed. Existing collections were preserved where they already contained data.");
    await mongoose.disconnect();
  } catch (err) {
    console.error("Seed failed:", err);
    await mongoose.disconnect().catch(()=>{});
    process.exit(1);
  }
}
seed();
