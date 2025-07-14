const axios = require("axios");

async function testProviderDashboardIssues() {
  try {
    console.log("🧪 Testing Provider Dashboard Issues...\n");
    console.log("Testing issues:");
    console.log("1. Logout button functionality");
    console.log("2. Accept/Reject button functionality\n");

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

    // Extract session cookie
    const cookies = loginResponse.headers["set-cookie"];
    const cookieHeader = cookies ? cookies.join("; ") : "";
    console.log(
      "   Session cookie:",
      cookieHeader ? "✅ Available" : "❌ Missing"
    );

    // Step 2: Test logout endpoint
    console.log("\n2️⃣ Testing logout endpoint...");
    try {
      const logoutResponse = await axios.post(
        "http://localhost:4000/api/providers/logout",
        {},
        {
          headers: {
            Cookie: cookieHeader,
            "Content-Type": "application/json",
          },
          validateStatus: () => true,
        }
      );

      console.log("   Logout response status:", logoutResponse.status);
      console.log("   Logout response data:", logoutResponse.data);

      if (logoutResponse.status === 200 && logoutResponse.data.success) {
        console.log("✅ Logout endpoint is working!");
      } else {
        console.log("❌ Logout endpoint failed:");
        console.log("   Status:", logoutResponse.status);
        console.log("   Message:", logoutResponse.data.message);
      }
    } catch (error) {
      console.log("❌ Logout endpoint test failed:", error.message);
    }

    // Step 3: Re-login for accept/reject testing (since we logged out)
    console.log("\n3️⃣ Re-logging in to test accept/reject...");
    const reLoginResponse = await axios.post(
      "http://localhost:4000/main-login",
      loginData,
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
        validateStatus: () => true,
      }
    );

    if (!reLoginResponse.data.success) {
      console.log("❌ Re-login failed:", reLoginResponse.data.message);
      return;
    }

    const newCookies = reLoginResponse.headers["set-cookie"];
    const newCookieHeader = newCookies ? newCookies.join("; ") : "";

    // Step 4: Test provider requests endpoint
    console.log("\n4️⃣ Testing provider requests endpoint...");
    try {
      const requestsResponse = await axios.get(
        "http://localhost:4000/api/providers/requests",
        {
          headers: {
            Cookie: newCookieHeader,
            "Content-Type": "application/json",
          },
          validateStatus: () => true,
        }
      );

      console.log("   Requests response status:", requestsResponse.status);

      if (requestsResponse.status === 200) {
        const requests =
          requestsResponse.data.requests ||
          requestsResponse.data.data?.requests ||
          [];
        console.log("✅ Requests endpoint is working!");
        console.log(`   Found ${requests.length} total requests`);

        const pendingRequests = requests.filter((r) => r.status === "pending");
        console.log(`   Found ${pendingRequests.length} pending requests`);

        if (pendingRequests.length > 0) {
          const testRequestId = pendingRequests[0]._id || pendingRequests[0].id;
          console.log(`   Testing with request ID: ${testRequestId}`);

          // Step 5: Test accept endpoint
          console.log("\n5️⃣ Testing accept endpoint...");
          const acceptResponse = await axios.post(
            `http://localhost:4000/api/providers/requests/${testRequestId}/accept`,
            { actualCost: 500 },
            {
              headers: {
                Cookie: newCookieHeader,
                "Content-Type": "application/json",
              },
              validateStatus: () => true,
            }
          );

          console.log("   Accept response status:", acceptResponse.status);
          console.log("   Accept response data:", acceptResponse.data);

          if (acceptResponse.status === 200 && acceptResponse.data.success) {
            console.log("✅ Accept endpoint is working!");
          } else {
            console.log("❌ Accept endpoint failed:");
            console.log("   Status:", acceptResponse.status);
            console.log("   Message:", acceptResponse.data.message);
          }
        } else {
          console.log(
            "⚠️  No pending requests available to test accept/reject"
          );
          console.log("   To test accept/reject buttons:");
          console.log("   1. Create a seller account");
          console.log("   2. Create a shipment request");
          console.log("   3. Then test the buttons");
        }
      } else {
        console.log("❌ Requests endpoint failed:");
        console.log("   Status:", requestsResponse.status);
        console.log("   Data:", requestsResponse.data);
      }
    } catch (error) {
      console.log("❌ Requests endpoint test failed:", error.message);
    }

    // Step 6: Test dashboard page JavaScript
    console.log("\n6️⃣ Testing dashboard page for JavaScript issues...");
    try {
      const dashboardResponse = await axios.get(
        "http://localhost:4000/dashboard",
        {
          headers: {
            Cookie: newCookieHeader,
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
          },
          validateStatus: () => true,
        }
      );

      if (dashboardResponse.status === 200) {
        const htmlContent = dashboardResponse.data;

        // Check for JavaScript functions
        const hasHandleRequest = htmlContent.includes("function handleRequest");
        const hasLogoutProvider = htmlContent.includes(
          "function logoutProvider"
        );
        const hasBootstrapJS = htmlContent.includes("bootstrap.bundle.min.js");
        const hasAcceptModal = htmlContent.includes('id="acceptModal"');
        const hasRejectModal = htmlContent.includes('id="rejectModal"');

        console.log("✅ Dashboard page loads successfully!");
        console.log("   JavaScript functions check:");
        console.log(
          `   - handleRequest function: ${hasHandleRequest ? "✅" : "❌"}`
        );
        console.log(
          `   - logoutProvider function: ${hasLogoutProvider ? "✅" : "❌"}`
        );
        console.log(`   - Bootstrap JS: ${hasBootstrapJS ? "✅" : "❌"}`);
        console.log(`   - Accept modal: ${hasAcceptModal ? "✅" : "❌"}`);
        console.log(`   - Reject modal: ${hasRejectModal ? "✅" : "❌"}`);

        if (!hasHandleRequest) {
          console.log(
            "❌ handleRequest function missing - accept/reject buttons won't work"
          );
        }
        if (!hasLogoutProvider) {
          console.log(
            "❌ logoutProvider function missing - logout button won't work"
          );
        }
      } else {
        console.log(
          "❌ Dashboard page failed to load:",
          dashboardResponse.status
        );
      }
    } catch (error) {
      console.log("❌ Dashboard page test failed:", error.message);
    }

    console.log("\n🎉 Provider Dashboard Issues Test Completed!");
    console.log("\n📋 Summary:");
    console.log("If logout is not working:");
    console.log("  - Check browser console for JavaScript errors");
    console.log("  - Verify the session cookies are being sent");
    console.log("  - Check that the API endpoint returns success");
    console.log("\nIf accept/reject buttons are not working:");
    console.log("  - Check browser console for JavaScript errors");
    console.log("  - Verify handleRequest function exists");
    console.log("  - Check that Bootstrap modals are properly initialized");
    console.log("  - Verify API endpoints return success");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Run the test
testProviderDashboardIssues();
