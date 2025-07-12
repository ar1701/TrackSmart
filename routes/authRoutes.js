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
