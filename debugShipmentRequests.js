require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./utils/connectToDB");
const { ShipmentRequest, ProviderQuote } = require("./model/providerQuote");
const Provider = require("./model/provider");
const Seller = require("./model/seller");
const Shipment = require("./model/shipment");

async function debugShipmentRequests() {
  try {
    await connectDB();
    console.log("✅ Connected to database\n");

    // Get all shipment requests
    console.log("🔍 Checking all shipment requests...");
    const allRequests = await ShipmentRequest.find({})
      .populate("providerId", "name bppId")
      .populate("sellerId", "name email")
      .populate("shipmentId", "parcelName status")
      .sort({ createdAt: -1 });

    console.log(`Found ${allRequests.length} total shipment requests\n`);

    if (allRequests.length > 0) {
      console.log("📋 All Shipment Requests:");
      allRequests.forEach((request, index) => {
        console.log(`${index + 1}. Request ID: ${request._id}`);
        console.log(
          `   Provider: ${request.providerId?.name} (${request.providerId?.bppId})`
        );
        console.log(`   Seller: ${request.sellerId?.name}`);
        console.log(`   Shipment: ${request.shipmentId?.parcelName}`);
        console.log(`   Status: ${request.status}`);
        console.log(`   Cost: ₹${request.requestedCost}`);
        console.log(`   Created: ${request.createdAt}`);
        console.log("");
      });
    } else {
      console.log("❌ No shipment requests found in database");
    }

    // Check specific provider (FastTrack - TS000018)
    console.log("🎯 Checking requests for FastTrack provider (TS000018)...");
    const fastTrackProvider = await Provider.findOne({ bppId: "TS000018" });

    if (fastTrackProvider) {
      console.log(
        `Provider found: ${fastTrackProvider.name} (ID: ${fastTrackProvider._id})`
      );

      const fastTrackRequests = await ShipmentRequest.find({
        providerId: fastTrackProvider._id,
      })
        .populate("sellerId", "name email")
        .populate("shipmentId", "parcelName status");

      console.log(`FastTrack has ${fastTrackRequests.length} requests`);

      if (fastTrackRequests.length > 0) {
        fastTrackRequests.forEach((request, index) => {
          console.log(
            `   ${index + 1}. ${request.shipmentId?.parcelName} - ${
              request.status
            }`
          );
        });
      }
    } else {
      console.log("❌ FastTrack provider not found");
    }

    // Check if there are quotes available
    const quotes = await ProviderQuote.find({})
      .populate("providerId", "name bppId")
      .sort({ createdAt: -1 });

    console.log(`\n📊 Found ${quotes.length} provider quotes in database`);

    if (quotes.length > 0) {
      console.log("Recent quotes:");
      quotes.slice(0, 5).forEach((quote, index) => {
        console.log(
          `   ${index + 1}. ${quote.providerId?.name} - ₹${
            quote.estimatedCost
          } - ${quote.status}`
        );
      });
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error debugging shipment requests:", error);
    process.exit(1);
  }
}

debugShipmentRequests();
