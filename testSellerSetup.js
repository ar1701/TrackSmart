const mongoose = require("mongoose");
require("dotenv").config();
const bcrypt = require("bcryptjs");
const Seller = require("./model/seller");

async function setupTestSeller() {
  try {
    // Connect to database
    await mongoose.connect(process.env.DB_URL);
    console.log("Connected to database");

    // Check existing sellers
    const existingSellers = await Seller.find({});
    console.log(`Found ${existingSellers.length} existing sellers`);

    // Check if test seller exists
    const testSeller = await Seller.findOne({ username: "testseller" });

    if (!testSeller) {
      console.log("Creating test seller...");

      const hashedPassword = await bcrypt.hash("password123", 10);

      const newSeller = new Seller({
        username: "testseller",
        name: "John Doe",
        email: "seller@test.com",
        password: hashedPassword,
        phone: "+91-9876543210",
        businessName: "Test Electronics Store",
        businessAddress: "123 Business Street, Mumbai, Maharashtra, 400001",
        businessType: "company",
        gstNumber: "TEST123456789",
        productCategories: ["Electronics", "Gadgets"],
        addresses: [
          {
            type: "pickup",
            address: "123 Business Street",
            city: "Mumbai",
            state: "Maharashtra",
            pincode: "400001",
            country: "India",
            isDefault: true,
          },
        ],
        isVerified: true,
        status: "verified",
      });

      await newSeller.save();
      console.log("✅ Test seller created successfully!");
      console.log("Username: testseller");
      console.log("Password: password123");
    } else {
      console.log("✅ Test seller already exists");
      console.log("Username: testseller");
      console.log("Password: password123");
      console.log("Status:", testSeller.status);
    }

    // List all sellers
    console.log("\n📋 All sellers in database:");
    const allSellers = await Seller.find({});
    allSellers.forEach((seller, index) => {
      console.log(
        `${index + 1}. ${seller.businessName} (${seller.username}) - ${
          seller.status
        }`
      );
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("Database connection closed");
  }
}

setupTestSeller();
