const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const Admin = require("../model/admin");
const { handleResponse } = require("../utils/responseHandler");

// API: Admin Login
const adminLoginAPI = async (req, res) => {
  try {
    const { username, password, rememberMe } = req.body;

    // Validate required fields
    if (!username || !password) {
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 400,
        message: "Username and password are required",
      });
    }

    // Find admin by username or email
    const admin = await Admin.findOne({
      $or: [{ username: username }, { email: username.toLowerCase() }],
      isActive: true,
    });

    if (!admin) {
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 401,
        message: "Invalid credentials or account disabled",
      });
    }

    // Check password (plain text comparison)
    const isMatch = admin.password === password;

    if (!isMatch) {
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 401,
        message: "Invalid credentials",
      });
    }

    // Update last login and activity
    admin.lastLogin = new Date();
    admin.lastActivity = new Date();
    await admin.save();

    // Create session (you can implement JWT here instead)
    req.session.user = {
      id: admin._id,
      type: "admin",
      adminId: admin.adminId,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions,
    };

    // Also set admin session for backward compatibility
    req.session.admin = {
      id: admin._id,
      adminId: admin.adminId,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions,
    };

    // Set session expiry based on rememberMe
    if (rememberMe) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    }

    return handleResponse(res, {
      type: "api",
      success: true,
      message: "Login successful",
      data: {
        admin: {
          id: admin._id,
          adminId: admin.adminId,
          name: admin.name,
          email: admin.email,
          username: admin.username,
          role: admin.role,
          permissions: admin.permissions,
          department: admin.department,
          isActive: admin.isActive,
        },
        session: {
          expiresIn: rememberMe ? "30d" : "24h",
        },
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return handleResponse(res, {
      type: "api",
      success: false,
      statusCode: 500,
      message: "Login processing error",
      data: { error: error.message },
    });
  }
};

// API: Admin Logout
const adminLogoutAPI = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Admin logout error:", err);
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 500,
        message: "Logout error",
        data: { error: err.message },
      });
    }

    return handleResponse(res, {
      type: "api",
      success: true,
      message: "Logged out successfully",
    });
  });
};

// API: Get Admin Dashboard Data
const getAdminDashboard = async (req, res) => {
  try {
    const adminId = req.session.user.id;
    const admin = await Admin.findById(adminId);

    if (!admin) {
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 404,
        message: "Admin not found",
      });
    }

    // Update last activity
    admin.lastActivity = new Date();
    await admin.save();

    // Get system statistics (you can expand this)
    const Provider = require("../model/provider");
    const Seller = require("../model/seller");

    const [totalProviders, verifiedProviders, totalSellers, verifiedSellers] =
      await Promise.all([
        Provider.countDocuments(),
        Provider.countDocuments({ isVerified: true }),
        Seller.countDocuments(),
        Seller.countDocuments({ isVerified: true, status: "verified" }),
      ]);

    return handleResponse(res, {
      type: "api",
      success: true,
      message: "Dashboard data retrieved successfully",
      data: {
        admin: {
          id: admin._id,
          adminId: admin.adminId,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          permissions: admin.permissions,
          department: admin.department,
          lastLogin: admin.lastLogin,
        },
        stats: {
          providers: {
            total: totalProviders,
            verified: verifiedProviders,
            pending: totalProviders - verifiedProviders,
          },
          sellers: {
            total: totalSellers,
            verified: verifiedSellers,
            pending: totalSellers - verifiedSellers,
          },
          orders: {
            total: 0, // Calculate from orders collection
            pending: 0,
            completed: 0,
            cancelled: 0,
          },
          revenue: {
            today: 0,
            thisMonth: 0,
            thisYear: 0,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error retrieving admin dashboard data:", error);
    return handleResponse(res, {
      type: "api",
      success: false,
      statusCode: 500,
      message: "Failed to retrieve dashboard data",
      data: { error: error.message },
    });
  }
};

// API: Get Admin Profile
const getAdminProfile = async (req, res) => {
  try {
    const adminId = req.session.user.id;
    const admin = await Admin.findById(adminId).select(
      "-password -twoFactorSecret"
    );

    if (!admin) {
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 404,
        message: "Admin not found",
      });
    }

    return handleResponse(res, {
      type: "api",
      success: true,
      message: "Admin profile retrieved successfully",
      data: {
        admin: {
          id: admin._id,
          adminId: admin.adminId,
          name: admin.name,
          email: admin.email,
          username: admin.username,
          role: admin.role,
          permissions: admin.permissions,
          department: admin.department,
          phone: admin.phone,
          isActive: admin.isActive,
          lastLogin: admin.lastLogin,
          lastActivity: admin.lastActivity,
          notifications: admin.notifications,
          twoFactorEnabled: admin.twoFactorEnabled,
          avatar: admin.avatar,
          bio: admin.bio,
          createdAt: admin.createdAt,
          updatedAt: admin.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error("Error retrieving admin profile:", error);
    return handleResponse(res, {
      type: "api",
      success: false,
      statusCode: 500,
      message: "Failed to retrieve admin profile",
      data: { error: error.message },
    });
  }
};

// API: Update Admin Profile
const updateAdminProfile = async (req, res) => {
  try {
    const adminId = req.session.admin.id;
    const { name, phoneNumber, department } = req.body;

    // Find and update admin
    const admin = await Admin.findById(adminId);

    if (!admin) {
      return handleResponse(res, {
        type: "api",
        success: false,
        statusCode: 404,
        message: "Admin not found",
      });
    }

    // Update allowed fields (don't allow changing sensitive fields like role, permissions)
    if (name) admin.name = name;
    if (phoneNumber) admin.phoneNumber = phoneNumber;
    if (department) admin.department = department;

    admin.lastUpdated = new Date();
    await admin.save();

    return handleResponse(res, {
      type: "api",
      success: true,
      message: "Profile updated successfully",
      data: {
        admin: {
          id: admin._id,
          adminId: admin.adminId,
          name: admin.name,
          email: admin.email,
          phoneNumber: admin.phoneNumber,
          role: admin.role,
          department: admin.department,
          lastUpdated: admin.lastUpdated,
        },
      },
    });
  } catch (error) {
    console.error("Error updating admin profile:", error);
    return handleResponse(res, {
      type: "api",
      success: false,
      statusCode: 500,
      message: "Failed to update profile",
      data: { error: error.message },
    });
  }
};

// Middleware to check if admin is authenticated
const ensureAdminAuthenticated = (req, res, next) => {
  if (req.session.user && req.session.user.type === "admin") {
    return next();
  }

  return res.status(401).json({
    success: false,
    message: "Admin authentication required. Please login first.",
    error: "UNAUTHORIZED",
  });
};

// Middleware to check admin permissions
const checkAdminPermission = (permission) => {
  return (req, res, next) => {
    if (!req.session.user || req.session.user.type !== "admin") {
      return res.status(401).json({
        success: false,
        message: "Admin authentication required.",
        error: "UNAUTHORIZED",
      });
    }

    const userPermissions = req.session.user.permissions || [];
    const userRole = req.session.user.role;

    // Super admin has all permissions
    if (userRole === "super-admin") {
      return next();
    }

    // Check if user has the required permission
    if (userPermissions.includes(permission)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to access this resource.",
      error: "FORBIDDEN",
    });
  };
};

module.exports = {
  login: adminLoginAPI,
  logout: adminLogoutAPI,
  dashboard: getAdminDashboard,
  getProfile: getAdminProfile,
  updateProfile: updateAdminProfile,
  ensureAdminAuthenticated,
  checkAdminPermission,
};
