/**
 * Global error handler middleware for Express
 * Handles errors thrown in routes and other middleware
 */

const errorHandler = (err, req, res, next) => {
  // Log the error for server-side debugging
  console.error("Error:", err);

  // Set default status code and message
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  // Check if request wants JSON response (API) or HTML (web)
  const isApiRequest =
    req.xhr ||
    req.headers?.accept?.includes("application/json") ||
    req.path.startsWith("/api");

  if (isApiRequest) {
    // Send JSON error response for API requests
    return res.status(statusCode).json({
      success: false,
      message: message,
      error: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  } else {
    // Render error page for web requests
    return res.status(statusCode).render("error", {
      title: "Error",
      statusCode: statusCode,
      message: message,
      error: process.env.NODE_ENV === "development" ? err : {},
    });
  }
};

module.exports = errorHandler;
