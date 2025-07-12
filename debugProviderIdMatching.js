// Test script to debug provider ID matching issue
const axios = require("axios");

async function debugProviderIdMatching() {
  try {
    console.log("🔍 Debugging Provider ID Matching...\n");

    // Step 1: Login as provider
    const loginData = {
      username: "fasttrack_TS000018",
      password: "5t38uw8ju8UXXB",
      userType: "provider",
      rememberMe: false,
    };

    console.log("1️⃣ Logging in as provider...");
    const loginResponse = await axios.post(
      "http://localhost:4000/main-login",
      loginData,
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
        validateStatus: () => true,
      }
    );

    if (!loginResponse.data.success) {
      console.log("❌ Login failed:", loginResponse.data.message);
      return;
    }

    console.log("✅ Login successful!");
    console.log("Session user data:", loginResponse.data.data.user);

    // Extract session cookie
    const cookies = loginResponse.headers["set-cookie"];
    const cookieHeader = cookies ? cookies.join("; ") : "";

    // Step 2: Check what provider ID is being used
    console.log(
      "\n2️⃣ Checking what provider ID would be used in getProviderRequests..."
    );
    console.log("Session user ID:", loginResponse.data.data.user.id);
    console.log(
      "Session user providerId:",
      loginResponse.data.data.user.providerId
    );
    console.log("Session user type:", loginResponse.data.data.user.type);

    // Step 3: Check the actual provider in database
    console.log("\n3️⃣ Checking provider in database...");
    const Provider = require("./model/provider");
    const { ShipmentRequest } = require("./model/providerQuote");
    const connectDB = require("./utils/connectToDB");

    await connectDB();

    const provider = await Provider.findOne({ bppId: "TS000018" });
    if (provider) {
      console.log("Provider in DB:");
      console.log("  _id:", provider._id.toString());
      console.log("  name:", provider.name);
      console.log("  bppId:", provider.bppId);

      // Check if session ID matches DB ID
      const sessionProviderId = loginResponse.data.data.user.id;
      const dbProviderId = provider._id.toString();

      console.log("\n4️⃣ ID Comparison:");
      console.log("Session ID:", sessionProviderId);
      console.log("Database ID:", dbProviderId);
      console.log("IDs match:", sessionProviderId === dbProviderId);

      // Check shipment requests using both IDs
      console.log("\n5️⃣ Checking shipment requests:");
      const requestsWithSessionId = await ShipmentRequest.find({
        providerId: sessionProviderId,
      });
      const requestsWithDbId = await ShipmentRequest.find({
        providerId: dbProviderId,
      });

      console.log(
        `Requests with session ID (${sessionProviderId}):`,
        requestsWithSessionId.length
      );
      console.log(
        `Requests with database ID (${dbProviderId}):`,
        requestsWithDbId.length
      );

      // Show all requests for this provider
      const allRequests = await ShipmentRequest.find({
        providerId: provider._id,
      });
      console.log(`\n6️⃣ All requests for this provider:`, allRequests.length);
      allRequests.forEach((req, index) => {
        console.log(
          `  ${index + 1}. ID: ${req._id}, Status: ${req.status}, Cost: ₹${
            req.requestedCost
          }`
        );
      });
    } else {
      console.log("❌ Provider not found in database");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.response) {
      console.log("Response status:", error.response.status);
      console.log("Response data:", error.response.data);
    }
    process.exit(1);
  }
}

// Run the debug
debugProviderIdMatching();
