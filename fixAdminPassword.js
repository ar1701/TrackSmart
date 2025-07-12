const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const Admin = require("./model/admin");

async function fixAdminPassword() {
  try {
    const dbUrl = process.env.DB_URL || "mongodb://localhost:27017/tracksmart";
    await mongoose.connect(dbUrl);
    console.log("Connected to MongoDB");

    // Find admin
    const admin = await Admin.findOne({ username: "admin" });
    if (!admin) {
      console.log("❌ No admin found with username: admin");
      process.exit(1);
    }

    console.log("📝 Current admin password hash:", admin.password);
    console.log("📏 Password hash length:", admin.password.length);

    // Hash the password properly
    const plainPassword = "asdf";
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    console.log("\n🔧 Updating password...");
    console.log("- Plain password:", plainPassword);
    console.log("- New hash length:", hashedPassword.length);

    // Update the admin password
    admin.password = hashedPassword;
    admin.isActive = true;
    admin.lastActivity = new Date();

    await admin.save();

    // Test the new password
    const testMatch = await bcrypt.compare(plainPassword, admin.password);
    console.log("\n✅ Password update complete!");
    console.log("- Password test:", testMatch ? "✅ WORKS" : "❌ FAILED");
    console.log("- You can now login with:");
    console.log("  Username: admin");
    console.log("  Password: asdf");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

fixAdminPassword();
