const axios = require("axios");

async function testProviderLogin() {
  try {
    console.log("🧪 Testing Provider Login...\n");

    const loginData = {
      username: "fasttrack_TS000018",
      password: "5t38uw8ju8UXXB",
      userType: "provider",
      rememberMe: false,
    };

    console.log("Login credentials:");
    console.log("Username:", loginData.username);
    console.log("Password:", loginData.password);
    console.log("User Type:", loginData.userType);

    const response = await axios.post(
      "http://localhost:4000/main-login",
      loginData,
      {
        headers: {
          "Content-Type": "application/json",
        },
        validateStatus: () => true, // Accept any status code
      }
    );

    console.log("\n📊 Response Status:", response.status);
    console.log("📋 Response Data:", JSON.stringify(response.data, null, 2));

    if (response.data.success) {
      console.log("\n✅ PROVIDER LOGIN SUCCESSFUL!");
      console.log("🎯 Redirect URL:", response.data.data.redirectUrl);
      console.log("👤 Provider Details:");
      console.log("   - ID:", response.data.data.user.id);
      console.log("   - Name:", response.data.data.user.name);
      console.log("   - BPP ID:", response.data.data.user.bppId);
      console.log("   - Email:", response.data.data.user.email);
      console.log("   - Verified:", response.data.data.user.isVerified);
    } else {
      console.log("\n❌ PROVIDER LOGIN FAILED!");
      console.log("Error:", response.data.message);
    }
  } catch (error) {
    console.error("\n💥 Error testing provider login:", error.message);
    if (error.response) {
      console.log("Status:", error.response.status);
      console.log("Data:", error.response.data);
    }
  }
}

testProviderLogin();
