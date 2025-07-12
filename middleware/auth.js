// Middleware to check if user is authenticated
const ensureAuthenticated = (req, res, next) => {
  // Check passport authentication first
  if (req.isAuthenticated()) {
    return next();
  }

  // Check session-based authentication
  if (req.session && req.session.user) {
    // For session-based auth, set req.user for compatibility
    req.user = req.session.user;
    return next();
  }

  res.redirect("/main-login");
};

// Middleware to check if user is not authenticated (for login/register pages)
const ensureNotAuthenticated = (req, res, next) => {
  // Check both passport and session authentication
  if (!req.isAuthenticated() && (!req.session || !req.session.user)) {
    return next();
  }

  // Redirect based on user type
  if (req.session && req.session.user) {
    switch (req.session.user.type) {
      case "admin":
        return res.redirect("/admin/dashboard");
      case "seller":
        return res.redirect("/seller/dashboard");
      case "provider":
        return res.redirect("/dashboard");
      default:
        return res.redirect("/dashboard");
    }
  }

  res.redirect("/dashboard");
};

module.exports = {
  ensureAuthenticated,
  ensureNotAuthenticated,
};
