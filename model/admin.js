const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema(
  {
    adminId: {
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
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["super-admin", "admin", "moderator"],
      default: "admin",
    },
    permissions: {
      type: [String],
      default: [
        "view_dashboard",
        "manage_providers",
        "manage_sellers",
        "view_analytics",
      ],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    department: {
      type: String,
      enum: ["operations", "technical", "customer-service", "management"],
      default: "operations",
    },
    phone: {
      type: String,
    },
    // Session management
    sessionToken: {
      type: String,
    },
    sessionExpires: {
      type: Date,
    },
    // Activity tracking
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    // Profile details
    avatar: {
      type: String, // URL to profile image
    },
    bio: {
      type: String,
    },
    // Notification preferences
    notifications: {
      email: {
        type: Boolean,
        default: true,
      },
      sms: {
        type: Boolean,
        default: false,
      },
      dashboard: {
        type: Boolean,
        default: true,
      },
    },
    // Two-factor authentication
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to auto-generate adminId
AdminSchema.pre("save", async function (next) {
  if (this.isNew && !this.adminId) {
    try {
      let isUnique = false;
      let adminId;
      let counter = 0;

      while (!isUnique && counter < 10) {
        // Generate adminId with format: ADM-YYYYMMDD-XXXX
        const timestamp = new Date()
          .toISOString()
          .slice(0, 10)
          .replace(/-/g, "");
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        adminId = `ADM-${timestamp}-${randomNum}`;

        // Check if this adminId already exists
        const existingAdmin = await mongoose.models.Admin.findOne({ adminId });
        if (!existingAdmin) {
          isUnique = true;
        }
        counter++;
      }

      if (!isUnique) {
        throw new Error("Unable to generate unique admin ID");
      }

      this.adminId = adminId;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model("Admin", AdminSchema);
