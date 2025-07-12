const express = require("express");
const router = express.Router();
const userAuthController = require("../controllers/userAuthController");

// Middleware to check if user is authenticated
const isUserAuthenticated = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.type === "user") {
    return next();
  }
  return res.status(401).json({
    success: false,
    message: "Access denied. Please login as a user.",
  });
};

// Authentication Routes
router.post("/login", userAuthController.login);
router.post("/logout", isUserAuthenticated, userAuthController.logout);

// Dashboard and Profile Routes
router.get("/dashboard", isUserAuthenticated, userAuthController.dashboard);
router.get("/profile", isUserAuthenticated, userAuthController.getProfile);
router.put("/profile", isUserAuthenticated, userAuthController.updateProfile);

// User Registration Route
router.post("/register", userAuthController.register);

// Additional user-specific routes can be added here
router.get("/orders", isUserAuthenticated, (req, res) => {
  // TODO: Implement user orders functionality
  res.json({ success: true, message: "User orders endpoint" });
});

router.get("/tracking-history", isUserAuthenticated, (req, res) => {
  // TODO: Implement tracking history functionality
  res.json({ success: true, message: "User tracking history endpoint" });
});

module.exports = router;
