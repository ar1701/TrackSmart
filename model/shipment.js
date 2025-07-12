const mongoose = require("mongoose");

const ShipmentSchema = new mongoose.Schema(
  {
    shipmentId: {
      type: String,
      unique: true,
    },

    // Seller Information
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
    },

    // Parcel Information
    parcelName: {
      type: String,
      required: true,
      trim: true,
    },

    weight: {
      type: Number,
      required: true,
      min: 0.1,
    },

    dimensions: {
      length: {
        type: Number,
        required: true,
        min: 1,
      },
      width: {
        type: Number,
        required: true,
        min: 1,
      },
      height: {
        type: Number,
        required: true,
        min: 1,
      },
    },

    // Sender Information
    sender: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      address: {
        type: String,
        required: true,
        trim: true,
      },
      contact: {
        type: String,
        required: true,
        match: [/^\+?[\d\s\-\(\)]+$/, "Please enter a valid phone number"],
      },
      pincode: {
        type: String,
        required: true,
        match: [/^\d{6}$/, "Please enter a valid 6-digit pincode"],
      },
    },

    // Receiver Information
    receiver: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      address: {
        type: String,
        required: true,
        trim: true,
      },
      contact: {
        type: String,
        required: true,
        match: [/^\+?[\d\s\-\(\)]+$/, "Please enter a valid phone number"],
      },
      pincode: {
        type: String,
        required: true,
        match: [/^\d{6}$/, "Please enter a valid 6-digit pincode"],
      },
    },

    // Distance and Location Information
    distance: {
      type: Number,
      default: null,
    },

    sourceLocation: {
      latitude: Number,
      longitude: Number,
      city: String,
      state: String,
    },

    destinationLocation: {
      latitude: Number,
      longitude: Number,
      city: String,
      state: String,
    },

    // Shipment Status
    status: {
      type: String,
      enum: [
        "draft",
        "confirmed",
        "picked_up",
        "in_transit",
        "out_for_delivery",
        "delivered",
        "cancelled",
        "returned",
        "delayed",
      ],
      default: "draft",
    },

    // Status History for tracking changes
    statusHistory: [
      {
        status: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: 'statusHistory.updatedByType',
        },
        updatedByType: {
          type: String,
          enum: ['Seller', 'Provider', 'System'],
          default: 'System',
        },
        notes: {
          type: String,
          trim: true,
        },
        trackingNumber: {
          type: String,
        },
      },
    ],

    // Provider Information (assigned later)
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
      default: null,
    },

    // Pricing
    estimatedCost: {
      type: Number,
      default: null,
    },

    actualCost: {
      type: Number,
      default: null,
    },

    // Tracking
    trackingNumber: {
      type: String,
      unique: true,
      sparse: true,
    },

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
    },

    confirmedAt: {
      type: Date,
      default: null,
    },

    deliveredAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to auto-generate shipmentId
ShipmentSchema.pre("save", async function (next) {
  if (this.isNew && !this.shipmentId) {
    try {
      let isUnique = false;
      let shipmentId;
      let counter = 0;

      while (!isUnique && counter < 10) {
        // Generate shipmentId with format: SHP-YYYYMMDD-XXXX
        const timestamp = new Date()
          .toISOString()
          .slice(0, 10)
          .replace(/-/g, "");
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        shipmentId = `SHP-${timestamp}-${randomNum}`;

        // Check if this shipmentId already exists
        const existingShipment = await mongoose.models.Shipment.findOne({
          shipmentId,
        });
        if (!existingShipment) {
          isUnique = true;
        }
        counter++;
      }

      if (!isUnique) {
        throw new Error("Unable to generate unique shipment ID");
      }

      this.shipmentId = shipmentId;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Pre-save middleware to generate tracking number when status changes to confirmed
ShipmentSchema.pre("save", async function (next) {
  if (
    this.isModified("status") &&
    this.status === "confirmed" &&
    !this.trackingNumber
  ) {
    try {
      let isUnique = false;
      let trackingNumber;
      let counter = 0;

      while (!isUnique && counter < 10) {
        // Generate tracking number with format: TSxxxxxxxx
        const randomNum = Math.floor(10000000 + Math.random() * 90000000);
        trackingNumber = `TS${randomNum}`;

        // Check if this tracking number already exists
        const existingShipment = await mongoose.models.Shipment.findOne({
          trackingNumber,
        });
        if (!existingShipment) {
          isUnique = true;
        }
        counter++;
      }

      if (!isUnique) {
        throw new Error("Unable to generate unique tracking number");
      }

      this.trackingNumber = trackingNumber;
      this.confirmedAt = new Date();
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Pre-save middleware to update status history when status changes
ShipmentSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    // Add new status to history
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      updatedBy: this._statusUpdatedBy || null,
      updatedByType: this._statusUpdatedByType || 'System',
      notes: this._statusNotes || '',
      trackingNumber: this.trackingNumber || '',
    });

    // Clean up temporary fields
    this._statusUpdatedBy = undefined;
    this._statusUpdatedByType = undefined;
    this._statusNotes = undefined;
  }
  next();
});

module.exports = mongoose.model("Shipment", ShipmentSchema);
