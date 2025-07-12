const mongoose = require("mongoose");

// Schema for provider quotes
const ProviderQuoteSchema = new mongoose.Schema(
  {
    shipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shipment",
      required: true,
    },

    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
      required: true,
    },

    // Quote details
    estimatedCost: {
      type: Number,
      required: true,
      min: 0,
    },

    estimatedDeliveryTime: {
      type: Number, // in hours
      required: true,
      min: 1,
    },

    serviceType: {
      type: String,
      enum: ["standard", "express", "overnight", "same-day"],
      default: "standard",
    },

    // Quote validity
    validUntil: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    },

    // Additional services
    pickupAvailable: {
      type: Boolean,
      default: true,
    },

    trackingAvailable: {
      type: Boolean,
      default: true,
    },

    insuranceAvailable: {
      type: Boolean,
      default: false,
    },

    insuranceCost: {
      type: Number,
      default: 0,
    },

    // Quote status
    status: {
      type: String,
      enum: ["pending", "provided", "accepted", "rejected", "expired"],
      default: "pending",
    },

    // Response details
    responseTime: {
      type: Number, // in milliseconds
      default: null,
    },

    errorMessage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Schema for shipment requests to providers
const ShipmentRequestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      unique: true,
    },

    shipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shipment",
      required: true,
    },

    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
    },

    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
      required: true,
    },

    quoteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProviderQuote",
      required: true,
    },

    // Request details
    requestedCost: {
      type: Number,
      required: true,
    },

    requestedDeliveryTime: {
      type: Number,
      required: true,
    },

    serviceType: {
      type: String,
      required: true,
    },

    // Additional services requested
    pickupRequired: {
      type: Boolean,
      default: true,
    },

    trackingRequired: {
      type: Boolean,
      default: true,
    },

    insuranceRequired: {
      type: Boolean,
      default: false,
    },

    // Request status
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled"],
      default: "pending",
    },

    // Provider response
    providerResponse: {
      acceptedAt: Date,
      rejectedAt: Date,
      rejectionReason: String,
      providerNotes: String,
      trackingNumber: String,
      actualCost: Number,
      actualDeliveryTime: Number,
    },

    // Seller actions
    sellerNotes: {
      type: String,
      trim: true,
    },

    cancelledAt: {
      type: Date,
    },

    cancellationReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to auto-generate requestId
ShipmentRequestSchema.pre("save", async function (next) {
  if (this.isNew && !this.requestId) {
    try {
      let isUnique = false;
      let requestId;
      let counter = 0;

      while (!isUnique && counter < 10) {
        // Generate requestId with format: REQ-YYYYMMDD-XXXX
        const timestamp = new Date()
          .toISOString()
          .slice(0, 10)
          .replace(/-/g, "");
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        requestId = `REQ-${timestamp}-${randomNum}`;

        // Check if this requestId already exists
        const existingRequest = await mongoose.models.ShipmentRequest.findOne({
          requestId,
        });
        if (!existingRequest) {
          isUnique = true;
        }
        counter++;
      }

      if (isUnique) {
        this.requestId = requestId;
      } else {
        return next(new Error("Unable to generate unique request ID"));
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Indexes for better performance
ProviderQuoteSchema.index({ shipmentId: 1, providerId: 1 });
ProviderQuoteSchema.index({ status: 1 });
ProviderQuoteSchema.index({ validUntil: 1 });

ShipmentRequestSchema.index({ shipmentId: 1 });
ShipmentRequestSchema.index({ providerId: 1, status: 1 });
ShipmentRequestSchema.index({ sellerId: 1, status: 1 });
ShipmentRequestSchema.index({ createdAt: -1 });

const ProviderQuote = mongoose.model("ProviderQuote", ProviderQuoteSchema);
const ShipmentRequest = mongoose.model(
  "ShipmentRequest",
  ShipmentRequestSchema
);

module.exports = {
  ProviderQuote,
  ShipmentRequest,
};
