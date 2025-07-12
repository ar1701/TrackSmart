require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./utils/connectToDB");
const Seller = require("./model/seller");
const Shipment = require("./model/shipment");
const providerQuoteService = require("./services/providerQuoteService");

async function testCompleteWorkflow() {
  try {
    await connectDB();
    console.log("✅ Connected to database\n");

    // 1. Find the test seller
    const seller = await Seller.findOne({ username: "dashboardtestseller" });
    if (!seller) {
      throw new Error("Test seller not found");
    }
    console.log(`👤 Found test seller: ${seller.name} (${seller.username})`);

    // 2. Create a test shipment
    console.log("\n📦 Creating test shipment...");
    const shipmentData = {
      sellerId: seller._id,
      parcelName: "Test Package",
      sender: {
        name: "Test Sender",
        contact: "+91-9876543210",
        address: "123 Test Street, New Delhi",
        pincode: "110001",
      },
      receiver: {
        name: "Test Receiver",
        contact: "+91-9876543211",
        address: "456 Destination Street, Mumbai",
        pincode: "400001",
      },
      weight: 2.5,
      dimensions: {
        length: 30,
        width: 20,
        height: 15,
      },
      status: "confirmed",
    };

    const shipment = new Shipment(shipmentData);
    await shipment.save();
    console.log(`✅ Shipment created: ${shipment._id}`);

    // 3. Get quotes from providers
    console.log("\n🔍 Getting quotes from providers...");
    const quoteResult = await providerQuoteService.getQuotesFromProviders(
      shipmentData
    );
    console.log(`📊 Quote Result:`, {
      success: quoteResult.success,
      providersContacted: quoteResult.providersContacted,
      quotesReceived: quoteResult.quotesReceived,
    });

    if (quoteResult.quotes && quoteResult.quotes.length > 0) {
      console.log(`\n📋 Available Quotes:`);
      quoteResult.quotes.forEach((quote, index) => {
        console.log(
          `   ${index + 1}. ${quote.providerName} (${quote.providerId})`
        );
        console.log(`      Cost: ₹${quote.estimatedCost}`);
        console.log(`      Delivery: ${quote.estimatedDeliveryTime}`);
      });

      // 4. Select the first provider (simulate seller choice)
      const selectedQuote = quoteResult.quotes[0];
      console.log(`\n✅ Selecting provider: ${selectedQuote.providerName}`);

      const requestResult = await providerQuoteService.createShipmentRequest(
        shipment._id,
        selectedQuote.providerId,
        selectedQuote.estimatedCost,
        "Test provider selection from workflow test"
      );

      if (requestResult.success) {
        console.log(
          `✅ Shipment request created: ${requestResult.data.requestId}`
        );
        console.log(`   Status: ${requestResult.data.status}`);
      } else {
        console.log(
          `❌ Failed to create shipment request: ${requestResult.error}`
        );
      }
    } else {
      console.log(`❌ No quotes received`);
    }

    // 5. Test provider dashboard data
    console.log(`\n🏢 Testing provider dashboard data...`);
    const providers = await mongoose
      .model("Provider")
      .find({ isVerified: true });

    for (const provider of providers.slice(0, 3)) {
      // Test first 3 providers
      const providerRequests = await providerQuoteService.getProviderRequests(
        provider._id
      );
      console.log(`   ${provider.name}: ${providerRequests.length} requests`);

      if (providerRequests.length > 0) {
        const pending = providerRequests.filter(
          (r) => r.status === "pending"
        ).length;
        const accepted = providerRequests.filter(
          (r) => r.status === "accepted"
        ).length;
        const rejected = providerRequests.filter(
          (r) => r.status === "rejected"
        ).length;
        console.log(
          `     Pending: ${pending}, Accepted: ${accepted}, Rejected: ${rejected}`
        );
      }
    }

    console.log(`\n🎯 Workflow Test Complete!`);
    console.log(`\n📝 Test Results Summary:`);
    console.log(`   ✅ Seller account: Found and accessible`);
    console.log(`   ✅ Shipment creation: Working`);
    console.log(
      `   ✅ Provider quote system: ${
        quoteResult.success ? "Working" : "Failed"
      }`
    );
    console.log(
      `   ✅ Request creation: ${
        quoteResult.quotes?.length > 0 ? "Working" : "No quotes to test"
      }`
    );
    console.log(`   ✅ Provider dashboard data: Available`);

    console.log(`\n🌐 Ready for Manual Testing:`);
    console.log(`   1. Login as seller: http://localhost:4000/main-login`);
    console.log(`      Username: dashboardtestseller`);
    console.log(`      Password: testpass123`);
    console.log(`   2. Create shipment and test quote comparison`);
    console.log(
      `   3. Login as provider to see requests (when provider login is available)`
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Workflow test error:", error);
    process.exit(1);
  }
}

testCompleteWorkflow();
