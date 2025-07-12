const axios = require("axios");

async function testProviderDashboardData() {
  try {
    console.log("🧪 Testing Provider Dashboard Data Access...\n");

    // First login to get session
    const loginResponse = await axios.post(
      "http://localhost:4000/main-login",
      {
        username: "fasttrack_TS000018",
        password: "5t38uw8ju8UXXB",
        userType: "provider",
        rememberMe: false,
      },
      {
        withCredentials: true,
      }
    );

    if (!loginResponse.data.success) {
      console.log("❌ Login failed:", loginResponse.data.message);
      return;
    }

    console.log("✅ Login successful");

    // Extract cookies for session
    const cookies = loginResponse.headers["set-cookie"];
    const cookieHeader = cookies ? cookies.join("; ") : "";

    // Now try to access dashboard
    const dashboardResponse = await axios.get(
      "http://localhost:4000/dashboard",
      {
        headers: {
          Cookie: cookieHeader,
        },
        validateStatus: () => true,
      }
    );

    console.log("📊 Dashboard Response Status:", dashboardResponse.status);
    console.log(
      "📋 Dashboard Response Type:",
      dashboardResponse.headers["content-type"]
    );

    if (dashboardResponse.status === 200) {
      const html = dashboardResponse.data;

      // Check for specific content
      const hasRequests =
        html.includes("shipment requests") ||
        html.includes("Shipment Requests");
      const hasPending = html.includes("pending") || html.includes("Pending");
      const hasTable =
        html.includes("<table") || html.includes("table-responsive");
      const hasStats =
        html.includes("Total Requests") || html.includes("totalRequests");

      console.log("\n🔍 Dashboard Content Analysis:");
      console.log("   Contains 'requests':", hasRequests);
      console.log("   Contains 'pending':", hasPending);
      console.log("   Contains table:", hasTable);
      console.log("   Contains stats:", hasStats);

      // Look for specific request data
      const containsSf = html.includes("sf");
      const containsV = html.includes(">v<") || html.includes('">v"');
      const contains233 = html.includes("233");
      const contains169 = html.includes("169");

      console.log("\n📦 Request Data Check:");
      console.log("   Contains 'sf' shipment:", containsSf);
      console.log("   Contains 'v' shipment:", containsV);
      console.log("   Contains cost ₹233:", contains233);
      console.log("   Contains cost ₹169:", contains169);

      // Check for error messages
      const hasNoRequests =
        html.includes("No shipment requests") || html.includes("no requests");
      console.log("   Shows 'no requests' message:", hasNoRequests);

      if (hasNoRequests) {
        console.log(
          "\n❌ ISSUE: Dashboard shows 'no requests' despite requests existing in database"
        );
      } else if (contains233 && contains169) {
        console.log("\n✅ SUCCESS: Dashboard contains request data");
      } else {
        console.log(
          "\n⚠️  PARTIAL: Dashboard loads but request data might not be visible"
        );
      }
    } else {
      console.log("❌ Dashboard access failed");
      console.log("Response:", dashboardResponse.data);
    }
  } catch (error) {
    console.error("💥 Error testing dashboard:", error.message);
  }
}

testProviderDashboardData();
