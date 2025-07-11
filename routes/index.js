const express = require("express");
const router = express.Router();

// Import route modules
const providerRoutes = require("./providerRoutes");
const authRoutes = require("./authRoutes");

// Use route modules
router.use("/providers", providerRoutes);

// API Root route
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to TrackSmart API!",
    version: "1.0.0",
    endpoints: {
      providers: {
        onboard: "POST /api/providers",
        onboardRequests: "GET /api/providers/onboard-requests",
        verifiedProviders: "GET /api/providers/verified",
        verify: "PUT /api/providers/:bppId/verify",
        reject: "PUT /api/providers/:bppId/reject",
        generateCredentials: "POST /api/providers/:bppId/credentials",
      },
      authentication: {
        loginInfo: "GET /api/providers/login",
        login: "POST /api/providers/login",
        logout: "POST /api/providers/logout",
        dashboard: "GET /api/providers/dashboard",
        profile: "GET /api/providers/profile",
      },
      webRoutes: {
        login: "/login",
        dashboard: "/dashboard",
      },
    },
    notes: {
      authentication:
        "All dashboard and profile endpoints require authentication",
      credentials:
        "Login credentials are generated when a provider is verified",
    },
  });
});

module.exports = router;
