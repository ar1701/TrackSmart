require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./utils/connectToDB");
const providerQuoteService = require("./services/providerQuoteService");

async function testProviderRequests() {
  try {
    await connectDB();
    console.log("✅ Connected to database\n");

    const providerId = "68721ebf20ce88771187f3bd"; // FastTrack provider ID

    console.log(`🔍 Testing getProviderRequests for provider: ${providerId}`);

    // Test the exact function used in dashboard
    const requests = await providerQuoteService.getProviderRequests(providerId);

    console.log(`📊 getProviderRequests returned: ${requests.length} requests`);

    if (requests.length > 0) {
      console.log("\n📋 Request Details:");
      requests.forEach((request, index) => {
        console.log(`${index + 1}. Request ID: ${request._id}`);
        console.log(`   Shipment: ${request.shipmentId?.parcelName || "N/A"}`);
        console.log(`   Seller: ${request.sellerId?.name || "N/A"}`);
        console.log(`   Status: ${request.status}`);
        console.log(`   Cost: ₹${request.requestedCost}`);
        console.log(`   Provider ID: ${request.providerId}`);
        console.log("");
      });

      // Test filtering
      const pendingRequests = requests.filter(
        (req) => req.status === "pending"
      );
      console.log(`📌 Pending requests: ${pendingRequests.length}`);

      // Test stats calculation
      const acceptedRequests = requests.filter(
        (req) => req.status === "accepted"
      );
      const rejectedRequests = requests.filter(
        (req) => req.status === "rejected"
      );
      const totalRevenue = acceptedRequests.reduce((sum, req) => {
        return (
          sum + (req.providerResponse?.actualCost || req.requestedCost || 0)
        );
      }, 0);

      const stats = {
        totalRequests: requests.length,
        pendingRequests: pendingRequests.length,
        acceptedRequests: acceptedRequests.length,
        rejectedRequests: rejectedRequests.length,
        totalRevenue: totalRevenue,
      };

      console.log("📈 Stats that would be passed to dashboard:");
      console.log(JSON.stringify(stats, null, 2));
    } else {
      console.log("❌ No requests found!");

      // Debug: Check what's in the ShipmentRequest collection
      const { ShipmentRequest } = require("./model/providerQuote");
      const allRequests = await ShipmentRequest.find({});

      console.log(`\n🔍 Total requests in DB: ${allRequests.length}`);
      console.log("Debug: Checking provider IDs...");

      allRequests.forEach((request, index) => {
        console.log(`${index + 1}. Provider ID in DB: ${request.providerId}`);
        console.log(`   Type: ${typeof request.providerId}`);
        console.log(
          `   Matches test ID: ${request.providerId.toString() === providerId}`
        );
      });
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error testing provider requests:", error);
    process.exit(1);
  }
}

testProviderRequests();
