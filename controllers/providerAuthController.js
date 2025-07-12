const express = require("express");
const bcrypt = require("bcryptjs");
const Provider = require("../model/provider");
const { handleResponse } = require("../utils/responseHandler");

// API: Provider Login (compatible with main login system)
const providerLoginAPI = async (req, res) => {
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

    // Find provider by username or email
    const provider = await Provider.findOne({
      $or: [{ username: username }, { email: username.toLowerCase() }],
      isVerified: true,
      status: "verified",
    });

    if (!provider) {
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 401,
        message: "Invalid credentials or account not verified",
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, provider.password);

    if (!isMatch) {
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 401,
        message: "Invalid credentials",
      });
    }

    // Create session
    req.session.user = {
      id: provider._id,
      type: "provider",
      bppId: provider.bppId,
      name: provider.name,
      email: provider.email,
      businessName: provider.businessName,
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
        provider: {
          id: provider._id,
          bppId: provider.bppId,
          name: provider.name,
          email: provider.email,
          businessName: provider.businessName,
          isVerified: provider.isVerified,
          status: provider.status,
        },
        session: {
          expiresIn: rememberMe ? "30d" : "24h",
        },
      },
    });
  } catch (error) {
    console.error("Provider login error:", error);
    return handleResponse(res, {
      type: "api",
      success: false,
      statusCode: 500,
      message: "Login processing error",
      data: { error: error.message },
    });
  }
};

// API: Provider Logout
const providerLogoutAPI = (req, res) => {
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

// API: Provider Dashboard
const providerDashboardAPI = async (req, res) => {
  try {
    const providerId = req.session.user.id;

    const provider = await Provider.findById(providerId).select(
      "-password -loginCredentials"
    );

    if (!provider) {
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 404,
        message: "Provider not found",
      });
    }

    // TODO: Get provider-specific dashboard data like orders, deliveries, etc.

    return handleResponse(res, {
      type: "api",
      success: true,
      message: "Dashboard data retrieved successfully",
      data: {
        provider: {
          id: provider._id,
          bppId: provider.bppId,
          name: provider.name,
          email: provider.email,
          businessName: provider.businessName,
          status: provider.status,
          isVerified: provider.isVerified,
          serviceAreas: provider.serviceAreas,
          contactInfo: provider.contactInfo,
        },
        stats: {
          // TODO: Add actual stats
          totalDeliveries: 0,
          activeOrders: 0,
          completedOrders: 0,
        },
      },
    });
  } catch (error) {
    console.error("Provider dashboard error:", error);
    return handleResponse(res, {
      type: "api",
      success: false,
      statusCode: 500,
      message: "Failed to retrieve dashboard data",
      data: { error: error.message },
    });
  }
};

// API: Get Provider Profile
const providerGetProfileAPI = async (req, res) => {
  try {
    const providerId = req.session.user.id;

    const provider = await Provider.findById(providerId).select(
      "-password -loginCredentials"
    );

    if (!provider) {
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 404,
        message: "Provider not found",
      });
    }

    return handleResponse(res, {
      type: "api",
      success: true,
      message: "Profile retrieved successfully",
      data: {
        provider: provider,
      },
    });
  } catch (error) {
    console.error("Get provider profile error:", error);
    return handleResponse(res, {
      type: "api",
      success: false,
      statusCode: 500,
      message: "Failed to retrieve profile",
      data: { error: error.message },
    });
  }
};

// API: Update Provider Profile
const providerUpdateProfileAPI = async (req, res) => {
  try {
    const providerId = req.session.user.id;
    const {
      name,
      businessName,
      businessDescription,
      contactInfo,
      businessAddress,
      serviceAreas,
    } = req.body;

    // Find provider
    const provider = await Provider.findById(providerId);

    if (!provider) {
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 404,
        message: "Provider not found",
      });
    }

    // Update allowed fields
    if (name) provider.name = name;
    if (businessName) provider.businessName = businessName;
    if (businessDescription) provider.businessDescription = businessDescription;
    if (contactInfo)
      provider.contactInfo = { ...provider.contactInfo, ...contactInfo };
    if (businessAddress)
      provider.businessAddress = {
        ...provider.businessAddress,
        ...businessAddress,
      };
    if (serviceAreas) provider.serviceAreas = serviceAreas;

    await provider.save();

    // Update session
    req.session.user.name = provider.name;
    req.session.user.businessName = provider.businessName;

    return handleResponse(res, {
      type: "api",
      success: true,
      message: "Profile updated successfully",
      data: {
        provider: {
          id: provider._id,
          bppId: provider.bppId,
          name: provider.name,
          email: provider.email,
          businessName: provider.businessName,
          businessDescription: provider.businessDescription,
          contactInfo: provider.contactInfo,
          businessAddress: provider.businessAddress,
          serviceAreas: provider.serviceAreas,
        },
      },
    });
  } catch (error) {
    console.error("Update provider profile error:", error);
    return handleResponse(res, {
      type: "api",
      success: false,
      statusCode: 500,
      message: "Failed to update profile",
      data: { error: error.message },
    });
  }
};

module.exports = {
  login: providerLoginAPI,
  logout: providerLogoutAPI,
  dashboard: providerDashboardAPI,
  getProfile: providerGetProfileAPI,
  updateProfile: providerUpdateProfileAPI,
};
