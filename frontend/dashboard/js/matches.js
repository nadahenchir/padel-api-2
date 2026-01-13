// matches.js - Matches page functionality
if (typeof API_BASE_URL === 'undefined') {
    const API_BASE_URL = '/api';  // Use relative path
}

function loadMatchesPage(tournamentId = null) {
    const mainContent = document.getElementById('mainContent');
    
    mainContent.innerHTML = `
        <div class="max-w-7xl mx-auto">
            <!-- Header -->
            <div class="flex justify-between items-center mb-8">
                <div>
                    <h1 class="text-3xl font-bold text-gray-800">Matches</h1>
                    <p class="text-gray-500 mt-1">View and manage all matches</p>
                </div>
                <button onclick="fetchMatches()" class="bg-gray-100 hover:bg-gray-200 px-6 py-3 rounded-lg transition flex items-center">
                    <i class="fas fa-sync-alt mr-2"></i>
                    Refresh
                </button>
            </div>

            <!-- Filters -->
            <div class="bg-white rounded-lg shadow-md p-4 mb-6">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
                        <select id="statusFilter" onchange="filterMatches()" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="finished">Finished</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Filter by Phase</label>
                        <select id="phaseFilter" onchange="filterMatches()" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                            <option value="">All Phases</option>
                            <option value="group">Group Phase</option>
                            <option value="knockout">Knockout Phase</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Search Teams</label>
                        <input 
                            type="text" 
                            id="teamSearch" 
                            placeholder="Search by team name..."
                            onkeyup="filterMatches()"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        >
                    </div>
                </div>
            </div>

            <!-- Matches List -->
            <div id="matchesList" class="space-y-4">
                <!-- Matches will be loaded here -->
            </div>

            <!-- Empty state -->
            <div id="emptyStateMatches" class="hidden text-center py-12">
                <i class="fas fa-table-tennis text-6xl text-gray-300 mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-700 mb-2">No matches found</h3>
                <p class="text-gray-500">Matches will appear here once tournaments start</p>
            </div>
        </div>
    `;
    
    // Store tournament filter if provided
    window.currentTournamentFilter = tournamentId;
    
    // Fetch matches from API
    fetchMatches();
}

let allMatches = [];

// Fetch matches from API
async function fetchMatches() {
    showLoading();
    
    try {
        let url = `${API_BASE_URL}/match`;
        
        // If filtering by tournament
        if (window.currentTournamentFilter) {
            url = `${API_BASE_URL}/tournament/${window.currentTournamentFilter}/matches`;
        }
        
        const response = await fetch('/api/court', {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch matches');
        }
        
        allMatches = await response.json();
        displayMatches(allMatches);
        
    } catch (error) {
        console.error('Error fetching matches:', error);
        showToast('Failed to load matches', 'error');
    } finally {
        hideLoading();
    }
}

// Display matches
function displayMatches(matches) {
    const matchesList = document.getElementById('matchesList');
    const emptyState = document.getElementById('emptyStateMatches');
    
    if (matches.length === 0) {
        matchesList.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    matchesList.innerHTML = matches.map(match => `
        <div class="bg-white rounded-lg shadow-md p-6 match-card" 
             data-status="${match.status}" 
             data-phase="${match.phase}"
             data-teams="${match.team1.name.toLowerCase()} ${match.team2.name.toLowerCase()}">
            
            <!-- Match Header -->
            <div class="flex justify-between items-start mb-4">
                <div class="flex items-center gap-3">
                    <span class="px-3 py-1 rounded-full text-xs font-semibold ${getPhaseColor(match.phase)}">
                        ${match.phase === 'group' ? 'GROUP' : `ROUND ${match.round_num || 'N/A'}`}
                    </span>
                    <span class="px-3 py-1 rounded-full text-xs font-semibold ${getMatchStatusColor(match.status)}">
                        ${match.status.toUpperCase()}
                    </span>
                </div>
                ${match.court_booking ? `
                    <div class="text-sm text-gray-600">
                        <i class="fas fa-calendar mr-1"></i>
                        ${new Date(match.court_booking.booking_date).toLocaleDateString()}
                        at ${match.court_booking.start_time}
                        <br>
                        <i class="fas fa-building mr-1"></i>
                        ${match.court_booking.court.name}
                    </div>
                ` : ''}
            </div>

            <!-- Teams -->
            <div class="grid grid-cols-3 gap-4 items-center mb-4">
                <!-- Team 1 -->
                <div class="text-right">
                    <div class="font-bold text-lg ${match.winner_id === match.team1_id ? 'text-green-600' : 'text-gray-800'}">
                        ${match.team1.name}
                        ${match.winner_id === match.team1_id ? '<i class="fas fa-trophy ml-2"></i>' : ''}
                    </div>
                    <div class="text-sm text-gray-500">Rank ${match.team1.ranking}</div>
                </div>

                <!-- Score -->
                <div class="text-center">
                    ${match.status === 'finished' ? `
                        <div class="text-3xl font-bold">
                            <span class="${match.team1_score > match.team2_score ? 'text-green-600' : 'text-gray-800'}">
                                ${match.team1_score}
                            </span>
                            <span class="text-gray-400 mx-2">-</span>
                            <span class="${match.team2_score > match.team1_score ? 'text-green-600' : 'text-gray-800'}">
                                ${match.team2_score}
                            </span>
                        </div>
                    ` : `
                        <div class="text-2xl font-bold text-gray-400">VS</div>
                    `}
                </div>

                <!-- Team 2 -->
                <div class="text-left">
                    <div class="font-bold text-lg ${match.winner_id === match.team2_id ? 'text-green-600' : 'text-gray-800'}">
                        ${match.winner_id === match.team2_id ? '<i class="fas fa-trophy mr-2"></i>' : ''}
                        ${match.team2.name}
                    </div>
                    <div class="text-sm text-gray-500">Rank ${match.team2.ranking}</div>
                </div>
            </div>

            <!-- Actions -->
            ${match.status === 'pending' ? `
                <div class="border-t pt-4">
                    <button onclick="recordResultModal('${match.id}')" class="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition text-sm font-medium">
                        <i class="fas fa-clipboard-check mr-2"></i>
                        Record Result
                    </button>
                </div>
            ` : ''}

            ${match.cancelled_by_team_id ? `
                <div class="border-t pt-4 bg-red-50 -m-6 p-4 mt-4 rounded-b-lg">
                    <div class="text-sm text-red-700">
                        <i class="fas fa-exclamation-triangle mr-2"></i>
                        <strong>Match Cancelled:</strong> ${match.cancellation_reason || 'Team forfeited'}
                    </div>
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Filter matches
function filterMatches() {
    const statusFilter = document.getElementById('statusFilter').value;
    const phaseFilter = document.getElementById('phaseFilter').value;
    const teamSearch = document.getElementById('teamSearch').value.toLowerCase();
    
    const filteredMatches = allMatches.filter(match => {
        const statusMatch = !statusFilter || match.status === statusFilter;
        const phaseMatch = !phaseFilter || match.phase === phaseFilter;
        const teamMatch = !teamSearch || 
            match.team1.name.toLowerCase().includes(teamSearch) ||
            match.team2.name.toLowerCase().includes(teamSearch);
        
        return statusMatch && phaseMatch && teamMatch;
    });
    
    displayMatches(filteredMatches);
}

// Get phase color
function getPhaseColor(phase) {
    return phase === 'group' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
}

// Get match status color
function getMatchStatusColor(status) {
    switch(status) {
        case 'pending':
            return 'bg-yellow-100 text-yellow-800';
        case 'finished':
            return 'bg-green-100 text-green-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

// Record result modal
function recordResultModal(matchId) {
    const match = allMatches.find(m => m.id === matchId);
    if (!match) return;
    
    const modal = document.createElement('div');
    modal.id = 'recordResultModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-gray-800">Record Match Result</h2>
                <button onclick="closeRecordResultModal()" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times text-2xl"></i>
                </button>
            </div>
            
            <div class="mb-6">
                <div class="text-center text-gray-600 mb-4">
                    ${match.team1.name} <strong>VS</strong> ${match.team2.name}
                </div>
            </div>
            
            <form onsubmit="handleRecordResult(event, '${matchId}')">
                <div class="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <label class="block text-gray-700 text-sm font-bold mb-2">
                            ${match.team1.name} Score <span class="text-red-500">*</span>
                        </label>
                        <input 
                            type="number" 
                            id="team1Score" 
                            required
                            min="0"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="0"
                        >
                    </div>
                    
                    <div>
                        <label class="block text-gray-700 text-sm font-bold mb-2">
                            ${match.team2.name} Score <span class="text-red-500">*</span>
                        </label>
                        <input 
                            type="number" 
                            id="team2Score" 
                            required
                            min="0"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="0"
                        >
                    </div>
                </div>
                
                <div class="flex gap-3">
                    <button 
                        type="button" 
                        onclick="closeRecordResultModal()" 
                        class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg transition"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        class="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition"
                    >
                        <i class="fas fa-save mr-2"></i>
                        Save Result
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeRecordResultModal() {
    const modal = document.getElementById('recordResultModal');
    if (modal) modal.remove();
}

async function handleRecordResult(event, matchId) {
    event.preventDefault();
    
    const team1Score = parseInt(document.getElementById('team1Score').value);
    const team2Score = parseInt(document.getElementById('team2Score').value);
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE_URL}/match/${matchId}/record-result`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({
                team1_score: team1Score,
                team2_score: team2Score
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to record result');
        }
        
        showToast('Match result recorded successfully!', 'success');
        closeRecordResultModal();
        fetchMatches(); // Reload matches
        
    } catch (error) {
        console.error('Error recording result:', error);
        showToast(error.message, 'error');
    } finally {
        hideLoading();
    }
}