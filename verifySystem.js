require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./utils/connectToDB");
const Provider = require("./model/provider");
const Seller = require("./model/seller");
const { ProviderQuote, ShipmentRequest } = require("./model/providerQuote");

async function verifySystemSetup() {
  try {
    await connectDB();
    console.log("✅ Database connection successful\n");

    // Check providers
    const providers = await Provider.find({});
    console.log(`📦 Found ${providers.length} providers in database:`);

    const verifiedProviders = providers.filter((p) => p.isVerified);
    const rejectedProviders = providers.filter((p) => p.rejectedAt);

    console.log(`   - ✅ Verified: ${verifiedProviders.length}`);
    console.log(`   - ❌ Rejected: ${rejectedProviders.length}`);
    console.log(
      `   - ⏳ Pending: ${
        providers.length - verifiedProviders.length - rejectedProviders.length
      }\n`
    );

    // List verified providers with their coverage
    console.log("🚚 Verified Providers & Coverage:");
    verifiedProviders.forEach((provider) => {
      console.log(`   - ${provider.name} (${provider.bppId})`);
      console.log(
        `     Pincodes: ${provider.supportedPincodes.slice(0, 5).join(", ")}${
          provider.supportedPincodes.length > 5 ? "..." : ""
        }`
      );
      console.log(
        `     Weight: ${provider.weightLimits.min}-${provider.weightLimits.max}kg`
      );
    });

    // Check sellers
    const sellers = await Seller.find({});
    console.log(`\n👤 Found ${sellers.length} sellers in database:`);

    const testSeller = sellers.find(
      (s) => s.username === "dashboardtestseller"
    );
    if (testSeller) {
      console.log(`   ✅ Test seller found: ${testSeller.username}`);
      console.log(`      Email: ${testSeller.email}`);
      console.log(`      Status: ${testSeller.status || "active"}`);
    } else {
      console.log(`   ❌ Test seller not found`);
    }

    // Test provider filtering logic
    console.log("\n🔍 Testing Provider Filtering Logic:");

    const testCases = [
      {
        name: "Delhi to Mumbai",
        source: "110001",
        dest: "400001",
        weight: 2.5,
        dimensions: { length: 30, width: 20, height: 15 },
      },
      {
        name: "Large shipment",
        source: "110001",
        dest: "400001",
        weight: 60,
        dimensions: { length: 150, width: 150, height: 150 },
      },
      {
        name: "Unsupported route",
        source: "700001", // Kolkata
        dest: "400001",
        weight: 2.0,
        dimensions: { length: 30, width: 20, height: 15 },
      },
    ];

    for (const testCase of testCases) {
      console.log(`\n   Test: ${testCase.name}`);
      console.log(`   Route: ${testCase.source} → ${testCase.dest}`);
      console.log(
        `   Weight: ${testCase.weight}kg, Dimensions: ${testCase.dimensions.length}x${testCase.dimensions.width}x${testCase.dimensions.height}cm`
      );

      // Find matching providers
      const matchingProviders = providers.filter((provider) => {
        if (!provider.isVerified) return false;

        const supportsSource = provider.supportedPincodes.includes(
          testCase.source
        );
        const supportsDest = provider.supportedPincodes.includes(testCase.dest);
        const withinWeightLimit =
          testCase.weight >= provider.weightLimits.min &&
          testCase.weight <= provider.weightLimits.max;
        const withinDimensions =
          testCase.dimensions.length <= provider.dimensionalLimits.l &&
          testCase.dimensions.width <= provider.dimensionalLimits.w &&
          testCase.dimensions.height <= provider.dimensionalLimits.h;

        return (
          supportsSource &&
          supportsDest &&
          withinWeightLimit &&
          withinDimensions
        );
      });

      console.log(`   ✅ Available providers: ${matchingProviders.length}`);
      matchingProviders.forEach((p) => {
        console.log(`      - ${p.name} (${p.bppId})`);
      });
    }

    // Check existing quotes and requests
    const quotes = await ProviderQuote.find({});
    const requests = await ShipmentRequest.find({});

    console.log(`\n📊 System Data:`);
    console.log(`   - Provider Quotes: ${quotes.length}`);
    console.log(`   - Shipment Requests: ${requests.length}`);

    console.log(`\n🎯 System Status: READY FOR TESTING!`);
    console.log(`\n📝 Next Steps:`);
    console.log(`   1. Open: http://localhost:4000/main-login`);
    console.log(`   2. Login as seller: dashboardtestseller / testpass123`);
    console.log(`   3. Create a new shipment (Delhi 110001 → Mumbai 400001)`);
    console.log(
      `   4. Verify quote comparison page loads with multiple providers`
    );
    console.log(`   5. Select a provider and confirm the request is created`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error verifying system setup:", error);
    process.exit(1);
  }
}

verifySystemSetup();
