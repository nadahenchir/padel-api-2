// user-teams.js - User view of teams
// Add at the VERY TOP of courts.js, players.js, etc.
if (typeof API_BASE_URL === 'undefined') {
    const API_BASE_URL = '/api';  // Use relative path
}
function loadTeamsPage() {
    const mainContent = document.getElementById('mainContent');
    
    mainContent.innerHTML = `
        <div class="max-w-7xl mx-auto">
            <!-- Header -->
            <div class="flex justify-between items-center mb-8">
                <div>
                    <h1 class="text-3xl font-bold text-gray-800">
                        <i class="fas fa-user-friends text-green-600 mr-2"></i>
                        Teams
                    </h1>
                    <p class="text-gray-500 mt-1">Browse all registered teams</p>
                </div>
                <button onclick="fetchTeams()" class="bg-gray-100 hover:bg-gray-200 px-6 py-3 rounded-lg transition flex items-center">
                    <i class="fas fa-sync-alt mr-2"></i>
                    Refresh
                </button>
            </div>

            <!-- Teams Grid -->
            <div id="teamsGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- Teams will be loaded here -->
            </div>

            <!-- Empty state -->
            <div id="emptyStateTeams" class="hidden text-center py-12">
                <i class="fas fa-user-friends text-6xl text-gray-300 mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-700 mb-2">No teams found</h3>
                <p class="text-gray-500">No teams have been registered yet</p>
            </div>
        </div>
    `;
    
    fetchTeams();
}

async function fetchTeams() {
    showLoading();
    
    try {
        const response = await fetch('/api/court', {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch teams');
        }
        
        const teams = await response.json();
        displayTeams(teams);
        
    } catch (error) {
        console.error('Error fetching teams:', error);
        showToast('Failed to load teams', 'error');
    } finally {
        hideLoading();
    }
}

function displayTeams(teams) {
    const teamsGrid = document.getElementById('teamsGrid');
    const emptyState = document.getElementById('emptyStateTeams');
    
    if (teams.length === 0) {
        teamsGrid.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    teamsGrid.innerHTML = teams.map(team => `
        <div class="bg-white rounded-lg shadow-md hover:shadow-xl transition p-6 border-t-4 border-green-500">
            <!-- Team Header -->
            <div class="mb-4">
                <div class="flex items-center justify-between mb-2">
                    <h3 class="text-2xl font-bold text-gray-800">${team.name}</h3>
                    <span class="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                        <i class="fas fa-trophy mr-1"></i>
                        Rank ${team.ranking}
                    </span>
                </div>
            </div>

            <!-- Team Members -->
            <div class="space-y-3">
                <div class="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <i class="fas fa-users mr-2 text-green-600"></i>
                    Team Members (${team.members?.length || 0}/2)
                </div>
                
                ${team.members && team.members.length > 0 ? team.members.map((member, index) => `
                    <div class="flex items-center bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-3">
                        <div class="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center">
                            <i class="fas fa-user text-white"></i>
                        </div>
                        <div class="ml-3 flex-1">
                            <div class="text-sm font-medium text-gray-900">${member.player.name}</div>
                            <div class="text-xs text-gray-600 flex items-center gap-2">
                                <span><i class="fas fa-trophy text-yellow-500 mr-1"></i>Rank ${member.player.rang}</span>
                                <span class="text-gray-400">•</span>
                                <span>${member.player.numero_licence || 'No license'}</span>
                            </div>
                        </div>
                        ${index === 0 ? '<span class="text-xs bg-green-600 text-white px-2 py-1 rounded">Captain</span>' : ''}
                    </div>
                `).join('') : '<p class="text-sm text-gray-500 text-center py-4">No members yet</p>'}
                
                ${team.members?.length === 1 ? `
                    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                        <i class="fas fa-exclamation-triangle text-yellow-600 mr-2"></i>
                        <span class="text-sm text-yellow-800">Team needs a second member</span>
                    </div>
                ` : ''}
            </div>

            <!-- Team Info -->
            <div class="mt-4 pt-4 border-t border-gray-200">
                <div class="flex justify-between text-xs text-gray-500">
                    <span>Created:</span>
                    <span>${new Date(team.created_at).toLocaleDateString()}</span>
                </div>
            </div>
        </div>
    `).join('');
}