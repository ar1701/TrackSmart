const express = require("express");
const router = express.Router();
const sellerController = require("../controllers/sellerController");
const sellerAuthController = require("../controllers/sellerAuthController");
const shipmentController = require("../controllers/shipmentController");

// Seller Management API Routes (for admin dashboard)
// POST - Create a new seller onboard request
router.post("/", sellerController.createSellerRequest);

// GET - View all onboard requests (pending verification)
router.get("/onboard-requests", sellerController.getOnboardRequests);

// GET - View all verified sellers
router.get("/verified", sellerController.getVerifiedSellers);

// GET - View all rejected sellers
router.get("/rejected", sellerController.getRejectedSellers);

// PUT - Verify a seller
router.put("/:sellerId/verify", sellerController.verifySeller);

// PUT - Reject a seller
router.put("/:sellerId/reject", sellerController.rejectSeller);

// Middleware to check if seller is authenticated
const isSellerAuthenticated = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.type === "seller") {
    return next();
  }
  return res.status(401).json({
    success: false,
    message: "Access denied. Please login as a seller.",
  });
};

// Authentication Routes
router.post("/login", sellerAuthController.sellerLoginAPI);
router.post(
  "/logout",
  isSellerAuthenticated,
  sellerAuthController.sellerLogoutAPI
);

// Dashboard and Profile Routes
router.get(
  "/dashboard",
  isSellerAuthenticated,
  sellerAuthController.getSellerDashboard
);

// Dashboard View Route
router.get("/dashboard-view", isSellerAuthenticated, (req, res) => {
  res.render("seller_dashboard", {
    title: "Seller Dashboard - TrackSmart",
    currentPage: "dashboard",
    user: req.session.user,
  });
});

router.get(
  "/profile",
  isSellerAuthenticated,
  sellerAuthController.getSellerProfile
);
router.put(
  "/profile",
  isSellerAuthenticated,
  sellerAuthController.updateSellerProfile
);

// Seller Registration Route (if not handled elsewhere)
router.post("/register", sellerAuthController.sellerRegisterAPI);

// Shipment Routes
router.get(
  "/shipments",
  isSellerAuthenticated,
  shipmentController.getSellerShipments
);

router.post(
  "/shipments",
  isSellerAuthenticated,
  shipmentController.createShipment
);

router.get(
  "/shipments/:shipmentId",
  isSellerAuthenticated,
  shipmentController.getShipmentDetails
);

// Quote-related routes
router.get(
  "/shipments/:shipmentId/quotes",
  isSellerAuthenticated,
  shipmentController.getShipmentQuotes
);

router.post(
  "/shipments/:shipmentId/quotes/refresh",
  isSellerAuthenticated,
  shipmentController.requestFreshQuotes
);

router.post(
  "/shipments/:shipmentId/quotes/:quoteId/select",
  isSellerAuthenticated,
  shipmentController.createShipmentRequest
);

// Shipment requests for seller
router.get(
  "/requests",
  isSellerAuthenticated,
  shipmentController.getSellerShipmentRequests
);

// Quote Routes
router.get(
  "/shipments/:shipmentId/quotes",
  isSellerAuthenticated,
  shipmentController.getShipmentQuotes
);

router.post(
  "/shipments/:shipmentId/quotes/refresh",
  isSellerAuthenticated,
  shipmentController.requestFreshQuotes
);

router.post(
  "/shipments/:shipmentId/quotes/:quoteId/select",
  isSellerAuthenticated,
  shipmentController.createShipmentRequest
);

// Shipment Request Routes
router.get(
  "/shipment-requests",
  isSellerAuthenticated,
  shipmentController.getSellerShipmentRequests
);

// Quote Routes
router.get(
  "/shipments/:shipmentId/quotes",
  isSellerAuthenticated,
  shipmentController.getShipmentQuotes
);

router.post(
  "/shipments/:shipmentId/quotes/refresh",
  isSellerAuthenticated,
  shipmentController.requestFreshQuotes
);

router.post(
  "/shipments/:shipmentId/quotes/:quoteId/select",
  isSellerAuthenticated,
  shipmentController.createShipmentRequest
);

// Shipment Request Routes
router.get(
  "/requests",
  isSellerAuthenticated,
  shipmentController.getSellerShipmentRequests
);

// Location and Distance API Routes
router.get(
  "/location/:pincode",
  isSellerAuthenticated,
  shipmentController.getLocationFromPincode
);

router.post(
  "/calculate-distance",
  isSellerAuthenticated,
  shipmentController.calculateDistanceBetweenPincodes
);

// View Routes for shipment pages
router.get("/new-shipment", isSellerAuthenticated, (req, res) => {
  res.render("seller_new_shipment", {
    title: "Create New Shipment - TrackSmart",
    currentPage: "new-shipment",
    user: req.session.user,
  });
});

router.get("/my-shipments", isSellerAuthenticated, (req, res) => {
  res.render("seller_shipments", {
    title: "My Shipments - TrackSmart",
    currentPage: "shipments",
    user: req.session.user,
  });
});

router.get("/quotes", isSellerAuthenticated, (req, res) => {
  res.render("seller_quotes", {
    title: "Provider Quotes - TrackSmart",
    currentPage: "quotes",
    user: req.session.user,
  });
});

module.exports = router;
