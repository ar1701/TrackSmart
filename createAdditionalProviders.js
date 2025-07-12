require("dotenv").config();
const mongoose = require("mongoose");
const Provider = require("./model/provider");
const connectDB = require("./utils/connectToDB");

async function createAdditionalProviders() {
  try {
    await connectDB();
    console.log("Connected to database");

    // Create providers with overlapping pincode coverage
    const additionalProviders = [
      {
        name: "Delhi Express Logistics",
        email: "delhi@express.com",
        hasBaseUri: true,
        baseUri: "https://api.delhiexpress.com",
        actions: ["search", "confirm", "status", "cancel"],
        supportedPincodes: [
          "110001",
          "110002",
          "110003",
          "110004",
          "110005",
          "110006",
          "110007",
          "110008",
        ],
        weightLimits: { min: 0.1, max: 30 },
        dimensionalLimits: { l: 90, w: 90, h: 90 },
        isVerified: true,
        verifiedAt: new Date(),
      },
      {
        name: "Mumbai Quick Delivery",
        email: "mumbai@quick.com",
        hasBaseUri: true,
        baseUri: "https://api.mumbaiquick.com",
        actions: ["search", "confirm", "status", "track"],
        supportedPincodes: [
          "400001",
          "400002",
          "400003",
          "400004",
          "400005",
          "400006",
        ],
        weightLimits: { min: 0.2, max: 40 },
        dimensionalLimits: { l: 100, w: 100, h: 100 },
        isVerified: true,
        verifiedAt: new Date(),
      },
      {
        name: "All India Courier",
        email: "allIndia@courier.com",
        hasBaseUri: true,
        baseUri: "https://api.allindia.com",
        actions: ["search", "confirm", "status", "cancel", "track"],
        supportedPincodes: [
          "110001",
          "110002",
          "110003", // Delhi
          "400001",
          "400002",
          "400003", // Mumbai
          "500001",
          "500002",
          "500003", // Hyderabad
          "600001",
          "600002",
          "600003", // Chennai
          "560001",
          "560002",
          "560003", // Bangalore
        ],
        weightLimits: { min: 0.1, max: 100 },
        dimensionalLimits: { l: 200, w: 200, h: 200 },
        isVerified: true,
        verifiedAt: new Date(),
      },
      {
        name: "Economy Shipping Co",
        email: "economy@shipping.com",
        hasBaseUri: true,
        baseUri: "https://api.economy.com",
        actions: ["search", "confirm", "status"],
        supportedPincodes: [
          "110001",
          "110002",
          "400001",
          "400002",
          "500001",
          "600001",
        ],
        weightLimits: { min: 1, max: 20 },
        dimensionalLimits: { l: 60, w: 60, h: 60 },
        isVerified: true,
        verifiedAt: new Date(),
      },
    ];

    for (const providerData of additionalProviders) {
      // Check if provider already exists
      const existingProvider = await Provider.findOne({
        email: providerData.email,
      });
      if (existingProvider) {
        console.log(`Provider ${providerData.name} already exists`);
        continue;
      }

      const provider = new Provider(providerData);
      await provider.save();
      console.log(`Created provider: ${provider.name} (${provider.bppId})`);
    }

    console.log("Additional providers created successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error creating additional providers:", error);
    process.exit(1);
  }
}

createAdditionalProviders();
