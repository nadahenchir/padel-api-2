from db import db
from models.court_booking import CourtBookingModel
from models.match import MatchModel
from datetime import datetime, timedelta

def schedule_matches(tournament, courts, start_date, time_slots=None):
    """
    Schedule matches on courts.
    time_slots: list of times like ["10:00", "12:00", "14:00", "16:00"]
    """
    
    if not time_slots:
        time_slots = ["10:00", "12:00", "14:00", "16:00", "18:00"]
    
    # Get all pending matches for this tournament
    pending_matches = MatchModel.query.filter_by(
        tournament_id=tournament.id,
        status="pending"
    ).all()
    
    if not pending_matches:
        return False, "No pending matches to schedule"
    
    if not courts:
        return False, "No courts available"
    
    scheduled = 0
    current_date = start_date
    slot_index = 0
    court_index = 0
    
    for match in pending_matches:
        # Skip if already scheduled
        if match.court_booking:
            continue
        
        # Get court and time slot
        court = courts[court_index % len(courts)]
        time_slot = time_slots[slot_index % len(time_slots)]
        
        # Create booking
        start_time = datetime.strptime(time_slot, "%H:%M")
        end_time = start_time + timedelta(hours=1)  # 1 hour per match
        
        booking = CourtBookingModel(
            match_id=match.id,
            court_id=court.id,
            booking_date=current_date,
            start_time=time_slot,
            end_time=end_time.strftime("%H:%M")
        )
        
        db.session.add(booking)
        scheduled += 1
        
        # Move to next slot
        slot_index += 1
        if slot_index >= len(time_slots):
            slot_index = 0
            court_index += 1
            if court_index >= len(courts):
                court_index = 0
                current_date += timedelta(days=1)  # Move to next day
    
    db.session.commit()
    print(f"✅ Scheduled {scheduled} matches")
    return True, f"Successfully scheduled {scheduled} matches"