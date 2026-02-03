const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("../models/user");

(async () => {
  try {
    await mongoose.connect(process.env.DATABASE );

    const exists = await User.findOne({ role: "superadmin" });
    if (exists) {
      console.log("❌ Superadmin already exists");
      process.exit();
    }

    const hashed = await bcrypt.hash("neha@1234", 10);

    const admin = await User.create({
      name: "Neha Patel",
      email: "nehapatel46630@gmail.com",
      password: hashed,
      role: "superadmin"
    });

    console.log("✅ Superadmin created:", admin.email);
    process.exit();

  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
})();
