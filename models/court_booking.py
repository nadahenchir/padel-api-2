from db import db
import uuid
from datetime import datetime

class CourtBookingModel(db.Model):
    __tablename__ = "court_bookings"

    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    match_id = db.Column(db.String, db.ForeignKey("matches.id"), nullable=False)
    court_id = db.Column(db.String, db.ForeignKey("courts.id"), nullable=False)
    booking_date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.String, nullable=False)  # Format: "HH:MM"
    end_time = db.Column(db.String, nullable=False)    # Format: "HH:MM"
    created_at = db.Column(db.DateTime, default=db.func.now())
    
    # NEW: Weather fields
    temperature = db.Column(db.Float, nullable=True)  # Celsius
    rain_probability = db.Column(db.Integer, nullable=True)  # 0-100%
    wind_speed = db.Column(db.Float, nullable=True)  # km/h
    weather_condition = db.Column(db.String, nullable=True)  # "clear", "rainy", "windy", etc.
    is_weather_suitable = db.Column(db.Boolean, default=True)
    weather_checked_at = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    match = db.relationship("MatchModel", back_populates="court_booking")
    court = db.relationship("CourtModel", back_populates="bookings")
    
    def to_dict(self):
        return {
            "id": self.id,
            "match_id": self.match_id,
            "court": self.court.to_dict(),
            "booking_date": self.booking_date.isoformat(),
            "start_time": self.start_time,
            "end_time": self.end_time,
            "created_at": self.created_at.isoformat(),
            # NEW: Weather data
            "temperature": self.temperature,
            "rain_probability": self.rain_probability,
            "wind_speed": self.wind_speed,
            "weather_condition": self.weather_condition,
            "is_weather_suitable": self.is_weather_suitable,
            "weather_checked_at": self.weather_checked_at.isoformat() if self.weather_checked_at else None
        }