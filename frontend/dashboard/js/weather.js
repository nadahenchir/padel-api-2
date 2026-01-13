// weather.js - Weather page functionality
// Add at the VERY TOP of courts.js, players.js, etc.
if (typeof API_BASE_URL === 'undefined') {
    const API_BASE_URL = '/api';  // Use relative path
}
function loadWeatherPage() {
    const mainContent = document.getElementById('mainContent');
    
    mainContent.innerHTML = `
        <div class="max-w-7xl mx-auto">
            <!-- Header -->
            <div class="flex justify-between items-center mb-8">
                <div>
                    <h1 class="text-3xl font-bold text-gray-800">Weather Monitor</h1>
                    <p class="text-gray-500 mt-1">Monitor weather for upcoming outdoor matches</p>
                </div>
                <button onclick="testWeatherAPI()" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition flex items-center">
                    <i class="fas fa-vial mr-2"></i>
                    Test Weather API
                </button>
            </div>

            <!-- Current Weather Card -->
            <div class="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg p-8 mb-8 text-white">
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-2xl font-bold mb-2">Current Weather</h2>
                        <p class="text-blue-100">Tunis, Tunisia</p>
                    </div>
                    <div id="currentWeatherIcon" class="text-6xl">
                        <i class="fas fa-cloud-sun"></i>
                    </div>
                </div>
                <div id="currentWeatherData" class="mt-6 grid grid-cols-3 gap-4">
                    <div class="bg-white bg-opacity-20 rounded-lg p-4">
                        <div class="text-sm text-blue-100">Temperature</div>
                        <div class="text-2xl font-bold">--°C</div>
                    </div>
                    <div class="bg-white bg-opacity-20 rounded-lg p-4">
                        <div class="text-sm text-blue-100">Rain Probability</div>
                        <div class="text-2xl font-bold">--%</div>
                    </div>
                    <div class="bg-white bg-opacity-20 rounded-lg p-4">
                        <div class="text-sm text-blue-100">Wind Speed</div>
                        <div class="text-2xl font-bold">-- km/h</div>
                    </div>
                </div>
            </div>

            <!-- Tournament Weather Check -->
            <div class="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-trophy mr-2"></i>
                    Check Tournament Weather
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Select Tournament</label>
                        <select id="tournamentSelect" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                            <option value="">-- Select Tournament --</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Location</label>
                        <input 
                            type="text" 
                            id="locationInput" 
                            value="Tunis,TN"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            placeholder="City,Country"
                        >
                    </div>
                </div>
                <button onclick="checkTournamentWeather()" class="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg transition font-medium">
                    <i class="fas fa-cloud-sun-rain mr-2"></i>
                    Check All Matches & Auto-Relocate
                </button>
            </div>

            <!-- Upcoming Outdoor Matches -->
            <div class="bg-white rounded-lg shadow-md p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-gray-800">
                        <i class="fas fa-sun mr-2"></i>
                        Upcoming Outdoor Matches
                    </h3>
                    <button onclick="fetchUpcomingOutdoorMatches()" class="text-gray-600 hover:text-gray-800">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </div>
                <div id="outdoorMatchesList">
                    <!-- Outdoor matches will be loaded here -->
                </div>
            </div>
        </div>
    `;
    
    // Load tournaments
    loadTournamentsForWeather();
    
    // Fetch current weather
    fetchCurrentWeather();
    
    // Fetch upcoming outdoor matches
    fetchUpcomingOutdoorMatches();
}

// Load tournaments
async function loadTournamentsForWeather() {
    try {
        const response = await fetch('/api/court', {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (!response.ok) return;
        
        const tournaments = await response.json();
        const select = document.getElementById('tournamentSelect');
        
        tournaments.forEach(t => {
            const option = document.createElement('option');
            option.value = t.id;
            option.textContent = `${t.name} (${t.status})`;
            select.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error loading tournaments:', error);
    }
}

// Fetch current weather
async function fetchCurrentWeather() {
    try {
        const response = await fetch(`${API_BASE_URL}/weather/test?location=Tunis,TN`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (!response.ok) return;
        
        const data = await response.json();
        displayCurrentWeather(data.weather);
        
    } catch (error) {
        console.error('Error fetching weather:', error);
    }
}

// Display current weather
function displayCurrentWeather(weather) {
    if (!weather || weather.error) {
        document.getElementById('currentWeatherData').innerHTML = `
            <div class="col-span-3 text-center text-white">
                <i class="fas fa-exclamation-triangle text-3xl mb-2"></i>
                <p>Weather API not configured or error occurred</p>
                <p class="text-sm mt-2">Please check your OpenWeatherMap API key</p>
            </div>
        `;
        return;
    }
    
    // Update weather icon
    const iconMap = {
        'Clear': 'fa-sun',
        'Clouds': 'fa-cloud',
        'Rain': 'fa-cloud-rain',
        'Snow': 'fa-snowflake',
        'Drizzle': 'fa-cloud-showers-heavy',
        'Thunderstorm': 'fa-bolt'
    };
    
    const iconClass = iconMap[weather.condition] || 'fa-cloud-sun';
    document.getElementById('currentWeatherIcon').innerHTML = `<i class="fas ${iconClass}"></i>`;
    
    // Update weather data
    document.getElementById('currentWeatherData').innerHTML = `
        <div class="bg-white bg-opacity-20 rounded-lg p-4">
            <div class="text-sm text-blue-100">Temperature</div>
            <div class="text-2xl font-bold">${weather.temperature}°C</div>
        </div>
        <div class="bg-white bg-opacity-20 rounded-lg p-4">
            <div class="text-sm text-blue-100">Rain Probability</div>
            <div class="text-2xl font-bold">${weather.rain_probability}%</div>
        </div>
        <div class="bg-white bg-opacity-20 rounded-lg p-4">
            <div class="text-sm text-blue-100">Wind Speed</div>
            <div class="text-2xl font-bold">${weather.wind_speed} km/h</div>
        </div>
    `;
}

// Test Weather API
async function testWeatherAPI() {
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE_URL}/weather/test?location=Tunis,TN`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        const data = await response.json();
        
        hideLoading();
        
        if (data.weather && !data.weather.error) {
            showToast('Weather API is working! ☀️', 'success');
            fetchCurrentWeather();
        } else {
            showToast('Weather API not configured. Please check your API key.', 'error');
        }
        
    } catch (error) {
        hideLoading();
        console.error('Error testing weather API:', error);
        showToast('Failed to test weather API', 'error');
    }
}

// Check tournament weather
async function checkTournamentWeather() {
    const tournamentId = document.getElementById('tournamentSelect').value;
    const location = document.getElementById('locationInput').value;
    
    if (!tournamentId) {
        showToast('Please select a tournament', 'error');
        return;
    }
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE_URL}/tournament/${tournamentId}/check-all-weather`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ location })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to check weather');
        }
        
        const data = await response.json();
        displayWeatherCheckResults(data);
        
    } catch (error) {
        console.error('Error checking weather:', error);
        showToast(error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Display weather check results
function displayWeatherCheckResults(data) {
    const summary = data.summary;
    
    let message = `Weather Check Complete!\n\n`;
    message += `✅ No Action: ${summary.no_action_count} matches\n`;
    message += `🔄 Relocated: ${summary.relocated_count} matches\n`;
    message += `📅 Postponed: ${summary.postponed_count} matches\n`;
    message += `⏭️ Skipped: ${summary.skipped_count} matches`;
    
    alert(message);
    
    if (summary.relocated_count > 0 || summary.postponed_count > 0) {
        showToast('Some matches were relocated/postponed due to bad weather!', 'info');
    } else {
        showToast('All matches are safe to play!', 'success');
    }
    
    // Refresh outdoor matches list
    fetchUpcomingOutdoorMatches();
}

// Fetch upcoming outdoor matches
async function fetchUpcomingOutdoorMatches() {
    try {
        const response = await fetch(`${API_BASE_URL}/match`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (!response.ok) return;
        
        const matches = await response.json();
        
        // Filter outdoor matches that are scheduled but not finished
        const outdoorMatches = matches.filter(m => 
            m.court_booking && 
            !m.court_booking.court.is_indoor &&
            m.status === 'pending'
        );
        
        displayOutdoorMatches(outdoorMatches);
        
    } catch (error) {
        console.error('Error fetching outdoor matches:', error);
    }
}

// Display outdoor matches
function displayOutdoorMatches(matches) {
    const container = document.getElementById('outdoorMatchesList');
    
    if (matches.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-check-circle text-4xl mb-2"></i>
                <p>No upcoming outdoor matches</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = matches.map(match => `
        <div class="border-b last:border-b-0 py-4">
            <div class="flex justify-between items-start mb-2">
                <div>
                    <div class="font-semibold text-gray-800">
                        ${match.team1.name} vs ${match.team2.name}
                    </div>
                    <div class="text-sm text-gray-500">
                        <i class="fas fa-calendar mr-1"></i>
                        ${new Date(match.court_booking.booking_date).toLocaleDateString()}
                        at ${match.court_booking.start_time}
                    </div>
                    <div class="text-sm text-gray-500">
                        <i class="fas fa-building mr-1"></i>
                        ${match.court_booking.court.name} (Outdoor)
                    </div>
                </div>
                <button onclick="checkMatchWeather('${match.id}')" class="text-blue-600 hover:text-blue-800">
                    <i class="fas fa-cloud-sun"></i>
                </button>
            </div>
            
            ${match.court_booking.is_weather_suitable !== null ? `
                <div class="mt-2 p-2 rounded ${match.court_booking.is_weather_suitable ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}">
                    <i class="fas ${match.court_booking.is_weather_suitable ? 'fa-check-circle' : 'fa-exclamation-triangle'} mr-1"></i>
                    ${match.court_booking.is_weather_suitable ? 'Weather is suitable' : 'Weather is unsuitable'}
                    (Checked: ${new Date(match.court_booking.weather_checked_at).toLocaleString()})
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Check single match weather
async function checkMatchWeather(matchId) {
    const location = document.getElementById('locationInput').value;
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE_URL}/match/${matchId}/check-weather`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ location })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to check weather');
        }
        
        const data = await response.json();
        
        let message = `Action: ${data.action_taken.toUpperCase()}\n`;
        message += `Reason: ${data.reason}\n\n`;
        
        if (data.weather) {
            message += `Weather:\n`;
            message += `- Temperature: ${data.weather.temperature}°C\n`;
            message += `- Rain: ${data.weather.rain_probability}%\n`;
            message += `- Wind: ${data.weather.wind_speed} km/h\n`;
        }
        
        if (data.action_taken === 'RELOCATED') {
            message += `\n✅ Match relocated from ${data.old_court} to ${data.new_court}`;
        } else if (data.action_taken === 'POSTPONED') {
            message += `\n📅 Match postponed from ${data.original_date} to ${data.new_date}`;
        }
        
        alert(message);
        
        if (data.action_taken !== 'NO_ACTION') {
            showToast(`Match ${data.action_taken.toLowerCase()}!`, 'info');
            fetchUpcomingOutdoorMatches();
        } else {
            showToast('Weather is suitable for this match!', 'success');
        }
        
    } catch (error) {
        console.error('Error checking match weather:', error);
        showToast(error.message, 'error');
    } finally {
        hideLoading();
    }
}