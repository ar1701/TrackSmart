const express = require("express");
const router = express.Router();
const providerController = require("../controllers/providerController");
const authController = require("../controllers/authController");
const passport = require("../config/passport");
const { ensureAuthenticated } = require("../middleware/auth");
const {
  ensureAPIAuthenticated,
  ensureAPINotAuthenticated,
  ensureProviderVerified,
} = require("../middleware/apiAuth");

// POST - Create a new provider onboard request
router.post("/", providerController.createProviderRequest);

// GET - View all onboard requests (pending verification)
router.get("/onboard-requests", providerController.getOnboardRequests);

// GET - View all verified providers
router.get("/verified", providerController.getVerifiedProviders);

// GET - View all rejected providers
router.get("/rejected", providerController.getRejectedProviders);

// PUT - Verify a provider
router.put("/:bppId/verify", providerController.verifyProvider);

// PUT - Reject a provider
router.put("/:bppId/reject", providerController.rejectProvider);

// POST - Generate login credentials for verified provider
router.post(
  "/:bppId/credentials",
  providerController.generateProviderCredentials
);

// GET - Provider login page/info API endpoint
router.get("/login", authController.getProviderLoginAPI);

// POST - Provider login API endpoint
router.post(
  "/login",
  ensureAPINotAuthenticated,
  authController.providerLoginAPI
);

// GET - Get provider dashboard data (API endpoint)
router.get(
  "/dashboard",
  ensureProviderVerified,
  authController.getProviderDashboard
);

// GET - Get current provider profile
router.get(
  "/profile",
  ensureProviderVerified,
  authController.getProviderProfile
);

// Middleware to check if provider is authenticated via session
const ensureProviderSessionAuthenticated = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.type === "provider") {
    return next();
  }
  return res.status(401).json({
    success: false,
    message: "Access denied. Please login as a provider.",
  });
};

// Shipment Request Routes
router.get(
  "/requests",
  ensureProviderSessionAuthenticated,
  providerController.getProviderRequests
);

router.get(
  "/dashboard-data",
  ensureProviderSessionAuthenticated,
  providerController.getProviderDashboard
);

router.post(
  "/requests/:requestId/accept",
  ensureProviderSessionAuthenticated,
  providerController.acceptShipmentRequest
);

router.post(
  "/requests/:requestId/reject",
  ensureProviderSessionAuthenticated,
  providerController.rejectShipmentRequest
);

// POST - Update shipment status
router.post(
  "/requests/:requestId/update-status",
  ensureProviderSessionAuthenticated,
  providerController.updateShipmentStatus
);

// POST - Provider logout API endpoint
router.post(
  "/logout",
  ensureAPIAuthenticated,
  authController.providerLogoutAPI
);

// Provider Auth Routes (for main login system)
const providerAuthController = require("../controllers/providerAuthController");

// Middleware to check if provider is authenticated
const isProviderAuthenticated = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.type === "provider") {
    return next();
  }
  return res.status(401).json({
    success: false,
    message: "Access denied. Please login as a provider.",
  });
};

// Provider Authentication Routes (compatible with main login)
router.post("/providers/login", providerAuthController.login);
router.post(
  "/providers/logout",
  isProviderAuthenticated,
  providerAuthController.logout
);
router.get(
  "/providers/dashboard",
  isProviderAuthenticated,
  providerAuthController.dashboard
);
router.get(
  "/providers/profile",
  isProviderAuthenticated,
  providerAuthController.getProfile
);
router.put(
  "/providers/profile",
  isProviderAuthenticated,
  providerAuthController.updateProfile
);

module.exports = router;
