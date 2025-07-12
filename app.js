var dotenv = require("dotenv").config();
var express = require("express");
var path = require("path");
var session = require("express-session");
var flash = require("connect-flash");
var app = express();

// Import configurations and middleware
var connectDB = require("./utils/connectToDB");
var logger = require("./middleware/logger");
var errorHandler = require("./middleware/errorHandler");
var passport = require("./config/passport");

// Import routes
var apiRoutes = require("./routes/index");
var authRoutes = require("./routes/authRoutes");
var sellerRoutes = require("./routes/sellerRoutes");
var adminRoutes = require("./routes/adminRoutes");
var userRoutes = require("./routes/userRoutes");
var providerRoutes = require("./routes/providerRoutes");

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "tracksmart-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Flash messages
app.use(flash());

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.use(logger); // Request logging

// Database connection
connectDB()
  .then(() => {
    console.log("Database connected successfully");
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
  });

// Main root route
app.get("/", (req, res) => {
  res.render("index", {
    title: "TrackSmart - Universal Logistics Platform",
    currentPage: "home",
  });
});

// API Routes
app.use("/api", apiRoutes);

// Authentication Routes
app.use("/", authRoutes);

// Seller Dashboard View Route (non-API)
app.get("/seller/dashboard", (req, res) => {
  // Check if seller is authenticated
  if (req.session && req.session.user && req.session.user.type === "seller") {
    res.render("seller_dashboard", {
      title: "Seller Dashboard - TrackSmart",
      currentPage: "dashboard",
      user: req.session.user,
    });
  } else {
    res.redirect("/main-login");
  }
});

// User Routes
app.use("/api/users", userRoutes);

// Seller Routes
app.use("/api/sellers", sellerRoutes);

// Admin Routes
app.use("/api/admin", adminRoutes);

// Provider Routes
app.use("/api/providers", providerRoutes);

// Error handling middleware (should be last)
app.use(errorHandler);

app.listen(process.env.PORT || 3000, function () {
  console.log("http://localhost:" + (process.env.PORT || 3000));
});

module.exports = app;
