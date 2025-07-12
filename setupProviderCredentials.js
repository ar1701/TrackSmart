require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Provider = require("./model/provider");
const connectDB = require("./utils/connectToDB");

async function setupProviderCredentials() {
  try {
    await connectDB();
    console.log("✅ Connected to database\n");

    // Get all verified providers
    const providers = await Provider.find({ isVerified: true });
    console.log(`Found ${providers.length} verified providers\n`);

    console.log("Provider Login Credentials:");
    console.log("=" * 50);

    providers.forEach((provider, index) => {
      console.log(`${index + 1}. ${provider.name} (${provider.bppId})`);
      console.log(`   Email: ${provider.email}`);
      console.log(`   Login Options:`);
      console.log(`     Username: ${provider.email}`);
      console.log(`     Password: ${provider.email} (or ${provider.bppId})`);
      console.log(`     OR`);
      console.log(`     Username: ${provider.bppId}`);
      console.log(`     Password: ${provider.email} (or ${provider.bppId})`);
      console.log("");
    });

    console.log("📝 How to login as a Provider:");
    console.log("1. Go to: http://localhost:4000/main-login");
    console.log("2. Select 'Provider' from the dropdown");
    console.log("3. Use Email OR Provider ID as username");
    console.log("4. Use Email OR Provider ID as password");
    console.log("5. Click Login");
    console.log("");
    console.log("Note: This is a simplified authentication for testing.");
    console.log("In production, providers should have secure passwords.");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error setting up provider credentials:", error);
    process.exit(1);
  }
}

setupProviderCredentials();
