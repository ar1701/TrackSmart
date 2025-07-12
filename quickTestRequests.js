const mongoose = require("mongoose");

async function quickTest() {
  try {
    await mongoose.connect(
      "mongodb+srv://ar898993:FDKNlFTJ3ePSWXtx@cluster0.wge4r7r.mongodb.net/TrackSmart?retryWrites=true&w=majority&appName=Cluster0"
    );

    // Import models
    require("../model/seller");
    require("../model/shipment");
    const { ShipmentRequest } = require("../model/providerQuote");

    const providerId = "68721ebf20ce88771187f3bd";

    const requests = await ShipmentRequest.find({ providerId })
      .populate("shipmentId")
      .populate("sellerId", "name email")
      .sort({ createdAt: -1 });

    console.log(`Found ${requests.length} requests`);

    if (requests.length > 0) {
      requests.forEach((req, i) => {
        console.log(
          `${i + 1}. ${req.shipmentId?.parcelName} by ${req.sellerId?.name} - ${
            req.status
          }`
        );
      });
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error.message);
  }
}

quickTest();
