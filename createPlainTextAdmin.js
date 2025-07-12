const mongoose = require("mongoose");
require("dotenv").config();
const Admin = require("./model/admin");

async function createPlainTextAdmin() {
  try {
    const dbUrl = process.env.DB_URL || "mongodb://localhost:27017/tracksmart";
    await mongoose.connect(dbUrl);
    console.log("Connected to MongoDB");

    // Delete existing admin if any
    await Admin.deleteOne({ username: "admin" });
    console.log("Deleted existing admin account");

    // Create new admin with plain text password
    const adminData = {
      username: "admin",
      email: "admin@tracksmart.com",
      password: "asdf", // Plain text password
      name: "System Administrator",
      role: "super-admin",
      permissions: [
        "manage_users",
        "manage_providers",
        "manage_sellers",
        "view_reports",
        "system_settings",
        "user_management",
        "provider_verification",
        "analytics_access",
      ],
      isActive: true,
      department: "management",
      phone: "+1234567890",
    };

    const admin = new Admin(adminData);
    await admin.save();

    console.log("✅ Admin account created successfully!");
    console.log("- Username: admin");
    console.log("- Password: asdf (plain text)");
    console.log("- Admin ID:", admin.adminId);
    console.log("- Email:", admin.email);
    console.log("- Role:", admin.role);
    console.log("- Is Active:", admin.isActive);

    // Verify the password is stored as plain text
    console.log("\n🔍 Verification:");
    console.log("- Stored password:", admin.password);
    console.log("- Password length:", admin.password.length);
    console.log('- Password matches "asdf":', admin.password === "asdf");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:", error);
    process.exit(1);
  }
}

createPlainTextAdmin();
