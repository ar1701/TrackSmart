require("dotenv").config();
const mongoose = require("mongoose");
const Provider = require("./model/provider");
const connectDB = require("./utils/connectToDB");

async function createTestProviders() {
  try {
    await connectDB();
    console.log("Connected to database");

    // Clear existing test providers
    await Provider.deleteMany({
      name: {
        $in: [
          "Test Logistics Co",
          "Fast Delivery Services",
          "Express Transport Ltd",
          "Reliable Carriers",
        ],
      },
    });

    // Create test providers with different statuses
    const testProviders = [
      {
        name: "Test Logistics Co",
        email: "test@logistics.com",
        hasBaseUri: true,
        baseUri: "https://api.testlogistics.com",
        actions: ["search", "confirm", "status", "cancel"],
        supportedPincodes: ["110001", "110002", "110003", "110004", "110005"],
        weightLimits: { min: 0.1, max: 50 },
        dimensionalLimits: { l: 100, w: 100, h: 100 },
        isVerified: false,
      },
      {
        name: "Fast Delivery Services",
        email: "info@fastdelivery.com",
        hasBaseUri: true,
        baseUri: "https://api.fastdelivery.com",
        actions: ["search", "confirm", "status"],
        supportedPincodes: ["400001", "400002", "400003", "400004"],
        weightLimits: { min: 0.5, max: 25 },
        dimensionalLimits: { l: 80, w: 80, h: 80 },
        isVerified: true,
        verifiedAt: new Date(),
      },
      {
        name: "Express Transport Ltd",
        email: "contact@express.com",
        hasBaseUri: false,
        actions: ["search", "confirm"],
        supportedPincodes: ["500001", "500002", "500003"],
        weightLimits: { min: 1, max: 100 },
        dimensionalLimits: { l: 150, w: 150, h: 150 },
        isVerified: false,
        rejectedAt: new Date(),
        rejectionReason: "Incomplete documentation provided",
      },
      {
        name: "Reliable Carriers",
        email: "support@reliable.com",
        hasBaseUri: true,
        baseUri: "https://api.reliable.com",
        actions: ["search", "confirm", "status", "cancel", "track"],
        supportedPincodes: [
          "600001",
          "600002",
          "600003",
          "600004",
          "600005",
          "600006",
        ],
        weightLimits: { min: 0.1, max: 75 },
        dimensionalLimits: { l: 120, w: 120, h: 120 },
        isVerified: false,
      },
    ];

    for (const providerData of testProviders) {
      const provider = new Provider(providerData);
      await provider.save();
      console.log(`Created provider: ${provider.name} (${provider.bppId})`);
    }

    console.log("Test providers created successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error creating test providers:", error);
    process.exit(1);
  }
}

createTestProviders();
