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
  res.json({
    success: true,
    message: "Welcome to TrackSmart!",
    version: "1.0.0",
    api: {
      baseUrl: "/api",
      documentation: "Visit /api for API endpoints",
    },
  });
});

// API Routes
app.use("/api", apiRoutes);

// Authentication Routes
app.use("/", authRoutes);

// Error handling middleware (should be last)
app.use(errorHandler);

app.listen(process.env.PORT || 3000, function () {
  console.log("http://localhost:" + (process.env.PORT || 3000));
});

module.exports = app;
