require("dotenv").config();
const mongoose = require("mongoose");
const Provider = require("./model/provider");
const connectDB = require("./utils/connectToDB");

async function quickUpdateProvider() {
  try {
    await connectDB();
    console.log("Connected to database");

    const result = await Provider.findOneAndUpdate(
      { bppId: "TS000018" },
      {
        username: "fasttrack_TS000018",
        password: "5t38uw8ju8UXXB",
      },
      { new: true }
    );

    if (result) {
      console.log("✅ Provider updated:", result.name);
      console.log("Username:", result.username);
      console.log("Password: 5t38uw8ju8UXXB");
    } else {
      console.log("❌ Provider TS000018 not found");
    }

    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

quickUpdateProvider();
