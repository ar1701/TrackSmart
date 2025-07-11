// Middleware for API authentication
const ensureAPIAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }

  return res.status(401).json({
    success: false,
    message: "Authentication required. Please login first.",
    error: "UNAUTHORIZED",
  });
};

// Middleware for API routes that should not be accessed when authenticated
const ensureAPINotAuthenticated = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return next();
  }

  return res.status(400).json({
    success: false,
    message: "Already authenticated. Please logout first.",
    error: "ALREADY_AUTHENTICATED",
  });
};

// Middleware to check if provider is verified
const ensureProviderVerified = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
      error: "UNAUTHORIZED",
    });
  }

  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: "Provider not verified. Please contact administrator.",
      error: "PROVIDER_NOT_VERIFIED",
    });
  }

  return next();
};

module.exports = {
  ensureAPIAuthenticated,
  ensureAPINotAuthenticated,
  ensureProviderVerified,
};
