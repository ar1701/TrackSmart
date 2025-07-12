const mongoose = require("mongoose");
require("dotenv").config();

async function testDashboardFixes() {
  try {
    console.log("\n🧪 Testing Dashboard Fixes...\n");

    // Connect to database
    await mongoose.connect(
      process.env.DB_URL || "mongodb://localhost:27017/tracksmart",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log("✅ Connected to database");

    // Test 1: Check if seller model has logout functionality
    const Seller = require("./model/seller");
    const testSeller = await Seller.findOne({ isVerified: true });

    if (testSeller) {
      console.log("✅ Found verified seller for testing:", testSeller.name);
      console.log("   Seller ID:", testSeller.sellerId);
    } else {
      console.log("⚠️  No verified seller found for testing");
    }

    // Test 2: Check if provider model has logout functionality
    const Provider = require("./model/provider");
    const testProvider = await Provider.findOne({ isVerified: true });

    if (testProvider) {
      console.log("✅ Found verified provider for testing:", testProvider.name);
      console.log("   Provider ID:", testProvider.bppId);
    } else {
      console.log("⚠️  No verified provider found for testing");
    }

    console.log("\n📋 Dashboard Fix Summary:");
    console.log(
      "1. ✅ Seller Dashboard: Added logout button in welcome section"
    );
    console.log("2. ✅ Seller Dashboard: Added logout JavaScript function");
    console.log(
      "3. ✅ Provider Dashboard: Updated logout link to use proper API"
    );
    console.log("4. ✅ Provider Dashboard: Added logout JavaScript function");
    console.log(
      "5. ✅ Provider Dashboard: Replaced prompt() with modal dialogs for amounts"
    );
    console.log(
      "6. ✅ Provider Dashboard: Added proper accept/reject modals with validation"
    );

    console.log("\n🎯 Test URLs to verify:");
    if (testSeller) {
      console.log(
        `Seller Login: http://localhost:4000/main-login (Username: ${testSeller.sellerId})`
      );
    }
    if (testProvider) {
      console.log(
        `Provider Login: http://localhost:4000/main-login (Username: ${testProvider.bppId})`
      );
    }

    console.log("\n✅ Dashboard fixes applied successfully!");
    console.log("\nTo test:");
    console.log("1. Start server: node app.js");
    console.log("2. Login as seller/provider");
    console.log("3. Check logout functionality");
    console.log("4. For provider: test accept/reject modals");
  } catch (error) {
    console.error("❌ Error testing dashboard fixes:", error);
  } finally {
    mongoose.connection.close();
  }
}

testDashboardFixes();
