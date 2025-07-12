// Test Provider Pincode Filtering
const mongoose = require("mongoose");
const Provider = require("./model/provider");
const providerQuoteService = require("./services/providerQuoteService");

async function testPincodeFiltering() {
  try {
    // Mock test without connecting to database
    console.log("🧪 Testing Provider Pincode Filtering Logic\n");

    // Mock providers with different pincode configurations
    const mockProviders = [
      {
        _id: "1",
        name: "Universal Express",
        bppId: "UE001",
        email: "universal@express.com",
        supportedPincodes: [], // Supports all pincodes
        isVerified: true,
        weightLimits: { min: 0.1, max: 50 },
        dimensionalLimits: { l: 100, w: 100, h: 100 },
      },
      {
        _id: "2",
        name: "Delhi-Mumbai Courier",
        bppId: "DMC001",
        email: "dm@courier.com",
        supportedPincodes: ["110001", "110002", "400001", "400002"], // Specific pincodes
        isVerified: true,
        weightLimits: { min: 0.1, max: 30 },
      },
      {
        _id: "3",
        name: "South India Logistics",
        bppId: "SIL001",
        email: "south@logistics.com",
        supportedPincodes: ["600001", "560001", "500001"], // Only South India
        isVerified: true,
        weightLimits: { min: 0.1, max: 25 },
      },
      {
        _id: "4",
        name: "Limited Weight Carrier",
        bppId: "LWC001",
        email: "limited@carrier.com",
        supportedPincodes: [], // All pincodes
        isVerified: true,
        weightLimits: { min: 0.1, max: 2 }, // Very low weight limit
      },
    ];

    // Test scenarios
    const testCases = [
      {
        name: "Delhi to Mumbai Route",
        sourcePincode: "110001",
        destinationPincode: "400001",
        weight: 5,
        dimensions: { length: 30, width: 20, height: 15 },
        expectedProviders: ["Universal Express", "Delhi-Mumbai Courier"],
      },
      {
        name: "Delhi to Bangalore Route",
        sourcePincode: "110001",
        destinationPincode: "560001",
        weight: 3,
        dimensions: { length: 25, width: 15, height: 10 },
        expectedProviders: ["Universal Express"], // DMC doesn't support Bangalore
      },
      {
        name: "Heavy Package (10kg)",
        sourcePincode: "110001",
        destinationPincode: "400001",
        weight: 10,
        dimensions: { length: 50, width: 40, height: 30 },
        expectedProviders: ["Universal Express", "Delhi-Mumbai Courier"], // LWC excluded due to weight
      },
      {
        name: "Light Package (1kg)",
        sourcePincode: "110001",
        destinationPincode: "400001",
        weight: 1,
        dimensions: { length: 20, width: 15, height: 10 },
        expectedProviders: [
          "Universal Express",
          "Delhi-Mumbai Courier",
          "Limited Weight Carrier",
        ],
      },
      {
        name: "Unsupported Route",
        sourcePincode: "110001",
        destinationPincode: "700001", // Kolkata
        weight: 2,
        dimensions: { length: 20, width: 15, height: 10 },
        expectedProviders: ["Universal Express"], // Only universal provider supports this route
      },
    ];

    // Mock the filtering logic locally
    function filterProviders(
      providers,
      sourcePincode,
      destinationPincode,
      weight,
      dimensions
    ) {
      return providers.filter((provider) => {
        // Pincode check
        if (
          provider.supportedPincodes &&
          provider.supportedPincodes.length > 0
        ) {
          const supportsSource =
            provider.supportedPincodes.includes(sourcePincode);
          const supportsDestination =
            provider.supportedPincodes.includes(destinationPincode);
          if (!supportsSource || !supportsDestination) {
            return false;
          }
        }

        // Weight check
        if (provider.weightLimits) {
          if (provider.weightLimits.min && weight < provider.weightLimits.min)
            return false;
          if (provider.weightLimits.max && weight > provider.weightLimits.max)
            return false;
        }

        // Dimension check
        if (provider.dimensionalLimits) {
          if (
            provider.dimensionalLimits.l &&
            dimensions.length > provider.dimensionalLimits.l
          )
            return false;
          if (
            provider.dimensionalLimits.w &&
            dimensions.width > provider.dimensionalLimits.w
          )
            return false;
          if (
            provider.dimensionalLimits.h &&
            dimensions.height > provider.dimensionalLimits.h
          )
            return false;
        }

        return true;
      });
    }

    // Run test cases
    testCases.forEach((testCase, index) => {
      console.log(`\n${index + 1}. ${testCase.name}`);
      console.log(
        `   Route: ${testCase.sourcePincode} → ${testCase.destinationPincode}`
      );
      console.log(
        `   Package: ${testCase.weight}kg, ${testCase.dimensions.length}×${testCase.dimensions.width}×${testCase.dimensions.height}cm`
      );

      const availableProviders = filterProviders(
        mockProviders,
        testCase.sourcePincode,
        testCase.destinationPincode,
        testCase.weight,
        testCase.dimensions
      );

      const providerNames = availableProviders.map((p) => p.name);

      console.log(
        `   Available Providers: ${providerNames.join(", ") || "None"}`
      );
      console.log(`   Expected: ${testCase.expectedProviders.join(", ")}`);

      const isCorrect =
        JSON.stringify(providerNames.sort()) ===
        JSON.stringify(testCase.expectedProviders.sort());
      console.log(`   ✅ Result: ${isCorrect ? "PASS" : "FAIL"}`);

      if (!isCorrect) {
        console.log(
          `   ❌ Expected: [${testCase.expectedProviders.join(", ")}]`
        );
        console.log(`   ❌ Got: [${providerNames.join(", ")}]`);
      }
    });

    console.log("\n🎯 Pincode filtering logic test completed!");
    console.log("\nProvider Pincode Support Summary:");
    mockProviders.forEach((provider) => {
      const pincodeSupport =
        provider.supportedPincodes.length === 0
          ? "All India"
          : provider.supportedPincodes.join(", ");
      console.log(`- ${provider.name}: ${pincodeSupport}`);
    });
  } catch (error) {
    console.error("Test error:", error);
  }
}

testPincodeFiltering();
