const axios = require("axios");

async function testDashboardLoad() {
  try {
    console.log("🧪 Testing Provider Dashboard Load...\n");

    // Step 1: Login as provider
    console.log("1️⃣ Logging in as provider...");
    const loginResponse = await axios.post(
      "http://localhost:4000/main-login",
      {
        username: "fasttrack_TS000018",
        password: "5t38uw8ju8UXXB",
        userType: "provider",
        rememberMe: false,
      },
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
    const cookies = loginResponse.headers["set-cookie"];
    const cookieHeader = cookies ? cookies.join("; ") : "";

    // Step 2: Load dashboard page
    console.log("\n2️⃣ Loading dashboard page...");
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

    console.log("Dashboard status:", dashboardResponse.status);

    if (dashboardResponse.status === 200) {
      console.log("✅ Dashboard loads successfully!");

      // Check for key JavaScript functions in the HTML
      const html = dashboardResponse.data;
      const hasHandleRequest = html.includes("handleRequest");
      const hasLogoutProvider = html.includes("logoutProvider");
      const hasBootstrap = html.includes("bootstrap");
      const hasModals =
        html.includes("acceptModal") && html.includes("rejectModal");

      console.log("\n📋 Frontend Component Check:");
      console.log(
        "✅ handleRequest function:",
        hasHandleRequest ? "Present" : "❌ Missing"
      );
      console.log(
        "✅ logoutProvider function:",
        hasLogoutProvider ? "Present" : "❌ Missing"
      );
      console.log(
        "✅ Bootstrap JavaScript:",
        hasBootstrap ? "Present" : "❌ Missing"
      );
      console.log(
        "✅ Accept/Reject modals:",
        hasModals ? "Present" : "❌ Missing"
      );

      if (hasHandleRequest && hasLogoutProvider && hasBootstrap && hasModals) {
        console.log(
          "\n🎉 All components are present! The buttons should work."
        );
        console.log("\n📝 If buttons still don't work in browser:");
        console.log("1. Open browser DevTools (F12)");
        console.log("2. Check Console tab for JavaScript errors");
        console.log(
          "3. Try clicking a button and see if handleRequest() is called"
        );
        console.log("4. Check if Bootstrap modals open correctly");
      }
    } else {
      console.log("❌ Dashboard failed to load");
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testDashboardLoad();
