const Provider = require("../model/provider");
const { ShipmentRequest } = require("../model/providerQuote");
const providerQuoteService = require("../services/providerQuoteService");
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
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 400,
        message: "Name and email are required fields",
      });
    }

    // Validate baseUri only if hasBaseUri is true
    if (hasBaseUri === true && (!baseUri || baseUri.trim() === "")) {
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 400,
        message: "Base URI is required when 'Has Base URI' is selected",
      });
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

    return handleResponse(res, {
      type: "api",
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
      },
    });
  } catch (error) {
    console.error("Error creating provider onboard request:", error);

    // Handle duplicate key errors specifically
    let errorMessage = "Failed to submit provider onboard request";
    let statusCode = 500;

    if (error.code === 11000) {
      statusCode = 400; // Bad Request for validation errors
      if (error.keyPattern?.email) {
        errorMessage = "Email address is already registered";
      } else if (error.keyPattern?.bppId) {
        errorMessage = "System error generating unique ID. Please try again";
        statusCode = 500; // This is a server error, not user error
      } else {
        errorMessage = "This information is already registered";
      }
    }

    return handleResponse(res, {
      type: "api",
      success: false,
      statusCode: statusCode,
      message: errorMessage,
      data: { error: error.message },
    });
  }
};

// Get all provider onboard requests (pending verification)
const getOnboardRequests = async (req, res) => {
  try {
    const providers = await Provider.find({
      isVerified: false,
      rejectedAt: { $exists: false },
    }).sort({
      createdAt: -1,
    });

    return handleResponse(res, {
      type: "api",
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
          actions: p.actions,
          weightLimits: p.weightLimits,
          dimensionalLimits: p.dimensionalLimits,
          createdAt: p.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("Error retrieving provider onboard requests:", error);
    return handleResponse(res, {
      type: "api",
      success: false,
      statusCode: 500,
      message: "Failed to retrieve provider onboard requests",
      data: { error: error.message },
    });
  }
};

// Get all verified providers
const getVerifiedProviders = async (req, res) => {
  try {
    const providers = await Provider.find({ isVerified: true }).sort({
      name: 1,
    });

    return handleResponse(res, {
      type: "api",
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
      },
    });
  } catch (error) {
    console.error("Error retrieving verified providers:", error);
    return handleResponse(res, {
      type: "api",
      success: false,
      statusCode: 500,
      message: "Failed to retrieve verified providers",
      data: { error: error.message },
    });
  }
};

// Get all rejected providers
const getRejectedProviders = async (req, res) => {
  try {
    const rejectedProviders = await Provider.find({
      isVerified: false,
      rejectedAt: { $exists: true },
    }).sort({ updatedAt: -1 });

    return handleResponse(res, {
      type: "api",
      success: true,
      message: "Rejected providers retrieved successfully",
      data: rejectedProviders,
    });
  } catch (error) {
    console.error("Get rejected providers error:", error);
    return handleResponse(res, {
      type: "api",
      success: false,
      statusCode: 500,
      message: "Failed to retrieve rejected providers",
      data: { error: error.message },
    });
  }
};

// Verify a provider
const verifyProvider = async (req, res) => {
  try {
    const { bppId } = req.params;
    const bcrypt = require("bcryptjs");

    const provider = await Provider.findOne({ bppId });

    if (!provider) {
      return handleResponse(res, {
        type: "api-response",
        success: false,
        statusCode: 404,
        message: "Provider not found",
        view: "error",
        viewData: { title: "Provider Not Found" },
      });
    }

    // Generate username and password automatically
    const sanitizedName = provider.name
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();
    const username = `${sanitizedName}_${provider.bppId}`;
    const plainPassword =
      Math.random().toString(36).substring(2, 12) +
      Math.random().toString(36).substring(2, 6).toUpperCase();

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    // Update provider status and credentials
    provider.isVerified = true;
    provider.verifiedAt = new Date();
    provider.username = username;
    provider.password = hashedPassword;
    provider.isPasswordGenerated = true;

    // Clear any previous rejection data when verifying
    provider.rejectedAt = undefined;
    provider.rejectionReason = undefined;

    await provider.save();

    return handleResponse(res, {
      type: "api",
      success: true,
      message: "Provider verified successfully and login credentials generated",
      data: {
        provider: {
          id: provider._id,
          name: provider.name,
          bppId: provider.bppId,
          email: provider.email,
          isVerified: provider.isVerified,
          verifiedAt: provider.verifiedAt,
          username: provider.username,
        },
        credentials: {
          username: username,
          password: plainPassword,
          note: "Please save these credentials securely. The password will not be shown again.",
          loginUrl: "/api/providers/login",
        },
      },
    });
  } catch (error) {
    console.error("Error verifying provider:", error);
    return handleResponse(res, {
      type: "api",
      success: false,
      statusCode: 500,
      message: "Failed to verify provider",
      data: { error: error.message },
    });
  }
};

// Reject a provider onboard request
const rejectProvider = async (req, res) => {
  try {
    const { bppId } = req.params;
    const { reason } = req.body;

    const provider = await Provider.findOne({ bppId });

    if (!provider) {
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 404,
        message: "Provider not found",
        data: { error: "Provider with the specified ID was not found" },
      });
    }

    // Update rejection details
    provider.rejectionReason = reason || "No reason provided";
    provider.rejectedAt = new Date();

    // Ensure provider is not verified when rejected
    provider.isVerified = false;
    provider.verifiedAt = undefined;
    provider.username = undefined;
    provider.password = undefined;
    provider.isPasswordGenerated = false;

    await provider.save();

    return handleResponse(res, {
      type: "api",
      success: true,
      message: "Provider onboard request rejected",
      data: {
        provider: {
          id: provider._id,
          name: provider.name,
          bppId: provider.bppId,
          email: provider.email,
          rejectionReason: provider.rejectionReason,
          rejectedAt: provider.rejectedAt,
        },
      },
    });
  } catch (error) {
    console.error("Error rejecting provider:", error);
    return handleResponse(res, {
      type: "api",
      success: false,
      statusCode: 500,
      message: "Failed to reject provider",
      data: { error: error.message },
    });
  }
};

// Generate login credentials for a verified provider
const generateProviderCredentials = async (req, res) => {
  try {
    const { bppId } = req.params;

    const provider = await Provider.findOne({ bppId, isVerified: true });

    if (!provider) {
      return handleResponse(res, {
        type: "api-response",
        success: false,
        statusCode: 404,
        message: "Verified provider not found",
        view: "error",
        viewData: { title: "Provider Not Found" },
      });
    }

    // Check if credentials already exist
    if (provider.hasCredentials) {
      return handleResponse(res, {
        type: "api-response",
        success: false,
        statusCode: 400,
        message: "Provider already has credentials",
        view: "error",
        viewData: { title: "Credentials Already Exist" },
      });
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

    return handleResponse(res, {
      type: "api",
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
      },
    });
  } catch (error) {
    console.error("Error generating provider credentials:", error);
    return handleResponse(res, {
      type: "api-response",
      success: false,
      statusCode: 500,
      message: "Failed to generate provider credentials",
      data: { error: error.message },
      view: "error",
      viewData: { title: "Credentials Generation Error" },
    });
  }
};

// Get shipment requests for provider (Dashboard)
const getProviderRequests = async (req, res) => {
  try {
    const providerId = req.session.user.providerId || req.session.user.id;
    const { status } = req.query;

    const requests = await providerQuoteService.getProviderRequests(
      providerId,
      status
    );

    return handleResponse(res, {
      type: "api",
      success: true,
      message: "Provider requests retrieved successfully",
      data: {
        requestsCount: requests.length,
        requests: requests.map((request) => ({
          id: request._id,
          requestId: request.requestId,
          shipment: {
            id: request.shipmentId._id,
            shipmentId: request.shipmentId.shipmentId,
            parcelName: request.shipmentId.parcelName,
            weight: request.shipmentId.weight,
            dimensions: request.shipmentId.dimensions,
            sender: request.shipmentId.sender,
            receiver: request.shipmentId.receiver,
            distance: request.shipmentId.distance,
          },
          seller: {
            id: request.sellerId._id,
            name: request.sellerId.name,
            email: request.sellerId.email,
            businessName: request.sellerId.businessName,
          },
          requestedCost: request.requestedCost,
          requestedDeliveryTime: request.requestedDeliveryTime,
          serviceType: request.serviceType,
          pickupRequired: request.pickupRequired,
          trackingRequired: request.trackingRequired,
          insuranceRequired: request.insuranceRequired,
          status: request.status,
          sellerNotes: request.sellerNotes,
          providerResponse: request.providerResponse,
          createdAt: request.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("Error getting provider requests:", error);
    return handleResponse(res, {
      type: "api",
      success: false,
      statusCode: 500,
      message: "Failed to get provider requests",
      data: { error: error.message },
    });
  }
};

// Accept shipment request
const acceptShipmentRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const providerId = req.session.user.providerId || req.session.user.id;
    const { providerNotes, actualCost, actualDeliveryTime, trackingNumber } =
      req.body;

    const result = await providerQuoteService.updateRequestStatus(
      requestId,
      providerId,
      "accepted",
      {
        providerNotes,
        actualCost,
        actualDeliveryTime,
        trackingNumber,
      }
    );

    if (!result.success) {
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 400,
        message: result.error,
      });
    }

    return handleResponse(res, {
      type: "api",
      success: true,
      message: result.message,
      data: {
        request: {
          id: result.request._id,
          requestId: result.request.requestId,
          status: result.request.status,
          providerResponse: result.request.providerResponse,
        },
      },
    });
  } catch (error) {
    console.error("Error accepting shipment request:", error);
    return handleResponse(res, {
      type: "api",
      success: false,
      statusCode: 500,
      message: "Failed to accept shipment request",
      data: { error: error.message },
    });
  }
};

// Reject shipment request
const rejectShipmentRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const providerId = req.session.user.providerId || req.session.user.id;
    const { rejectionReason } = req.body;

    if (!rejectionReason || rejectionReason.trim() === "") {
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 400,
        message: "Rejection reason is required",
      });
    }

    const result = await providerQuoteService.updateRequestStatus(
      requestId,
      providerId,
      "rejected",
      {
        rejectionReason,
      }
    );

    if (!result.success) {
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 400,
        message: result.error,
      });
    }

    return handleResponse(res, {
      type: "api",
      success: true,
      message: result.message,
      data: {
        request: {
          id: result.request._id,
          requestId: result.request.requestId,
          status: result.request.status,
          providerResponse: result.request.providerResponse,
        },
      },
    });
  } catch (error) {
    console.error("Error rejecting shipment request:", error);
    return handleResponse(res, {
      type: "api",
      success: false,
      statusCode: 500,
      message: "Failed to reject shipment request",
      data: { error: error.message },
    });
  }
};

// Get provider dashboard data
const getProviderDashboard = async (req, res) => {
  try {
    const providerId = req.session.user.providerId || req.session.user.id;

    // Get provider details
    const provider = await Provider.findById(providerId);
    if (!provider) {
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 404,
        message: "Provider not found",
      });
    }

    // Get request statistics
    const allRequests = await providerQuoteService.getProviderRequests(
      providerId
    );
    const pendingRequests = allRequests.filter(
      (req) => req.status === "pending"
    );
    const acceptedRequests = allRequests.filter(
      (req) => req.status === "accepted"
    );
    const rejectedRequests = allRequests.filter(
      (req) => req.status === "rejected"
    );

    // Calculate total revenue from accepted requests
    const totalRevenue = acceptedRequests.reduce((sum, req) => {
      return sum + (req.providerResponse?.actualCost || req.requestedCost || 0);
    }, 0);

    return handleResponse(res, {
      type: "api",
      success: true,
      message: "Provider dashboard data retrieved successfully",
      data: {
        provider: {
          id: provider._id,
          name: provider.name,
          bppId: provider.bppId,
          email: provider.email,
          isVerified: provider.isVerified,
        },
        stats: {
          totalRequests: allRequests.length,
          pendingRequests: pendingRequests.length,
          acceptedRequests: acceptedRequests.length,
          rejectedRequests: rejectedRequests.length,
          totalRevenue: totalRevenue,
        },
        recentRequests: allRequests.slice(0, 5), // Last 5 requests
      },
    });
  } catch (error) {
    console.error("Error getting provider dashboard data:", error);
    return handleResponse(res, {
      type: "api",
      success: false,
      statusCode: 500,
      message: "Failed to get dashboard data",
      data: { error: error.message },
    });
  }
};

// Update shipment status
const updateShipmentStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, trackingNumber, notes } = req.body;
    const providerId = req.session.user.providerId || req.session.user.id;

    if (!status) {
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 400,
        message: "Status is required",
      });
    }

    // Valid shipment statuses
    const validStatuses = [
      "picked_up",
      "in_transit",
      "out_for_delivery",
      "delivered",
      "failed_delivery",
      "returned",
    ];

    if (!validStatuses.includes(status)) {
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 400,
        message: "Invalid status",
      });
    }

    const result = await providerQuoteService.updateShipmentStatus(
      requestId,
      providerId,
      status,
      {
        trackingNumber,
        notes,
      }
    );

    if (!result.success) {
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 400,
        message: result.error,
      });
    }

    return handleResponse(res, {
      type: "api",
      success: true,
      message: "Shipment status updated successfully",
      data: {
        request: result.request,
        shipment: result.shipment,
      },
    });
  } catch (error) {
    console.error("Error updating shipment status:", error);
    return handleResponse(res, {
      type: "api",
      success: false,
      statusCode: 500,
      message: "Failed to update shipment status",
      data: { error: error.message },
    });
  }
};

module.exports = {
  createProviderRequest,
  getOnboardRequests,
  getVerifiedProviders,
  getRejectedProviders,
  verifyProvider,
  rejectProvider,
  generateProviderCredentials,
  getProviderRequests,
  acceptShipmentRequest,
  rejectShipmentRequest,
  updateShipmentStatus,
  getProviderDashboard,
};
