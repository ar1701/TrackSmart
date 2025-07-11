const Provider = require("../model/provider");

// Create a new provider onboard request
const createProviderRequest = async (req, res) => {
  try {
    const {
      name,
      email,
      baseUri,
      actions,
      supportedPincodes,
      weightLimits,
      dimensionalLimits,
      credentials,
    } = req.body;

    // Validate required fields
    if (!name || !email || !baseUri) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and baseUri are required fields",
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
      isVerified: false, // Default to false for onboard request
    });

    // Save to database (bppId will be auto-generated)
    const savedProvider = await newProvider.save();

    res.status(201).json({
      success: true,
      message:
        "Provider onboard request submitted successfully. Please wait for verification.",
      data: savedProvider,
    });
  } catch (error) {
    console.error("Error creating provider:", error);

    // Handle duplicate key error for email or bppId
    if (error.code === 11000) {
      const field = error.keyPattern.email ? "email" : "bppId";
      return res.status(409).json({
        success: false,
        message: `Provider with this ${field} already exists`,
      });
    }

    // Handle validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get all onboard requests (pending verification)
const getOnboardRequests = async (req, res) => {
  try {
    const pendingProviders = await Provider.find({ isVerified: false })
      .select("-credentials") // Exclude sensitive credentials from response
      .sort({ requestedAt: -1 }); // Sort by latest requests first

    res.status(200).json({
      success: true,
      message: "Onboard requests retrieved successfully",
      count: pendingProviders.length,
      data: pendingProviders,
    });
  } catch (error) {
    console.error("Error fetching onboard requests:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get all verified providers
const getVerifiedProviders = async (req, res) => {
  try {
    const verifiedProviders = await Provider.find({ isVerified: true })
      .select("-credentials") // Exclude sensitive credentials from response
      .sort({ verifiedAt: -1 }); // Sort by latest verified first

    res.status(200).json({
      success: true,
      message: "Verified providers retrieved successfully",
      count: verifiedProviders.length,
      data: verifiedProviders,
    });
  } catch (error) {
    console.error("Error fetching verified providers:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Verify a provider
const verifyProvider = async (req, res) => {
  try {
    const { bppId } = req.params;

    // Find the provider and update verification status
    const provider = await Provider.findOneAndUpdate(
      { bppId: bppId, isVerified: false },
      {
        isVerified: true,
        verifiedAt: new Date(),
      },
      { new: true, runValidators: true }
    ).select("-credentials"); // Exclude sensitive credentials from response

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found or already verified",
      });
    }

    res.status(200).json({
      success: true,
      message: "Provider verified successfully",
      data: provider,
    });
  } catch (error) {
    console.error("Error verifying provider:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Reject a provider
const rejectProvider = async (req, res) => {
  try {
    const { bppId } = req.params;
    const { reason, message } = req.body;

    // Use either 'reason' or 'message' field for backward compatibility
    const rejectionMessage = reason || message || "No reason provided";

    // Find the provider and update verification status
    const provider = await Provider.findOneAndUpdate(
      { bppId: bppId },
      {
        isVerified: false,
        verifiedAt: null,
        rejectionReason: rejectionMessage,
        rejectedAt: new Date(),
      },
      { new: true, runValidators: true }
    ).select("-credentials"); // Exclude sensitive credentials from response

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Provider verification rejected",
      data: provider,
    });
  } catch (error) {
    console.error("Error rejecting provider:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  createProviderRequest,
  getOnboardRequests,
  getVerifiedProviders,
  verifyProvider,
  rejectProvider,
};
