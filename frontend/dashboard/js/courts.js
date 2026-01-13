// courts.js - Courts page functionality
if (typeof API_BASE_URL === 'undefined') {
    const API_BASE_URL = '/api';  // Use relative path
}

function loadCourtsPage() {
    const mainContent = document.getElementById('mainContent');
    
    mainContent.innerHTML = `
        <div class="max-w-7xl mx-auto">
            <!-- Header -->
            <div class="flex justify-between items-center mb-8">
                <div>
                    <h1 class="text-3xl font-bold text-gray-800">Courts</h1>
                    <p class="text-gray-500 mt-1">Manage all courts and their availability</p>
                </div>
                <button onclick="showAddCourtModal()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition flex items-center">
                    <i class="fas fa-plus mr-2"></i>
                    Add Court
                </button>
            </div>

            <!-- Filter -->
            <div class="bg-white rounded-lg shadow-md p-4 mb-6">
                <div class="flex gap-4">
                    <select id="courtTypeFilter" onchange="filterCourts()" class="px-4 py-2 border border-gray-300 rounded-lg">
                        <option value="">All Courts</option>
                        <option value="indoor">Indoor Only</option>
                        <option value="outdoor">Outdoor Only</option>
                    </select>
                    <button onclick="fetchCourts()" class="bg-gray-100 hover:bg-gray-200 px-6 py-2 rounded-lg transition flex items-center">
                        <i class="fas fa-sync-alt mr-2"></i>
                        Refresh
                    </button>
                </div>
            </div>

            <!-- Courts Grid -->
            <div id="courtsGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- Courts will be loaded here -->
            </div>

            <!-- Empty state -->
            <div id="emptyStateCourts" class="hidden text-center py-12">
                <i class="fas fa-building text-6xl text-gray-300 mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-700 mb-2">No courts found</h3>
                <p class="text-gray-500 mb-4">Get started by adding your first court</p>
                <button onclick="showAddCourtModal()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition">
                    <i class="fas fa-plus mr-2"></i>
                    Add Court
                </button>
            </div>
        </div>
    `;
    
    // Fetch courts from API
    fetchCourts();
}

let allCourts = [];

// Fetch courts from API
async function fetchCourts() {
    showLoading();
    
    try {
        const response = await fetch('/api/court', {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch courts');
        }
        
        allCourts = await response.json();
        displayCourts(allCourts);
        
    } catch (error) {
        console.error('Error fetching courts:', error);
        showToast('Failed to load courts', 'error');
    } finally {
        hideLoading();
    }
}

// Display courts in grid
function displayCourts(courts) {
    const courtsGrid = document.getElementById('courtsGrid');
    const emptyState = document.getElementById('emptyStateCourts');
    
    if (courts.length === 0) {
        courtsGrid.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    courtsGrid.innerHTML = courts.map(court => `
        <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6 court-card" data-type="${court.is_indoor ? 'indoor' : 'outdoor'}">
            <!-- Court Header -->
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="text-xl font-bold text-gray-800">${court.name}</h3>
                    <p class="text-sm text-gray-500 mt-1">${court.location || 'No location set'}</p>
                </div>
                <button onclick="deleteCourt('${court.id}', '${court.name}')" class="text-red-600 hover:text-red-800">
                    <i class="fas fa-trash"></i>
                </button>
            </div>

            <!-- Court Type -->
            <div class="mb-4">
                <span class="px-3 py-1 rounded-full text-xs font-semibold ${court.is_indoor ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}">
                    <i class="fas ${court.is_indoor ? 'fa-home' : 'fa-sun'} mr-1"></i>
                    ${court.is_indoor ? 'INDOOR' : 'OUTDOOR'}
                </span>
            </div>

            <!-- Court Availability -->
            <div class="mb-4">
                <div class="flex items-center justify-between">
                    <span class="text-sm font-semibold text-gray-700">Availability:</span>
                    <span class="px-2 py-1 rounded text-xs font-semibold ${court.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${court.is_available ? 'Available' : 'Unavailable'}
                    </span>
                </div>
            </div>

            <!-- Court Info -->
            <div class="border-t pt-4 text-xs text-gray-500">
                <div class="flex justify-between mb-2">
                    <span>Court ID:</span>
                    <span class="font-mono">${court.id.substring(0, 8)}...</span>
                </div>
                <div class="flex justify-between">
                    <span>Created:</span>
                    <span>${new Date(court.created_at).toLocaleDateString()}</span>
                </div>
            </div>

            <!-- Actions -->
            <div class="border-t pt-4 mt-4">
                <button onclick="toggleCourtAvailability('${court.id}', ${!court.is_available})" 
                        class="w-full ${court.is_available ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white py-2 rounded-lg transition text-sm font-medium">
                    <i class="fas ${court.is_available ? 'fa-ban' : 'fa-check'} mr-2"></i>
                    ${court.is_available ? 'Mark Unavailable' : 'Mark Available'}
                </button>
            </div>
        </div>
    `).join('');
}

// Filter courts
function filterCourts() {
    const filter = document.getElementById('courtTypeFilter').value;
    
    let filteredCourts = allCourts;
    
    if (filter === 'indoor') {
        filteredCourts = allCourts.filter(c => c.is_indoor);
    } else if (filter === 'outdoor') {
        filteredCourts = allCourts.filter(c => !c.is_indoor);
    }
    
    displayCourts(filteredCourts);
}

// Show add court modal
function showAddCourtModal() {
    const modal = document.createElement('div');
    modal.id = 'courtModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-gray-800">Add New Court</h2>
                <button onclick="closeCourtModal()" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times text-2xl"></i>
                </button>
            </div>
            
            <form id="addCourtForm" onsubmit="handleAddCourt(event)">
                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2">
                        Court Name <span class="text-red-500">*</span>
                    </label>
                    <input 
                        type="text" 
                        id="courtName" 
                        required
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="e.g., Padel Court 1"
                    >
                </div>
                
                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2">
                        Location
                    </label>
                    <input 
                        type="text" 
                        id="courtLocation" 
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="e.g., Tunis Sports Complex"
                    >
                </div>
                
                <div class="mb-6">
                    <label class="flex items-center">
                        <input type="checkbox" id="isIndoor" class="mr-2">
                        <span class="text-gray-700 text-sm font-bold">Indoor Court</span>
                    </label>
                    <p class="text-xs text-gray-500 mt-1 ml-6">Check if this is an indoor court (protected from weather)</p>
                </div>
                
                <div class="flex gap-3">
                    <button 
                        type="button" 
                        onclick="closeCourtModal()" 
                        class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg transition"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition"
                    >
                        <i class="fas fa-save mr-2"></i>
                        Save Court
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Close court modal
function closeCourtModal() {
    const modal = document.getElementById('courtModal');
    if (modal) {
        modal.remove();
    }
}

// Handle add court form submission
async function handleAddCourt(event) {
    event.preventDefault();
    
    const name = document.getElementById('courtName').value;
    const location = document.getElementById('courtLocation').value;
    const isIndoor = document.getElementById('isIndoor').checked;
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE_URL}/court`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({
                name: name,
                location: location || null,
                is_indoor: isIndoor
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to add court');
        }
        
        showToast('Court added successfully!', 'success');
        closeCourtModal();
        fetchCourts(); // Reload courts
        
    } catch (error) {
        console.error('Error adding court:', error);
        showToast(error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Toggle court availability
async function toggleCourtAvailability(courtId, newAvailability) {
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE_URL}/court/${courtId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({
                is_available: newAvailability
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to update court');
        }
        
        showToast(`Court marked as ${newAvailability ? 'available' : 'unavailable'}`, 'success');
        fetchCourts(); // Reload courts
        
    } catch (error) {
        console.error('Error updating court:', error);
        showToast('Failed to update court', 'error');
    } finally {
        hideLoading();
    }
}

// Delete court
async function deleteCourt(courtId, courtName) {
    if (!confirm(`Are you sure you want to delete ${courtName}?`)) {
        return;
    }
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE_URL}/court/${courtId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete court');
        }
        
        showToast('Court deleted successfully!', 'success');
        fetchCourts(); // Reload courts
        
    } catch (error) {
        console.error('Error deleting court:', error);
        showToast('Failed to delete court', 'error');
    } finally {
        hideLoading();
    }
}