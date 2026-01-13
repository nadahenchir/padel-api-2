// user-players.js - User view of players
// Add at the VERY TOP of courts.js, players.js, etc.
const API_BASE_URL = window.location.origin;

function loadPlayersPage() {
    const mainContent = document.getElementById('mainContent');
    
    mainContent.innerHTML = `
        <div class="max-w-7xl mx-auto">
            <!-- Header -->
            <div class="flex justify-between items-center mb-8">
                <div>
                    <h1 class="text-3xl font-bold text-gray-800">
                        <i class="fas fa-users text-green-600 mr-2"></i>
                        Players
                    </h1>
                    <p class="text-gray-500 mt-1">Browse all registered players</p>
                </div>
                <button onclick="fetchPlayers()" class="bg-gray-100 hover:bg-gray-200 px-6 py-3 rounded-lg transition flex items-center">
                    <i class="fas fa-sync-alt mr-2"></i>
                    Refresh
                </button>
            </div>

            <!-- Search -->
            <div class="bg-white rounded-lg shadow-md p-4 mb-6">
                <div class="relative">
                    <i class="fas fa-search absolute left-4 top-3 text-gray-400"></i>
                    <input 
                        type="text" 
                        id="searchPlayers" 
                        placeholder="Search players by name or license..."
                        class="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        onkeyup="filterPlayers()"
                    >
                </div>
            </div>

            <!-- Players Grid -->
            <div id="playersGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- Players will be loaded here -->
            </div>

            <!-- Empty state -->
            <div id="emptyState" class="hidden text-center py-12">
                <i class="fas fa-users text-6xl text-gray-300 mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-700 mb-2">No players found</h3>
                <p class="text-gray-500">No players match your search criteria</p>
            </div>
        </div>
    `;
    
    fetchPlayers();
}

let allPlayers = [];

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
        
        allPlayers = await response.json();
        displayPlayers(allPlayers);
        
    } catch (error) {
        console.error('Error fetching players:', error);
        showToast('Failed to load players', 'error');
    } finally {
        hideLoading();
    }
}

function displayPlayers(players) {
    const playersGrid = document.getElementById('playersGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (players.length === 0) {
        playersGrid.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    playersGrid.innerHTML = players.map(player => `
        <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6 player-card" 
             data-name="${player.name.toLowerCase()}" 
             data-license="${player.numero_licence?.toLowerCase() || ''}">
            <!-- Player Avatar -->
            <div class="flex items-center mb-4">
                <div class="flex-shrink-0 h-16 w-16 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center">
                    <i class="fas fa-user text-white text-2xl"></i>
                </div>
                <div class="ml-4 flex-1">
                    <h3 class="text-xl font-bold text-gray-800">${player.name}</h3>
                    <p class="text-sm text-gray-500">${player.numero_licence || 'No license'}</p>
                </div>
            </div>

            <!-- Player Stats -->
            <div class="space-y-2">
                <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span class="text-sm text-gray-600">Rank</span>
                    <span class="font-bold text-green-600">#${player.rang}</span>
                </div>
                <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span class="text-sm text-gray-600">Joined</span>
                    <span class="text-sm text-gray-800">${new Date(player.created_at).toLocaleDateString()}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function filterPlayers() {
    const searchTerm = document.getElementById('searchPlayers').value.toLowerCase();
    
    const filteredPlayers = allPlayers.filter(player => {
        const name = player.name.toLowerCase();
        const license = player.numero_licence?.toLowerCase() || '';
        return name.includes(searchTerm) || license.includes(searchTerm);
    });
    
    displayPlayers(filteredPlayers);
}