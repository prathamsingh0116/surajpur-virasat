require("dotenv").config();

// This script is run locally on the Windows PC only. The public DNS override
// addresses the SRV resolver issue identified on the developer's network.
if (process.platform === "win32" && process.env.USE_PUBLIC_DNS !== "false") {
  require("node:dns").setServers(["8.8.8.8", "8.8.4.4"]);
}

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function main() {
  const name = String(process.env.BOOTSTRAP_ADMIN_NAME || "").trim();
  const email = String(process.env.BOOTSTRAP_ADMIN_EMAIL || "").trim().toLowerCase();
  const password = String(process.env.BOOTSTRAP_ADMIN_PASSWORD || "");
  const uri = String(process.env.MONGO_URI || "").trim();

  if (!uri.startsWith("mongodb+srv://")) {
    throw new Error("For safety, first-admin creation requires an Atlas mongodb+srv:// URI in .env. Local MongoDB is not accepted.");
  }
  if (!name) throw new Error("BOOTSTRAP_ADMIN_NAME is required.");
  if (!validEmail(email)) throw new Error("BOOTSTRAP_ADMIN_EMAIL must be a valid email address.");
  if (password.length < 12) throw new Error("Choose a password with at least 12 characters.");

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 });
  console.log(`Connected to MongoDB database: ${mongoose.connection.name}`);

  if (mongoose.connection.name !== "tamor_pingla") {
    throw new Error(`Connected to '${mongoose.connection.name}'. Expected 'tamor_pingla'; no account was created.`);
  }

  const count = await Admin.countDocuments();
  if (count > 0) {
    throw new Error(`Found ${count} existing admin account(s). No account was created or changed.`);
  }

  const admin = await Admin.create({
    name,
    email,
    password: await bcrypt.hash(password, 12)
  });

  console.log("First administrator created successfully.");
  console.log(`Admin email: ${admin.email}`);
  console.log("Password stored as a bcrypt hash; it was not printed.");
  console.log("No existing location, gallery or other content records were changed.");
}

main()
  .catch((error) => {
    console.error("Admin creation failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect().catch(() => {});
    }
  });
