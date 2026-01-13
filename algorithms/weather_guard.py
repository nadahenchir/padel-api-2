from services.weather_service import get_live_weather
from models.court import CourtModel
from models.court_booking import CourtBookingModel
from db import db
from datetime import datetime, timedelta

def check_match_weather_and_relocate(match, location="Tunis,TN"):
    """
    Check weather for match and handle relocation/postponement.
    
    Logic:
    1. Check if court is outdoor
    2. If outdoor, check live weather via API
    3. If bad weather → find available indoor court
    4. If no indoor court → postpone to next day
    
    Args:
        match: MatchModel instance
        location: Location string for weather API (e.g., "Tunis,TN")
    
    Returns:
        dict: {
            "action": "relocated" | "postponed" | "no_action",
            "reason": str,
            "weather": dict (optional),
            "new_court": dict (optional),
            "new_date": str (optional)
        }
    """
    
    if not match.court_booking:
        return {
            "action": "no_action",
            "reason": "No booking to check"
        }
    
    booking = match.court_booking
    court = booking.court
    
    # Skip if already indoor
    if court.is_indoor:
        return {
            "action": "no_action",
            "reason": "Court is indoor, weather doesn't affect play"
        }
    
    print(f"🌤️ Checking weather for outdoor match {match.id}...")
    
    # Get live weather
    weather = get_live_weather(location)
    
    # Update booking with weather data
    booking.temperature = weather["temperature"]
    booking.rain_probability = weather["rain_probability"]
    booking.wind_speed = weather["wind_speed"]
    booking.weather_condition = weather["condition"]
    booking.is_weather_suitable = weather["is_suitable"]
    booking.weather_checked_at = datetime.utcnow()
    
    # If weather is good, just save and return
    if weather["is_suitable"]:
        db.session.commit()
        return {
            "action": "no_action",
            "reason": "Weather is suitable for outdoor play",
            "weather": weather
        }
    
    # Weather is BAD! Need to relocate or postpone
    print(f"⚠️ Bad weather detected: {weather['condition']} (temp: {weather['temperature']}°C, rain: {weather['rain_probability']}%, wind: {weather['wind_speed']} km/h)")
    
    # Try to find an available indoor court on the same date/time
    indoor_courts = CourtModel.query.filter_by(
        is_indoor=True,
        is_available=True
    ).all()
    
    # Check if any indoor court is free at this time
    available_indoor_court = None
    for indoor_court in indoor_courts:
        # Check if this court has a booking at the same time
        conflicting_booking = CourtBookingModel.query.filter(
            CourtBookingModel.court_id == indoor_court.id,
            CourtBookingModel.booking_date == booking.booking_date,
            CourtBookingModel.start_time == booking.start_time
        ).first()
        
        if not conflicting_booking:
            available_indoor_court = indoor_court
            break
    
    if available_indoor_court:
        # RELOCATE to indoor court
        old_court_name = court.name
        booking.court_id = available_indoor_court.id
        match.cancellation_reason = f"Relocated from '{old_court_name}' to '{available_indoor_court.name}' due to {weather['condition']} weather"
        
        db.session.commit()
        
        print(f"✅ Match relocated to indoor court: {available_indoor_court.name}")
        
        return {
            "action": "relocated",
            "reason": f"Bad weather ({weather['condition']}), relocated to indoor court",
            "weather": weather,
            "old_court": old_court_name,
            "new_court": available_indoor_court.to_dict()
        }
    
    else:
        # POSTPONE to next day (same time)
        original_date = booking.booking_date
        new_date = original_date + timedelta(days=1)
        
        booking.booking_date = new_date
        match.cancellation_reason = f"Postponed from {original_date.isoformat()} to {new_date.isoformat()} due to {weather['condition']} weather (no indoor courts available)"
        
        db.session.commit()
        
        print(f"📅 Match postponed to next day: {new_date.isoformat()}")
        
        return {
            "action": "postponed",
            "reason": f"Bad weather ({weather['condition']}), postponed to next day (no indoor courts available)",
            "weather": weather,
            "original_date": original_date.isoformat(),
            "new_date": new_date.isoformat()
        }

def check_all_tournament_weather(tournament, location="Tunis,TN"):
    """
    Check weather for all upcoming matches in a tournament.
    Auto-relocate or postpone as needed.
    
    Args:
        tournament: TournamentModel instance
        location: Location string for weather API
    
    Returns:
        dict: {
            "total_checked": int,
            "relocated": int,
            "postponed": int,
            "no_action": int,
            "results": list
        }
    """
    
    from datetime import date
    
    # Get all upcoming matches (today or future, pending status)
    upcoming_matches = [
        m for m in tournament.matches
        if m.court_booking 
        and m.court_booking.booking_date >= date.today() 
        and m.status == "pending"
    ]
    
    results = []
    relocated_count = 0
    postponed_count = 0
    no_action_count = 0
    
    print(f"🌤️ Checking weather for {len(upcoming_matches)} upcoming matches...")
    
    for match in upcoming_matches:
        result = check_match_weather_and_relocate(match, location)
        
        results.append({
            "match_id": match.id,
            "action": result["action"],
            "reason": result["reason"],
            "booking_date": match.court_booking.booking_date.isoformat(),
            "court": match.court_booking.court.name
        })
        
        if result["action"] == "relocated":
            relocated_count += 1
        elif result["action"] == "postponed":
            postponed_count += 1
        else:
            no_action_count += 1
    
    summary = {
        "total_checked": len(upcoming_matches),
        "relocated": relocated_count,
        "postponed": postponed_count,
        "no_action": no_action_count,
        "results": results
    }
    
    print(f"✅ Weather check complete: {relocated_count} relocated, {postponed_count} postponed, {no_action_count} no action")
    
    return summary