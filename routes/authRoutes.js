const express = require("express");
const router = express.Router();
const passport = require("../config/passport");
const authController = require("../controllers/authController");
const {
  ensureAuthenticated,
  ensureNotAuthenticated,
} = require("../middleware/auth");

// Provider login page
router.get("/login", ensureNotAuthenticated, authController.showLogin);

// Provider login page (alternative route)
router.get("/provider/login", ensureNotAuthenticated, authController.showLogin);

// Handle provider login
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

// Handle provider login (alternative route)
router.post(
  "/provider/login",
  ensureNotAuthenticated,
  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/provider/login",
    failureFlash: true,
  }),
  authController.login
);

// Provider dashboard
router.get("/dashboard", ensureAuthenticated, authController.showDashboard);

// Provider dashboard (alternative route)
router.get(
  "/provider/dashboard",
  ensureAuthenticated,
  authController.showDashboard
);

// Provider logout
router.post("/logout", ensureAuthenticated, authController.logout);
router.get("/logout", ensureAuthenticated, authController.logout);

// Provider logout (alternative routes)
router.post("/provider/logout", ensureAuthenticated, authController.logout);
router.get("/provider/logout", ensureAuthenticated, authController.logout);

module.exports = router;
