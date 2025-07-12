// Test script to check accept/reject button functionality
const axios = require("axios");

async function testAcceptRejectButtons() {
  try {
    console.log("🧪 Testing Accept/Reject Button Functionality...\n");

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

    // Step 2: Get provider requests
    console.log("\n2️⃣ Fetching provider requests...");
    const requestsResponse = await axios.get(
      "http://localhost:4000/api/providers/requests",
      {
        headers: {
          Cookie: cookieHeader,
          "Content-Type": "application/json",
        },
        validateStatus: () => true,
      }
    );

    console.log("Response status:", requestsResponse.status);
    
    if (requestsResponse.status !== 200) {
      console.log("❌ Failed to fetch requests:", requestsResponse.data);
      return;
    }

    const requests = requestsResponse.data.requests || [];
    console.log(`✅ Found ${requests.length} requests`);

    if (requests.length === 0) {
      console.log("\n⚠️  No requests found. Creating a test request...");
      // We'll need to create a test request first
      return;
    }

    // Step 3: Find a pending request to test
    const pendingRequests = requests.filter(r => r.status === 'pending');
    console.log(`Found ${pendingRequests.length} pending requests`);

    if (pendingRequests.length === 0) {
      console.log("⚠️  No pending requests to test accept/reject functionality");
      console.log("Available requests:");
      requests.forEach((req, index) => {
        console.log(`  ${index + 1}. ID: ${req.id || req._id}, Status: ${req.status}`);
      });
      return;
    }

    const testRequest = pendingRequests[0];
    const requestId = testRequest.id || testRequest._id;
    console.log(`\n3️⃣ Testing accept functionality with request: ${requestId}`);

    // Step 4: Test accept endpoint
    const acceptResponse = await axios.post(
      `http://localhost:4000/api/providers/requests/${requestId}/accept`,
      { 
        actualCost: 500,
        providerNotes: "Test acceptance",
        actualDeliveryTime: 2
      },
      {
        headers: {
          Cookie: cookieHeader,
          "Content-Type": "application/json",
        },
        validateStatus: () => true,
      }
    );

    console.log("Accept response status:", acceptResponse.status);
    console.log("Accept response data:", acceptResponse.data);

    if (acceptResponse.status === 200 && acceptResponse.data.success) {
      console.log("✅ Accept functionality is working!");
    } else {
      console.log("❌ Accept functionality failed:");
      console.log("   Status:", acceptResponse.status);
      console.log("   Message:", acceptResponse.data.message);
      console.log("   Full response:", acceptResponse.data);
    }

    // Step 5: Test with another pending request for reject (if available)
    if (pendingRequests.length > 1) {
      const rejectTestRequest = pendingRequests[1];
      const rejectRequestId = rejectTestRequest.id || rejectTestRequest._id;
      
      console.log(`\n4️⃣ Testing reject functionality with request: ${rejectRequestId}`);
      
      const rejectResponse = await axios.post(
        `http://localhost:4000/api/providers/requests/${rejectRequestId}/reject`,
        { 
          rejectionReason: "Test rejection - not available for this route"
        },
        {
          headers: {
            Cookie: cookieHeader,
            "Content-Type": "application/json",
          },
          validateStatus: () => true,
        }
      );

      console.log("Reject response status:", rejectResponse.status);
      console.log("Reject response data:", rejectResponse.data);

      if (rejectResponse.status === 200 && rejectResponse.data.success) {
        console.log("✅ Reject functionality is working!");
      } else {
        console.log("❌ Reject functionality failed:");
        console.log("   Status:", rejectResponse.status);
        console.log("   Message:", rejectResponse.data.message);
      }
    }

  } catch (error) {
    console.error("❌ Test failed:", error.message);
    if (error.response) {
      console.log("Error status:", error.response.status);
      console.log("Error data:", error.response.data);
    }
  }
}

// Run the test
testAcceptRejectButtons();
