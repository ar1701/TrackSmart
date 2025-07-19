/* Provider Dashboard Fixes - Inject this script into the dashboard */

// Fix 1: Enhanced Logout Function
window.enhancedLogoutProvider = async function () {
  console.log("🔄 Enhanced logout function called");

  if (confirm("Are you sure you want to logout?")) {
    try {
      // Show loading state
      const logoutBtn = document.querySelector('a[onclick*="logoutProvider"]');
      if (logoutBtn) {
        logoutBtn.innerHTML =
          '<i class="fas fa-spinner fa-spin me-2"></i>Logging out...';
        logoutBtn.style.pointerEvents = "none";
      }

      const response = await fetch("/api/providers/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
      });

      console.log("Logout response status:", response.status);

      if (response.ok || response.status === 200) {
        // Clear storage
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (e) {
          console.log("Storage clear failed:", e);
        }

        // Force redirect
        console.log("Redirecting to login...");
        window.location.replace("/main-login");
        return;
      }

      // Handle error response
      let errorMsg = "Logout failed";
      try {
        const result = await response.json();
        errorMsg = result.message || errorMsg;
      } catch (e) {
        console.log("Could not parse error response");
      }

      throw new Error(errorMsg);
    } catch (error) {
      console.error("Logout error:", error);
      alert("Logout error: " + error.message + ". Redirecting anyway...");
      // Force redirect even on error
      window.location.replace("/main-login");
    }
  }
};

// Fix 2: Enhanced Accept/Reject Functions
window.enhancedHandleRequest = async function (requestId, action) {
  console.log(`🔄 Enhanced ${action} function called for request:`, requestId);

  // Disable button to prevent double-clicks
  const buttons = document.querySelectorAll(`button[onclick*="${requestId}"]`);
  buttons.forEach((btn) => {
    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin me-2"></i>Processing...`;
  });

  try {
    let data = {};

    // Get input based on action
    if (action === "accept") {
      // Try to use modal first
      const costInput = document.getElementById("actualCost");
      if (costInput && costInput.value) {
        data.actualCost = parseFloat(costInput.value);
      } else {
        // Fallback to prompt
        const cost = prompt("Enter actual cost for this shipment (₹):");
        if (!cost || isNaN(cost) || parseFloat(cost) <= 0) {
          throw new Error("Valid cost is required");
        }
        data.actualCost = parseFloat(cost);
      }
    } else if (action === "reject") {
      // Try to use modal first
      const reasonInput = document.getElementById("rejectionReason");
      if (reasonInput && reasonInput.value.trim()) {
        data.rejectionReason = reasonInput.value.trim();
      } else {
        // Fallback to prompt
        const reason = prompt("Enter reason for rejection:");
        if (!reason || !reason.trim()) {
          throw new Error("Rejection reason is required");
        }
        data.rejectionReason = reason.trim();
      }
    }

    // Make API call
    const response = await fetch(
      `/api/providers/requests/${requestId}/${action}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(data),
      }
    );

    console.log(`${action} response status:`, response.status);

    if (response.ok) {
      const result = await response.json();
      console.log(`${action} result:`, result);

      if (result.success) {
        alert(`Request ${action}ed successfully!`);
        // Refresh page to show updated status
        window.location.reload();
      } else {
        throw new Error(result.message || `${action} failed`);
      }
    } else {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error(`${action} error:`, error);
    alert(`Error ${action}ing request: ${error.message}`);
  } finally {
    // Re-enable buttons
    buttons.forEach((btn) => {
      btn.disabled = false;
      btn.innerHTML = btn.innerHTML.includes("Accept")
        ? '<i class="fas fa-check me-1"></i>Accept'
        : '<i class="fas fa-times me-1"></i>Reject';
    });
  }
};

// Fix 3: Replace existing functions with enhanced versions
document.addEventListener("DOMContentLoaded", function () {
  console.log("🔧 Applying provider dashboard fixes...");

  // Replace logout function
  if (typeof window.logoutProvider === "function") {
    window.logoutProvider = window.enhancedLogoutProvider;
    console.log("✅ Logout function enhanced");
  }

  // Replace handleRequest function
  if (typeof window.handleRequest === "function") {
    window.handleRequest = window.enhancedHandleRequest;
    console.log("✅ HandleRequest function enhanced");
  }

  // Fix provider information display
  const usernameElements = document.querySelectorAll('p:contains("Username:")');
  usernameElements.forEach((el) => {
    if (
      el.textContent.includes("undefined") ||
      el.textContent.includes("null")
    ) {
      el.innerHTML = el.innerHTML.replace(/undefined|null/, "Not set");
    }
  });

  // Fix member since display
  const memberElements = document.querySelectorAll(
    'p:contains("Member Since:")'
  );
  memberElements.forEach((el) => {
    if (
      el.textContent.includes("Invalid Date") ||
      el.textContent.includes("NaN")
    ) {
      el.innerHTML = el.innerHTML.replace(
        /Invalid Date|NaN\/NaN\/NaN/,
        "Not available"
      );
    }
  });

  console.log("🎉 Provider dashboard fixes applied successfully!");
});

// Override onclick handlers for logout links
document.addEventListener("DOMContentLoaded", function () {
  const logoutLinks = document.querySelectorAll('a[onclick*="logoutProvider"]');
  logoutLinks.forEach((link) => {
    link.removeAttribute("onclick");
    link.addEventListener("click", function (e) {
      e.preventDefault();
      window.enhancedLogoutProvider();
    });
  });
});

console.log("📦 Provider Dashboard Enhancement Script Loaded");
