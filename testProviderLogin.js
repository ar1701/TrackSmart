require("dotenv").config();
const axios = require("axios");

async function testProviderLogin() {
  try {
    console.log("🧪 Testing Provider Login Functionality\n");

    const baseURL = "http://localhost:4000";

    // Test provider credentials (using one of the verified providers)
    const testCredentials = {
      username: "allindia@courier.com", // All India Courier
      password: "allindia@courier.com",
      userType: "provider",
      rememberMe: false,
    };

    console.log("📝 Test Credentials:");
    console.log(`   Username: ${testCredentials.username}`);
    console.log(`   Password: ${testCredentials.password}`);
    console.log(`   User Type: ${testCredentials.userType}\n`);

    // Attempt login
    console.log("🔑 Attempting provider login...");

    const response = await axios.post(
      `${baseURL}/main-login`,
      testCredentials,
      {
        headers: {
          "Content-Type": "application/json",
        },
        validateStatus: function (status) {
          return status < 500; // Resolve only if status is less than 500
        },
      }
    );

    console.log(`📊 Response Status: ${response.status}`);
    console.log(`📦 Response Data:`, response.data);

    if (response.data.success) {
      console.log(`\n✅ LOGIN SUCCESSFUL!`);
      console.log(`   Provider: ${response.data.data.user.name}`);
      console.log(`   Provider ID: ${response.data.data.user.bppId}`);
      console.log(`   Email: ${response.data.data.user.email}`);
      console.log(`   Redirect URL: ${response.data.data.redirectUrl}`);
      console.log(`\n🎉 Provider login is working correctly!`);
    } else {
      console.log(`\n❌ LOGIN FAILED:`);
      console.log(`   Error: ${response.data.message}`);

      if (response.status === 501) {
        console.log(`   Status 501: Feature not implemented`);
      } else if (response.status === 401) {
        console.log(`   Status 401: Authentication failed`);
      }
    }

    // Test alternative login with Provider ID
    console.log(`\n🔄 Testing alternative login with Provider ID...`);

    const altCredentials = {
      username: "TS000016", // All India Courier BPP ID
      password: "allindia@courier.com",
      userType: "provider",
      rememberMe: false,
    };

    const altResponse = await axios.post(
      `${baseURL}/main-login`,
      altCredentials,
      {
        headers: {
          "Content-Type": "application/json",
        },
        validateStatus: function (status) {
          return status < 500;
        },
      }
    );

    console.log(`📊 Alt Response Status: ${altResponse.status}`);

    if (altResponse.data.success) {
      console.log(`✅ Alternative login also successful!`);
    } else {
      console.log(`❌ Alternative login failed: ${altResponse.data.message}`);
    }
  } catch (error) {
    console.error("❌ Test Error:", error.message);

    if (error.code === "ECONNREFUSED") {
      console.log(
        "🔗 Server is not running. Please start the server with: node app.js"
      );
    }
  }
}

testProviderLogin();
