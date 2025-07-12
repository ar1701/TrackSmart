require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./utils/connectToDB");
const providerQuoteService = require("./services/providerQuoteService");

async function testGetProviderRequests() {
  try {
    await connectDB();
    console.log("✅ Connected to database\n");

    const providerId = "68721ebf20ce88771187f3bd"; // FastTrack provider ID
    console.log(`🔍 Testing getProviderRequests for provider: ${providerId}\n`);

    const requests = await providerQuoteService.getProviderRequests(providerId);

    console.log(`📊 Function returned ${requests.length} requests`);

    if (requests.length > 0) {
      console.log("\n📋 Returned requests:");
      requests.forEach((request, index) => {
        console.log(`${index + 1}. ID: ${request._id}`);
        console.log(
          `   Shipment: ${request.shipmentId?.parcelName || "Unknown"}`
        );
        console.log(`   Seller: ${request.sellerId?.name || "Unknown"}`);
        console.log(`   Status: ${request.status}`);
        console.log(`   Cost: ₹${request.requestedCost}`);
        console.log(`   Created: ${request.createdAt}`);
        console.log("");
      });
    } else {
      console.log("❌ No requests returned by the function");

      // Let's manually check what's in the database
      const { ShipmentRequest } = require("./model/providerQuote");
      const manualRequests = await ShipmentRequest.find({ providerId });
      console.log(
        `\n🔍 Manual database query found ${manualRequests.length} requests`
      );

      if (manualRequests.length > 0) {
        console.log("📋 Manual query results:");
        manualRequests.forEach((request, index) => {
          console.log(`${index + 1}. ID: ${request._id}`);
          console.log(`   Provider ID: ${request.providerId}`);
          console.log(`   Status: ${request.status}`);
          console.log(`   Cost: ₹${request.requestedCost}`);
        });
      }
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error testing getProviderRequests:", error);
    console.error("Stack trace:", error.stack);
    process.exit(1);
  }
}

testGetProviderRequests();
