require("dotenv").config();
const mongoose = require("mongoose");
const Provider = require("./model/provider");
const connectDB = require("./utils/connectToDB");

async function listProviders() {
  try {
    await connectDB();
    console.log("Connected to database");

    const providers = await Provider.find({ isVerified: true }).select(
      "name bppId supportedPincodes weightLimits"
    );

    console.log(`\nFound ${providers.length} verified providers:`);
    console.log("=" * 50);

    providers.forEach((provider) => {
      console.log(`\nProvider: ${provider.name}`);
      console.log(`ID: ${provider.bppId}`);
      console.log(`Pincodes: ${provider.supportedPincodes.join(", ")}`);
      console.log(
        `Weight limits: ${provider.weightLimits.min}kg - ${provider.weightLimits.max}kg`
      );
    });

    console.log("\n" + "=" * 50);
    process.exit(0);
  } catch (error) {
    console.error("Error listing providers:", error);
    process.exit(1);
  }
}

listProviders();
