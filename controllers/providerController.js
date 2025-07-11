const Provider = require("../model/provider");
const { handleResponse } = require("../utils/responseHandler");

// Create a new provider onboard request
const createProviderRequest = async (req, res) => {
  try {
    const {
      name,
      email,
      hasBaseUri,
      baseUri,
      actions,
      supportedPincodes,
      weightLimits,
      dimensionalLimits,
    } = req.body;

    // Validate required fields
    if (!name || !email) {
      return handleResponse(req, res, "api-response", {
        success: false,
        message: "Name and email are required fields",
        status: 400
      }, { title: "Provider Onboarding Error" });
    }

    // Validate baseUri only if hasBaseUri is true
    if (hasBaseUri === true && (!baseUri || baseUri.trim() === "")) {
      return handleResponse(req, res, "api-response", {
        success: false,
        message: "Base URI is required when 'Has Base URI' is selected",
        status: 400
      }, { title: "Provider Onboarding Error" });
    }

    // Create new provider instance
    const newProvider = new Provider({
      name,
      email,
      hasBaseUri: hasBaseUri || false,
      baseUri: hasBaseUri ? baseUri : undefined,
      actions: actions || [],
      supportedPincodes: supportedPincodes || [],
      weightLimits: weightLimits || { min: 0, max: 0 },
      dimensionalLimits: dimensionalLimits || { l: 0, w: 0, h: 0 },
      isVerified: false, // Default to false for onboard request
    });

    // Save to database (bppId will be auto-generated)
    const savedProvider = await newProvider.save();

    return handleResponse(req, res, "api-response", {
      success: true,
      message: "Provider onboard request submitted successfully",
      data: {
        provider: {
          id: savedProvider._id,
          name: savedProvider.name,
          bppId: savedProvider.bppId,
          email: savedProvider.email,
          isVerified: savedProvider.isVerified,
          createdAt: savedProvider.createdAt,
        },
      }
    }, { title: "Provider Onboarding Success" });
  } catch (error) {
    console.error("Error creating provider onboard request:", error);
    return handleResponse(req, res, "api-response", {
      success: false,
      message: "Failed to submit provider onboard request",
      error: error.message,
      status: 500
    }, { title: "Provider Onboarding Error" });
  }
};

// Get all provider onboard requests (pending verification)
const getOnboardRequests = async (req, res) => {
  try {
    const providers = await Provider.find({ isVerified: false }).sort({
      createdAt: -1,
    });

    return handleResponse(req, res, "api-response", {
      success: true,
      message: "Provider onboard requests retrieved successfully",
      data: {
        count: providers.length,
        providers: providers.map((p) => ({
          id: p._id,
          name: p.name,
          bppId: p.bppId,
          email: p.email,
          hasBaseUri: p.hasBaseUri,
          baseUri: p.baseUri,
          supportedPincodes: p.supportedPincodes,
          createdAt: p.createdAt,
        })),
      }
    }, { title: "Provider Onboard Requests" });
  } catch (error) {
    console.error("Error retrieving provider onboard requests:", error);
    return handleResponse(req, res, "api-response", {
      success: false,
      message: "Failed to retrieve provider onboard requests",
      error: error.message,
      status: 500
    }, { title: "Provider Requests Error" });
  }
};

// Get all verified providers
const getVerifiedProviders = async (req, res) => {
  try {
    const providers = await Provider.find({ isVerified: true }).sort({
      name: 1,
    });

    return handleResponse(req, res, "api-response", {
      success: true,
      message: "Verified providers retrieved successfully",
      data: {
        count: providers.length,
        providers: providers.map((p) => ({
          id: p._id,
          name: p.name,
          bppId: p.bppId,
          email: p.email,
          hasBaseUri: p.hasBaseUri,
          baseUri: p.baseUri,
          supportedPincodes: p.supportedPincodes.length,
          hasCredentials: p.hasCredentials,
          createdAt: p.createdAt,
          verifiedAt: p.verifiedAt,
        })),
      }
    }, { title: "Verified Providers" });
  } catch (error) {
    console.error("Error retrieving verified providers:", error);
    return handleResponse(req, res, "api-response", {
      success: false,
      message: "Failed to retrieve verified providers",
      error: error.message,
      status: 500
    }, { title: "Providers Error" });
  }
};

// Verify a provider
const verifyProvider = async (req, res) => {
  try {
    const { bppId } = req.params;

    const provider = await Provider.findOne({ bppId });

    if (!provider) {
      return handleResponse(req, res, "api-response", {
        success: false,
        message: "Provider not found",
        status: 404
      }, { title: "Provider Not Found" });
    }

    // Update provider status
    provider.isVerified = true;
    provider.verifiedAt = new Date();
    await provider.save();

    return handleResponse(req, res, "api-response", {
      success: true,
      message: "Provider verified successfully",
      data: {
        provider: {
          id: provider._id,
          name: provider.name,
          bppId: provider.bppId,
          email: provider.email,
          isVerified: provider.isVerified,
          verifiedAt: provider.verifiedAt,
        },
      }
    }, { title: "Provider Verified" });
  } catch (error) {
    console.error("Error verifying provider:", error);
    return handleResponse(req, res, "api-response", {
      success: false,
      message: "Failed to verify provider",
      error: error.message,
      status: 500
    }, { title: "Provider Verification Error" });
  }
};

// Reject a provider onboard request
const rejectProvider = async (req, res) => {
  try {
    const { bppId } = req.params;
    const { reason } = req.body;

    const provider = await Provider.findOne({ bppId });

    if (!provider) {
      return handleResponse(req, res, "api-response", {
        success: false,
        message: "Provider not found",
        status: 404
      }, { title: "Provider Not Found" });
    }

    // Update rejection details
    provider.isRejected = true;
    provider.rejectionReason = reason || "No reason provided";
    provider.rejectedAt = new Date();
    await provider.save();

    return handleResponse(req, res, "api-response", {
      success: true,
      message: "Provider onboard request rejected",
      data: {
        provider: {
          id: provider._id,
          name: provider.name,
          bppId: provider.bppId,
          email: provider.email,
          isRejected: provider.isRejected,
          rejectionReason: provider.rejectionReason,
          rejectedAt: provider.rejectedAt,
        },
      }
    }, { title: "Provider Rejected" });
  } catch (error) {
    console.error("Error rejecting provider:", error);
    return handleResponse(req, res, "api-response", {
      success: false,
      message: "Failed to reject provider",
      error: error.message,
      status: 500
    }, { title: "Provider Rejection Error" });
  }
};

// Generate login credentials for a verified provider
const generateProviderCredentials = async (req, res) => {
  try {
    const { bppId } = req.params;

    const provider = await Provider.findOne({ bppId, isVerified: true });

    if (!provider) {
      return handleResponse(req, res, "api-response", {
        success: false,
        message: "Verified provider not found",
        status: 404
      }, { title: "Provider Not Found" });
    }

    // Check if credentials already exist
    if (provider.hasCredentials) {
      return handleResponse(req, res, "api-response", {
        success: false,
        message: "Provider already has credentials",
        status: 400
      }, { title: "Credentials Already Exist" });
    }

    // Generate credentials
    const username = provider.bppId;
    const password = Math.random().toString(36).substring(2, 10);

    // Hash password before saving
    const bcrypt = require("bcryptjs");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update provider with credentials
    provider.credentials = {
      username,
      password: hashedPassword,
    };
    provider.hasCredentials = true;
    await provider.save();

    return handleResponse(req, res, "api-response", {
      success: true,
      message: "Provider credentials generated successfully",
      data: {
        provider: {
          id: provider._id,
          name: provider.name,
          bppId: provider.bppId,
          email: provider.email,
        },
        credentials: {
          username,
          password, // Plain text password to show once
          note: "Please save these credentials. The password will not be shown again.",
        },
      }
    }, { title: "Provider Credentials" });
  } catch (error) {
    console.error("Error generating provider credentials:", error);
    return handleResponse(req, res, "api-response", {
      success: false,
      message: "Failed to generate provider credentials",
      error: error.message,
      status: 500
    }, { title: "Credentials Generation Error" });
  }
};

module.exports = {
  createProviderRequest,
  getOnboardRequests,
  getVerifiedProviders,
  verifyProvider,
  rejectProvider,
  generateProviderCredentials,
};
