const axios = require("axios");

class GeolocationService {
  constructor() {
    this.nominatimBaseUrl = "https://nominatim.openstreetmap.org";
    
    // Request headers to be respectful to the service
    this.requestHeaders = {
      'User-Agent': 'TrackSmart-App/1.0 (logistics@tracksmart.com)'
    };
  }

  /**
   * Get coordinates for a pincode using OpenStreetMap Nominatim API
   * @param {string} pincode - 6-digit Indian pincode
   * @returns {Promise<{lat: number, lng: number}>}
   */
  async getCoordinatesFromPincode(pincode) {
    try {
      const response = await axios.get(
        `${this.nominatimBaseUrl}/search`,
        {
          params: {
            postalcode: pincode,
            country: "India",
            format: "json",
            limit: 1
          },
          headers: this.requestHeaders
        }
      );

      if (response.data && response.data.length > 0) {
        const location = response.data[0];
        return { 
          lat: parseFloat(location.lat), 
          lng: parseFloat(location.lon) 
        };
      } else {
        throw new Error(`No coordinates found for pincode: ${pincode}`);
      }
    } catch (error) {
      console.error(`Error geocoding pincode ${pincode}:`, error.message);
      throw new Error(`Failed to get coordinates for pincode: ${pincode}`);
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * @param {object} source - {lat, lng}
   * @param {object} destination - {lat, lng}
   * @returns {number} - Distance in kilometers
   */
  calculateDistance(source, destination) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.toRadians(destination.lat - source.lat);
    const dLng = this.toRadians(destination.lng - source.lng);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(source.lat)) * Math.cos(this.toRadians(destination.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Convert degrees to radians
   * @param {number} degrees 
   * @returns {number} radians
   */
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Calculate distance between two pincodes
   * @param {string} sourcePincode - Source pincode
   * @param {string} destinationPincode - Destination pincode
   * @returns {Promise<number>} - Distance in kilometers
   */
  async calculateDistanceBetweenPincodes(sourcePincode, destinationPincode) {
    try {
      // Add delay to be respectful to the free service
      await this.delay(1000);
      
      // Get coordinates for both pincodes
      const [sourceCoords, destCoords] = await Promise.all([
        this.getCoordinatesFromPincode(sourcePincode),
        this.getCoordinatesFromPincode(destinationPincode),
      ]);

      // Calculate distance using Haversine formula
      const distance = this.calculateDistance(sourceCoords, destCoords);
      
      console.log(`Distance from ${sourcePincode} to ${destinationPincode}: ${distance} km`);
      return distance;
    } catch (error) {
      console.error("Error in calculateDistanceBetweenPincodes:", error.message);
      
      // Fallback: Use approximate distance calculation based on pincode
      return this.approximateDistanceFromPincode(sourcePincode, destinationPincode);
    }
  }

  /**
   * Add delay to be respectful to free services
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Fallback method to calculate approximate distance based on pincode ranges
   * This is a simplified approach when the main API is not available
   * @param {string} sourcePincode - Source pincode
   * @param {string} destinationPincode - Destination pincode
   * @returns {number} - Approximate distance in kilometers
   */
  approximateDistanceFromPincode(sourcePincode, destinationPincode) {
    // Simple approximation based on pincode difference
    // This is a very basic fallback and should be replaced with actual distance calculation
    const sourceFirst3 = parseInt(sourcePincode.substring(0, 3));
    const destFirst3 = parseInt(destinationPincode.substring(0, 3));
    
    const difference = Math.abs(sourceFirst3 - destFirst3);
    
    // Rough approximation: each 100-unit difference in pincode = ~500km
    const approximateDistance = difference * 5;
    
    console.log(`Approximate distance from ${sourcePincode} to ${destinationPincode}: ${approximateDistance} km (fallback)`);
    return approximateDistance;
  }

  /**
   * Validate if the service is properly configured
   * @returns {boolean}
   */
  isConfigured() {
    return true; // OpenStreetMap doesn't require API keys
  }
}

module.exports = new GeolocationService();
