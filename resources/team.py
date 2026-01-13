from flask.views import MethodView
from flask_smorest import Blueprint
from flask import request
from marshmallow import Schema, fields
from db import db
from models.team import TeamModel
from models.team_member import TeamMemberModel
from models.player import PlayerModel

blp = Blueprint("Teams", "teams", description="Operations on teams")

# Schemas
class TeamCreateSchema(Schema):
    name = fields.String(required=True, metadata={"description": "Team name"})
    player1_id = fields.String(required=True, metadata={"description": "First player ID"})

class AddTeamMemberSchema(Schema):
    player2_id = fields.String(required=True, metadata={"description": "Second player ID"})

@blp.route("/team")
class TeamList(MethodView):
    def get(self):
        """Get all teams"""
        teams = TeamModel.query.all()
        return [t.to_dict() for t in teams], 200

    @blp.arguments(TeamCreateSchema)
    def post(self, data):
        """Create a new team (player 1 joins automatically)"""
        
        player1 = PlayerModel.query.get_or_404(data["player1_id"])
        
        team = TeamModel(
            name=data["name"],
            ranking=player1.rang
        )
        db.session.add(team)
        db.session.flush()
        
        # Add player 1 as member
        member1 = TeamMemberModel(team_id=team.id, player_id=player1.id)
        db.session.add(member1)
        db.session.commit()
        
        return team.to_dict(), 201

@blp.route("/team/<string:team_id>")
class Team(MethodView):
    def get(self, team_id):
        """Get a specific team"""
        team = TeamModel.query.get_or_404(team_id)
        return team.to_dict(), 200

    def delete(self, team_id):
        """Delete a team"""
        team = TeamModel.query.get_or_404(team_id)
        db.session.delete(team)
        db.session.commit()
        return {"message": "Team deleted"}, 200

@blp.route("/team/<string:team_id>/add-member")
class AddTeamMember(MethodView):
    @blp.arguments(AddTeamMemberSchema)
    def post(self, data, team_id):
        """Add second member to team and recalculate ranking"""
        team = TeamModel.query.get_or_404(team_id)
        
        # Check if team already has 2 members
        if len(team.members) >= 2:
            return {"error": "Team already has 2 members"}, 400
        
        player2 = PlayerModel.query.get_or_404(data["player2_id"])
        
        # Add player 2 as member
        member2 = TeamMemberModel(team_id=team.id, player_id=player2.id)
        db.session.add(member2)
        
        # Recalculate team ranking
        team.calculate_ranking()
        db.session.commit()
        
        return team.to_dict(), 200