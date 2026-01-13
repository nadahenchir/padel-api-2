from flask.views import MethodView
from flask_smorest import Blueprint
from flask import request
from marshmallow import Schema, fields
from db import db
from models.player import PlayerModel

blp = Blueprint("Players", "players", description="Operations on players")

# Schemas
class PlayerCreateSchema(Schema):
    name = fields.String(required=True, metadata={"description": "Player full name"})
    rang = fields.Integer(required=True, metadata={"description": "Player ranking number"})
    numero_licence = fields.String(required=False, metadata={"description": "License number (optional)"})

class PlayerUpdateSchema(Schema):
    name = fields.String(required=False, metadata={"description": "Player full name"})
    rang = fields.Integer(required=False, metadata={"description": "Player ranking number"})
    numero_licence = fields.String(required=False, metadata={"description": "License number"})

@blp.route("/player")
class PlayerList(MethodView):
    def get(self):
        """Get all players"""
        players = PlayerModel.query.all()
        return [p.to_dict() for p in players], 200

    @blp.arguments(PlayerCreateSchema)
    def post(self, data):
        """Create a new player"""
        
        player = PlayerModel(
            name=data["name"],
            rang=data["rang"],
            numero_licence=data.get("numero_licence")
        )
        db.session.add(player)
        db.session.commit()
        return player.to_dict(), 201

@blp.route("/player/<string:player_id>")
class Player(MethodView):
    def get(self, player_id):
        """Get a specific player"""
        player = PlayerModel.query.get_or_404(player_id)
        return player.to_dict(), 200

    @blp.arguments(PlayerUpdateSchema)
    def put(self, data, player_id):
        """Update a player"""
        player = PlayerModel.query.get_or_404(player_id)
        
        player.name = data.get("name", player.name)
        player.rang = data.get("rang", player.rang)
        player.numero_licence = data.get("numero_licence", player.numero_licence)
        
        db.session.commit()
        return player.to_dict(), 200

    def delete(self, player_id):
        """Delete a player"""
        player = PlayerModel.query.get_or_404(player_id)
        db.session.delete(player)
        db.session.commit()
        return {"message": "Player deleted"}, 200