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

module.exports = router;
