const axios = require("axios");

async function testProviderDashboard() {
  try {
    console.log("🧪 Testing Provider Dashboard Access...\n");

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
    console.log("   Provider ID:", loginResponse.data.data.user.id);
    console.log("   BPP ID:", loginResponse.data.data.user.bppId);

    // Extract session cookie
    const cookies = loginResponse.headers["set-cookie"];
    const cookieHeader = cookies ? cookies.join("; ") : "";

    // Step 2: Access dashboard
    console.log("\n2️⃣ Accessing provider dashboard...");
    const dashboardResponse = await axios.get(
      "http://localhost:4000/dashboard",
      {
        headers: {
          Cookie: cookieHeader,
          "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
        },
        validateStatus: () => true,
      }
    );

    console.log("Dashboard Status:", dashboardResponse.status);

    if (dashboardResponse.status === 200) {
      console.log("✅ Dashboard accessible");

      // Check if the response contains shipment requests data
      const htmlContent = dashboardResponse.data;

      if (
        htmlContent.includes("Request ID") ||
        htmlContent.includes("shipment-request")
      ) {
        console.log("✅ Dashboard contains request elements");
      } else {
        console.log("❌ Dashboard does not contain request elements");
      }

      if (htmlContent.includes("pending")) {
        console.log("✅ Dashboard shows pending requests");
      } else {
        console.log("❌ Dashboard does not show pending status");
      }

      if (htmlContent.includes("FastTrack")) {
        console.log("✅ Dashboard shows provider name");
      } else {
        console.log("❌ Dashboard does not show provider name");
      }
    } else {
      console.log("❌ Dashboard not accessible");
      console.log("Response:", dashboardResponse.data);
    }

    // Step 3: Test dashboard data API if available
    console.log("\n3️⃣ Testing dashboard API...");
    try {
      const apiResponse = await axios.get(
        "http://localhost:4000/provider/dashboard-data",
        {
          headers: {
            Cookie: cookieHeader,
            "Content-Type": "application/json",
          },
          validateStatus: () => true,
        }
      );

      console.log("API Status:", apiResponse.status);
      if (apiResponse.status === 200 && apiResponse.data) {
        console.log("✅ Dashboard API accessible");
        console.log("API Data:", JSON.stringify(apiResponse.data, null, 2));
      } else {
        console.log("❌ Dashboard API not accessible");
      }
    } catch (apiError) {
      console.log("⚠️  Dashboard API test failed:", apiError.message);
    }
  } catch (error) {
    console.error("\n💥 Error testing provider dashboard:", error.message);
  }
}

testProviderDashboard();
