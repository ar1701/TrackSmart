const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Seller = require("./model/seller");

// Connect to MongoDB
mongoose.connect(
  process.env.DB_URL ||
    "mongodb+srv://ar898993:FDKNlFTJ3ePSWXtx@cluster0.wge4r7r.mongodb.net/TrackSmart?retryWrites=true&w=majority&appName=Cluster0"
);

async function createTestSeller() {
  try {
    // Check if test seller already exists
    const existingSeller = await Seller.findOne({
      email: "testdashboard@seller.com",
    });
    if (existingSeller) {
      console.log("Test seller already exists");
      console.log("Username:", existingSeller.username);
      console.log("Use password: testpass123");
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("testpass123", salt);

    // Create seller
    const seller = new Seller({
      name: "Dashboard Test Seller",
      email: "testdashboard@seller.com",
      phone: "+91-9999999998",
      businessName: "Dashboard Test Business",
      businessAddress: "123 Test Dashboard Street, Test City",
      username: "dashboardtestseller",
      password: hashedPassword,
      isVerified: true,
      verifiedAt: new Date(),
      status: "verified",
    });

    await seller.save();
    console.log("✅ Test seller created successfully!");
    console.log("Username: dashboardtestseller");
    console.log("Password: testpass123");
    console.log("Email: testdashboard@seller.com");
  } catch (error) {
    console.error("Error creating test seller:", error);
  } finally {
    mongoose.connection.close();
  }
}

createTestSeller();
