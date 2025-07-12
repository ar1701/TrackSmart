const express = require("express");
const router = express.Router();
const adminAuthController = require("../controllers/adminAuthController");

// Middleware to check if admin is authenticated
const isAdminAuthenticated = (req, res, next) => {
  if (req.session && req.session.admin) {
    return next();
  }
  return res.status(401).json({
    success: false,
    message: "Access denied. Please login as an admin.",
  });
};

// Middleware to check admin permissions
const hasPermission = (permission) => {
  return (req, res, next) => {
    if (!req.session.admin) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Please login as an admin.",
      });
    }

    if (!req.session.admin.permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Insufficient permissions.",
      });
    }

    next();
  };
};

// Authentication Routes
router.post("/login", adminAuthController.login);
router.post("/logout", isAdminAuthenticated, adminAuthController.logout);

// Dashboard and Profile Routes
router.get("/dashboard", isAdminAuthenticated, adminAuthController.dashboard);
router.get("/profile", isAdminAuthenticated, adminAuthController.getProfile);
router.put("/profile", isAdminAuthenticated, adminAuthController.updateProfile);

// Admin Management Routes (with permission checks)
router.get(
  "/users",
  isAdminAuthenticated,
  hasPermission("view_users"),
  (req, res) => {
    // TODO: Implement user management functionality
    res.json({ success: true, message: "User management endpoint" });
  }
);

router.get(
  "/sellers",
  isAdminAuthenticated,
  hasPermission("view_sellers"),
  (req, res) => {
    // TODO: Implement seller management functionality
    res.json({ success: true, message: "Seller management endpoint" });
  }
);

router.get(
  "/providers",
  isAdminAuthenticated,
  hasPermission("view_providers"),
  (req, res) => {
    // TODO: Implement provider management functionality
    res.json({ success: true, message: "Provider management endpoint" });
  }
);

router.get(
  "/reports",
  isAdminAuthenticated,
  hasPermission("view_reports"),
  (req, res) => {
    // TODO: Implement reports functionality
    res.json({ success: true, message: "Reports endpoint" });
  }
);

module.exports = router;
