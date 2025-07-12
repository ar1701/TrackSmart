const mongoose = require("mongoose");

const ProviderSchema = new mongoose.Schema(
  {
    bppId: {
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
    hasBaseUri: {
      type: Boolean,
      default: false,
    },
    baseUri: {
      type: String,
      required: function () {
        return this.hasBaseUri === true;
      },
      validate: {
        validator: function (value) {
          if (this.hasBaseUri && (!value || value.trim() === "")) {
            return false;
          }
          return true;
        },
        message: "Base URI is required when 'Has Base URI' is selected",
      },
    },
    actions: [String],
    supportedPincodes: [String],
    weightLimits: { min: Number, max: Number },
    dimensionalLimits: { l: Number, w: Number, h: Number },
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
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to auto-generate bppId
ProviderSchema.pre("save", async function (next) {
  if (this.isNew && !this.bppId) {
    try {
      // Find the highest existing bppId number more efficiently
      const lastProvider = await this.constructor
        .findOne({ bppId: { $regex: /^TS\d+$/ } })
        .sort({ bppId: -1 })
        .select("bppId");

      let nextNumber = 1;
      if (lastProvider && lastProvider.bppId) {
        const lastNumber = parseInt(lastProvider.bppId.replace("TS", ""));
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }

      // Generate the next bppId
      this.bppId = `TS${String(nextNumber).padStart(6, "0")}`;

      // Double-check for uniqueness (in case of race conditions)
      const existingProvider = await this.constructor.findOne({
        bppId: this.bppId,
      });
      if (existingProvider) {
        // If collision, use timestamp-based fallback
        const timestamp = Date.now().toString().slice(-6);
        this.bppId = `TS${timestamp}`;
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model("Provider", ProviderSchema);
