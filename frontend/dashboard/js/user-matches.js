// user-matches.js - User view of matches
// Add at the VERY TOP of courts.js, players.js, etc.
const API_BASE_URL = window.location.origin;

function loadMatchesPage(tournamentId = null) {
    const mainContent = document.getElementById('mainContent');
    
    mainContent.innerHTML = `
        <div class="max-w-7xl mx-auto">
            <!-- Header -->
            <div class="flex justify-between items-center mb-8">
                <div>
                    <h1 class="text-3xl font-bold text-gray-800">
                        <i class="fas fa-table-tennis text-green-600 mr-2"></i>
                        Matches
                    </h1>
                    <p class="text-gray-500 mt-1">View all tournament matches and results</p>
                </div>
                <button onclick="fetchMatches()" class="bg-gray-100 hover:bg-gray-200 px-6 py-3 rounded-lg transition flex items-center">
                    <i class="fas fa-sync-alt mr-2"></i>
                    Refresh
                </button>
            </div>

            <!-- Filters -->
            <div class="bg-white rounded-lg shadow-md p-4 mb-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
                        <select id="statusFilter" onchange="filterMatches()" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                            <option value="">All Statuses</option>
                            <option value="pending">Upcoming</option>
                            <option value="finished">Completed</option>
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
                <p class="text-gray-500">Matches will appear once tournaments start</p>
            </div>
        </div>
    `;
    
    window.currentTournamentFilter = tournamentId;
    fetchMatches();
}

let allMatches = [];

async function fetchMatches() {
    showLoading();
    
    try {
        let url = `${API_BASE_URL}/match`;
        
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
        <div class="bg-white rounded-lg shadow-md p-6 match-card border-l-4 ${match.status === 'finished' ? 'border-green-500' : 'border-yellow-500'}" 
             data-status="${match.status}" 
             data-teams="${match.team1.name.toLowerCase()} ${match.team2.name.toLowerCase()}">
            
            <!-- Match Header -->
            <div class="flex justify-between items-start mb-4">
                <div class="flex items-center gap-3">
                    <span class="px-3 py-1 rounded-full text-xs font-semibold ${getPhaseColor(match.phase)}">
                        ${match.phase === 'group' ? 'GROUP PHASE' : `KNOCKOUT - ROUND ${match.round_num || '?'}`}
                    </span>
                    <span class="px-3 py-1 rounded-full text-xs font-semibold ${getMatchStatusColor(match.status)}">
                        ${match.status === 'pending' ? 'UPCOMING' : 'COMPLETED'}
                    </span>
                </div>
                ${match.court_booking ? `
                    <div class="text-sm text-gray-600 text-right">
                        <div>
                            <i class="fas fa-calendar mr-1"></i>
                            ${new Date(match.court_booking.booking_date).toLocaleDateString()}
                        </div>
                        <div>
                            <i class="fas fa-clock mr-1"></i>
                            ${match.court_booking.start_time}
                        </div>
                        <div>
                            <i class="fas fa-building mr-1"></i>
                            ${match.court_booking.court.name}
                        </div>
                    </div>
                ` : ''}
            </div>

            <!-- Teams and Score -->
            <div class="grid grid-cols-3 gap-4 items-center">
                <!-- Team 1 -->
                <div class="text-right">
                    <div class="font-bold text-xl ${match.winner_id === match.team1_id ? 'text-green-600' : 'text-gray-800'}">
                        ${match.team1.name}
                        ${match.winner_id === match.team1_id ? '<i class="fas fa-trophy ml-2 text-yellow-500"></i>' : ''}
                    </div>
                    <div class="text-sm text-gray-500">Rank ${match.team1.ranking}</div>
                </div>

                <!-- Score -->
                <div class="text-center">
                    ${match.status === 'finished' ? `
                        <div class="text-4xl font-bold">
                            <span class="${match.team1_score > match.team2_score ? 'text-green-600' : 'text-gray-800'}">
                                ${match.team1_score}
                            </span>
                            <span class="text-gray-400 mx-2">-</span>
                            <span class="${match.team2_score > match.team1_score ? 'text-green-600' : 'text-gray-800'}">
                                ${match.team2_score}
                            </span>
                        </div>
                        ${match.team1_score === match.team2_score ? '<div class="text-xs text-orange-600 font-semibold mt-1">TIE</div>' : ''}
                    ` : `
                        <div class="text-3xl font-bold text-gray-400">VS</div>
                        <div class="text-xs text-gray-500 mt-1">Not played yet</div>
                    `}
                </div>

                <!-- Team 2 -->
                <div class="text-left">
                    <div class="font-bold text-xl ${match.winner_id === match.team2_id ? 'text-green-600' : 'text-gray-800'}">
                        ${match.winner_id === match.team2_id ? '<i class="fas fa-trophy mr-2 text-yellow-500"></i>' : ''}
                        ${match.team2.name}
                    </div>
                    <div class="text-sm text-gray-500">Rank ${match.team2.ranking}</div>
                </div>
            </div>
        </div>
    `).join('');
}

function filterMatches() {
    const statusFilter = document.getElementById('statusFilter').value;
    const teamSearch = document.getElementById('teamSearch').value.toLowerCase();
    
    const filteredMatches = allMatches.filter(match => {
        const statusMatch = !statusFilter || match.status === statusFilter;
        const teamMatch = !teamSearch || 
            match.team1.name.toLowerCase().includes(teamSearch) ||
            match.team2.name.toLowerCase().includes(teamSearch);
        
        return statusMatch && teamMatch;
    });
    
    displayMatches(filteredMatches);
}

function getPhaseColor(phase) {
    return phase === 'group' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
}

function getMatchStatusColor(status) {
    return status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800';
}