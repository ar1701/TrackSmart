const bcrypt = require("bcryptjs");
const Provider = require("../model/provider");
const passport = require("passport");

// Show login page
const showLogin = (req, res) => {
  res.render("login", {
    title: "Provider Login",
    error: req.flash("error"),
    success: req.flash("success"),
  });
};

// Handle login
const login = (req, res) => {
  res.redirect("/dashboard");
};

// Show dashboard
const showDashboard = async (req, res) => {
  try {
    const provider = req.user;
    res.render("dashboard", {
      title: "Provider Dashboard",
      provider: provider,
    });
  } catch (error) {
    console.error("Error loading dashboard:", error);
    res.status(500).render("error", { message: "Error loading dashboard" });
  }
};

// Logout
const logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error("Logout error:", err);
    }
    req.flash("success", "You have been logged out successfully");
    res.redirect("/login");
  });
};

// Generate credentials for verified provider (internal function)
const generateCredentials = async (providerId) => {
  try {
    const provider = await Provider.findById(providerId);

    if (!provider || !provider.isVerified) {
      throw new Error("Provider not found or not verified");
    }

    if (provider.isPasswordGenerated) {
      return {
        username: provider.username,
        message: "Credentials already exist",
      };
    }

    // Generate username from name and bppId
    const cleanName = provider.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "") // Remove special characters and spaces
      .substring(0, 10); // Limit to 10 characters

    const username = `${cleanName}_${provider.bppId.toLowerCase()}`;

    // Generate random password
    const password =
      Math.random().toString(36).slice(-8) +
      Math.random().toString(36).slice(-8);

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update provider with credentials
    await Provider.findByIdAndUpdate(providerId, {
      username: username,
      password: hashedPassword,
      isPasswordGenerated: true,
    });

    return {
      username: username,
      password: password,
      message: "Credentials generated successfully",
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  showLogin,
  login,
  showDashboard,
  logout,
  generateCredentials,
};
