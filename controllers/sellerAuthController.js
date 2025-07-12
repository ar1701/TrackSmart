const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const Seller = require("../model/seller");
const { handleResponse } = require("../utils/responseHandler");

// API: Seller Login
const sellerLoginAPI = async (req, res) => {
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

    // Find seller by username or email
    const seller = await Seller.findOne({
      $or: [{ username: username }, { email: username.toLowerCase() }],
      isVerified: true,
      status: "verified",
    });

    if (!seller) {
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 401,
        message: "Invalid credentials or account not verified",
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, seller.password);

    if (!isMatch) {
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 401,
        message: "Invalid credentials",
      });
    }

    // Create session (you can implement JWT here instead)
    req.session.user = {
      id: seller._id,
      type: "seller",
      sellerId: seller.sellerId,
      name: seller.name,
      email: seller.email,
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
        seller: {
          id: seller._id,
          sellerId: seller.sellerId,
          name: seller.name,
          email: seller.email,
          businessName: seller.businessName,
          isVerified: seller.isVerified,
          status: seller.status,
        },
        session: {
          expiresIn: rememberMe ? "30d" : "24h",
        },
      },
    });
  } catch (error) {
    console.error("Seller login error:", error);
    return handleResponse(res, {
      type: "api",
      success: false,
      statusCode: 500,
      message: "Login processing error",
      data: { error: error.message },
    });
  }
};

// API: Seller Logout
const sellerLogoutAPI = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Seller logout error:", err);
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 500,
        message: "Logout error",
        data: { error: err.message },
      });
    }

    return handleResponse(res, {
      type: "api",
      success: true,
      message: "Logged out successfully",
    });
  });
};

// API: Get Seller Dashboard Data
const getSellerDashboard = async (req, res) => {
  try {
    const sellerId = req.session.user.id;
    const seller = await Seller.findById(sellerId);

    if (!seller) {
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 404,
        message: "Seller not found",
      });
    }

    // You can add more dashboard data here
    return handleResponse(res, {
      type: "api",
      success: true,
      message: "Dashboard data retrieved successfully",
      data: {
        seller: {
          id: seller._id,
          sellerId: seller.sellerId,
          name: seller.name,
          email: seller.email,
          businessName: seller.businessName,
          isVerified: seller.isVerified,
          status: seller.status,
          totalOrders: seller.totalOrders,
          averageOrderValue: seller.averageOrderValue,
        },
        stats: {
          totalOrders: seller.totalOrders || 0,
          pendingOrders: 0, // Calculate from orders collection
          completedOrders: 0, // Calculate from orders collection
          totalRevenue: 0, // Calculate from orders collection
        },
      },
    });
  } catch (error) {
    console.error("Error retrieving seller dashboard data:", error);
    return handleResponse(res, {
      type: "api",
      success: false,
      statusCode: 500,
      message: "Failed to retrieve dashboard data",
      data: { error: error.message },
    });
  }
};

// API: Get Seller Profile
const getSellerProfile = async (req, res) => {
  try {
    const sellerId = req.session.user.id;
    const seller = await Seller.findById(sellerId);

    if (!seller) {
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 404,
        message: "Seller not found",
      });
    }

    return handleResponse(res, {
      type: "api",
      success: true,
      message: "Seller profile retrieved successfully",
      data: {
        seller: {
          id: seller._id,
          sellerId: seller.sellerId,
          name: seller.name,
          email: seller.email,
          phone: seller.phone,
          businessName: seller.businessName,
          businessAddress: seller.businessAddress,
          businessType: seller.businessType,
          gstNumber: seller.gstNumber,
          website: seller.website,
          productCategories: seller.productCategories,
          addresses: seller.addresses,
          preferredCarriers: seller.preferredCarriers,
          isVerified: seller.isVerified,
          status: seller.status,
          verifiedAt: seller.verifiedAt,
          createdAt: seller.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("Error retrieving seller profile:", error);
    return handleResponse(res, {
      type: "api",
      success: false,
      statusCode: 500,
      message: "Failed to retrieve seller profile",
      data: { error: error.message },
    });
  }
};

// API: Seller Registration
const sellerRegisterAPI = async (req, res) => {
  try {
    const {
      name,
      email,
      username,
      password,
      phoneNumber,
      businessName,
      businessType,
      businessDescription,
      businessAddress,
      personalAddress,
    } = req.body;

    // Validate required fields
    if (
      !name ||
      !email ||
      !username ||
      !password ||
      !phoneNumber ||
      !businessName
    ) {
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 400,
        message: "All required fields must be provided",
      });
    }

    // Check if seller already exists
    const existingSeller = await Seller.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username }],
    });

    if (existingSeller) {
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 409,
        message: "Seller with this email or username already exists",
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new seller
    const newSeller = new Seller({
      name,
      email: email.toLowerCase(),
      username,
      password: hashedPassword,
      phoneNumber,
      businessName,
      businessType: businessType || "retail",
      businessDescription,
      businessAddress: businessAddress || {},
      personalAddress: personalAddress || {},
      isVerified: false,
      status: "pending",
    });

    await newSeller.save();

    return handleResponse(res, {
      type: "api",
      success: true,
      statusCode: 201,
      message: "Seller registration successful. Please wait for verification.",
      data: {
        seller: {
          id: newSeller._id,
          sellerId: newSeller.sellerId,
          name: newSeller.name,
          email: newSeller.email,
          businessName: newSeller.businessName,
          status: newSeller.status,
        },
      },
    });
  } catch (error) {
    console.error("Seller registration error:", error);
    return handleResponse(res, {
      type: "api",
      success: false,
      statusCode: 500,
      message: "Registration processing error",
      data: { error: error.message },
    });
  }
};

// API: Update Seller Profile
const updateSellerProfile = async (req, res) => {
  try {
    const sellerId = req.session.user.id;
    const {
      name,
      phoneNumber,
      businessName,
      businessType,
      businessDescription,
      businessAddress,
      personalAddress,
      gstNumber,
    } = req.body;

    // Find and update seller
    const seller = await Seller.findById(sellerId);

    if (!seller) {
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 404,
        message: "Seller not found",
      });
    }

    // Update allowed fields
    if (name) seller.name = name;
    if (phoneNumber) seller.phoneNumber = phoneNumber;
    if (businessName) seller.businessName = businessName;
    if (businessType) seller.businessType = businessType;
    if (businessDescription) seller.businessDescription = businessDescription;
    if (businessAddress)
      seller.businessAddress = {
        ...seller.businessAddress,
        ...businessAddress,
      };
    if (personalAddress)
      seller.personalAddress = {
        ...seller.personalAddress,
        ...personalAddress,
      };
    if (gstNumber) seller.gstNumber = gstNumber;

    seller.lastUpdated = new Date();
    await seller.save();

    return handleResponse(res, {
      type: "api",
      success: true,
      message: "Profile updated successfully",
      data: {
        seller: {
          id: seller._id,
          sellerId: seller.sellerId,
          name: seller.name,
          email: seller.email,
          phoneNumber: seller.phoneNumber,
          businessName: seller.businessName,
          businessType: seller.businessType,
          businessDescription: seller.businessDescription,
          lastUpdated: seller.lastUpdated,
        },
      },
    });
  } catch (error) {
    console.error("Error updating seller profile:", error);
    return handleResponse(res, {
      type: "api",
      success: false,
      statusCode: 500,
      message: "Failed to update profile",
      data: { error: error.message },
    });
  }
};

// Middleware to check if seller is authenticated
const ensureSellerAuthenticated = (req, res, next) => {
  if (req.session.user && req.session.user.type === "seller") {
    return next();
  }

  return res.status(401).json({
    success: false,
    message: "Seller authentication required. Please login first.",
    error: "UNAUTHORIZED",
  });
};

module.exports = {
  sellerLoginAPI,
  sellerLogoutAPI,
  getSellerDashboard,
  getSellerProfile,
  updateSellerProfile,
  sellerRegisterAPI,
  ensureSellerAuthenticated,
};
