require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./utils/connectToDB");
const providerQuoteService = require("./services/providerQuoteService");

async function testProviderQuoteService() {
  try {
    await connectDB();
    console.log("Connected to database");

    // Test case 1: Delhi to Mumbai shipment
    console.log("\n=== Test Case 1: Delhi to Mumbai ===");
    const testShipment1 = {
      _id: "test1",
      sourcePincode: "110001",
      destinationPincode: "400001",
      weight: 2.5,
      dimensions: { length: 30, width: 20, height: 15 },
    };

    console.log("Shipment details:", testShipment1);
    const providers1 = await providerQuoteService.findAvailableProviders(
      testShipment1.sourcePincode,
      testShipment1.destinationPincode,
      testShipment1.weight,
      testShipment1.dimensions
    );
    console.log(`Found ${providers1.length} available providers:`);
    providers1.forEach((p) => {
      console.log(`- ${p.name} (${p.bppId})`);
    });

    // Test case 2: Delhi to Delhi (local)
    console.log("\n=== Test Case 2: Delhi to Delhi (Local) ===");
    const testShipment2 = {
      _id: "test2",
      sourcePincode: "110001",
      destinationPincode: "110002",
      weight: 1.0,
      dimensions: { length: 20, width: 15, height: 10 },
    };

    console.log("Shipment details:", testShipment2);
    const providers2 = await providerQuoteService.findAvailableProviders(
      testShipment2.sourcePincode,
      testShipment2.destinationPincode,
      testShipment2.weight,
      testShipment2.dimensions
    );
    console.log(`Found ${providers2.length} available providers:`);
    providers2.forEach((p) => {
      console.log(`- ${p.name} (${p.bppId})`);
    });

    // Test case 3: Large shipment that exceeds some provider limits
    console.log("\n=== Test Case 3: Large Shipment ===");
    const testShipment3 = {
      _id: "test3",
      sourcePincode: "110001",
      destinationPincode: "400001",
      weight: 50,
      dimensions: { length: 120, width: 100, height: 80 },
    };

    console.log("Shipment details:", testShipment3);
    const providers3 = await providerQuoteService.findAvailableProviders(
      testShipment3.sourcePincode,
      testShipment3.destinationPincode,
      testShipment3.weight,
      testShipment3.dimensions
    );
    console.log(`Found ${providers3.length} available providers:`);
    providers3.forEach((p) => {
      console.log(`- ${p.name} (${p.bppId})`);
    });

    // Test case 4: Unsupported route
    console.log("\n=== Test Case 4: Unsupported Route ===");
    const testShipment4 = {
      _id: "test4",
      sourcePincode: "700001", // Kolkata (not supported by any provider)
      destinationPincode: "400001",
      weight: 2.0,
      dimensions: { length: 30, width: 20, height: 15 },
    };

    console.log("Shipment details:", testShipment4);
    const providers4 = await providerQuoteService.findAvailableProviders(
      testShipment4.sourcePincode,
      testShipment4.destinationPincode,
      testShipment4.weight,
      testShipment4.dimensions
    );
    console.log(`Found ${providers4.length} available providers:`);
    providers4.forEach((p) => {
      console.log(`- ${p.name} (${p.bppId})`);
    });

    console.log("\n=== Provider Quote Service Test Complete ===");
    process.exit(0);
  } catch (error) {
    console.error("Error testing provider quote service:", error);
    process.exit(1);
  }
}

testProviderQuoteService();
