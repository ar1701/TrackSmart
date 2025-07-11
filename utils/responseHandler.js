/**
 * Response handler utility for consistent API and web responses
 * Provides standardized responses for both API and web interfaces
 */

/**
 * Handle API and web responses consistently
 * @param {Object} res - Express response object
 * @param {Object} options - Response options
 * @param {String} options.type - Response type: 'api', 'api-response', 'view', or 'redirect'
 * @param {Number} options.statusCode - HTTP status code
 * @param {Boolean} options.success - Whether the operation was successful
 * @param {String} options.message - Response message
 * @param {Object} options.data - Response data
 * @param {String} options.view - View template to render
 * @param {Object} options.viewData - Data to pass to the view
 * @param {String} options.redirectUrl - URL to redirect to
 * @param {String} options.flashType - Flash message type (success, error, info)
 * @param {String} options.flashMessage - Flash message content
 */
const handleResponse = (res, options) => {
  const {
    type = "api",
    statusCode = 200,
    success = true,
    message = "",
    data = null,
    view = "index",
    viewData = {},
    redirectUrl = "/",
    flashType = "info",
    flashMessage = "",
  } = options;

  // Handle different response types
  switch (type) {
    case "api":
      // Standard API JSON response
      return res.status(statusCode).json({
        success,
        message,
        data,
      });

    case "api-response":
      // Smart response - returns JSON for API requests, renders view for web requests
      const acceptHeader = res.req.headers?.accept || "";
      const isApiRequest =
        res.req.xhr ||
        acceptHeader.includes("application/json") ||
        res.req.path.startsWith("/api");

      if (isApiRequest) {
        return res.status(statusCode).json({
          success,
          message,
          data,
        });
      } else {
        return res.status(statusCode).render(view, {
          ...viewData,
          apiData: data,
          message,
        });
      }

    case "view":
      // Standard view rendering
      return res.status(statusCode).render(view, viewData);

    case "redirect":
      // Redirect with optional flash message
      if (flashMessage) {
        res.req.flash(flashType, flashMessage);
      }
      return res.redirect(redirectUrl);

    default:
      // Default to API response if type is not recognized
      return res.status(statusCode).json({
        success,
        message,
        data,
      });
  }
};

module.exports = {
  handleResponse,
};
