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

// POST - Provider logout API endpoint
router.post(
  "/logout",
  ensureAPIAuthenticated,
  authController.providerLogoutAPI
);

module.exports = router;
