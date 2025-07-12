const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../model/user");
const { handleResponse } = require("../utils/responseHandler");

// API: User Login
const userLoginAPI = async (req, res) => {
  try {
    const { username, password, rememberMe } = req.body;

    // Validate required fields
    if (!username || !password) {
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 400,
        message: "Username and password are required",
      });
    }

    // Find user by username or email
    const user = await User.findByLogin(username);

    if (!user) {
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 401,
        message: "Invalid credentials",
      });
    }

    // Check if account is locked
    if (user.isLocked()) {
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 423,
        message:
          "Account is temporarily locked due to too many failed login attempts. Please try again later.",
      });
    }

    // Check if account is active
    if (user.status !== "active") {
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 403,
        message:
          "Account is not active. Please verify your email or contact support.",
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      // Increment login attempts
      await user.incLoginAttempts();

      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 401,
        message: "Invalid credentials",
      });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Create session
    req.session.user = {
      id: user._id,
      type: "user",
      userId: user.userId,
      name: user.fullName,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    // Set session expiry based on rememberMe
    if (rememberMe) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    }

    return handleResponse(res, {
      type: "api",
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user._id,
          userId: user.userId,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          isEmailVerified: user.isEmailVerified,
          status: user.status,
        },
        session: {
          expiresIn: rememberMe ? "30d" : "24h",
        },
      },
    });
  } catch (error) {
    console.error("User login error:", error);
    return handleResponse(res, {
      type: "api",
      success: false,
      statusCode: 500,
      message: "Login processing error",
      data: { error: error.message },
    });
  }
};

// API: User Logout
const userLogoutAPI = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 500,
        message: "Logout failed",
        data: { error: err.message },
      });
    }

    return handleResponse(res, {
      type: "api",
      success: true,
      message: "Logout successful",
    });
  });
};

// API: User Dashboard
const userDashboardAPI = async (req, res) => {
  try {
    const userId = req.session.user.id;

    const user = await User.findById(userId)
      .populate("orders")
      .select("-password -emailVerificationToken -passwordResetToken");

    if (!user) {
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 404,
        message: "User not found",
      });
    }

    // Get recent tracking history
    const recentTracking = user.trackingHistory
      .sort((a, b) => new Date(b.accessedAt) - new Date(a.accessedAt))
      .slice(0, 5);

    return handleResponse(res, {
      type: "api",
      success: true,
      message: "Dashboard data retrieved successfully",
      data: {
        user: {
          id: user._id,
          userId: user.userId,
          fullName: user.fullName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          status: user.status,
          isEmailVerified: user.isEmailVerified,
          lastLogin: user.lastLogin,
        },
        stats: {
          totalOrders: user.orders.length,
          recentTracking: recentTracking.length,
        },
        recentOrders: user.orders.slice(-5), // Last 5 orders
        recentTracking: recentTracking,
      },
    });
  } catch (error) {
    console.error("User dashboard error:", error);
    return handleResponse(res, {
      type: "api",
      success: false,
      statusCode: 500,
      message: "Failed to retrieve dashboard data",
      data: { error: error.message },
    });
  }
};

// API: Get User Profile
const userGetProfileAPI = async (req, res) => {
  try {
    const userId = req.session.user.id;

    const user = await User.findById(userId).select(
      "-password -emailVerificationToken -passwordResetToken"
    );

    if (!user) {
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 404,
        message: "User not found",
      });
    }

    return handleResponse(res, {
      type: "api",
      success: true,
      message: "Profile retrieved successfully",
      data: {
        user: user,
      },
    });
  } catch (error) {
    console.error("Get user profile error:", error);
    return handleResponse(res, {
      type: "api",
      success: false,
      statusCode: 500,
      message: "Failed to retrieve profile",
      data: { error: error.message },
    });
  }
};

// API: Update User Profile
const userUpdateProfileAPI = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const {
      firstName,
      lastName,
      phoneNumber,
      dateOfBirth,
      address,
      preferences,
    } = req.body;

    // Find user
    const user = await User.findById(userId);

    if (!user) {
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 404,
        message: "User not found",
      });
    }

    // Update allowed fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (dateOfBirth) user.dateOfBirth = new Date(dateOfBirth);
    if (address) user.address = { ...user.address, ...address };
    if (preferences) user.preferences = { ...user.preferences, ...preferences };

    await user.save();

    // Update session
    req.session.user.name = user.fullName;
    req.session.user.firstName = user.firstName;
    req.session.user.lastName = user.lastName;

    return handleResponse(res, {
      type: "api",
      success: true,
      message: "Profile updated successfully",
      data: {
        user: {
          id: user._id,
          userId: user.userId,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          dateOfBirth: user.dateOfBirth,
          address: user.address,
          preferences: user.preferences,
        },
      },
    });
  } catch (error) {
    console.error("Update user profile error:", error);
    return handleResponse(res, {
      type: "api",
      success: false,
      statusCode: 500,
      message: "Failed to update profile",
      data: { error: error.message },
    });
  }
};

// API: User Registration
const userRegisterAPI = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      username,
      password,
      phoneNumber,
      dateOfBirth,
      address,
    } = req.body;

    // Validate required fields
    if (
      !firstName ||
      !lastName ||
      !email ||
      !username ||
      !password ||
      !phoneNumber
    ) {
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 400,
        message: "All required fields must be provided",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username }],
    });

    if (existingUser) {
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 409,
        message: "User with this email or username already exists",
      });
    }

    // Create new user
    const newUser = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      username,
      password,
      phoneNumber,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      address: address || {},
      status: "active", // Users can be active immediately
      isEmailVerified: false, // Will need email verification
    });

    // Generate email verification token
    const verificationToken = newUser.generateEmailVerificationToken();

    await newUser.save();

    // TODO: Send verification email here

    return handleResponse(res, {
      type: "api",
      success: true,
      statusCode: 201,
      message:
        "User registration successful. Please check your email for verification.",
      data: {
        user: {
          id: newUser._id,
          userId: newUser.userId,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          fullName: newUser.fullName,
          email: newUser.email,
          status: newUser.status,
          isEmailVerified: newUser.isEmailVerified,
        },
      },
    });
  } catch (error) {
    console.error("User registration error:", error);
    return handleResponse(res, {
      type: "api",
      success: false,
      statusCode: 500,
      message: "Registration processing error",
      data: { error: error.message },
    });
  }
};

module.exports = {
  login: userLoginAPI,
  logout: userLogoutAPI,
  dashboard: userDashboardAPI,
  getProfile: userGetProfileAPI,
  updateProfile: userUpdateProfileAPI,
  register: userRegisterAPI,
};
