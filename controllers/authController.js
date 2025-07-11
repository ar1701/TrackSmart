const bcrypt = require("bcryptjs");
const Provider = require("../model/provider");
const passport = require("passport");
const { handleResponse } = require("../utils/responseHandler");

// Show login page
const showLogin = (req, res) => {
  res.render("login", {
    title: "Provider Login",
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
    res.render("dashboard", {
      title: "Provider Dashboard",
      provider: provider,
    });
  } catch (error) {
    console.error("Error loading dashboard:", error);
    res.status(500).render("error", { message: "Error loading dashboard" });
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
  return handleResponse(req, res, "api-response", {
    success: true,
    message: "Provider login information",
    data: {
      loginEndpoint: "/api/providers/login",
      method: "POST",
      requiredFields: ["username", "password"],
      note: "Login credentials are generated when a provider is verified",
    }
  }, { title: "Provider Login Information" });
};

// API: Provider Login
const providerLoginAPI = async (req, res, next) => {
  try {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error("Authentication error:", err);
        return handleResponse(req, res, "api-response", {
          success: false,
          message: "Authentication error",
          error: err.message,
          status: 500
        }, { title: "Login Error" });
      }

      if (!user) {
        return handleResponse(req, res, "api-response", {
          success: false,
          message: info.message || "Invalid credentials",
          status: 401
        }, { title: "Login Failed" });
      }

      req.logIn(user, (err) => {
        if (err) {
          console.error("Login error:", err);
          return handleResponse(req, res, "api-response", {
            success: false,
            message: "Login error",
            error: err.message,
            status: 500
          }, { title: "Login Error" });
        }

        return handleResponse(req, res, "api-response", {
          success: true,
          message: "Login successful",
          data: {
            provider: {
              id: user._id,
              name: user.name,
              bppId: user.bppId,
              email: user.email,
            },
            session: {
              expiresIn: "24h",
            },
          }
        }, { title: "Login Successful" });
      });
    })(req, res, next);
  } catch (error) {
    console.error("Login API error:", error);
    return handleResponse(req, res, "api-response", {
      success: false,
      message: "Login processing error",
      error: error.message,
      status: 500
    }, { title: "Login Error" });
  }
};

// API: Provider Logout
const providerLogoutAPI = (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error("Logout error:", err);
      return handleResponse(req, res, "api-response", {
        success: false,
        message: "Logout error",
        error: err.message,
        status: 500
      }, { title: "Logout Error" });
    }

    return handleResponse(req, res, "api-response", {
      success: true,
      message: "Logged out successfully"
    }, { title: "Logout Successful" });
  });
};

// API: Get Provider Dashboard Data
const getProviderDashboard = async (req, res) => {
  try {
    const provider = req.user;

    // Additional dashboard data can be fetched here
    // For example, shipment statistics, recent orders, etc.

    return handleResponse(req, res, "api-response", {
      success: true,
      message: "Dashboard data retrieved successfully",
      data: {
        provider: {
          id: provider._id,
          name: provider.name,
          bppId: provider.bppId,
          email: provider.email,
        },
        stats: {
          // Example statistics, replace with actual data
          totalShipments: 0,
          pendingShipments: 0,
          completedShipments: 0,
          cancelledShipments: 0,
        },
        // Additional dashboard data can be added here
      }
    }, { title: "Provider Dashboard" });
  } catch (error) {
    console.error("Error retrieving dashboard data:", error);
    return handleResponse(req, res, "api-response", {
      success: false,
      message: "Failed to retrieve dashboard data",
      error: error.message,
      status: 500
    }, { title: "Dashboard Error" });
  }
};

// API: Get Provider Profile
const getProviderProfile = async (req, res) => {
  try {
    const provider = req.user;

    return handleResponse(req, res, "api-response", {
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
        }
      }
    }, { title: "Provider Profile" });
  } catch (error) {
    console.error("Error retrieving provider profile:", error);
    return handleResponse(req, res, "api-response", {
      success: false,
      message: "Failed to retrieve provider profile",
      error: error.message,
      status: 500
    }, { title: "Profile Error" });
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
};
