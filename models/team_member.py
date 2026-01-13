from db import db
import uuid

class TeamMemberModel(db.Model):
    __tablename__ = "team_members"

    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    team_id = db.Column(db.String, db.ForeignKey("teams.id"), nullable=False)
    player_id = db.Column(db.String, db.ForeignKey("players.id"), nullable=False)
    
    # Relationships
    team = db.relationship("TeamModel", back_populates="members")
    player = db.relationship("PlayerModel", back_populates="teams")
    
    def to_dict(self):
        return {
            "id": self.id,
            "team_id": self.team_id,
            "player_id": self.player_id,
            "player": self.player.to_dict() if self.player else None
        }