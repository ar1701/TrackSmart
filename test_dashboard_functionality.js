// Test provider dashboard functionality
const express = require("express");
const session = require("express-session");
const path = require("path");

const app = express();

// Set up EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Session setup
app.use(
  session({
    secret: "test-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
  })
);

// Test provider data
const testProvider = {
  _id: "507f1f77bcf86cd799439011",
  bppId: "TS000001",
  name: "Test Provider",
  email: "test@provider.com",
  username: "testprovider",
  isVerified: true,
  createdAt: new Date("2025-01-01"),
  verifiedAt: new Date("2025-01-15"),
};

// Test dashboard route
app.get("/test-dashboard", (req, res) => {
  // Simulate authenticated session
  req.session.user = {
    type: "provider",
    providerId: testProvider._id,
    ...testProvider,
  };

  const stats = {
    totalRequests: 5,
    pendingRequests: 2,
    acceptedRequests: 2,
    rejectedRequests: 1,
    totalRevenue: 2500,
  };

  const testRequests = [
    {
      _id: "req1",
      requestId: "REQ001",
      status: "pending",
      source: "Delhi",
      destination: "Mumbai",
      estimatedCost: 1200,
      createdAt: new Date(),
    },
    {
      _id: "req2",
      requestId: "REQ002",
      status: "pending",
      source: "Bangalore",
      destination: "Chennai",
      estimatedCost: 800,
      createdAt: new Date(),
    },
  ];

  res.render("providerPage/dashboard", {
    title: "Provider Dashboard",
    provider: testProvider,
    requests: testRequests,
    pendingRequests: testRequests,
    stats: stats,
  });
});

// Test logout endpoint
app.post("/api/providers/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Logout error" });
    }
    res.json({ success: true, message: "Logged out successfully" });
  });
});

// Test accept/reject endpoints
app.post("/api/providers/requests/:requestId/accept", (req, res) => {
  console.log("Accept request:", req.params.requestId, req.body);
  res.json({
    success: true,
    message: "Request accepted successfully",
    data: { request: { id: req.params.requestId, status: "accepted" } },
  });
});

app.post("/api/providers/requests/:requestId/reject", (req, res) => {
  console.log("Reject request:", req.params.requestId, req.body);
  res.json({
    success: true,
    message: "Request rejected successfully",
    data: { request: { id: req.params.requestId, status: "rejected" } },
  });
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
  console.log(`Visit: http://localhost:${PORT}/test-dashboard`);
  console.log("Press Ctrl+C to stop");
});
