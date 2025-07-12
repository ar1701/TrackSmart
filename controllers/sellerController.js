const express = require("express");
const Seller = require("../model/seller");
const { handleResponse } = require("../utils/responseHandler");

// Create a new seller onboard request
const createSellerRequest = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      businessName,
      businessAddress,
      gstNumber,
      website,
      productCategories,
      notes,
    } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !businessName || !businessAddress) {
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 400,
        message:
          "Name, email, phone, business name, and business address are required",
      });
    }

    // Check if seller already exists
    const existingSeller = await Seller.findOne({
      email: email.toLowerCase(),
    });

    if (existingSeller) {
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 409,
        message: "Seller with this email already exists",
      });
    }

    // Create new seller onboard request
    const newSeller = new Seller({
      name,
      email: email.toLowerCase(),
      phone,
      businessName,
      businessAddress,
      gstNumber,
      website,
      productCategories: productCategories
        ? productCategories.split(",").map((cat) => cat.trim())
        : [],
      notes,
      isVerified: false, // Default to false for onboard request
      status: "pending",
    });

    // Save to database (sellerId will be auto-generated)
    const savedSeller = await newSeller.save();

    return handleResponse(res, {
      type: "api",
      success: true,
      message: "Seller onboard request submitted successfully",
      data: {
        seller: {
          id: savedSeller._id,
          name: savedSeller.name,
          sellerId: savedSeller.sellerId,
          email: savedSeller.email,
          businessName: savedSeller.businessName,
          isVerified: savedSeller.isVerified,
          status: savedSeller.status,
          createdAt: savedSeller.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("Error creating seller onboard request:", error);

    // Handle duplicate key errors specifically
    let errorMessage = "Failed to submit seller onboard request";
    let statusCode = 500;

    if (error.code === 11000) {
      statusCode = 400; // Bad Request for validation errors
      if (error.keyPattern?.email) {
        errorMessage = "Email address is already registered";
      } else if (error.keyPattern?.sellerId) {
        errorMessage = "System error generating unique ID. Please try again";
        statusCode = 500; // This is a server error, not user error
      } else {
        errorMessage = "This information is already registered";
      }
    }

    return handleResponse(res, {
      type: "api",
      success: false,
      statusCode: statusCode,
      message: errorMessage,
      data: { error: error.message },
    });
  }
};

// Get all seller onboard requests (pending verification)
const getOnboardRequests = async (req, res) => {
  try {
    const sellers = await Seller.find({
      isVerified: false,
      rejectedAt: { $exists: false },
    }).sort({
      createdAt: -1,
    });

    return handleResponse(res, {
      type: "api",
      success: true,
      message: "Seller onboard requests retrieved successfully",
      data: {
        count: sellers.length,
        sellers: sellers.map((seller) => ({
          id: seller._id,
          name: seller.name,
          sellerId: seller.sellerId,
          email: seller.email,
          businessName: seller.businessName,
          phone: seller.phone,
          businessAddress: seller.businessAddress,
          status: seller.status,
          createdAt: seller.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("Error retrieving seller onboard requests:", error);
    return handleResponse(res, {
      type: "api",
      success: false,
      statusCode: 500,
      message: "Failed to retrieve seller onboard requests",
      data: { error: error.message },
    });
  }
};

// Get all verified sellers
const getVerifiedSellers = async (req, res) => {
  try {
    const sellers = await Seller.find({
      isVerified: true,
      status: "verified",
    }).sort({
      verifiedAt: -1,
    });

    return handleResponse(res, {
      type: "api",
      success: true,
      message: "Verified sellers retrieved successfully",
      data: {
        count: sellers.length,
        sellers: sellers.map((seller) => ({
          id: seller._id,
          name: seller.name,
          sellerId: seller.sellerId,
          email: seller.email,
          businessName: seller.businessName,
          phone: seller.phone,
          username: seller.username,
          isVerified: seller.isVerified,
          verifiedAt: seller.verifiedAt,
          totalOrders: seller.totalOrders,
          status: seller.status,
        })),
      },
    });
  } catch (error) {
    console.error("Error retrieving verified sellers:", error);
    return handleResponse(res, {
      type: "api",
      success: false,
      statusCode: 500,
      message: "Failed to retrieve verified sellers",
      data: { error: error.message },
    });
  }
};

// Get all rejected sellers
const getRejectedSellers = async (req, res) => {
  try {
    const sellers = await Seller.find({
      isRejected: true,
      rejectedAt: { $exists: true },
    }).sort({
      rejectedAt: -1,
    });

    return handleResponse(res, {
      type: "api",
      success: true,
      message: "Rejected sellers retrieved successfully",
      data: {
        count: sellers.length,
        sellers: sellers.map((seller) => ({
          id: seller._id,
          name: seller.name,
          sellerId: seller.sellerId,
          email: seller.email,
          businessName: seller.businessName,
          rejectionReason: seller.rejectionReason,
          rejectedAt: seller.rejectedAt,
        })),
      },
    });
  } catch (error) {
    console.error("Error retrieving rejected sellers:", error);
    return handleResponse(res, {
      type: "api",
      success: false,
      statusCode: 500,
      message: "Failed to retrieve rejected sellers",
      data: { error: error.message },
    });
  }
};

// Verify a seller onboard request
const verifySeller = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const bcrypt = require("bcryptjs");

    const seller = await Seller.findOne({ sellerId });

    if (!seller) {
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 404,
        message: "Seller not found",
        data: { error: "Seller with the specified ID was not found" },
      });
    }

    // Generate username and password automatically
    const sanitizedBusinessName = seller.businessName
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();
    const username = `${sanitizedBusinessName}_${seller.sellerId}`;
    const plainPassword =
      Math.random().toString(36).substring(2, 12) +
      Math.random().toString(36).substring(2, 6).toUpperCase();

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    // Update seller status and credentials
    seller.isVerified = true;
    seller.verifiedAt = new Date();
    seller.username = username;
    seller.password = hashedPassword;
    seller.isPasswordGenerated = true;
    seller.status = "verified";

    // Clear any previous rejection data when verifying
    seller.rejectedAt = undefined;
    seller.rejectionReason = undefined;
    seller.isRejected = false;

    await seller.save();

    return handleResponse(res, {
      type: "api",
      success: true,
      message: "Seller verified successfully and login credentials generated",
      data: {
        seller: {
          id: seller._id,
          name: seller.name,
          sellerId: seller.sellerId,
          email: seller.email,
          businessName: seller.businessName,
          isVerified: seller.isVerified,
          verifiedAt: seller.verifiedAt,
          username: seller.username,
        },
        credentials: {
          username: username,
          password: plainPassword,
          note: "Please save these credentials securely. The password will not be shown again.",
          loginUrl: "/api/sellers/login",
        },
      },
    });
  } catch (error) {
    console.error("Error verifying seller:", error);
    return handleResponse(res, {
      type: "api",
      success: false,
      statusCode: 500,
      message: "Failed to verify seller",
      data: { error: error.message },
    });
  }
};

// Reject a seller onboard request
const rejectSeller = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { reason } = req.body;

    const seller = await Seller.findOne({ sellerId });

    if (!seller) {
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 404,
        message: "Seller not found",
        data: { error: "Seller with the specified ID was not found" },
      });
    }

    // Update rejection details
    seller.rejectionReason = reason || "No reason provided";
    seller.rejectedAt = new Date();
    seller.isRejected = true;
    seller.status = "rejected";

    // Ensure seller is not verified when rejected
    seller.isVerified = false;
    seller.verifiedAt = undefined;
    seller.username = undefined;
    seller.password = undefined;
    seller.isPasswordGenerated = false;

    await seller.save();

    return handleResponse(res, {
      type: "api",
      success: true,
      message: "Seller onboard request rejected",
      data: {
        seller: {
          id: seller._id,
          name: seller.name,
          sellerId: seller.sellerId,
          email: seller.email,
          businessName: seller.businessName,
          rejectionReason: seller.rejectionReason,
          rejectedAt: seller.rejectedAt,
        },
      },
    });
  } catch (error) {
    console.error("Error rejecting seller:", error);
    return handleResponse(res, {
      type: "api",
      success: false,
      statusCode: 500,
      message: "Failed to reject seller",
      data: { error: error.message },
    });
  }
};

module.exports = {
  createSellerRequest,
  getOnboardRequests,
  getVerifiedSellers,
  getRejectedSellers,
  verifySeller,
  rejectSeller,
};
