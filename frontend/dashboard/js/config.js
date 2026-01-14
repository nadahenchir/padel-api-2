// config.js - Shared frontend configuration (admin + user dashboards)

// Use same-origin. Example: fetch("/player") -> goes to same host:port serving the page.
const API_BASE_URL = "";

// JWT token helpers
function getToken() {
  return localStorage.getItem("jwt_token");
}

function setToken(token) {
  localStorage.setItem("jwt_token", token);
}

// Logout helper (use Flask route)
function logout() {
  localStorage.removeItem("jwt_token");
  window.location.href = "/login";
}

// Loading overlay helpers (optional)
function showLoading() {
  const overlay = document.getElementById("loadingOverlay");
  if (overlay) overlay.classList.remove("hidden");
}

function hideLoading() {
  const overlay = document.getElementById("loadingOverlay");
  if (overlay) overlay.classList.add("hidden");
}

// Toast notification helper (uses your existing toast div if present)
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toastMessage");

  if (!toast || !toastMessage) {
    console.log(`[${type}] ${message}`);
    return;
  }

  toastMessage.textContent = message;

  toast.className = "fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transition-opacity";

  if (type === "success") {
    toast.classList.add("bg-green-500", "text-white");
  } else if (type === "error") {
    toast.classList.add("bg-red-500", "text-white");
  } else {
    toast.classList.add("bg-blue-500", "text-white");
  }

  toast.classList.remove("hidden");

  setTimeout(() => {
    toast.classList.add("hidden");
  }, 3000);
}
