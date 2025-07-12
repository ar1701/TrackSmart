const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Provider = require("./model/provider");

async function createQuickProviders() {
  try {
    // Connect using environment variable
    const DB_URL =
      process.env.DB_URL ||
      "mongodb+srv://ayushhh321:admin@cluster0.vmrn8.mongodb.net/tracksmart";
    await mongoose.connect(DB_URL);
    console.log("Connected to MongoDB");

    // Check existing providers
    const existingCount = await Provider.countDocuments({ isVerified: true });
    console.log(`Existing verified providers: ${existingCount}`);

    if (existingCount >= 3) {
      console.log("Sufficient providers already exist");
      process.exit(0);
    }

    // Create quick test providers
    const providers = [
      {
        name: "Express Logistics",
        email: "express@test.com",
        hasBaseUri: false,
        supportedPincodes: [], // Empty means supports all pincodes
        weightLimits: { min: 0.1, max: 50 },
        dimensionalLimits: { l: 100, w: 100, h: 100 },
        isVerified: true,
        verifiedAt: new Date(),
      },
      {
        name: "Speed Delivery",
        email: "speed@test.com",
        hasBaseUri: false,
        supportedPincodes: [], // Empty means supports all pincodes
        weightLimits: { min: 0.1, max: 30 },
        dimensionalLimits: { l: 80, w: 80, h: 80 },
        isVerified: true,
        verifiedAt: new Date(),
      },
      {
        name: "Economy Shipping",
        email: "economy@test.com",
        hasBaseUri: false,
        supportedPincodes: [], // Empty means supports all pincodes
        weightLimits: { min: 0.1, max: 100 },
        dimensionalLimits: { l: 150, w: 150, h: 150 },
        isVerified: true,
        verifiedAt: new Date(),
      },
    ];

    for (const providerData of providers) {
      // Check if provider already exists
      const exists = await Provider.findOne({ email: providerData.email });
      if (!exists) {
        const provider = new Provider(providerData);
        await provider.save();
        console.log(`✅ Created: ${provider.name} (${provider.bppId})`);
      } else {
        console.log(`⚠️  Already exists: ${providerData.name}`);
      }
    }

    console.log("🎉 Provider setup complete!");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createQuickProviders();
