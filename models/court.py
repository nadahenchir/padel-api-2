from db import db
import uuid

class CourtModel(db.Model):
    __tablename__ = "courts"

    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String, nullable=False)
    location = db.Column(db.String, nullable=True)
    is_available = db.Column(db.Boolean, default=True)
    is_indoor = db.Column(db.Boolean, default=False)  # NEW: Indoor/Outdoor flag
    created_at = db.Column(db.DateTime, default=db.func.now())
    
    # Relationships
    bookings = db.relationship("CourtBookingModel", back_populates="court", cascade="all, delete-orphan")
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "location": self.location,
            "is_available": self.is_available,
            "is_indoor": self.is_indoor,  # NEW
            "created_at": self.created_at.isoformat()
        }