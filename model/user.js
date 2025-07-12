const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    // User Identification
    userId: {
      type: String,
      unique: true,
      required: true,
      default: function () {
        return (
          "USER-" +
          Date.now() +
          "-" +
          Math.random().toString(36).substr(2, 9).toUpperCase()
        );
      },
    },

    // Personal Information
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Please enter a valid email address",
      ],
    },

    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      match: [
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores",
      ],
    },

    // Authentication
    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    // Contact Information
    phoneNumber: {
      type: String,
      required: true,
      match: [/^\+?[\d\s\-\(\)]+$/, "Please enter a valid phone number"],
    },

    dateOfBirth: {
      type: Date,
      validate: {
        validator: function (value) {
          return value < new Date();
        },
        message: "Date of birth must be in the past",
      },
    },

    // Address Information
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, trim: true, default: "India" },
    },

    // Account Status
    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    isPhoneVerified: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["pending", "active", "suspended", "deactivated"],
      default: "pending",
    },

    // Email Verification
    emailVerificationToken: {
      type: String,
      default: null,
    },

    emailVerificationExpires: {
      type: Date,
      default: null,
    },

    // Password Reset
    passwordResetToken: {
      type: String,
      default: null,
    },

    passwordResetExpires: {
      type: Date,
      default: null,
    },

    // User Preferences
    preferences: {
      notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        push: { type: Boolean, default: true },
      },
      language: { type: String, default: "en" },
      timezone: { type: String, default: "Asia/Kolkata" },
    },

    // Activity Tracking
    lastLogin: {
      type: Date,
      default: null,
    },

    loginAttempts: {
      type: Number,
      default: 0,
    },

    accountLocked: {
      type: Boolean,
      default: false,
    },

    lockExpires: {
      type: Date,
      default: null,
    },

    // Order History References
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
    ],

    // Tracking History
    trackingHistory: [
      {
        trackingNumber: String,
        accessedAt: { type: Date, default: Date.now },
        ipAddress: String,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for full name
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ userId: 1 });
userSchema.index({ phoneNumber: 1 });
userSchema.index({ status: 1 });

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if account is locked
userSchema.methods.isLocked = function () {
  return !!(
    this.accountLocked &&
    this.lockExpires &&
    this.lockExpires > Date.now()
  );
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function () {
  // Reset attempts if lock has expired
  if (this.lockExpires && this.lockExpires < Date.now()) {
    return this.updateOne({
      $unset: { lockExpires: 1 },
      $set: { accountLocked: false, loginAttempts: 1 },
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = {
      accountLocked: true,
      lockExpires: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
    };
  }

  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockExpires: 1 },
    $set: { accountLocked: false },
  });
};

// Method to generate email verification token
userSchema.methods.generateEmailVerificationToken = function () {
  const token = require("crypto").randomBytes(32).toString("hex");
  this.emailVerificationToken = token;
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return token;
};

// Method to generate password reset token
userSchema.methods.generatePasswordResetToken = function () {
  const token = require("crypto").randomBytes(32).toString("hex");
  this.passwordResetToken = token;
  this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  return token;
};

// Static method to find by login (username or email)
userSchema.statics.findByLogin = function (login) {
  return this.findOne({
    $or: [{ username: login }, { email: login.toLowerCase() }],
  });
};

module.exports = mongoose.model("User", userSchema);
