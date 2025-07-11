var dotenv = require("dotenv").config();
var express = require("express");
var path = require("path");
var app = express();

// Import configurations and middleware
var connectDB = require("./utils/connectToDB");
var logger = require("./middleware/logger");
var errorHandler = require("./middleware/errorHandler");

// Import routes
var apiRoutes = require("./routes/index");

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
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

// Error handling middleware (should be last)
app.use(errorHandler);

app.listen(process.env.PORT || 3000, function () {
  console.log("http://localhost:" + (process.env.PORT || 3000));
});

module.exports = app;
