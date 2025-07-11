const express = require("express");
const router = express.Router();
const providerController = require("../controllers/providerController");

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

module.exports = router;
