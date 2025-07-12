const mongoose = require("mongoose");

// Direct connection and update
async function directUpdate() {
  try {
    await mongoose.connect(
      "mongodb+srv://ar898993:FDKNlFTJ3ePSWXtx@cluster0.wge4r7r.mongodb.net/TrackSmart?retryWrites=true&w=majority&appName=Cluster0"
    );

    const Provider = mongoose.model("Provider", {
      bppId: String,
      name: String,
      email: String,
      username: String,
      password: String,
      isVerified: Boolean,
    });

    const result = await Provider.updateOne(
      { bppId: "TS000018" },
      {
        $set: {
          username: "fasttrack_TS000018",
          password: "5t38uw8ju8UXXB",
        },
      }
    );

    console.log("Update result:", result);

    const provider = await Provider.findOne({ bppId: "TS000018" });
    if (provider) {
      console.log("✅ Provider found:", provider.name);
      console.log("Username:", provider.username);
      console.log("Has password:", !!provider.password);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

directUpdate();
