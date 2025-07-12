const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Provider = require("./model/provider");

const MONGO_URL =
  "mongodb+srv://ar898993:FDKNlFTJ3ePSWXtx@cluster0.wge4r7r.mongodb.net/TrackSmart?retryWrites=true&w=majority&appName=Cluster0";

async function createProvidersForAtlas() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("✅ Connected to MongoDB Atlas");

    // Check if providers already exist
    const existingProviders = await Provider.find({});
    console.log(`Found ${existingProviders.length} existing providers`);

    if (existingProviders.length >= 4) {
      console.log("✅ Sufficient providers already exist");
      existingProviders.forEach((p, i) => {
        console.log(
          `${i + 1}. ${p.name} (${p.bppId}) - Verified: ${p.isVerified}`
        );
      });
      return;
    }

    // Create test providers with different pincode coverage
    const testProviders = [
      {
        name: "Express Metro Logistics",
        email: "express.metro@logistics.com",
        hasBaseUri: false,
        actions: ["pickup", "delivery", "tracking"],
        supportedPincodes: ["110001", "400001", "560001", "600001", "700001"], // Major cities
        weightLimits: { min: 0.1, max: 50 },
        dimensionalLimits: { l: 100, w: 100, h: 100 },
        isVerified: true,
        verifiedAt: new Date(),
        username: "express_metro",
        password: await bcrypt.hash("express123", 10),
        isPasswordGenerated: true,
      },
      {
        name: "All India Speed Courier",
        email: "allindiacourier@delivery.com",
        hasBaseUri: false,
        actions: ["pickup", "delivery", "tracking", "insurance"],
        supportedPincodes: [], // Supports all pincodes (empty array means no restrictions)
        weightLimits: { min: 0.1, max: 30 },
        dimensionalLimits: { l: 80, w: 80, h: 80 },
        isVerified: true,
        verifiedAt: new Date(),
        username: "allindiacourier",
        password: await bcrypt.hash("speed123", 10),
        isPasswordGenerated: true,
      },
      {
        name: "Regional Transport Services",
        email: "regional@transport.com",
        hasBaseUri: false,
        actions: ["pickup", "delivery"],
        supportedPincodes: ["110001", "110002", "110003", "110010", "110020"], // Delhi region only
        weightLimits: { min: 0.1, max: 25 },
        dimensionalLimits: { l: 60, w: 60, h: 60 },
        isVerified: true,
        verifiedAt: new Date(),
        username: "regional_transport",
        password: await bcrypt.hash("regional123", 10),
        isPasswordGenerated: true,
      },
      {
        name: "PAN India Economy Shipping",
        email: "panindiaeconomy@shipping.com",
        hasBaseUri: false,
        actions: ["pickup", "delivery", "tracking"],
        supportedPincodes: [], // Supports all pincodes
        weightLimits: { min: 0.1, max: 100 },
        dimensionalLimits: { l: 150, w: 150, h: 150 },
        isVerified: true,
        verifiedAt: new Date(),
        username: "panindia_economy",
        password: await bcrypt.hash("economy123", 10),
        isPasswordGenerated: true,
      },
      {
        name: "Mumbai Express Limited",
        email: "mumbaiexpress@delivery.com",
        hasBaseUri: false,
        actions: ["pickup", "delivery", "tracking"],
        supportedPincodes: [
          "400001",
          "400002",
          "400003",
          "400010",
          "400020",
          "400050",
        ], // Mumbai region only
        weightLimits: { min: 0.1, max: 40 },
        dimensionalLimits: { l: 90, w: 90, h: 90 },
        isVerified: true,
        verifiedAt: new Date(),
        username: "mumbai_express",
        password: await bcrypt.hash("mumbai123", 10),
        isPasswordGenerated: true,
      },
    ];

    console.log("\n🚀 Creating test providers...");

    for (const providerData of testProviders) {
      // Check if provider already exists
      const existing = await Provider.findOne({ email: providerData.email });
      if (existing) {
        console.log(`⏭️  Provider ${providerData.name} already exists`);
        continue;
      }

      const provider = new Provider(providerData);
      await provider.save();

      console.log(`✅ Created: ${provider.name}`);
      console.log(`   BPP ID: ${provider.bppId}`);
      console.log(`   Username: ${provider.username}`);
      console.log(
        `   Supported Pincodes: ${
          provider.supportedPincodes.length === 0
            ? "All India"
            : provider.supportedPincodes.join(", ")
        }`
      );
      console.log("");
    }

    console.log("🎉 Provider creation completed!");

    // Show final provider list
    const allProviders = await Provider.find({ isVerified: true });
    console.log(`\n📋 Total verified providers: ${allProviders.length}`);
    allProviders.forEach((p, i) => {
      console.log(
        `${i + 1}. ${p.name} - ${
          p.supportedPincodes.length === 0
            ? "All India"
            : p.supportedPincodes.length + " pincodes"
        }`
      );
    });
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from database");
  }
}

createProvidersForAtlas();
