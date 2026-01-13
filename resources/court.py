from flask.views import MethodView
from flask_smorest import Blueprint
from flask import request
from marshmallow import Schema, fields
from db import db
from models.court import CourtModel
from utils.auth_decorator import admin_required, token_required

blp = Blueprint("Courts", "courts", description="Operations on courts")

# Schemas
class CourtCreateSchema(Schema):
    name = fields.String(required=True, metadata={"description": "Court name"})
    location = fields.String(required=False, metadata={"description": "Court location (optional)"})
    is_indoor = fields.Boolean(required=False, load_default=False, metadata={"description": "Indoor or outdoor court"})

class CourtUpdateSchema(Schema):
    name = fields.String(required=False, metadata={"description": "Court name"})
    location = fields.String(required=False, metadata={"description": "Court location"})
    is_available = fields.Boolean(required=False, metadata={"description": "Court availability"})
    is_indoor = fields.Boolean(required=False, metadata={"description": "Indoor or outdoor court"})

@blp.route("/court")
class CourtList(MethodView):
    def get(self):
        """Get all courts"""
        courts = CourtModel.query.all()
        return [c.to_dict() for c in courts], 200

    @admin_required
    @blp.arguments(CourtCreateSchema)
    def post(self, data):
        """Create a new court (admin only)"""
        
        court = CourtModel(
            name=data["name"],
            location=data.get("location"),
            is_indoor=data.get("is_indoor", False)
        )
        db.session.add(court)
        db.session.commit()
        return court.to_dict(), 201

@blp.route("/court/<string:court_id>")
class Court(MethodView):
    def get(self, court_id):
        """Get a specific court"""
        court = CourtModel.query.get_or_404(court_id)
        return court.to_dict(), 200

    @admin_required
    @blp.arguments(CourtUpdateSchema)
    def put(self, data, court_id):
        """Update a court (admin only)"""
        court = CourtModel.query.get_or_404(court_id)
        
        court.name = data.get("name", court.name)
        court.location = data.get("location", court.location)
        court.is_available = data.get("is_available", court.is_available)
        court.is_indoor = data.get("is_indoor", court.is_indoor)
        
        db.session.commit()
        return court.to_dict(), 200

    @admin_required
    def delete(self, court_id):
        """Delete a court (admin only)"""
        court = CourtModel.query.get_or_404(court_id)
        db.session.delete(court)
        db.session.commit()
        return {"message": "Court deleted"}, 200