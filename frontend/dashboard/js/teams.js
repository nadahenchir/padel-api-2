// teams.js - Teams page functionality
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
                    <h1 class="text-3xl font-bold text-gray-800">Teams</h1>
                    <p class="text-gray-500 mt-1">Manage all teams and their members</p>
                </div>
                <button onclick="showAddTeamModal()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition flex items-center">
                    <i class="fas fa-plus mr-2"></i>
                    Create Team
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
                <p class="text-gray-500 mb-4">Get started by creating your first team</p>
                <button onclick="showAddTeamModal()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition">
                    <i class="fas fa-plus mr-2"></i>
                    Create Team
                </button>
            </div>
        </div>
    `;
    
    // Fetch teams from API
    fetchTeams();
}

// Fetch teams from API
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

// Display teams in grid
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
        <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6">
            <!-- Team Header -->
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="text-xl font-bold text-gray-800">${team.name}</h3>
                    <span class="inline-block mt-1 px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-semibold rounded-full">
                        <i class="fas fa-trophy mr-1"></i>
                        Rank ${team.ranking}
                    </span>
                </div>
                <div class="flex gap-2">
                    <button onclick="deleteTeam('${team.id}', '${team.name}')" class="text-red-600 hover:text-red-800">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>

            <!-- Team Members -->
            <div class="space-y-3">
                <div class="text-sm font-semibold text-gray-700 mb-2">
                    <i class="fas fa-users mr-1"></i>
                    Members (${team.members?.length || 0}/2)
                </div>
                ${team.members && team.members.length > 0 ? team.members.map(member => `
                    <div class="flex items-center bg-gray-50 rounded-lg p-3">
                        <div class="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-user text-indigo-600"></i>
                        </div>
                        <div class="ml-3 flex-1">
                            <div class="text-sm font-medium text-gray-900">${member.player.name}</div>
                            <div class="text-xs text-gray-500">Rank ${member.player.rang}</div>
                        </div>
                        <span class="text-xs text-gray-400">${member.player.numero_licence || 'N/A'}</span>
                    </div>
                `).join('') : '<p class="text-sm text-gray-500">No members yet</p>'}
                
                ${team.members?.length === 1 ? `
                    <button onclick="addSecondMember('${team.id}')" class="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-600 py-2 rounded-lg transition text-sm font-medium">
                        <i class="fas fa-user-plus mr-2"></i>
                        Add Second Member
                    </button>
                ` : ''}
            </div>

            <!-- Team Info -->
            <div class="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                <div class="flex justify-between">
                    <span>Created:</span>
                    <span>${new Date(team.created_at).toLocaleDateString()}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Show add team modal
async function showAddTeamModal() {
    showLoading();
    
    // Fetch available players
    let players = [];
    try {
        const response = await fetch(`${API_BASE_URL}/player`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (response.ok) {
            players = await response.json();
        }
    } catch (error) {
        console.error('Error fetching players:', error);
    }
    
    hideLoading();
    
    if (players.length === 0) {
        showToast('Please add players first before creating a team', 'error');
        return;
    }
    
    const modal = document.createElement('div');
    modal.id = 'teamModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-gray-800">Create New Team</h2>
                <button onclick="closeTeamModal()" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times text-2xl"></i>
                </button>
            </div>
            
            <form id="addTeamForm" onsubmit="handleAddTeam(event)">
                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2">
                        Team Name <span class="text-red-500">*</span>
                    </label>
                    <input 
                        type="text" 
                        id="teamName" 
                        required
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Enter team name"
                    >
                </div>
                
                <div class="mb-6">
                    <label class="block text-gray-700 text-sm font-bold mb-2">
                        Select Player 1 <span class="text-red-500">*</span>
                    </label>
                    <select 
                        id="player1" 
                        required
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                        <option value="">-- Select Player --</option>
                        ${players.map(p => `
                            <option value="${p.id}">${p.name} (Rank ${p.rang})</option>
                        `).join('')}
                    </select>
                    <p class="text-xs text-gray-500 mt-1">You can add a second player after creating the team</p>
                </div>
                
                <div class="flex gap-3">
                    <button 
                        type="button" 
                        onclick="closeTeamModal()" 
                        class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg transition"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition"
                    >
                        <i class="fas fa-save mr-2"></i>
                        Create Team
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Close team modal
function closeTeamModal() {
    const modal = document.getElementById('teamModal');
    if (modal) {
        modal.remove();
    }
}

// Handle add team form submission
async function handleAddTeam(event) {
    event.preventDefault();
    
    const name = document.getElementById('teamName').value;
    const player1Id = document.getElementById('player1').value;
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE_URL}/team`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({
                name: name,
                player1_id: player1Id
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create team');
        }
        
        showToast('Team created successfully!', 'success');
        closeTeamModal();
        fetchTeams(); // Reload teams
        
    } catch (error) {
        console.error('Error creating team:', error);
        showToast(error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Add second member to team
async function addSecondMember(teamId) {
    showLoading();
    
    // Fetch available players
    let players = [];
    try {
        const response = await fetch(`${API_BASE_URL}/player`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (response.ok) {
            players = await response.json();
        }
    } catch (error) {
        console.error('Error fetching players:', error);
    }
    
    hideLoading();
    
    const modal = document.createElement('div');
    modal.id = 'addMemberModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-gray-800">Add Second Member</h2>
                <button onclick="closeAddMemberModal()" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times text-2xl"></i>
                </button>
            </div>
            
            <form onsubmit="handleAddMember(event, '${teamId}')">
                <div class="mb-6">
                    <label class="block text-gray-700 text-sm font-bold mb-2">
                        Select Player 2 <span class="text-red-500">*</span>
                    </label>
                    <select 
                        id="player2" 
                        required
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                        <option value="">-- Select Player --</option>
                        ${players.map(p => `
                            <option value="${p.id}">${p.name} (Rank ${p.rang})</option>
                        `).join('')}
                    </select>
                </div>
                
                <div class="flex gap-3">
                    <button 
                        type="button" 
                        onclick="closeAddMemberModal()" 
                        class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg transition"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition"
                    >
                        <i class="fas fa-user-plus mr-2"></i>
                        Add Member
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeAddMemberModal() {
    const modal = document.getElementById('addMemberModal');
    if (modal) {
        modal.remove();
    }
}

async function handleAddMember(event, teamId) {
    event.preventDefault();
    
    const player2Id = document.getElementById('player2').value;
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE_URL}/team/${teamId}/add-member`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({
                player2_id: player2Id
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to add member');
        }
        
        showToast('Member added successfully!', 'success');
        closeAddMemberModal();
        fetchTeams(); // Reload teams
        
    } catch (error) {
        console.error('Error adding member:', error);
        showToast(error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Delete team
async function deleteTeam(teamId, teamName) {
    if (!confirm(`Are you sure you want to delete ${teamName}?`)) {
        return;
    }
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE_URL}/team/${teamId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete team');
        }
        
        showToast('Team deleted successfully!', 'success');
        fetchTeams(); // Reload teams
        
    } catch (error) {
        console.error('Error deleting team:', error);
        showToast('Failed to delete team', 'error');
    } finally {
        hideLoading();
    }
}