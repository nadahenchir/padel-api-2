// user-tournaments.js - User view of tournaments

function loadTournamentsPage() {
    const mainContent = document.getElementById('mainContent');
    
    mainContent.innerHTML = `
        <div class="max-w-7xl mx-auto">
            <!-- Welcome Header -->
            <div class="bg-gradient-to-r from-green-500 to-teal-600 rounded-lg shadow-lg p-8 mb-8 text-white">
                <h1 class="text-4xl font-bold mb-2">🏆 Welcome to Padel Tournaments</h1>
                <p class="text-green-100">Browse active tournaments and view standings</p>
            </div>

            <!-- Tournaments Grid -->
            <div id="tournamentsGrid" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Tournaments will be loaded here -->
            </div>

            <!-- Empty state -->
            <div id="emptyStateTournaments" class="hidden text-center py-12">
                <i class="fas fa-trophy text-6xl text-gray-300 mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-700 mb-2">No tournaments available</h3>
                <p class="text-gray-500">Check back later for upcoming tournaments</p>
            </div>
        </div>
    `;
    
    fetchTournaments();
}

async function fetchTournaments() {
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE_URL}/tournament`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch tournaments');
        }
        
        const tournaments = await response.json();
        displayTournaments(tournaments);
        
    } catch (error) {
        console.error('Error fetching tournaments:', error);
        showToast('Failed to load tournaments', 'error');
    } finally {
        hideLoading();
    }
}

function displayTournaments(tournaments) {
    const tournamentsGrid = document.getElementById('tournamentsGrid');
    const emptyState = document.getElementById('emptyStateTournaments');
    
    if (tournaments.length === 0) {
        tournamentsGrid.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    tournamentsGrid.innerHTML = tournaments.map(tournament => `
        <div class="bg-white rounded-lg shadow-md hover:shadow-xl transition p-6 border-l-4 ${getStatusBorderColor(tournament.status)}">
            <!-- Tournament Header -->
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="text-2xl font-bold text-gray-800">${tournament.name}</h3>
                    <p class="text-sm text-gray-500 mt-1">${tournament.prize_money || 'No prize'}</p>
                </div>
                <span class="px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(tournament.status)}">
                    ${tournament.status.replace('_', ' ').toUpperCase()}
                </span>
            </div>

            <!-- Tournament Info -->
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div class="bg-gray-50 rounded-lg p-3">
                    <div class="text-xs text-gray-500">Start Date</div>
                    <div class="text-sm font-semibold text-gray-800">
                        ${tournament.start_date ? new Date(tournament.start_date).toLocaleDateString() : 'Not set'}
                    </div>
                </div>
                <div class="bg-gray-50 rounded-lg p-3">
                    <div class="text-xs text-gray-500">Teams</div>
                    <div class="text-sm font-semibold text-gray-800">
                        ${tournament.teams?.length || 0} registered
                    </div>
                </div>
            </div>

            <!-- Participating Teams -->
            ${tournament.teams && tournament.teams.length > 0 ? `
                <div class="mb-4">
                    <div class="text-sm font-semibold text-gray-700 mb-2">
                        <i class="fas fa-users mr-1"></i>
                        Participating Teams
                    </div>
                    <div class="flex flex-wrap gap-2">
                        ${tournament.teams.slice(0, 6).map(tt => `
                            <span class="px-2 py-1 bg-green-50 text-green-700 text-xs rounded">
                                ${tt.team.name}
                            </span>
                        `).join('')}
                        ${tournament.teams.length > 6 ? `
                            <span class="px-2 py-1 bg-gray-50 text-gray-500 text-xs rounded">
                                +${tournament.teams.length - 6} more
                            </span>
                        ` : ''}
                    </div>
                </div>
            ` : ''}

            <!-- Action Buttons -->
            <div class="border-t pt-4 space-y-2">
                ${tournament.status === 'group_phase' || tournament.status === 'knockout_phase' ? `
                    <button onclick="viewStandings('${tournament.id}')" class="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition text-sm font-medium">
                        <i class="fas fa-list-ol mr-2"></i>
                        View Standings
                    </button>
                ` : ''}
                
                <button onclick="viewTournamentMatches('${tournament.id}')" class="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg transition text-sm font-medium">
                    <i class="fas fa-table-tennis mr-2"></i>
                    View Matches
                </button>
            </div>
        </div>
    `).join('');
}

function getStatusColor(status) {
    switch(status) {
        case 'waiting':
            return 'bg-yellow-100 text-yellow-800';
        case 'group_phase':
            return 'bg-blue-100 text-blue-800';
        case 'knockout_phase':
            return 'bg-purple-100 text-purple-800';
        case 'finished':
            return 'bg-green-100 text-green-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

function getStatusBorderColor(status) {
    switch(status) {
        case 'waiting':
            return 'border-yellow-500';
        case 'group_phase':
            return 'border-blue-500';
        case 'knockout_phase':
            return 'border-purple-500';
        case 'finished':
            return 'border-green-500';
        default:
            return 'border-gray-500';
    }
}

async function viewStandings(tournamentId) {
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE_URL}/tournament/${tournamentId}/standings`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch standings');
        }
        
        const data = await response.json();
        showStandingsModal(data);
        
    } catch (error) {
        console.error('Error fetching standings:', error);
        showToast('Failed to load standings', 'error');
    } finally {
        hideLoading();
    }
}

function showStandingsModal(data) {
    const modal = document.createElement('div');
    modal.id = 'standingsModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-8 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-gray-800">
                    <i class="fas fa-trophy text-yellow-500 mr-2"></i>
                    ${data.tournament_name} - Standings
                </h2>
                <button onclick="closeStandingsModal()" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times text-2xl"></i>
                </button>
            </div>
            
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-green-50 border-b-2 border-green-500">
                        <tr>
                            <th class="px-4 py-3 text-left text-sm font-bold text-green-800">Position</th>
                            <th class="px-4 py-3 text-left text-sm font-bold text-green-800">Team</th>
                            <th class="px-4 py-3 text-center text-sm font-bold text-green-800">Played</th>
                            <th class="px-4 py-3 text-center text-sm font-bold text-green-800">W</th>
                            <th class="px-4 py-3 text-center text-sm font-bold text-green-800">L</th>
                            <th class="px-4 py-3 text-center text-sm font-bold text-green-800">Points</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.standings.map((s, index) => `
                            <tr class="border-b hover:bg-gray-50 ${index < 4 ? 'bg-green-50' : ''}">
                                <td class="px-4 py-3">
                                    <span class="font-bold text-lg ${index === 0 ? 'text-yellow-600' : index < 4 ? 'text-green-600' : 'text-gray-800'}">
                                        ${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : s.position}
                                    </span>
                                </td>
                                <td class="px-4 py-3 font-semibold">${s.team.name}</td>
                                <td class="px-4 py-3 text-center">${s.matches_played}</td>
                                <td class="px-4 py-3 text-center text-green-600 font-semibold">${s.wins}</td>
                                <td class="px-4 py-3 text-center text-red-600">${s.losses}</td>
                                <td class="px-4 py-3 text-center font-bold text-lg">${s.points}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <div class="mt-6 p-4 bg-blue-50 rounded-lg">
                <p class="text-sm text-blue-800">
                    <i class="fas fa-info-circle mr-2"></i>
                    Top 4 teams qualify for knockout phase
                </p>
            </div>
            
            <button 
                onclick="closeStandingsModal()" 
                class="mt-6 w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition font-medium"
            >
                Close
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeStandingsModal() {
    const modal = document.getElementById('standingsModal');
    if (modal) modal.remove();
}

function viewTournamentMatches(tournamentId) {
    // Switch to matches page with tournament filter
    window.currentTournamentFilter = tournamentId;
    loadMatchesPage();
    
    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('bg-green-50', 'text-green-600', 'border-r-4', 'border-green-600');
    });
    document.querySelectorAll('.nav-link')[1].classList.add('bg-green-50', 'text-green-600', 'border-r-4', 'border-green-600');
}