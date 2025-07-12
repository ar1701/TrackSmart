const mongoose = require("mongoose");

const SellerSchema = new mongoose.Schema(
  {
    sellerId: {
      type: String,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Please enter a valid email address",
      ],
    },
    phone: {
      type: String,
      required: true,
    },
    businessName: {
      type: String,
      required: true,
    },
    businessAddress: {
      type: String,
      required: true,
    },
    gstNumber: {
      type: String,
    },
    website: {
      type: String,
    },
    productCategories: [String],
    notes: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    verifiedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
    rejectedAt: {
      type: Date,
    },
    isRejected: {
      type: Boolean,
      default: false,
    },
    // Authentication fields
    username: {
      type: String,
      unique: true,
      sparse: true, // Only enforce uniqueness for non-null values
    },
    password: {
      type: String,
    },
    isPasswordGenerated: {
      type: Boolean,
      default: false,
    },
    // Business details
    businessType: {
      type: String,
      enum: ["individual", "company", "partnership"],
      default: "individual",
    },
    // Address details for shipping
    addresses: [
      {
        type: {
          type: String,
          enum: ["pickup", "billing", "shipping"],
          required: true,
        },
        address: {
          type: String,
          required: true,
        },
        city: {
          type: String,
          required: true,
        },
        state: {
          type: String,
          required: true,
        },
        pincode: {
          type: String,
          required: true,
        },
        country: {
          type: String,
          default: "India",
        },
        isDefault: {
          type: Boolean,
          default: false,
        },
      },
    ],
    // Shipping preferences
    preferredCarriers: [String],
    averageOrderValue: {
      type: Number,
      default: 0,
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
    // Status tracking
    status: {
      type: String,
      enum: ["pending", "verified", "suspended", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to auto-generate sellerId
SellerSchema.pre("save", async function (next) {
  if (this.isNew && !this.sellerId) {
    try {
      let isUnique = false;
      let sellerId;
      let counter = 0;

      while (!isUnique && counter < 10) {
        // Generate sellerId with format: SEL-YYYYMMDD-XXXX
        const timestamp = new Date()
          .toISOString()
          .slice(0, 10)
          .replace(/-/g, "");
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        sellerId = `SEL-${timestamp}-${randomNum}`;

        // Check if this sellerId already exists
        const existingSeller = await mongoose.models.Seller.findOne({
          sellerId,
        });
        if (!existingSeller) {
          isUnique = true;
        }
        counter++;
      }

      if (!isUnique) {
        throw new Error("Unable to generate unique seller ID");
      }

      this.sellerId = sellerId;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model("Seller", SellerSchema);
