import requests
from datetime import datetime

# Get your free API key from: https://openweathermap.org/api
OPENWEATHER_API_KEY = "2058b3537797aa402bf5b9881a5bc387"  
OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5/weather"

def get_live_weather(location="Tunis,TN"):
    """
    Get live weather data from OpenWeatherMap.
    
    Args:
        location: City and country code (e.g., "Tunis,TN", "Paris,FR")
    
    Returns:
        dict: {
            "temperature": float,
            "rain_probability": int,
            "wind_speed": float,
            "condition": str,
            "is_suitable": bool,
            "checked_at": str
        }
    """
    
    try:
        params = {
            "q": location,
            "appid": OPENWEATHER_API_KEY,
            "units": "metric"  # Celsius
        }
        
        response = requests.get(OPENWEATHER_BASE_URL, params=params, timeout=5)
        response.raise_for_status()
        
        data = response.json()
        
        # Extract weather data
        temperature = data["main"]["temp"]
        wind_speed = data["wind"]["speed"] * 3.6  # Convert m/s to km/h
        
        # Check if rain exists
        rain_probability = 0
        if "rain" in data:
            # OpenWeather gives rain volume, convert to probability estimate
            rain_volume = data["rain"].get("1h", 0)
            rain_probability = min(int(rain_volume * 20), 100)  # Rough conversion
        
        # Get weather condition
        condition = data["weather"][0]["main"].lower()  # "clear", "rain", "clouds", etc.
        
        # Check suitability
        is_suitable = check_weather_suitability(temperature, rain_probability, wind_speed)
        
        return {
            "temperature": round(temperature, 1),
            "rain_probability": rain_probability,
            "wind_speed": round(wind_speed, 1),
            "condition": condition,
            "is_suitable": is_suitable,
            "checked_at": datetime.utcnow().isoformat()
        }
        
    except requests.exceptions.RequestException as e:
        print(f" Weather API error: {e}")
        # Return safe default (assume good weather if API fails)
        return {
            "temperature": 20.0,
            "rain_probability": 0,
            "wind_speed": 10.0,
            "condition": "unknown",
            "is_suitable": True,
            "checked_at": datetime.utcnow().isoformat(),
            "error": str(e)
        }
    except KeyError as e:
        print(f"Weather API response parsing error: {e}")
        return {
            "temperature": 20.0,
            "rain_probability": 0,
            "wind_speed": 10.0,
            "condition": "unknown",
            "is_suitable": True,
            "checked_at": datetime.utcnow().isoformat(),
            "error": f"Invalid API response: {e}"
        }

def check_weather_suitability(temperature, rain_probability, wind_speed):
    """
    Determine if weather is suitable for outdoor play.
    
    Rules:
    - Temperature: 5°C - 40°C (safe playing range)
    - Rain: < 30% probability
    - Wind: < 40 km/h
    
    Args:
        temperature: Temperature in Celsius
        rain_probability: Rain probability (0-100%)
        wind_speed: Wind speed in km/h
    
    Returns:
        bool: True if weather is suitable, False otherwise
    """
    
    if temperature is None or rain_probability is None or wind_speed is None:
        return True  # Assume suitable if no data
    
    # Temperature check
    if temperature < 5 or temperature > 40:
        return False
    
    # Rain check
    if rain_probability >= 30:
        return False
    
    # Wind check
    if wind_speed >= 40:
        return False
    
    return True

def get_weather_condition_description(condition, temperature, rain_probability, wind_speed):
    """
    Get a human-readable weather description.
    
    Returns:
        str: Weather description like "Heavy rain", "Clear skies", etc.
    """
    
    descriptions = []
    
    # Rain description
    if rain_probability >= 70:
        descriptions.append("Heavy rain")
    elif rain_probability >= 30:
        descriptions.append("Light rain")
    
    # Wind description
    if wind_speed >= 40:
        descriptions.append("Strong winds")
    elif wind_speed >= 30:
        descriptions.append("Moderate winds")
    
    # Temperature description
    if temperature >= 35:
        descriptions.append("Very hot")
    elif temperature >= 30:
        descriptions.append("Hot")
    elif temperature <= 5:
        descriptions.append("Very cold")
    elif temperature <= 10:
        descriptions.append("Cold")
    
    # If no specific conditions, use general condition
    if not descriptions:
        if condition == "clear":
            return "Clear skies"
        elif condition == "clouds":
            return "Cloudy"
        elif condition == "rain":
            return "Rainy"
        elif condition == "snow":
            return "Snowy"
        else:
            return condition.capitalize()
    
    return ", ".join(descriptions)