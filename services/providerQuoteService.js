const { ProviderQuote, ShipmentRequest } = require("../model/providerQuote");
const Provider = require("../model/provider");
const Shipment = require("../model/shipment");
const Seller = require("../model/seller");

class ProviderQuoteService {
  // Get quotes from all available providers for a shipment
  async getQuotesFromProviders(shipmentData) {
    try {
      const { sender, receiver, weight, dimensions } = shipmentData;

      // Find providers that can handle this shipment
      const availableProviders = await this.findAvailableProviders(
        sender.pincode,
        receiver.pincode,
        weight,
        dimensions
      );

      if (availableProviders.length === 0) {
        throw new Error("No providers available for this route");
      }

      // Request quotes from all available providers
      const quotePromises = availableProviders.map((provider) =>
        this.requestQuoteFromProvider(provider, shipmentData)
      );

      const quotes = await Promise.allSettled(quotePromises);

      // Process results and return successful quotes
      const successfulQuotes = quotes
        .filter((result) => result.status === "fulfilled" && result.value)
        .map((result) => result.value);

      // Log failed quotes for debugging
      const failedQuotes = quotes
        .filter((result) => result.status === "rejected")
        .map((result) => result.reason);

      if (failedQuotes.length > 0) {
        console.log("Failed to get quotes from some providers:", failedQuotes);
      }

      return {
        success: true,
        quotes: successfulQuotes,
        providersContacted: availableProviders.length,
        quotesReceived: successfulQuotes.length,
      };
    } catch (error) {
      console.error("Error getting provider quotes:", error);
      return {
        success: false,
        error: error.message,
        quotes: [],
      };
    }
  }

  // Find providers that can handle the shipment
  async findAvailableProviders(
    sourcePincode,
    destinationPincode,
    weight,
    dimensions
  ) {
    try {
      const providers = await Provider.find({
        isVerified: true,
        $and: [
          // Provider must support both source and destination pincodes
          {
            $or: [
              // Either provider has empty supportedPincodes (supports all)
              { supportedPincodes: { $size: 0 } },
              // Or provider specifically supports both pincodes
              {
                $and: [
                  { supportedPincodes: { $in: [sourcePincode] } },
                  { supportedPincodes: { $in: [destinationPincode] } },
                ],
              },
            ],
          },
          // Weight constraints
          {
            $or: [
              {
                $and: [
                  { "weightLimits.min": { $lte: weight } },
                  { "weightLimits.max": { $gte: weight } },
                ],
              },
              { weightLimits: { $exists: false } }, // No weight restrictions
              {
                $and: [
                  { "weightLimits.min": { $exists: false } },
                  { "weightLimits.max": { $exists: false } },
                ],
              },
            ],
          },
          // Dimensional constraints
          {
            $or: [
              {
                $and: [
                  { "dimensionalLimits.l": { $gte: dimensions.length } },
                  { "dimensionalLimits.w": { $gte: dimensions.width } },
                  { "dimensionalLimits.h": { $gte: dimensions.height } },
                ],
              },
              { dimensionalLimits: { $exists: false } }, // No dimensional restrictions
              {
                $and: [
                  { "dimensionalLimits.l": { $exists: false } },
                  { "dimensionalLimits.w": { $exists: false } },
                  { "dimensionalLimits.h": { $exists: false } },
                ],
              },
            ],
          },
        ],
      });

      // Additional filtering for providers with specific pincode restrictions
      const filteredProviders = providers.filter((provider) => {
        // If provider has specific pincode restrictions, ensure both pincodes are supported
        if (
          provider.supportedPincodes &&
          provider.supportedPincodes.length > 0
        ) {
          const supportsSource =
            provider.supportedPincodes.includes(sourcePincode);
          const supportsDestination =
            provider.supportedPincodes.includes(destinationPincode);

          if (!supportsSource || !supportsDestination) {
            console.log(
              `Provider ${provider.name} doesn't support route ${sourcePincode} -> ${destinationPincode}`
            );
            return false;
          }
        }

        // Check weight limits
        if (
          provider.weightLimits &&
          (provider.weightLimits.min || provider.weightLimits.max)
        ) {
          if (provider.weightLimits.min && weight < provider.weightLimits.min) {
            console.log(
              `Provider ${provider.name} minimum weight ${provider.weightLimits.min}kg exceeds parcel weight ${weight}kg`
            );
            return false;
          }
          if (provider.weightLimits.max && weight > provider.weightLimits.max) {
            console.log(
              `Provider ${provider.name} maximum weight ${provider.weightLimits.max}kg is less than parcel weight ${weight}kg`
            );
            return false;
          }
        }

        // Check dimensional limits
        if (
          provider.dimensionalLimits &&
          (provider.dimensionalLimits.l ||
            provider.dimensionalLimits.w ||
            provider.dimensionalLimits.h)
        ) {
          if (
            provider.dimensionalLimits.l &&
            dimensions.length > provider.dimensionalLimits.l
          ) {
            console.log(
              `Provider ${provider.name} length limit ${provider.dimensionalLimits.l}cm is less than parcel length ${dimensions.length}cm`
            );
            return false;
          }
          if (
            provider.dimensionalLimits.w &&
            dimensions.width > provider.dimensionalLimits.w
          ) {
            console.log(
              `Provider ${provider.name} width limit ${provider.dimensionalLimits.w}cm is less than parcel width ${dimensions.width}cm`
            );
            return false;
          }
          if (
            provider.dimensionalLimits.h &&
            dimensions.height > provider.dimensionalLimits.h
          ) {
            console.log(
              `Provider ${provider.name} height limit ${provider.dimensionalLimits.h}cm is less than parcel height ${dimensions.height}cm`
            );
            return false;
          }
        }

        return true;
      });

      console.log(
        `Found ${filteredProviders.length} providers that can handle route ${sourcePincode} -> ${destinationPincode}`
      );
      filteredProviders.forEach((provider) => {
        console.log(`- ${provider.name} (${provider.bppId})`);
      });

      return filteredProviders;
    } catch (error) {
      console.error("Error finding available providers:", error);
      return [];
    }
  }

  // Request quote from individual provider
  async requestQuoteFromProvider(provider, shipmentData) {
    const startTime = Date.now();

    try {
      let quote;

      if (provider.hasBaseUri && provider.baseUri) {
        // Provider has API integration
        quote = await this.requestQuoteFromAPI(provider, shipmentData);
      } else {
        // Generate mock quote for providers without API
        quote = await this.generateMockQuote(provider, shipmentData);
      }

      const responseTime = Date.now() - startTime;
      quote.responseTime = responseTime;

      return quote;
    } catch (error) {
      console.error(
        `Error getting quote from provider ${provider.name}:`,
        error
      );

      // Create error quote record
      return {
        providerId: provider._id,
        providerName: provider.name,
        status: "failed",
        errorMessage: error.message,
        responseTime: Date.now() - startTime,
      };
    }
  }

  // Request quote from provider API
  async requestQuoteFromAPI(provider, shipmentData) {
    // This would integrate with actual provider APIs
    // For now, we'll simulate API call with timeout

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const mockQuote = this.generateMockQuote(provider, shipmentData);
          resolve(mockQuote);
        } catch (error) {
          reject(error);
        }
      }, Math.random() * 2000 + 500); // 500-2500ms random delay
    });
  }

  // Generate mock quote for testing
  generateMockQuote(provider, shipmentData) {
    const { weight, dimensions, sender, receiver } = shipmentData;

    // Calculate base cost based on weight and distance
    const baseCostPerKg = Math.random() * 50 + 30; // ₹30-80 per kg
    const weightCost = weight * baseCostPerKg;

    // Add dimensional weight factor
    const dimensionalWeight =
      (dimensions.length * dimensions.width * dimensions.height) / 5000;
    const dimensionalCost = Math.max(
      0,
      (dimensionalWeight - weight) * baseCostPerKg * 0.5
    );

    // Distance factor (mock calculation)
    const distanceFactor = Math.random() * 0.3 + 0.8; // 0.8-1.1

    // Provider-specific multipliers
    const providerMultipliers = {
      express: 1.5,
      premium: 1.3,
      standard: 1.0,
      economy: 0.8,
    };

    const providerType = provider.name.toLowerCase().includes("express")
      ? "express"
      : provider.name.toLowerCase().includes("premium")
      ? "premium"
      : provider.name.toLowerCase().includes("economy")
      ? "economy"
      : "standard";

    const providerMultiplier = providerMultipliers[providerType];

    // Calculate final cost
    const estimatedCost = Math.round(
      (weightCost + dimensionalCost) * distanceFactor * providerMultiplier
    );

    // Calculate delivery time based on provider type and distance
    const baseDeliveryHours = {
      express: 24,
      premium: 48,
      standard: 72,
      economy: 120,
    };

    const deliveryTime = baseDeliveryHours[providerType] + Math.random() * 24;

    // Service types based on provider
    const serviceTypes = {
      express: "express",
      premium: "express",
      standard: "standard",
      economy: "standard",
    };

    return {
      providerId: provider._id,
      providerName: provider.name,
      bppId: provider.bppId,
      estimatedCost: estimatedCost,
      estimatedDeliveryTime: Math.round(deliveryTime),
      serviceType: serviceTypes[providerType],
      pickupAvailable: true,
      trackingAvailable: true,
      insuranceAvailable: Math.random() > 0.3, // 70% chance
      insuranceCost: estimatedCost * 0.02, // 2% of shipment cost
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      status: "provided",
    };
  }

  // Save quotes to database
  async saveQuotesToDatabase(shipmentId, quotes) {
    try {
      const quoteDocs = quotes
        .filter((quote) => quote.status === "provided")
        .map((quote) => ({
          shipmentId,
          providerId: quote.providerId,
          estimatedCost: quote.estimatedCost,
          estimatedDeliveryTime: quote.estimatedDeliveryTime,
          serviceType: quote.serviceType,
          pickupAvailable: quote.pickupAvailable,
          trackingAvailable: quote.trackingAvailable,
          insuranceAvailable: quote.insuranceAvailable,
          insuranceCost: quote.insuranceCost,
          validUntil: quote.validUntil,
          status: "provided",
          responseTime: quote.responseTime,
        }));

      if (quoteDocs.length > 0) {
        await ProviderQuote.insertMany(quoteDocs);
      }

      return {
        success: true,
        savedQuotes: quoteDocs.length,
      };
    } catch (error) {
      console.error("Error saving quotes to database:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get quotes for a shipment from database
  async getQuotesForShipment(shipmentId) {
    try {
      const quotes = await ProviderQuote.find({
        shipmentId,
        status: "provided",
        validUntil: { $gt: new Date() }, // Only valid quotes
      })
        .populate("providerId", "name bppId email")
        .sort({ estimatedCost: 1 }); // Sort by cost (cheapest first)

      return quotes;
    } catch (error) {
      console.error("Error getting quotes for shipment:", error);
      return [];
    }
  }

  // Create shipment request to selected provider
  async createShipmentRequest(
    shipmentId,
    sellerId,
    quoteId,
    additionalData = {}
  ) {
    try {
      // Get the quote
      const quote = await ProviderQuote.findById(quoteId)
        .populate("providerId")
        .populate("shipmentId");

      if (!quote) {
        throw new Error("Quote not found");
      }

      if (quote.validUntil < new Date()) {
        throw new Error("Quote has expired");
      }

      // Create shipment request
      const shipmentRequest = new ShipmentRequest({
        shipmentId,
        sellerId,
        providerId: quote.providerId._id,
        quoteId: quote._id,
        requestedCost: quote.estimatedCost,
        requestedDeliveryTime: quote.estimatedDeliveryTime,
        serviceType: quote.serviceType,
        pickupRequired:
          quote.pickupAvailable && additionalData.pickupRequired !== false,
        trackingRequired:
          quote.trackingAvailable && additionalData.trackingRequired !== false,
        insuranceRequired:
          quote.insuranceAvailable && additionalData.insuranceRequired === true,
        sellerNotes: additionalData.sellerNotes || "",
      });

      await shipmentRequest.save();

      // Update quote status
      quote.status = "accepted";
      await quote.save();

      // Update shipment with provider info
      await Shipment.findByIdAndUpdate(shipmentId, {
        providerId: quote.providerId._id,
        estimatedCost: quote.estimatedCost,
        status: "confirmed",
        confirmedAt: new Date(),
      });

      return {
        success: true,
        request: shipmentRequest,
        message: "Shipment request created successfully",
      };
    } catch (error) {
      console.error("Error creating shipment request:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get pending requests for a provider
  async getProviderRequests(providerId, status = null) {
    try {
      const query = { providerId };
      if (status) {
        query.status = status;
      }

      const requests = await ShipmentRequest.find(query)
        .populate("shipmentId")
        .populate("sellerId", "name email businessName")
        .populate("quoteId")
        .sort({ createdAt: -1 });

      return requests;
    } catch (error) {
      console.error("Error getting provider requests:", error);
      return [];
    }
  }

  // Provider accepts/rejects shipment request
  async updateRequestStatus(requestId, providerId, status, responseData = {}) {
    try {
      const request = await ShipmentRequest.findOne({
        _id: requestId,
        providerId,
      });

      if (!request) {
        throw new Error("Request not found");
      }

      request.status = status;

      if (status === "accepted") {
        request.providerResponse.acceptedAt = new Date();
        request.providerResponse.providerNotes =
          responseData.providerNotes || "";
        request.providerResponse.actualCost =
          responseData.actualCost || request.requestedCost;
        request.providerResponse.actualDeliveryTime =
          responseData.actualDeliveryTime || request.requestedDeliveryTime;

        if (responseData.trackingNumber) {
          request.providerResponse.trackingNumber = responseData.trackingNumber;

          // Update shipment with tracking number
          await Shipment.findByIdAndUpdate(request.shipmentId, {
            trackingNumber: responseData.trackingNumber,
            actualCost: request.providerResponse.actualCost,
            status: "picked_up",
          });
        }
      } else if (status === "rejected") {
        request.providerResponse.rejectedAt = new Date();
        request.providerResponse.rejectionReason =
          responseData.rejectionReason || "No reason provided";

        // Reset shipment status if rejected
        await Shipment.findByIdAndUpdate(request.shipmentId, {
          providerId: null,
          status: "draft",
          confirmedAt: null,
        });
      }

      await request.save();

      return {
        success: true,
        request,
        message: `Request ${status} successfully`,
      };
    } catch (error) {
      console.error("Error updating request status:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Update shipment status for tracking
  async updateShipmentStatus(requestId, providerId, status, additionalData = {}) {
    try {
      const request = await ShipmentRequest.findOne({
        _id: requestId,
        providerId,
      }).populate("shipmentId");

      if (!request) {
        throw new Error("Request not found");
      }

      if (request.status !== "accepted") {
        throw new Error("Can only update status for accepted requests");
      }

      // Get the shipment document
      const shipment = await Shipment.findById(request.shipmentId._id);
      
      if (!shipment) {
        throw new Error("Shipment not found");
      }

      // Set temporary fields for the middleware to use
      shipment._statusUpdatedBy = providerId;
      shipment._statusUpdatedByType = 'Provider';
      shipment._statusNotes = additionalData.notes || '';

      // Update shipment status
      shipment.status = status;
      shipment.lastUpdated = new Date();

      if (additionalData.trackingNumber) {
        shipment.trackingNumber = additionalData.trackingNumber;
      }

      // Save the shipment (this will trigger the middleware to update status history)
      await shipment.save();

      // Also update the request if we have tracking number
      if (additionalData.trackingNumber) {
        request.providerResponse.trackingNumber = additionalData.trackingNumber;
        await request.save();
      }

      return {
        success: true,
        request,
        shipment,
        message: `Shipment status updated to ${status}`,
      };
    } catch (error) {
      console.error("Error updating shipment status:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = new ProviderQuoteService();
