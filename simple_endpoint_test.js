// Simple endpoint testing for provider dashboard issues
console.log("🔧 Testing Provider Dashboard Endpoints...\n");

async function testEndpoints() {
  // Install node-fetch if needed
  let fetch;
  try {
    fetch = require("node-fetch");
  } catch (e) {
    console.log("Installing node-fetch...");
    require("child_process").execSync("npm install node-fetch@2", {
      stdio: "inherit",
    });
    fetch = require("node-fetch");
  }

  const tests = [
    { name: "Main Login Page", url: "http://localhost:4000/main-login" },
    { name: "Dashboard Page", url: "http://localhost:4000/dashboard" },
    {
      name: "Provider Logout API",
      url: "http://localhost:4000/api/providers/logout",
      method: "POST",
    },
    {
      name: "Accept Request API",
      url: "http://localhost:4000/api/providers/requests/test123/accept",
      method: "POST",
    },
    {
      name: "Reject Request API",
      url: "http://localhost:4000/api/providers/requests/test123/reject",
      method: "POST",
    },
  ];

  for (const test of tests) {
    try {
      const response = await fetch(test.url, {
        method: test.method || "GET",
        headers: { "Content-Type": "application/json" },
      });

      const status = response.status;
      let result = `${test.name}: ${status} ${response.statusText}`;

      // Add additional info for specific responses
      if (status === 401) {
        result += " (Authentication required - EXPECTED for protected routes)";
      } else if (status === 200) {
        result += " ✅ (Working)";
      } else if (status === 302) {
        result += " (Redirect - likely to login)";
      }

      console.log(result);

      // For API endpoints, also check the response content
      if (test.url.includes("/api/")) {
        try {
          const text = await response.text();
          const json = JSON.parse(text);
          if (json.message) {
            console.log(`   Response: ${json.message}`);
          }
        } catch (e) {
          // Not JSON, skip
        }
      }
    } catch (error) {
      console.log(`${test.name}: ❌ ERROR - ${error.message}`);
    }
  }

  console.log("\n📋 Manual Testing Instructions:");
  console.log("1. Open http://localhost:4000/main-login in browser");
  console.log("2. Look for provider/carrier login option");
  console.log("3. Login with provider credentials");
  console.log("4. Try to access dashboard and test buttons");
  console.log("5. Open browser console to see any JavaScript errors");
  console.log("6. Test logout button and accept/reject buttons");
}

testEndpoints().catch(console.error);
