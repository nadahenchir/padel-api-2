// tournaments.js - Tournaments page functionality
if (typeof API_BASE_URL === 'undefined') {
    const API_BASE_URL = '/api';  // Use relative path
}
function loadTournamentsPage() {
    const mainContent = document.getElementById('mainContent');
    
    mainContent.innerHTML = `
        <div class="max-w-7xl mx-auto">
            <!-- Header -->
            <div class="flex justify-between items-center mb-8">
                <div>
                    <h1 class="text-3xl font-bold text-gray-800">Tournaments</h1>
                    <p class="text-gray-500 mt-1">Manage all tournaments and phases</p>
                </div>
                <button onclick="fetchTournaments()" class="bg-gray-100 hover:bg-gray-200 px-6 py-3 rounded-lg transition flex items-center">
                    <i class="fas fa-sync-alt mr-2"></i>
                    Refresh
                </button>
            </div>

            <!-- Tournaments Grid -->
            <div id="tournamentsGrid" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Tournaments will be loaded here -->
            </div>

            <!-- Empty state -->
            <div id="emptyStateTournaments" class="hidden text-center py-12">
                <i class="fas fa-trophy text-6xl text-gray-300 mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-700 mb-2">No tournaments found</h3>
                <p class="text-gray-500">Tournaments will appear here once created via API</p>
            </div>
        </div>
    `;
    
    // Fetch tournaments from API
    fetchTournaments();
}

// Fetch tournaments from API
async function fetchTournaments() {
    showLoading();
    
    try {
        const response = await fetch('/api/court', {
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

// Display tournaments in grid
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
        <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6">
            <!-- Tournament Header -->
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="text-2xl font-bold text-gray-800">${tournament.name}</h3>
                    <p class="text-sm text-gray-500 mt-1">Prize: ${tournament.prize_money || 'N/A'}</p>
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
                    <div class="text-xs text-gray-500">Registered Teams</div>
                    <div class="text-sm font-semibold text-gray-800">
                        ${tournament.teams?.length || 0} teams
                    </div>
                </div>
            </div>

            <!-- Teams List -->
            ${tournament.teams && tournament.teams.length > 0 ? `
                <div class="mb-4">
                    <div class="text-sm font-semibold text-gray-700 mb-2">
                        <i class="fas fa-users mr-1"></i>
                        Registered Teams
                    </div>
                    <div class="flex flex-wrap gap-2">
                        ${tournament.teams.map(tt => `
                            <span class="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded">
                                ${tt.team.name}
                            </span>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <!-- Actions -->
            <div class="border-t pt-4 space-y-2">
                ${tournament.status === 'waiting' && tournament.teams?.length >= 2 ? `
                    <button onclick="startGroupPhase('${tournament.id}')" class="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition text-sm font-medium">
                        <i class="fas fa-play mr-2"></i>
                        Start Group Phase
                    </button>
                ` : ''}
                
                ${tournament.status === 'waiting' ? `
                    <button onclick="registerTeamsModal('${tournament.id}')" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition text-sm font-medium">
                        <i class="fas fa-user-plus mr-2"></i>
                        Register Teams
                    </button>
                ` : ''}
                
                ${tournament.status === 'group_phase' ? `
                    <button onclick="scheduleMatchesModal('${tournament.id}')" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition text-sm font-medium">
                        <i class="fas fa-calendar mr-2"></i>
                        Schedule Matches
                    </button>
                    <button onclick="viewStandings('${tournament.id}')" class="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition text-sm font-medium">
                        <i class="fas fa-list-ol mr-2"></i>
                        View Standings
                    </button>
                    <button onclick="startKnockoutPhase('${tournament.id}')" class="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg transition text-sm font-medium">
                        <i class="fas fa-trophy mr-2"></i>
                        Start Knockout Phase
                    </button>
                ` : ''}
                
                ${tournament.status === 'knockout_phase' ? `
                    <button onclick="scheduleMatchesModal('${tournament.id}')" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition text-sm font-medium">
                        <i class="fas fa-calendar mr-2"></i>
                        Schedule Knockout Matches
                    </button>
                ` : ''}
                
                <button onclick="viewTournamentMatches('${tournament.id}')" class="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg transition text-sm font-medium">
                    <i class="fas fa-table-tennis mr-2"></i>
                    View All Matches
                </button>
            </div>
        </div>
    `).join('');
}

// Get status color
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

// Start group phase
async function startGroupPhase(tournamentId) {
    if (!confirm('Are you sure you want to start the group phase? This will generate all round-robin matches.')) {
        return;
    }
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE_URL}/tournament/${tournamentId}/start-group-phase`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to start group phase');
        }
        
        showToast('Group phase started! All matches generated.', 'success');
        fetchTournaments(); // Reload tournaments
        
    } catch (error) {
        console.error('Error starting group phase:', error);
        showToast(error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Start knockout phase
async function startKnockoutPhase(tournamentId) {
    if (!confirm('Are you sure you want to start the knockout phase? Make sure all group matches are completed.')) {
        return;
    }
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE_URL}/tournament/${tournamentId}/start-knockout-phase`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to start knockout phase');
        }
        
        showToast('Knockout phase started! Bracket generated from standings.', 'success');
        fetchTournaments(); // Reload tournaments
        
    } catch (error) {
        console.error('Error starting knockout phase:', error);
        showToast(error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Register teams modal
async function registerTeamsModal(tournamentId) {
    showLoading();
    
    // Fetch available teams
    let teams = [];
    try {
        const response = await fetch(`${API_BASE_URL}/team`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (response.ok) {
            teams = await response.json();
        }
    } catch (error) {
        console.error('Error fetching teams:', error);
    }
    
    hideLoading();
    
    if (teams.length === 0) {
        showToast('Please create teams first', 'error');
        return;
    }
    
    const modal = document.createElement('div');
    modal.id = 'registerTeamsModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-gray-800">Register Team</h2>
                <button onclick="closeRegisterTeamsModal()" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times text-2xl"></i>
                </button>
            </div>
            
            <form onsubmit="handleRegisterTeam(event, '${tournamentId}')">
                <div class="mb-6">
                    <label class="block text-gray-700 text-sm font-bold mb-2">
                        Select Team <span class="text-red-500">*</span>
                    </label>
                    <select 
                        id="teamToRegister" 
                        required
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                        <option value="">-- Select Team --</option>
                        ${teams.map(t => `
                            <option value="${t.id}">${t.name} (Rank ${t.ranking})</option>
                        `).join('')}
                    </select>
                </div>
                
                <div class="flex gap-3">
                    <button 
                        type="button" 
                        onclick="closeRegisterTeamsModal()" 
                        class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg transition"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition"
                    >
                        <i class="fas fa-check mr-2"></i>
                        Register
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeRegisterTeamsModal() {
    const modal = document.getElementById('registerTeamsModal');
    if (modal) modal.remove();
}

async function handleRegisterTeam(event, tournamentId) {
    event.preventDefault();
    
    const teamId = document.getElementById('teamToRegister').value;
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE_URL}/tournament/${tournamentId}/register-team`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ team_id: teamId })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to register team');
        }
        
        showToast('Team registered successfully!', 'success');
        closeRegisterTeamsModal();
        fetchTournaments();
        
    } catch (error) {
        console.error('Error registering team:', error);
        showToast(error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Schedule matches modal
async function scheduleMatchesModal(tournamentId) {
    showLoading();
    
    // Fetch available courts
    let courts = [];
    try {
        const response = await fetch(`${API_BASE_URL}/court`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (response.ok) {
            courts = await response.json();
        }
    } catch (error) {
        console.error('Error fetching courts:', error);
    }
    
    hideLoading();
    
    if (courts.length === 0) {
        showToast('Please create courts first', 'error');
        return;
    }
    
    const modal = document.createElement('div');
    modal.id = 'scheduleModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-gray-800">Schedule Matches</h2>
                <button onclick="closeScheduleModal()" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times text-2xl"></i>
                </button>
            </div>
            
            <form onsubmit="handleScheduleMatches(event, '${tournamentId}')">
                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2">
                        Select Courts <span class="text-red-500">*</span>
                    </label>
                    ${courts.map(court => `
                        <label class="flex items-center mb-2">
                            <input type="checkbox" name="courtIds" value="${court.id}" class="mr-2">
                            <span>${court.name} ${court.is_indoor ? '(Indoor)' : '(Outdoor)'}</span>
                        </label>
                    `).join('')}
                </div>
                
                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2">
                        Start Date <span class="text-red-500">*</span>
                    </label>
                    <input 
                        type="date" 
                        id="startDate" 
                        required
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                </div>
                
                <div class="mb-6">
                    <label class="block text-gray-700 text-sm font-bold mb-2">
                        Time Slots (comma separated)
                    </label>
                    <input 
                        type="text" 
                        id="timeSlots" 
                        placeholder="09:00,11:00,13:00,15:00,17:00"
                        value="09:00,11:00,13:00,15:00,17:00"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                </div>
                
                <div class="flex gap-3">
                    <button 
                        type="button" 
                        onclick="closeScheduleModal()" 
                        class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg transition"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition"
                    >
                        <i class="fas fa-calendar-check mr-2"></i>
                        Schedule
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeScheduleModal() {
    const modal = document.getElementById('scheduleModal');
    if (modal) modal.remove();
}

async function handleScheduleMatches(event, tournamentId) {
    event.preventDefault();
    
    const checkboxes = document.querySelectorAll('input[name="courtIds"]:checked');
    const courtIds = Array.from(checkboxes).map(cb => cb.value);
    const startDate = document.getElementById('startDate').value;
    const timeSlots = document.getElementById('timeSlots').value.split(',').map(t => t.trim());
    
    if (courtIds.length === 0) {
        showToast('Please select at least one court', 'error');
        return;
    }
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE_URL}/tournament/${tournamentId}/schedule-matches`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({
                court_ids: courtIds,
                start_date: startDate,
                time_slots: timeSlots
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to schedule matches');
        }
        
        const data = await response.json();
        showToast(`Successfully scheduled ${data.scheduled_count} matches!`, 'success');
        closeScheduleModal();
        
    } catch (error) {
        console.error('Error scheduling matches:', error);
        showToast(error.message, 'error');
    } finally {
        hideLoading();
    }
}

// View standings
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
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-8 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-gray-800">${data.tournament_name} - Standings</h2>
                <button onclick="closeStandingsModal()" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times text-2xl"></i>
                </button>
            </div>
            
            <table class="w-full">
                <thead class="bg-gray-50 border-b">
                    <tr>
                        <th class="px-4 py-2 text-left">Pos</th>
                        <th class="px-4 py-2 text-left">Team</th>
                        <th class="px-4 py-2 text-center">Played</th>
                        <th class="px-4 py-2 text-center">Wins</th>
                        <th class="px-4 py-2 text-center">Losses</th>
                        <th class="px-4 py-2 text-center">Points</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.standings.map(s => `
                        <tr class="border-b hover:bg-gray-50">
                            <td class="px-4 py-3 font-bold">${s.position}</td>
                            <td class="px-4 py-3">${s.team.name}</td>
                            <td class="px-4 py-3 text-center">${s.matches_played}</td>
                            <td class="px-4 py-3 text-center text-green-600">${s.wins}</td>
                            <td class="px-4 py-3 text-center text-red-600">${s.losses}</td>
                            <td class="px-4 py-3 text-center font-bold">${s.points}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <button 
                onclick="closeStandingsModal()" 
                class="mt-6 w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition"
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

// View tournament matches
function viewTournamentMatches(tournamentId) {
    // Switch to matches page with filter
    loadMatchesPage(tournamentId);
    
    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('bg-indigo-50', 'text-indigo-600', 'border-r-4', 'border-indigo-600');
    });
    document.querySelectorAll('.nav-link')[3].classList.add('bg-indigo-50', 'text-indigo-600', 'border-r-4', 'border-indigo-600');
}