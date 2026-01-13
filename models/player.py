from db import db
import uuid

class PlayerModel(db.Model):
    __tablename__ = "players"

    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String, nullable=False)
    rang = db.Column(db.Integer, nullable=False)  # Ranking from classement masculin
    numero_licence = db.Column(db.String, nullable=True)
    
    # Relationships
    teams = db.relationship("TeamMemberModel", back_populates="player")
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "rang": self.rang,
            "numero_licence": self.numero_licence
        }