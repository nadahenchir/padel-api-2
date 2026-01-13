// players.js - Players page functionality
if (typeof API_BASE_URL === 'undefined') {
    const API_BASE_URL = '/api';  // Use relative path
}
function loadPlayersPage() {
    const mainContent = document.getElementById('mainContent');
    
    mainContent.innerHTML = `
        <div class="max-w-7xl mx-auto">
            <!-- Header -->
            <div class="flex justify-between items-center mb-8">
                <div>
                    <h1 class="text-3xl font-bold text-gray-800">Players</h1>
                    <p class="text-gray-500 mt-1">Manage all players in the system</p>
                </div>
                <button onclick="showAddPlayerModal()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition flex items-center">
                    <i class="fas fa-plus mr-2"></i>
                    Add Player
                </button>
            </div>

            <!-- Search and Filter -->
            <div class="bg-white rounded-lg shadow-md p-4 mb-6">
                <div class="flex gap-4">
                    <div class="flex-1">
                        <input 
                            type="text" 
                            id="searchPlayers" 
                            placeholder="Search players by name or license..."
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            onkeyup="filterPlayers()"
                        >
                    </div>
                    <button onclick="fetchPlayers()" class="bg-gray-100 hover:bg-gray-200 px-6 py-2 rounded-lg transition flex items-center">
                        <i class="fas fa-sync-alt mr-2"></i>
                        Refresh
                    </button>
                </div>
            </div>

            <!-- Players Table -->
            <div class="bg-white rounded-lg shadow-md overflow-hidden">
                <table class="w-full">
                    <thead class="bg-gray-50 border-b">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License Number</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="playersTableBody" class="bg-white divide-y divide-gray-200">
                        <!-- Players will be loaded here -->
                    </tbody>
                </table>
            </div>

            <!-- Empty state -->
            <div id="emptyState" class="hidden text-center py-12">
                <i class="fas fa-users text-6xl text-gray-300 mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-700 mb-2">No players found</h3>
                <p class="text-gray-500 mb-4">Get started by adding your first player</p>
                <button onclick="showAddPlayerModal()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition">
                    <i class="fas fa-plus mr-2"></i>
                    Add Player
                </button>
            </div>
        </div>
    `;
    
    // Fetch players from API
    fetchPlayers();
}

// Fetch players from API
async function fetchPlayers() {
    showLoading();
    
    try {
        const response = await fetch('/api/court', {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch players');
        }
        
        const players = await response.json();
        displayPlayers(players);
        
    } catch (error) {
        console.error('Error fetching players:', error);
        showToast('Failed to load players', 'error');
    } finally {
        hideLoading();
    }
}

// Display players in table
function displayPlayers(players) {
    const tbody = document.getElementById('playersTableBody');
    const emptyState = document.getElementById('emptyState');
    
    if (players.length === 0) {
        tbody.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    tbody.innerHTML = players.map(player => `
        <tr class="hover:bg-gray-50 transition player-row" data-name="${player.name.toLowerCase()}" data-license="${player.numero_licence?.toLowerCase() || ''}">
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <i class="fas fa-user text-indigo-600"></i>
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${player.name}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${player.numero_licence || 'N/A'}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Rank ${player.rang}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${new Date(player.created_at).toLocaleDateString()}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="editPlayer('${player.id}')" class="text-indigo-600 hover:text-indigo-900 mr-3">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button onclick="deletePlayer('${player.id}', '${player.name}')" class="text-red-600 hover:text-red-900">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        </tr>
    `).join('');
}

// Filter players
function filterPlayers() {
    const searchTerm = document.getElementById('searchPlayers').value.toLowerCase();
    const rows = document.querySelectorAll('.player-row');
    
    rows.forEach(row => {
        const name = row.dataset.name;
        const license = row.dataset.license;
        
        if (name.includes(searchTerm) || license.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Show add player modal
function showAddPlayerModal() {
    const mainContent = document.getElementById('mainContent');
    
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'playerModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-gray-800">Add New Player</h2>
                <button onclick="closePlayerModal()" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times text-2xl"></i>
                </button>
            </div>
            
            <form id="addPlayerForm" onsubmit="handleAddPlayer(event)">
                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2">
                        Player Name <span class="text-red-500">*</span>
                    </label>
                    <input 
                        type="text" 
                        id="playerName" 
                        required
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Enter player name"
                    >
                </div>
                
                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2">
                        License Number
                    </label>
                    <input 
                        type="text" 
                        id="playerLicense" 
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="e.g., TUN001"
                    >
                </div>
                
                <div class="mb-6">
                    <label class="block text-gray-700 text-sm font-bold mb-2">
                        Rank <span class="text-red-500">*</span>
                    </label>
                    <input 
                        type="number" 
                        id="playerRank" 
                        required
                        min="1"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Enter rank (1-100)"
                    >
                </div>
                
                <div class="flex gap-3">
                    <button 
                        type="button" 
                        onclick="closePlayerModal()" 
                        class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg transition"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition"
                    >
                        <i class="fas fa-save mr-2"></i>
                        Save Player
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Close player modal
function closePlayerModal() {
    const modal = document.getElementById('playerModal');
    if (modal) {
        modal.remove();
    }
}

// Handle add player form submission
async function handleAddPlayer(event) {
    event.preventDefault();
    
    const name = document.getElementById('playerName').value;
    const license = document.getElementById('playerLicense').value;
    const rank = parseInt(document.getElementById('playerRank').value);
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE_URL}/player`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({
                name: name,
                numero_licence: license || null,
                rang: rank
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to add player');
        }
        
        showToast('Player added successfully!', 'success');
        closePlayerModal();
        fetchPlayers(); // Reload players
        
    } catch (error) {
        console.error('Error adding player:', error);
        showToast(error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Delete player
async function deletePlayer(playerId, playerName) {
    if (!confirm(`Are you sure you want to delete ${playerName}?`)) {
        return;
    }
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE_URL}/player/${playerId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete player');
        }
        
        showToast('Player deleted successfully!', 'success');
        fetchPlayers(); // Reload players
        
    } catch (error) {
        console.error('Error deleting player:', error);
        showToast('Failed to delete player', 'error');
    } finally {
        hideLoading();
    }
}

// Edit player (placeholder for now)
function editPlayer(playerId) {
    showToast('Edit functionality coming soon!', 'info');
}