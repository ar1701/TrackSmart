const axios = require("axios");

async function testLogout() {
  try {
    console.log("🧪 Testing Provider Logout...\n");

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

    // Step 2: Test logout
    console.log("\n2️⃣ Testing logout...");
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

    console.log("Logout response status:", logoutResponse.status);
    console.log("Logout response data:", logoutResponse.data);

    if (logoutResponse.status === 200 && logoutResponse.data.success) {
      console.log("✅ Logout functionality is working!");
    } else {
      console.log("❌ Logout functionality failed:");
      console.log("   Status:", logoutResponse.status);
      console.log("   Message:", logoutResponse.data.message);
    }

  } catch (error) {
    console.error("❌ Test failed:", error.message);
    if (error.response) {
      console.log("Error status:", error.response.status);
      console.log("Error data:", error.response.data);
    }
  }
}

testLogout();
