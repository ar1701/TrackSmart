const express = require("express");
const router = express.Router();

// Import route modules
const providerRoutes = require("./providerRoutes");

// Use route modules
router.use("/providers", providerRoutes);

// API Root route
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to TrackSmart API!",
    version: "1.0.0",
    endpoints: {
      providers: "/api/providers",
      onboardRequests: "/api/providers/onboard-requests",
      verifiedProviders: "/api/providers/verified",
    },
  });
});

module.exports = router;
