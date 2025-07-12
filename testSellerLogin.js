const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Seller = require("./model/seller");

async function testSellerLogin() {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/tracksmart");
    console.log("Connected to MongoDB");

    const username = "dashboardtestseller";
    const password = "testpass123";

    console.log("\n=== TESTING SELLER LOGIN LOGIC ===");
    console.log("Testing username:", username);
    console.log("Testing password:", password);

    // Step 1: Find seller (exact same query as in controller)
    console.log("\n1. Finding seller with login query...");
    const seller = await Seller.findOne({
      $or: [{ username: username }, { email: username.toLowerCase() }],
      isVerified: true,
      status: "verified",
    });

    if (!seller) {
      console.log("❌ Seller not found with login query");
      return;
    }

    console.log("✅ Seller found:", seller._id);
    console.log("   Username:", seller.username);
    console.log("   Email:", seller.email);
    console.log("   isVerified:", seller.isVerified);
    console.log("   status:", seller.status);

    // Step 2: Check password
    console.log("\n2. Checking password...");
    const isMatch = await bcrypt.compare(password, seller.password);
    console.log("Password match result:", isMatch);

    if (!isMatch) {
      console.log("❌ Password does not match");
      return;
    }

    console.log("✅ Password matches");

    // Step 3: Simulate session creation
    console.log("\n3. Session data would be:");
    const sessionData = {
      id: seller._id,
      type: "seller",
      sellerId: seller.sellerId,
      name: seller.name,
      email: seller.email,
    };
    console.log(JSON.stringify(sessionData, null, 2));

    console.log("\n✅ LOGIN SHOULD SUCCEED - Issue is elsewhere");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

testSellerLogin();
