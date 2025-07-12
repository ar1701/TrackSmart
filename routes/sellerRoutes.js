const express = require("express");
const router = express.Router();
const sellerAuthController = require("../controllers/sellerAuthController");

// Middleware to check if seller is authenticated
const isSellerAuthenticated = (req, res, next) => {
  if (req.session && req.session.seller) {
    return next();
  }
  return res.status(401).json({
    success: false,
    message: "Access denied. Please login as a seller.",
  });
};

// Authentication Routes
router.post("/login", sellerAuthController.login);
router.post("/logout", isSellerAuthenticated, sellerAuthController.logout);

// Dashboard and Profile Routes
router.get("/dashboard", isSellerAuthenticated, sellerAuthController.dashboard);
router.get("/profile", isSellerAuthenticated, sellerAuthController.getProfile);
router.put(
  "/profile",
  isSellerAuthenticated,
  sellerAuthController.updateProfile
);

// Seller Registration Route (if not handled elsewhere)
router.post("/register", sellerAuthController.register);

module.exports = router;
