from db import db
import uuid

class TeamModel(db.Model):
    __tablename__ = "teams"

    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String, nullable=False)
    ranking = db.Column(db.Integer, nullable=False, default=0)  # Sum of member rankings
    created_at = db.Column(db.DateTime, default=db.func.now())
    
    # Relationships
    members = db.relationship("TeamMemberModel", back_populates="team", cascade="all, delete-orphan")
    tournaments = db.relationship("TournamentTeamModel", back_populates="team", cascade="all, delete-orphan")
    
    def calculate_ranking(self):
        """Calculate team ranking as sum of member rankings"""
        total = sum(member.player.rang for member in self.members if member.player)
        self.ranking = total
        return total
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "ranking": self.ranking,
            "members": [member.to_dict() for member in self.members],
            "created_at": self.created_at.isoformat()
        }