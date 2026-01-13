from db import db
import uuid

class MatchModel(db.Model):
    __tablename__ = "matches"

    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tournament_id = db.Column(db.String, db.ForeignKey("tournaments.id"), nullable=False)
    team1_id = db.Column(db.String, db.ForeignKey("teams.id"), nullable=False)
    team2_id = db.Column(db.String, db.ForeignKey("teams.id"), nullable=False)
    
    # Match results
    team1_score = db.Column(db.Integer, nullable=True)
    team2_score = db.Column(db.Integer, nullable=True)
    winner_id = db.Column(db.String, db.ForeignKey("teams.id"), nullable=True)
    
    # Match status
    status = db.Column(db.String, default="pending")  # pending, finished, cancelled
    phase = db.Column(db.String, default="group")  # group, knockout
    round_num = db.Column(db.Integer, nullable=True)  # Which round in knockout
    
    # Cancellation info
    cancelled_by_team_id = db.Column(db.String, db.ForeignKey("teams.id"), nullable=True)
    cancellation_reason = db.Column(db.String, nullable=True)
    
    created_at = db.Column(db.DateTime, default=db.func.now())
    
    # Relationships
    tournament = db.relationship("TournamentModel", back_populates="matches")
    team1 = db.relationship("TeamModel", foreign_keys=[team1_id])
    team2 = db.relationship("TeamModel", foreign_keys=[team2_id])
    winner = db.relationship("TeamModel", foreign_keys=[winner_id])
    court_booking = db.relationship("CourtBookingModel", back_populates="match", uselist=False, cascade="all, delete-orphan")
    
    def to_dict(self):
        return {
            "id": self.id,
            "tournament_id": self.tournament_id,
            "team1": self.team1.to_dict(),
            "team2": self.team2.to_dict(),
            "team1_score": self.team1_score,
            "team2_score": self.team2_score,
            "winner": self.winner.to_dict() if self.winner else None,
            "status": self.status,
            "phase": self.phase,
            "round_num": self.round_num,
            "cancelled_by_team": self.team1.to_dict() if self.cancelled_by_team_id == self.team1_id else (self.team2.to_dict() if self.cancelled_by_team_id else None),
            "cancellation_reason": self.cancellation_reason,
            "court_booking": self.court_booking.to_dict() if self.court_booking else None,
            "created_at": self.created_at.isoformat()
        }