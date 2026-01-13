// config.js - Configuration for frontend
const API_BASE_URL = '/api';  // Use relative path for same domain

// Authentication helper functions
function getToken() {
    return localStorage.getItem('token');
}

function isLoggedIn() {
    return !!getToken();
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
}

// Loading indicators
function showLoading() {
    // Implement loading indicator if needed
}

function hideLoading() {
    // Hide loading indicator if needed
}

// Toast notifications
function showToast(message, type = 'info') {
    // Implement toast notifications if needed
    console.log(`${type}: ${message}`);
}