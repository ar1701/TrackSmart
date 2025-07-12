const express = require("express");
const Shipment = require("../model/shipment");
const Seller = require("../model/seller");
const { ProviderQuote, ShipmentRequest } = require("../model/providerQuote");
const { handleResponse } = require("../utils/responseHandler");
const providerQuoteService = require("../services/providerQuoteService");
const axios = require("axios");

// Create a new shipment
const createShipment = async (req, res) => {
  try {
    const sellerId = req.session.user.id;
    const {
      parcelName,
      weight,
      dimensions,
      sender,
      receiver,
      sourceLocation,
      destinationLocation,
      distance,
    } = req.body;

    // Validate required fields
    if (!parcelName || !weight || !dimensions || !sender || !receiver) {
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 400,
        message: "All required fields must be provided",
      });
    }

    // Create new shipment
    const newShipment = new Shipment({
      sellerId,
      parcelName,
      weight,
      dimensions,
      sender,
      receiver,
      sourceLocation,
      destinationLocation,
      distance,
      status: "draft",
    });

    await newShipment.save();

    // Get provider quotes for the shipment
    const quoteResult = await providerQuoteService.getQuotesFromProviders({
      parcelName,
      weight,
      dimensions,
      sender,
      receiver,
      sourceLocation,
      destinationLocation,
      distance,
    });

    if (quoteResult.success && quoteResult.quotes.length > 0) {
      // Save quotes to database
      await providerQuoteService.saveQuotesToDatabase(
        newShipment._id,
        quoteResult.quotes
      );
    }

    return handleResponse(res, {
      type: "api",
      success: true,
      statusCode: 201,
      message: "Shipment created successfully",
      data: {
        shipment: {
          id: newShipment._id,
          shipmentId: newShipment.shipmentId,
          parcelName: newShipment.parcelName,
          status: newShipment.status,
          distance: newShipment.distance,
          createdAt: newShipment.createdAt,
        },
        quotes: {
          success: quoteResult.success,
          providersContacted: quoteResult.providersContacted || 0,
          quotesReceived: quoteResult.quotesReceived || 0,
          quotes: quoteResult.quotes || [],
        },
      },
    });
  } catch (error) {
    console.error("Error creating shipment:", error);
    return handleResponse(res, {
      type: "api",
      success: false,
      statusCode: 500,
      message: "Failed to create shipment",
      data: { error: error.message },
    });
  }
};

// Get all shipments for a seller
const getSellerShipments = async (req, res) => {
  try {
    const sellerId = req.session.user.id;
    const shipments = await Shipment.find({ sellerId }).sort({ createdAt: -1 });

    return handleResponse(res, {
      type: "api",
      success: true,
      message: "Shipments retrieved successfully",
      data: {
        count: shipments.length,
        shipments: shipments.map((shipment) => ({
          id: shipment._id,
          shipmentId: shipment.shipmentId,
          parcelName: shipment.parcelName,
          status: shipment.status,
          receiver: shipment.receiver,
          distance: shipment.distance,
          estimatedCost: shipment.estimatedCost,
          trackingNumber: shipment.trackingNumber,
          createdAt: shipment.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("Error retrieving shipments:", error);
    return handleResponse(res, {
      type: "api",
      success: false,
      statusCode: 500,
      message: "Failed to retrieve shipments",
      data: { error: error.message },
    });
  }
};

// Get shipment details
const getShipmentDetails = async (req, res) => {
  try {
    const { shipmentId } = req.params;
    const sellerId = req.session.user.id;

    const shipment = await Shipment.findOne({
      _id: shipmentId,
      sellerId,
    }).populate("sellerId", "name businessName");

    if (!shipment) {
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 404,
        message: "Shipment not found",
      });
    }

    return handleResponse(res, {
      type: "api",
      success: true,
      message: "Shipment details retrieved successfully",
      data: { shipment },
    });
  } catch (error) {
    console.error("Error retrieving shipment details:", error);
    return handleResponse(res, {
      type: "api",
      success: false,
      statusCode: 500,
      message: "Failed to retrieve shipment details",
      data: { error: error.message },
    });
  }
};

// Fetch location data from pincode
const getLocationFromPincode = async (req, res) => {
  try {
    const { pincode } = req.params;

    if (!pincode || !/^\d{6}$/.test(pincode)) {
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 400,
        message: "Please provide a valid 6-digit pincode",
      });
    }

    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search?postalcode=${pincode}&country=India&format=json`
    );

    if (!response.data || response.data.length === 0) {
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 404,
        message: "Location not found for this pincode",
      });
    }

    const location = response.data[0];
    return handleResponse(res, {
      type: "api",
      success: true,
      message: "Location retrieved successfully",
      data: {
        latitude: parseFloat(location.lat),
        longitude: parseFloat(location.lon),
        city: location.display_name.split(",")[0],
        state: location.display_name.split(",")[1]?.trim(),
        fullAddress: location.display_name,
      },
    });
  } catch (error) {
    console.error("Error fetching location:", error);
    return handleResponse(res, {
      type: "api",
      success: false,
      statusCode: 500,
      message: "Failed to fetch location data",
      data: { error: error.message },
    });
  }
};

// Calculate distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
};

// Calculate distance between two pincodes
const calculateDistanceBetweenPincodes = async (req, res) => {
  try {
    const { sourcePincode, destinationPincode } = req.body;

    if (!sourcePincode || !destinationPincode) {
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 400,
        message: "Both source and destination pincodes are required",
      });
    }

    // Fetch location data for both pincodes
    const [sourceResponse, destResponse] = await Promise.all([
      axios.get(
        `https://nominatim.openstreetmap.org/search?postalcode=${sourcePincode}&country=India&format=json`
      ),
      axios.get(
        `https://nominatim.openstreetmap.org/search?postalcode=${destinationPincode}&country=India&format=json`
      ),
    ]);

    if (
      !sourceResponse.data ||
      sourceResponse.data.length === 0 ||
      !destResponse.data ||
      destResponse.data.length === 0
    ) {
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 404,
        message: "One or both pincodes could not be found",
      });
    }

    const sourceLocation = sourceResponse.data[0];
    const destLocation = destResponse.data[0];

    const distance = calculateDistance(
      parseFloat(sourceLocation.lat),
      parseFloat(sourceLocation.lon),
      parseFloat(destLocation.lat),
      parseFloat(destLocation.lon)
    );

    return handleResponse(res, {
      type: "api",
      success: true,
      message: "Distance calculated successfully",
      data: {
        distance,
        source: {
          latitude: parseFloat(sourceLocation.lat),
          longitude: parseFloat(sourceLocation.lon),
          city: sourceLocation.display_name.split(",")[0],
          state: sourceLocation.display_name.split(",")[1]?.trim(),
        },
        destination: {
          latitude: parseFloat(destLocation.lat),
          longitude: parseFloat(destLocation.lon),
          city: destLocation.display_name.split(",")[0],
          state: destLocation.display_name.split(",")[1]?.trim(),
        },
      },
    });
  } catch (error) {
    console.error("Error calculating distance:", error);
    return handleResponse(res, {
      type: "api",
      success: false,
      statusCode: 500,
      message: "Failed to calculate distance",
      data: { error: error.message },
    });
  }
};

// Get provider quotes for a shipment
const getShipmentQuotes = async (req, res) => {
  try {
    const { shipmentId } = req.params;
    const sellerId = req.session.user.id;

    // Verify shipment belongs to seller
    const shipment = await Shipment.findOne({
      _id: shipmentId,
      sellerId,
    });

    if (!shipment) {
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 404,
        message: "Shipment not found",
      });
    }

    // Get quotes from database
    const quotes = await providerQuoteService.getQuotesForShipment(shipmentId);

    return handleResponse(res, {
      type: "api",
      success: true,
      message: "Quotes retrieved successfully",
      data: {
        shipmentId,
        quotesCount: quotes.length,
        quotes: quotes.map((quote) => ({
          id: quote._id,
          provider: {
            id: quote.providerId._id,
            name: quote.providerId.name,
            bppId: quote.providerId.bppId,
          },
          estimatedCost: quote.estimatedCost,
          estimatedDeliveryTime: quote.estimatedDeliveryTime,
          serviceType: quote.serviceType,
          pickupAvailable: quote.pickupAvailable,
          trackingAvailable: quote.trackingAvailable,
          insuranceAvailable: quote.insuranceAvailable,
          insuranceCost: quote.insuranceCost,
          validUntil: quote.validUntil,
          responseTime: quote.responseTime,
        })),
      },
    });
  } catch (error) {
    console.error("Error getting shipment quotes:", error);
    return handleResponse(res, {
      type: "api",
      success: false,
      statusCode: 500,
      message: "Failed to get quotes",
      data: { error: error.message },
    });
  }
};

// Request fresh quotes for a shipment
const requestFreshQuotes = async (req, res) => {
  try {
    const { shipmentId } = req.params;
    const sellerId = req.session.user.id;

    // Verify shipment belongs to seller
    const shipment = await Shipment.findOne({
      _id: shipmentId,
      sellerId,
    });

    if (!shipment) {
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 404,
        message: "Shipment not found",
      });
    }

    // Get fresh quotes from providers
    const quoteResult = await providerQuoteService.getQuotesFromProviders({
      parcelName: shipment.parcelName,
      weight: shipment.weight,
      dimensions: shipment.dimensions,
      sender: shipment.sender,
      receiver: shipment.receiver,
      sourceLocation: shipment.sourceLocation,
      destinationLocation: shipment.destinationLocation,
      distance: shipment.distance,
    });

    if (quoteResult.success && quoteResult.quotes.length > 0) {
      // Clear old quotes and save new ones
      await ProviderQuote.deleteMany({
        shipmentId,
        status: { $in: ["pending", "provided"] },
      });

      await providerQuoteService.saveQuotesToDatabase(
        shipmentId,
        quoteResult.quotes
      );
    }

    return handleResponse(res, {
      type: "api",
      success: true,
      message: "Fresh quotes requested successfully",
      data: {
        quotesResult: quoteResult,
      },
    });
  } catch (error) {
    console.error("Error requesting fresh quotes:", error);
    return handleResponse(res, {
      type: "api",
      success: false,
      statusCode: 500,
      message: "Failed to request fresh quotes",
      data: { error: error.message },
    });
  }
};

// Create shipment request to selected provider
const createShipmentRequest = async (req, res) => {
  try {
    const { shipmentId, quoteId } = req.params;
    const sellerId = req.session.user.id;
    const { pickupRequired, trackingRequired, insuranceRequired, sellerNotes } =
      req.body;

    // Verify shipment belongs to seller
    const shipment = await Shipment.findOne({
      _id: shipmentId,
      sellerId,
    });

    if (!shipment) {
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 404,
        message: "Shipment not found",
      });
    }

    // Create the shipment request
    const result = await providerQuoteService.createShipmentRequest(
      shipmentId,
      sellerId,
      quoteId,
      {
        pickupRequired,
        trackingRequired,
        insuranceRequired,
        sellerNotes,
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
          requestedCost: result.request.requestedCost,
          requestedDeliveryTime: result.request.requestedDeliveryTime,
          serviceType: result.request.serviceType,
          createdAt: result.request.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("Error creating shipment request:", error);
    return handleResponse(res, {
      type: "api",
      success: false,
      statusCode: 500,
      message: "Failed to create shipment request",
      data: { error: error.message },
    });
  }
};

// Get shipment requests for seller
const getSellerShipmentRequests = async (req, res) => {
  try {
    const sellerId = req.session.user.id;
    const { status } = req.query;

    const requests = await ShipmentRequest.find({
      sellerId,
      ...(status && { status }),
    })
      .populate("shipmentId", "shipmentId parcelName")
      .populate("providerId", "name bppId")
      .sort({ createdAt: -1 });

    return handleResponse(res, {
      type: "api",
      success: true,
      message: "Shipment requests retrieved successfully",
      data: {
        requestsCount: requests.length,
        requests: requests.map((request) => ({
          id: request._id,
          requestId: request.requestId,
          shipment: {
            id: request.shipmentId._id,
            shipmentId: request.shipmentId.shipmentId,
            parcelName: request.shipmentId.parcelName,
          },
          provider: {
            id: request.providerId._id,
            name: request.providerId.name,
            bppId: request.providerId.bppId,
          },
          requestedCost: request.requestedCost,
          requestedDeliveryTime: request.requestedDeliveryTime,
          serviceType: request.serviceType,
          status: request.status,
          providerResponse: request.providerResponse,
          createdAt: request.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("Error getting seller shipment requests:", error);
    return handleResponse(res, {
      type: "api",
      success: false,
      statusCode: 500,
      message: "Failed to get shipment requests",
      data: { error: error.message },
    });
  }
};

module.exports = {
  createShipment,
  getSellerShipments,
  getShipmentDetails,
  getLocationFromPincode,
  calculateDistanceBetweenPincodes,
  getShipmentQuotes,
  requestFreshQuotes,
  createShipmentRequest,
  getSellerShipmentRequests,
};
