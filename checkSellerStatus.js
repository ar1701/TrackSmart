const mongoose = require("mongoose");
const Seller = require("./model/seller");
const bcrypt = require("bcryptjs");

async function checkSellerStatus() {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/tracksmart");
    console.log("Connected to MongoDB");

    // Check for our test seller with the actual username
    const testSeller = await Seller.findOne({
      username: "dashboardtestseller",
    });

    if (testSeller) {
      console.log("\n=== TEST SELLER FOUND ===");
      console.log("Username:", testSeller.username);
      console.log("Email:", testSeller.email);
      console.log("Name:", testSeller.name);
      console.log("Business Name:", testSeller.businessName);
      console.log("Is Verified:", testSeller.isVerified);
      console.log("Status:", testSeller.status);
      console.log("Password Hash exists:", !!testSeller.password);
      console.log("Created At:", testSeller.createdAt);

      // Test password verification
      const testPassword = "testpass123";
      const isPasswordValid = await bcrypt.compare(
        testPassword,
        testSeller.password
      );
      console.log("Password verification test:", isPasswordValid);

      // Test the exact query used in login
      const loginQuery = await Seller.findOne({
        $or: [
          { username: "dashboardtestseller" },
          { email: "dashboardtestseller".toLowerCase() },
        ],
        isVerified: true,
        status: "verified",
      });
      console.log("Login query result:", !!loginQuery);
      if (loginQuery) {
        console.log("Login query seller found with ID:", loginQuery._id);
      } else {
        console.log("❌ Login query failed - this is the issue!");

        // Check what the actual query should find
        const debugQuery1 = await Seller.findOne({
          username: "dashboardtestseller",
        });
        const debugQuery2 = await Seller.findOne({
          username: "dashboardtestseller",
          isVerified: true,
        });
        const debugQuery3 = await Seller.findOne({
          username: "dashboardtestseller",
          status: "verified",
        });
        const debugQuery4 = await Seller.findOne({
          username: "dashboardtestseller",
          isVerified: true,
          status: "verified",
        });

        console.log("Debug - username only:", !!debugQuery1);
        console.log("Debug - username + isVerified:", !!debugQuery2);
        console.log("Debug - username + status:", !!debugQuery3);
        console.log("Debug - username + both:", !!debugQuery4);

        if (debugQuery1) {
          console.log(
            "Actual seller isVerified:",
            debugQuery1.isVerified,
            "(type:",
            typeof debugQuery1.isVerified,
            ")"
          );
          console.log(
            "Actual seller status:",
            debugQuery1.status,
            "(type:",
            typeof debugQuery1.status,
            ")"
          );
        }
      }
    } else {
      console.log("\n=== TEST SELLER NOT FOUND ===");

      // Check all sellers
      const allSellers = await Seller.find({}).select(
        "username email name businessName isVerified status"
      );
      console.log(`\nFound ${allSellers.length} sellers in total:`);

      allSellers.forEach((seller, index) => {
        console.log(`\nSeller ${index + 1}:`);
        console.log("  Username:", seller.username);
        console.log("  Email:", seller.email);
        console.log("  Name:", seller.name);
        console.log("  Business Name:", seller.businessName);
        console.log("  Is Verified:", seller.isVerified);
        console.log("  Status:", seller.status);
      });
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

checkSellerStatus();
