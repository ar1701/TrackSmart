require("dotenv").config();
const mongoose = require("mongoose");
const Provider = require("./model/provider");
const connectDB = require("./utils/connectToDB");

async function updateProviderCredentials() {
  try {
    await connectDB();
    console.log("✅ Connected to database\n");

    // Find the provider with bppId TS000018
    const provider = await Provider.findOne({ bppId: "TS000018" });

    if (!provider) {
      console.log("❌ Provider with bppId TS000018 not found");
      process.exit(1);
    }

    console.log(`Found provider: ${provider.name} (${provider.bppId})`);

    // Update provider with new credentials
    provider.username = "fasttrack_TS000018";
    provider.password = "5t38uw8ju8UXXB";
    await provider.save();

    console.log("✅ Provider credentials updated successfully!");
    console.log("\nProvider Login Details:");
    console.log("Username: fasttrack_TS000018");
    console.log("Password: 5t38uw8ju8UXXB");
    console.log("Provider ID: TS000018");
    console.log("Email:", provider.email);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error updating provider credentials:", error);
    process.exit(1);
  }
}

updateProviderCredentials();
