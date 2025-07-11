var dotenv = require('dotenv').config();
var express = require('express');
var path = require('path');
var app = express();
var connectToDB = require('./utils/connectToDB');
var mongoose = require('mongoose');
var Provider = require('./model/provider');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

connectToDB().then(() => {
  console.log("Database connected successfully");
}).catch((err) => {
  console.error("Database connection failed:", err);
});

app.get("/",(req,res)=>{
  res.send("Welcome to TrackSmart!");
});

// POST API to create a new provider onboard request
app.post("/api/providers", async (req, res) => {
  try {
    const {
      name,
      email,
      baseUri,
      actions,
      supportedPincodes,
      weightLimits,
      dimensionalLimits,
      credentials
    } = req.body;

    // Validate required fields
    if (!name || !email || !baseUri) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and baseUri are required fields"
      });
    }

    // Create new provider instance
    const newProvider = new Provider({
      name,
      email,
      baseUri,
      actions: actions || [],
      supportedPincodes: supportedPincodes || [],
      weightLimits: weightLimits || { min: 0, max: 0 },
      dimensionalLimits: dimensionalLimits || { l: 0, w: 0, h: 0 },
      credentials: credentials || {},
      isVerified: false // Default to false for onboard request
    });

    // Save to database (bppId will be auto-generated)
    const savedProvider = await newProvider.save();

    res.status(201).json({
      success: true,
      message: "Provider onboard request submitted successfully. Please wait for verification.",
      data: savedProvider
    });

  } catch (error) {
    console.error("Error creating provider:", error);
    
    // Handle duplicate key error for email or bppId
    if (error.code === 11000) {
      const field = error.keyPattern.email ? 'email' : 'bppId';
      return res.status(409).json({
        success: false,
        message: `Provider with this ${field} already exists`
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});

// GET API to view all onboard requests (pending verification)
app.get("/api/providers/onboard-requests", async (req, res) => {
  try {
    const pendingProviders = await Provider.find({ isVerified: false })
      .select('-credentials') // Exclude sensitive credentials from response
      .sort({ requestedAt: -1 }); // Sort by latest requests first

    res.status(200).json({
      success: true,
      message: "Onboard requests retrieved successfully",
      count: pendingProviders.length,
      data: pendingProviders
    });

  } catch (error) {
    console.error("Error fetching onboard requests:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});

// GET API to view all verified providers
app.get("/api/providers/verified", async (req, res) => {
  try {
    const verifiedProviders = await Provider.find({ isVerified: true })
      .select('-credentials') // Exclude sensitive credentials from response
      .sort({ verifiedAt: -1 }); // Sort by latest verified first

    res.status(200).json({
      success: true,
      message: "Verified providers retrieved successfully",
      count: verifiedProviders.length,
      data: verifiedProviders
    });

  } catch (error) {
    console.error("Error fetching verified providers:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});

// PUT API to verify a provider
app.put("/api/providers/:bppId/verify", async (req, res) => {
  try {
    const { bppId } = req.params;

    // Find the provider and update verification status
    const provider = await Provider.findOneAndUpdate(
      { bppId: bppId, isVerified: false },
      { 
        isVerified: true,
        verifiedAt: new Date()
      },
      { new: true, runValidators: true }
    ).select('-credentials'); // Exclude sensitive credentials from response

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found or already verified"
      });
    }

    res.status(200).json({
      success: true,
      message: "Provider verified successfully",
      data: provider
    });

  } catch (error) {
    console.error("Error verifying provider:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});

// PUT API to reject/unverify a provider
app.put("/api/providers/:bppId/reject", async (req, res) => {
  try {
    const { bppId } = req.params;
    const { reason } = req.body;

    // Find the provider and update verification status
    const provider = await Provider.findOneAndUpdate(
      { bppId: bppId },
      { 
        isVerified: false,
        verifiedAt: null,
        rejectionReason: reason || "No reason provided"
      },
      { new: true, runValidators: true }
    ).select('-credentials'); // Exclude sensitive credentials from response

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Provider verification rejected",
      data: provider
    });

  } catch (error) {
    console.error("Error rejecting provider:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});

app.listen(process.env.PORT || 3000, function() {
    console.log('http://localhost:' + (process.env.PORT || 3000));
});

module.exports = app;