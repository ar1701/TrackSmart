const bcrypt = require("bcryptjs");
const Provider = require("../model/provider");
const passport = require("passport");
const { handleResponse } = require("../utils/responseHandler");

// Show login page
const showLogin = (req, res) => {
  res.render("providerPage/login", {
    title: "Provider Login",
    error: req.flash("error"),
    success: req.flash("success"),
  });
};

// Show carrier onboard page
const showCarrierOnboard = (req, res) => {
  res.render("onboard_carrier", {
    title: "Onboard Carrier - TrackSmart",
    error: req.flash("error"),
    success: req.flash("success"),
  });
};

// Handle login
const login = (req, res) => {
  res.redirect("/dashboard");
};

// Show dashboard
const showDashboard = async (req, res) => {
  try {
    const provider = req.user;

    // Get the correct provider ID
    const providerId = provider._id || provider.id || provider.providerId;

    // Get shipment requests for this provider
    const providerQuoteService = require("../services/providerQuoteService");
    const requests = await providerQuoteService.getProviderRequests(providerId);

    // Separate requests by status
    const pendingRequests = requests.filter((req) => req.status === "pending");
    const acceptedRequests = requests.filter(
      (req) => req.status === "accepted"
    );
    const rejectedRequests = requests.filter(
      (req) => req.status === "rejected"
    );

    // Calculate stats
    const stats = {
      totalRequests: requests.length,
      pendingRequests: pendingRequests.length,
      acceptedRequests: acceptedRequests.length,
      rejectedRequests: rejectedRequests.length,
      totalRevenue: acceptedRequests.reduce((sum, req) => {
        return (
          sum + (req.providerResponse?.actualCost || req.requestedCost || 0)
        );
      }, 0),
    };

    res.render("providerPage/dashboard", {
      title: "Provider Dashboard",
      provider: provider,
      requests: requests,
      pendingRequests: pendingRequests,
      stats: stats,
    });
  } catch (error) {
    console.error("Error loading dashboard:", error);
    res
      .status(500)
      .render("providerPage/error", { message: "Error loading dashboard" });
  }
};

// Logout
const logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error("Logout error:", err);
    }
    req.flash("success", "You have been logged out successfully");
    res.redirect("/login");
  });
};

// Generate credentials for verified provider (internal function)
const generateCredentials = async (providerId) => {
  try {
    const provider = await Provider.findById(providerId);

    if (!provider || !provider.isVerified) {
      throw new Error("Provider not found or not verified");
    }

    // Generate credentials
    const username = provider.bppId;
    const password = Math.random().toString(36).substring(2, 10);

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update provider with credentials
    provider.credentials = {
      username,
      password: hashedPassword,
    };
    provider.hasCredentials = true;
    await provider.save();

    return {
      success: true,
      username,
      password,
    };
  } catch (error) {
    console.error("Error generating credentials:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// API: Get Provider Login Info
const getProviderLoginAPI = (req, res) => {
  return handleResponse(res, {
    type: "api",
    success: true,
    message: "Provider login information",
    data: {
      loginEndpoint: "/api/providers/login",
      method: "POST",
      requiredFields: ["username", "password"],
      note: "Login credentials are generated when a provider is verified",
    },
  });
};

// API: Provider Login
const providerLoginAPI = async (req, res, next) => {
  try {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error("Authentication error:", err);
        return handleResponse(res, {
          type: "api",
          success: false,
          statusCode: 500,
          message: "Authentication error",
          data: { error: err.message },
        });
      }

      if (!user) {
        return handleResponse(res, {
          type: "api",
          success: false,
          statusCode: 401,
          message: info.message || "Invalid credentials",
        });
      }

      req.logIn(user, (err) => {
        if (err) {
          console.error("Login error:", err);
          return handleResponse(res, {
            type: "api",
            success: false,
            statusCode: 500,
            message: "Login error",
            data: { error: err.message },
          });
        }

        return handleResponse(res, {
          type: "api",
          success: true,
          message: "Login successful",
          data: {
            provider: {
              id: user._id,
              name: user.name,
              bppId: user.bppId,
              email: user.email,
              username: user.username,
              isVerified: user.isVerified,
            },
            session: {
              expiresIn: "24h",
            },
          },
        });
      });
    })(req, res, next);
  } catch (error) {
    console.error("Login API error:", error);
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
  try {
    // Clear session
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
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
  } catch (error) {
    console.error("Logout error:", error);
    return handleResponse(res, {
      type: "api",
      success: false,
      statusCode: 500,
      message: "Logout error",
      data: { error: error.message },
    });
  }
};

// API: Get Provider Dashboard Data
const getProviderDashboard = async (req, res) => {
  try {
    const provider = req.user;

    // Additional dashboard data can be fetched here
    // For example, shipment statistics, recent orders, etc.

    return handleResponse(res, {
      type: "api",
      success: true,
      message: "Dashboard data retrieved successfully",
      data: {
        provider: {
          id: provider._id,
          name: provider.name,
          bppId: provider.bppId,
          email: provider.email,
          username: provider.username,
          isVerified: provider.isVerified,
        },
        stats: {
          // Example statistics, replace with actual data
          totalShipments: 0,
          pendingShipments: 0,
          completedShipments: 0,
          cancelledShipments: 0,
        },
        // Additional dashboard data can be added here
      },
    });
  } catch (error) {
    console.error("Error retrieving dashboard data:", error);
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
const getProviderProfile = async (req, res) => {
  try {
    const provider = req.user;

    return handleResponse(res, {
      type: "api",
      success: true,
      message: "Provider profile retrieved successfully",
      data: {
        provider: {
          id: provider._id,
          name: provider.name,
          bppId: provider.bppId,
          email: provider.email,
          hasBaseUri: provider.hasBaseUri,
          baseUri: provider.baseUri,
          actions: provider.actions,
          supportedPincodes: provider.supportedPincodes,
          weightLimits: provider.weightLimits,
          dimensionalLimits: provider.dimensionalLimits,
          isVerified: provider.isVerified,
          verifiedAt: provider.verifiedAt,
          createdAt: provider.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("Error retrieving provider profile:", error);
    return handleResponse(res, {
      type: "api",
      success: false,
      statusCode: 500,
      message: "Failed to retrieve provider profile",
      data: { error: error.message },
    });
  }
};

module.exports = {
  showLogin,
  login,
  showDashboard,
  logout,
  generateCredentials,
  getProviderLoginAPI,
  providerLoginAPI,
  providerLogoutAPI,
  getProviderDashboard,
  getProviderProfile,
  showCarrierOnboard,
};
