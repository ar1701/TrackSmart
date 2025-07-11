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
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email address",
      ],
    },
    baseUri: {
      type: String,
      required: true,
    },
    actions: [String],
    supportedPincodes: [String],
    weightLimits: { min: Number, max: Number },
    dimensionalLimits: { l: Number, w: Number, h: Number },
    credentials: Object,
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
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to auto-generate bppId
ProviderSchema.pre("save", async function (next) {
  if (this.isNew && !this.bppId) {
    try {
      // Find the highest existing bppId number
      const lastProvider = await this.constructor.findOne(
        { bppId: { $regex: /^TS\d+$/ } },
        {},
        { sort: { bppId: -1 } }
      );

      let nextNumber = 1;
      if (lastProvider && lastProvider.bppId) {
        const lastNumber = parseInt(lastProvider.bppId.replace("TS", ""));
        nextNumber = lastNumber + 1;
      }

      this.bppId = `TS${nextNumber}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model("Provider", ProviderSchema);
