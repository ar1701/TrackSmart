#!/usr/bin/env node

/**
 * Comprehensive test for seller shipment workflow
 * Tests all the features implemented for the seller shipment system
 */

const axios = require("axios");

const BASE_URL = "http://localhost:4000";
const TEST_SELLER = {
  username: "testseller",
  password: "password123",
};

let sessionCookie = "";

// Helper function to make authenticated requests
const makeRequest = async (method, url, data = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        "Content-Type": "application/json",
        ...(sessionCookie && { Cookie: sessionCookie }),
      },
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);

    // Extract session cookie from response if it exists
    if (response.headers["set-cookie"]) {
      sessionCookie = response.headers["set-cookie"][0].split(";")[0];
    }

    return response.data;
  } catch (error) {
    console.error(
      `Error in ${method} ${url}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

// Test functions
const testSellerLogin = async () => {
  console.log("\n🔐 Testing Seller Login...");
  const result = await makeRequest("POST", "/api/sellers/login", TEST_SELLER);
  console.log("✅ Login successful:", result.message);
  return result;
};

const testSellerDashboard = async () => {
  console.log("\n📊 Testing Seller Dashboard...");
  const result = await makeRequest("GET", "/api/sellers/dashboard");
  console.log("✅ Dashboard data retrieved:", {
    sellerName: result.data.seller.name,
    businessName: result.data.seller.businessName,
    totalOrders: result.data.stats.totalOrders,
  });
  return result;
};

const testLocationLookup = async () => {
  console.log("\n🌍 Testing Location Lookup...");
  const testPincodes = ["110001", "400001", "560001"];

  for (const pincode of testPincodes) {
    const result = await makeRequest("GET", `/api/sellers/location/${pincode}`);
    console.log(`✅ Location for ${pincode}:`, {
      city: result.data.city,
      state: result.data.state,
      coordinates: `${result.data.latitude}, ${result.data.longitude}`,
    });
  }
};

const testDistanceCalculation = async () => {
  console.log("\n📏 Testing Distance Calculation...");
  const distanceData = {
    sourcePincode: "110001",
    destinationPincode: "400001",
  };

  const result = await makeRequest(
    "POST",
    "/api/sellers/calculate-distance",
    distanceData
  );
  console.log("✅ Distance calculated:", {
    distance: `${result.data.distance} km`,
    source: `${result.data.source.city}, ${result.data.source.state}`,
    destination: `${result.data.destination.city}, ${result.data.destination.state}`,
  });
  return result;
};

const testShipmentCreation = async () => {
  console.log("\n📦 Testing Shipment Creation...");
  const shipmentData = {
    parcelName: "Test Electronics Package",
    weight: 2.5,
    dimensions: {
      length: 30,
      width: 20,
      height: 15,
    },
    sender: {
      name: "John Doe",
      contact: "9876543210",
      email: "john@test.com",
      address: "123 Business Street, New Delhi",
      pincode: "110001",
    },
    receiver: {
      name: "Jane Smith",
      contact: "9876543211",
      email: "jane@test.com",
      address: "456 Corporate Road, Mumbai",
      pincode: "400001",
    },
    sourceLocation: {
      pincode: "110001",
      latitude: 28.6287133,
      longitude: 77.2186075,
      city: "New Delhi",
      state: "Delhi",
    },
    destinationLocation: {
      pincode: "400001",
      latitude: 19.0013184,
      longitude: 72.8571037,
      city: "Mumbai",
      state: "Maharashtra",
    },
    distance: 1158.5,
  };

  const result = await makeRequest(
    "POST",
    "/api/sellers/shipments",
    shipmentData
  );
  console.log("✅ Shipment created:", {
    shipmentId: result.data.shipment.shipmentId,
    id: result.data.shipment.id,
    status: result.data.shipment.status,
    distance: `${result.data.shipment.distance} km`,
  });
  return result;
};

const testShipmentRetrieval = async () => {
  console.log("\n📋 Testing Shipment Retrieval...");
  const result = await makeRequest("GET", "/api/sellers/shipments");
  console.log("✅ Shipments retrieved:", {
    count: result.data.count,
    shipments: result.data.shipments.map((s) => ({
      id: s.shipmentId,
      parcel: s.parcelName,
      status: s.status,
      distance: `${s.distance} km`,
    })),
  });
  return result;
};

const testShipmentDetails = async (shipmentId) => {
  console.log("\n🔍 Testing Shipment Details...");
  const result = await makeRequest(
    "GET",
    `/api/sellers/shipments/${shipmentId}`
  );
  console.log("✅ Shipment details retrieved:", {
    shipmentId: result.data.shipment.shipmentId,
    parcel: result.data.shipment.parcelName,
    weight: `${result.data.shipment.weight} kg`,
    sender: result.data.shipment.sender.name,
    receiver: result.data.shipment.receiver.name,
    distance: `${result.data.shipment.distance} km`,
    status: result.data.shipment.status,
  });
  return result;
};

// Main test execution
const runTests = async () => {
  console.log("🚀 Starting Comprehensive Seller Workflow Tests...");
  console.log("=" + "=".repeat(50));

  try {
    // Test authentication
    await testSellerLogin();

    // Test dashboard
    await testSellerDashboard();

    // Test location services
    await testLocationLookup();

    // Test distance calculation
    await testDistanceCalculation();

    // Test shipment creation
    const shipmentResult = await testShipmentCreation();

    // Test shipment retrieval
    await testShipmentRetrieval();

    // Test shipment details
    await testShipmentDetails(shipmentResult.data.shipment.id);

    console.log("\n" + "=".repeat(52));
    console.log("🎉 All tests completed successfully!");
    console.log("\n✅ Features Tested:");
    console.log("   - Seller Authentication");
    console.log("   - Dashboard Data Retrieval");
    console.log("   - Location Lookup via OpenStreetMap Nominatim");
    console.log("   - Distance Calculation (Haversine Formula)");
    console.log("   - Shipment Creation with Validation");
    console.log("   - Shipment List Retrieval");
    console.log("   - Individual Shipment Details");
    console.log("\n🌐 UI Pages Available:");
    console.log("   - Seller Dashboard: /api/sellers/dashboard-view");
    console.log("   - New Shipment Form: /api/sellers/new-shipment");
    console.log("   - My Shipments List: /api/sellers/my-shipments");
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    process.exit(1);
  }
};

// Run the tests
runTests();
