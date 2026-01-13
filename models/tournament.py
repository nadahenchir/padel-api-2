from db import db
import uuid

class TournamentModel(db.Model):
    __tablename__ = "tournaments"

    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String, nullable=False, unique=True)  # P50, P100, P250, P500, P1000
    status = db.Column(db.String, default="waiting")  # waiting, group_phase, knockout_phase, finished
    created_at = db.Column(db.DateTime, default=db.func.now())
    
    # Relationships
    teams = db.relationship("TournamentTeamModel", back_populates="tournament", cascade="all, delete-orphan")
    matches = db.relationship("MatchModel", back_populates="tournament", cascade="all, delete-orphan")
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "status": self.status,
            "teams": [tt.to_dict() for tt in self.teams],
            "matches_count": len(self.matches),
            "created_at": self.created_at.isoformat()
        }

class TournamentTeamModel(db.Model):
    __tablename__ = "tournament_teams"

    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tournament_id = db.Column(db.String, db.ForeignKey("tournaments.id"), nullable=False)
    team_id = db.Column(db.String, db.ForeignKey("teams.id"), nullable=False)
    registered_at = db.Column(db.DateTime, default=db.func.now())
    
    # Relationships
    tournament = db.relationship("TournamentModel", back_populates="teams")
    team = db.relationship("TeamModel", back_populates="tournaments")
    
    def to_dict(self):
        return {
            "id": self.id,
            "tournament_id": self.tournament_id,
            "team": self.team.to_dict(),
            "registered_at": self.registered_at.isoformat()
        }