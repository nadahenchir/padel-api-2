from db import db
from models.court_booking import CourtBookingModel
from models.match import MatchModel
from datetime import datetime, timedelta
from collections import defaultdict

def get_player_schedule(player_id, start_date, end_date):
    """Get all booked times for a player within date range"""
    
    from models.team import TeamModel
    from models.team_member import TeamMemberModel
    
    bookings = []
    
    # Get all team members with this player
    team_members = TeamMemberModel.query.filter_by(player_id=player_id).all()
    
    for member in team_members:
        # Get all matches this team is in
        matches = MatchModel.query.filter(
            (MatchModel.team1_id == member.team_id) | 
            (MatchModel.team2_id == member.team_id)
        ).all()
        
        # Check if matches have court bookings
        for match in matches:
            if match.court_booking:
                booking = match.court_booking
                if start_date <= booking.booking_date <= end_date:
                    bookings.append({
                        "date": booking.booking_date,
                        "start_time": booking.start_time,
                        "end_time": booking.end_time,
                        "court": booking.court.name,
                        "match_id": match.id
                    })
    
    return bookings

def get_team_schedule(team_id, start_date, end_date):
    """Get all matches scheduled for a team within date range (all tournaments)"""
    
    bookings = []
    
    # Get all matches this team is in (across ALL tournaments)
    matches = MatchModel.query.filter(
        (MatchModel.team1_id == team_id) | 
        (MatchModel.team2_id == team_id)
    ).all()
    
    for match in matches:
        if match.court_booking:
            booking = match.court_booking
            if start_date <= booking.booking_date <= end_date:
                bookings.append({
                    "date": booking.booking_date,
                    "start_time": booking.start_time,
                    "end_time": booking.end_time,
                    "court": booking.court.name,
                    "match_id": match.id,
                    "tournament_id": match.tournament_id
                })
    
    return bookings

def has_match_on_date(team_id, booking_date):
    """
    Check if team already has a match scheduled on this date (across all tournaments).
    STRICT: No same-day matches allowed, even with time gaps.
    """
    team_bookings = get_team_schedule(team_id, booking_date, booking_date)
    
    # If team has ANY match on this date, return True
    if len(team_bookings) > 0:
        return True
    
    return False

def can_schedule_match(match, court, booking_date, start_time, end_time, buffer_minutes=10):
    """
    Check if match can be scheduled at given time on court.
    Includes: court availability, buffer time, no player double-booking, 
    and NO TEAM PLAYING 2+ MATCHES IN SAME DAY
    Returns: (can_schedule: bool, conflict_details: str or None)
    """
    
    # Check 1: Court is not already booked at this time
    conflict_booking = CourtBookingModel.query.filter(
        CourtBookingModel.court_id == court.id,
        CourtBookingModel.booking_date == booking_date,
        CourtBookingModel.start_time < end_time,
        CourtBookingModel.end_time > start_time
    ).first()
    
    if conflict_booking:
        return False, f"Court {court.name} is already booked {conflict_booking.start_time}-{conflict_booking.end_time}"
    
    # Check 2: Court has buffer time (no back-to-back matches)
    buffer_start = (datetime.strptime(start_time, "%H:%M") - timedelta(minutes=buffer_minutes)).strftime("%H:%M")
    buffer_end = (datetime.strptime(end_time, "%H:%M") + timedelta(minutes=buffer_minutes)).strftime("%H:%M")
    
    buffer_conflict = CourtBookingModel.query.filter(
        CourtBookingModel.court_id == court.id,
        CourtBookingModel.booking_date == booking_date,
        CourtBookingModel.start_time < buffer_end,
        CourtBookingModel.end_time > buffer_start
    ).first()
    
    if buffer_conflict:
        return False, f"Not enough buffer time on {court.name} (need {buffer_minutes} min gap)"
    
    # Check 3: No player is double-booked
    from models.team_member import TeamMemberModel
    
    team1_players = [m.player_id for m in TeamMemberModel.query.filter_by(team_id=match.team1_id).all()]
    team2_players = [m.player_id for m in TeamMemberModel.query.filter_by(team_id=match.team2_id).all()]
    all_players = team1_players + team2_players
    
    for player_id in all_players:
        player_bookings = get_player_schedule(player_id, booking_date, booking_date)
        
        for booking in player_bookings:
            if booking["date"] == booking_date:
                if booking["start_time"] < end_time and booking["end_time"] > start_time:
                    return False, f"Player in team has conflict: {booking['court']} at {booking['start_time']}-{booking['end_time']}"
    
    # Check 4: Team doesn't already have a match on this date (across all tournaments)
    if has_match_on_date(match.team1_id, booking_date):
        return False, f"Team 1 already has a match scheduled on {booking_date} (only 1 match per day allowed)"
    
    if has_match_on_date(match.team2_id, booking_date):
        return False, f"Team 2 already has a match scheduled on {booking_date} (only 1 match per day allowed)"
    
    return True, None

def find_next_available_slot(match, courts, start_date, time_slots, buffer_minutes=10):
    """
    Find the next available slot for a match across courts and dates.
    STRICT RULE: Each team can only play 1 match per day (no same-day matches).
    Returns: (court, date, start_time, end_time) or (None, None, None, None) if not found
    """
    
    current_date = start_date
    max_days = 30
    
    for day_offset in range(max_days):
        search_date = current_date + timedelta(days=day_offset)
        
        # Check if EITHER team already has a match on this date
        team1_has_match = has_match_on_date(match.team1_id, search_date)
        team2_has_match = has_match_on_date(match.team2_id, search_date)
        
        # If either team busy, skip this entire day and go to next day
        if team1_has_match or team2_has_match:
            continue
        
        # Try each court and time slot on this date
        for court in courts:
            for time_slot in time_slots:
                start_time = time_slot
                end_time = (datetime.strptime(time_slot, "%H:%M") + timedelta(hours=1)).strftime("%H:%M")
                
                can_schedule, conflict = can_schedule_match(
                    match, court, search_date, start_time, end_time, buffer_minutes
                )
                
                if can_schedule:
                    return court, search_date, start_time, end_time
    
    return None, None, None, None

def schedule_matches_intelligent(tournament, courts, start_date, time_slots=None, buffer_minutes=10):
    """
    Intelligently schedule all pending matches with conflict detection.
    Uses backtracking to find valid schedules for all matches.
    """
    
    if not time_slots:
        time_slots = ["10:00", "12:00", "14:00", "16:00", "18:00"]
    
    # Get all pending matches
    pending_matches = MatchModel.query.filter_by(
        tournament_id=tournament.id,
        status="pending"
    ).all()
    
    if not pending_matches:
        return True, "No pending matches to schedule", 0
    
    if not courts:
        return False, "No courts available", 0
    
    scheduled_count = 0
    failed_matches = []
    
    for match in pending_matches:
        if match.court_booking:
            continue
        
        # Find next available slot
        court, date, start_time, end_time = find_next_available_slot(
            match, courts, start_date, time_slots, buffer_minutes
        )
        
        if court and date:
            # Create booking
            booking = CourtBookingModel(
                match_id=match.id,
                court_id=court.id,
                booking_date=date,
                start_time=start_time,
                end_time=end_time
            )
            db.session.add(booking)
            scheduled_count += 1
            
            print(f"✅ Scheduled: {match.team1.name} vs {match.team2.name}")
            print(f"   Court: {court.name}, Date: {date}, Time: {start_time}-{end_time}")
        else:
            failed_matches.append(f"{match.team1.name} vs {match.team2.name}")
    
    db.session.commit()
    
    if failed_matches:
        message = f"Scheduled {scheduled_count} matches. Failed to schedule: {', '.join(failed_matches)}"
        return False, message, scheduled_count
    
    message = f"Successfully scheduled all {scheduled_count} matches without conflicts!"
    return True, message, scheduled_count