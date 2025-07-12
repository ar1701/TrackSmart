const express = require("express");
const router = express.Router();
const passport = require("../config/passport");
const authController = require("../controllers/authController");
const {
  ensureAuthenticated,
  ensureNotAuthenticated,
} = require("../middleware/auth");

// Login page
router.get("/login", ensureNotAuthenticated, authController.showLogin);

// Carrier onboard page
router.get("/onboard-carrier", authController.showCarrierOnboard);

// Handle login
router.post(
  "/login",
  ensureNotAuthenticated,
  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
    failureFlash: true,
  }),
  authController.login
);

// Dashboard
router.get("/dashboard", ensureAuthenticated, authController.showDashboard);

// Logout
router.post("/logout", ensureAuthenticated, authController.logout);
router.get("/logout", ensureAuthenticated, authController.logout);

// Static pages routes
router.get("/about", (req, res) => {
  res.render("about", {
    title: "About Us - TrackSmart",
    currentPage: "about",
  });
});

router.get("/service", (req, res) => {
  res.render("service", {
    title: "Services - TrackSmart",
    currentPage: "service",
  });
});

router.get("/contact", (req, res) => {
  res.render("contact", {
    title: "Contact Us - TrackSmart",
    currentPage: "contact",
  });
});

router.get("/analytics", (req, res) => {
  res.render("analytics", {
    title: "Analytics & Dashboard - TrackSmart",
    currentPage: "analytics",
  });
});

router.get("/onboard-seller", (req, res) => {
  res.render("onboard_seller", {
    title: "Onboard Seller - TrackSmart",
    currentPage: "onboard-seller",
  });
});

router.get("/place-order", (req, res) => {
  res.render("place-order", {
    title: "Place Order - TrackSmart",
    currentPage: "place-order",
  });
});

router.get("/track", (req, res) => {
  res.render("track", {
    title: "Track Package - TrackSmart",
    currentPage: "track",
  });
});

router.get("/update_status", (req, res) => {
  res.render("update_status", {
    title: "Update Status - TrackSmart",
    currentPage: "update-status",
  });
});

// Main login page
router.get("/main-login", (req, res) => {
  res.render("main_login", {
    title: "Login - TrackSmart",
    currentPage: "main-login",
  });
});

// Unified login API endpoint
router.post("/main-login", async (req, res) => {
  try {
    const { username, password, userType, rememberMe } = req.body;

    // Validate required fields
    if (!username || !password || !userType) {
      return res.status(400).json({
        success: false,
        message: "Username, password, and user type are required",
      });
    }

    // Import required controllers and models
    const bcrypt = require("bcryptjs");
    const { handleResponse } = require("../utils/responseHandler");

    let result;

    switch (userType) {
      case "seller":
        const Seller = require("../model/seller");

        // Find seller by username or email
        const seller = await Seller.findOne({
          $or: [{ username: username }, { email: username.toLowerCase() }],
          isVerified: true,
          status: "verified",
        });

        if (!seller) {
          return res.status(401).json({
            success: false,
            message: "Invalid credentials or account not verified",
          });
        }

        // Check password
        const isSellerPasswordMatch = await bcrypt.compare(
          password,
          seller.password
        );
        if (!isSellerPasswordMatch) {
          return res.status(401).json({
            success: false,
            message: "Invalid credentials",
          });
        }

        // Create session
        req.session.user = {
          id: seller._id,
          type: "seller",
          sellerId: seller.sellerId,
          name: seller.name,
          email: seller.email,
        };

        if (rememberMe) {
          req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
        }

        result = {
          success: true,
          message: "Login successful",
          data: {
            user: {
              id: seller._id,
              type: "seller",
              name: seller.name,
              email: seller.email,
              businessName: seller.businessName,
            },
            redirectUrl: "/seller/dashboard",
          },
        };
        break;

      case "admin":
        const Admin = require("../model/admin");

        // Find admin by username or email
        const admin = await Admin.findOne({
          $or: [{ username: username }, { email: username.toLowerCase() }],
          isActive: true,
        });

        if (!admin) {
          return res.status(401).json({
            success: false,
            message: "Invalid credentials or account disabled",
          });
        }

        // Check password (plain text comparison for admin)
        const isAdminPasswordMatch = admin.password === password;
        if (!isAdminPasswordMatch) {
          return res.status(401).json({
            success: false,
            message: "Invalid credentials",
          });
        }

        // Update last login
        admin.lastLogin = new Date();
        admin.lastActivity = new Date();
        await admin.save();

        // Create session
        req.session.user = {
          id: admin._id,
          type: "admin",
          adminId: admin.adminId,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          permissions: admin.permissions,
        };

        req.session.admin = {
          id: admin._id,
          adminId: admin.adminId,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          permissions: admin.permissions,
        };

        if (rememberMe) {
          req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
        }

        result = {
          success: true,
          message: "Login successful",
          data: {
            user: {
              id: admin._id,
              type: "admin",
              name: admin.name,
              email: admin.email,
              role: admin.role,
            },
            redirectUrl: "/admin/dashboard",
          },
        };
        break;

      case "user":
        // TODO: Implement user login logic
        return res.status(501).json({
          success: false,
          message: "User login not yet implemented",
        });

      case "provider":
        const Provider = require("../model/provider");

        // Find provider by username, email, or bppId
        const provider = await Provider.findOne({
          $or: [
            { username: username },
            { email: username.toLowerCase() },
            { bppId: username },
          ],
          isVerified: true,
        });

        if (!provider) {
          return res.status(401).json({
            success: false,
            message: "Invalid credentials or account not verified",
          });
        }

        // Check if provider is rejected
        if (provider.rejectedAt) {
          return res.status(401).json({
            success: false,
            message: "Account has been rejected. Contact admin for assistance.",
          });
        }

        // Check password - support both stored password and fallback methods
        let isPasswordValid = false;

        if (provider.password) {
          // If provider has a stored password, use it
          isPasswordValid = password === provider.password;
        } else {
          // Fallback to email or bppId for legacy providers
          isPasswordValid =
            password === provider.email || password === provider.bppId;
        }

        if (!isPasswordValid) {
          return res.status(401).json({
            success: false,
            message: "Invalid credentials",
          });
        }

        // Create session
        req.session.user = {
          id: provider._id,
          type: "provider",
          providerId: provider._id,
          bppId: provider.bppId,
          name: provider.name,
          email: provider.email,
        };

        if (rememberMe) {
          req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
        }

        result = {
          success: true,
          message: "Login successful",
          data: {
            user: {
              id: provider._id,
              type: "provider",
              bppId: provider.bppId,
              name: provider.name,
              email: provider.email,
              isVerified: provider.isVerified,
            },
            redirectUrl: "/dashboard",
          },
        };
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Invalid user type",
        });
    }

    res.json(result);
  } catch (error) {
    console.error("Main login error:", error);
    res.status(500).json({
      success: false,
      message: "Login processing error",
      data: { error: error.message },
    });
  }
});

// User registration page
router.get("/register-user", (req, res) => {
  res.render("register_user", {
    title: "User Registration - TrackSmart",
    currentPage: "register",
  });
});

// Admin dashboard page
router.get("/admin/dashboard", async (req, res) => {
  try {
    // Check if admin is authenticated
    if (
      !req.session ||
      !req.session.user ||
      req.session.user.type !== "admin"
    ) {
      return res.redirect("/main-login");
    }

    // Get admin details from database
    const Admin = require("../model/admin");
    const admin = await Admin.findById(req.session.user.id);

    if (!admin) {
      return res.redirect("/main-login");
    }

    res.render("admin_dashboard", {
      title: "Admin Dashboard - TrackSmart",
      currentPage: "admin-dashboard",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        adminId: admin.adminId,
      },
    });
  } catch (error) {
    console.error("Error loading admin dashboard:", error);
    res.redirect("/main-login");
  }
});

// Test admin login page
router.get("/test-admin-login", (req, res) => {
  res.render("test_admin_login", {
    title: "Test Admin Login - TrackSmart",
    currentPage: "test-admin-login",
  });
});

module.exports = router;
