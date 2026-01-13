from flask.views import MethodView
from flask_smorest import Blueprint
from flask import request
from marshmallow import Schema, fields
from db import db
from models.match import MatchModel
from models.team import TeamModel
from models.court import CourtModel
from algorithms.advanced_scheduling import can_schedule_match
from datetime import datetime

blp = Blueprint("Matches", "matches", description="Operations on matches")

# Schemas
class RecordResultSchema(Schema):
    team1_score = fields.Integer(required=True, metadata={"description": "Team 1 score"})
    team2_score = fields.Integer(required=True, metadata={"description": "Team 2 score"})

class CancelMatchSchema(Schema):
    team_id = fields.String(required=True, metadata={"description": "ID of team that forfeits"})
    reason = fields.String(required=False, load_default="Team forfeited", metadata={"description": "Cancellation reason"})

class ValidateScheduleSchema(Schema):
    court_id = fields.String(required=True, metadata={"description": "Court ID"})
    booking_date = fields.String(required=True, metadata={"description": "Booking date (YYYY-MM-DD)"})
    start_time = fields.String(required=True, metadata={"description": "Start time (HH:MM)"})
    end_time = fields.String(required=True, metadata={"description": "End time (HH:MM)"})
    buffer_minutes = fields.Integer(required=False, load_default=10, metadata={"description": "Buffer minutes"})

@blp.route("/match")
class MatchList(MethodView):
    def get(self):
        """Get all matches"""
        matches = MatchModel.query.all()
        return [m.to_dict() for m in matches], 200

@blp.route("/match/<string:match_id>")
class Match(MethodView):
    def get(self, match_id):
        """Get a specific match"""
        match = MatchModel.query.get_or_404(match_id)
        return match.to_dict(), 200

@blp.route("/match/<string:match_id>/record-result")
class RecordResult(MethodView):
    @blp.arguments(RecordResultSchema)
    def post(self, data, match_id):
        """Record match result and set winner"""
        match = MatchModel.query.get_or_404(match_id)
        
        match.team1_score = data["team1_score"]
        match.team2_score = data["team2_score"]
        
        # Determine winner
        if match.team1_score > match.team2_score:
            match.winner_id = match.team1_id
        elif match.team2_score > match.team1_score:
            match.winner_id = match.team2_id
        else:
            # Handle tie - in real padel, there's a tie-break
            # For now, no winner on tie
            match.winner_id = None
        
        match.status = "finished"
        db.session.commit()
        
        return {
            "message": "Match result recorded",
            "match": match.to_dict()
        }, 200

@blp.route("/match/<string:match_id>/cancel")
class CancelMatch(MethodView):
    @blp.arguments(CancelMatchSchema)
    def post(self, data, match_id):
        """Cancel a match (forfeit) - other team automatically wins"""
        match = MatchModel.query.get_or_404(match_id)
        
        cancelling_team_id = data["team_id"]
        
        # Verify the team is in this match
        if cancelling_team_id not in [match.team1_id, match.team2_id]:
            return {"error": "Team is not in this match"}, 400
        
        # Check match status
        if match.status != "pending":
            return {"error": "Can only cancel pending matches"}, 400
        
        # Determine winner (the other team)
        if cancelling_team_id == match.team1_id:
            match.winner_id = match.team2_id
        else:
            match.winner_id = match.team1_id
        
        # Record cancellation
        match.status = "finished"
        match.cancelled_by_team_id = cancelling_team_id
        match.cancellation_reason = data.get("reason", "Team forfeited")
        
        db.session.commit()
        
        return {
            "message": "Match cancelled - other team wins by forfeit",
            "match": match.to_dict()
        }, 200

@blp.route("/match/<string:match_id>/validate-schedule")
class ValidateSchedule(MethodView):
    @blp.arguments(ValidateScheduleSchema)
    def post(self, data, match_id):
        """Check if a specific match can be scheduled at a given time/court"""
        match = MatchModel.query.get_or_404(match_id)
        
        court = CourtModel.query.get_or_404(data["court_id"])
        
        try:
            booking_date = datetime.strptime(data["booking_date"], "%Y-%m-%d").date()
        except ValueError:
            return {"error": "Invalid date format. Use YYYY-MM-DD"}, 400
        
        buffer_minutes = data.get("buffer_minutes", 10)
        
        can_schedule, conflict = can_schedule_match(
            match, court, booking_date, data["start_time"], data["end_time"], buffer_minutes
        )
        
        return {
            "match_id": match_id,
            "can_schedule": can_schedule,
            "conflict_reason": conflict,
            "court": court.to_dict(),
            "requested_date": booking_date.isoformat(),
            "requested_time": f"{data['start_time']}-{data['end_time']}"
        }, 200

@blp.route("/tournament/<string:tournament_id>/matches")
class TournamentMatches(MethodView):
    def get(self, tournament_id):
        """Get all matches for a tournament"""
        matches = MatchModel.query.filter_by(tournament_id=tournament_id).all()
        return [m.to_dict() for m in matches], 200

@blp.route("/team/<string:team_id>/matches")
class TeamMatches(MethodView):
    def get(self, team_id):
        """Get all matches for a specific team (across all tournaments)"""
        matches = MatchModel.query.filter(
            (MatchModel.team1_id == team_id) | 
            (MatchModel.team2_id == team_id)
        ).all()
        return [m.to_dict() for m in matches], 200