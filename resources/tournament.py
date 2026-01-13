from flask.views import MethodView
from flask_smorest import Blueprint
from flask import request
from marshmallow import Schema, fields
from db import db
from models.tournament import TournamentModel, TournamentTeamModel
from models.team import TeamModel
from models.court import CourtModel
from models.match import MatchModel
from algorithms.round_robin import generate_round_robin_matches
from algorithms.positions_table import get_tournament_standings
from algorithms.knockout import generate_knockout_bracket
from algorithms.advanced_scheduling import schedule_matches_intelligent, can_schedule_match
from utils.auth_decorator import admin_required, token_required
from datetime import datetime

blp = Blueprint("Tournaments", "tournaments", description="Operations on tournaments")

# Schemas
class RegisterTeamSchema(Schema):
    team_id = fields.String(required=True, metadata={"description": "Team ID to register"})

class ScheduleMatchesSchema(Schema):
    court_ids = fields.List(fields.String(), required=True, metadata={"description": "List of court IDs"})
    start_date = fields.String(required=True, metadata={"description": "Start date (YYYY-MM-DD)"})
    time_slots = fields.List(fields.String(), required=False, load_default=["10:00", "12:00", "14:00", "16:00", "18:00"], metadata={"description": "Time slots (e.g., ['09:00', '11:00'])"})
    buffer_minutes = fields.Integer(required=False, load_default=10, metadata={"description": "Buffer minutes between matches"})

class ValidateScheduleSchema(Schema):
    court_id = fields.String(required=True, metadata={"description": "Court ID"})
    booking_date = fields.String(required=True, metadata={"description": "Booking date (YYYY-MM-DD)"})
    start_time = fields.String(required=True, metadata={"description": "Start time (HH:MM)"})
    end_time = fields.String(required=True, metadata={"description": "End time (HH:MM)"})
    buffer_minutes = fields.Integer(required=False, load_default=10, metadata={"description": "Buffer minutes"})

@blp.route("/tournament")
class TournamentList(MethodView):
    def get(self):
        """Get all tournaments"""
        tournaments = TournamentModel.query.all()
        return [t.to_dict() for t in tournaments], 200

@blp.route("/tournament/<string:tournament_id>")
class Tournament(MethodView):
    def get(self, tournament_id):
        """Get a specific tournament"""
        tournament = TournamentModel.query.get_or_404(tournament_id)
        return tournament.to_dict(), 200

@blp.route("/tournament/<string:tournament_id>/register-team")
class RegisterTeam(MethodView):
    @blp.arguments(RegisterTeamSchema)
    def post(self, data, tournament_id):
        """Register a team for a tournament"""
        tournament = TournamentModel.query.get_or_404(tournament_id)
        
        team = TeamModel.query.get_or_404(data["team_id"])
        
        # Check if team is already registered
        existing = TournamentTeamModel.query.filter_by(
            tournament_id=tournament_id, 
            team_id=team.id
        ).first()
        
        if existing:
            return {"error": "Team already registered for this tournament"}, 400
        
        # Register team
        tournament_team = TournamentTeamModel(
            tournament_id=tournament_id,
            team_id=team.id
        )
        db.session.add(tournament_team)
        db.session.commit()
        
        return {
            "message": "Team registered successfully",
            "tournament": tournament.to_dict()
        }, 201

@blp.route("/tournament/<string:tournament_id>/start-group-phase")
class StartGroupPhase(MethodView):
    @admin_required
    def post(self, tournament_id):
        """Start group phase - generates round robin matches (admin only)"""
        tournament = TournamentModel.query.get_or_404(tournament_id)
        
        if tournament.status != "waiting":
            return {"error": "Tournament is not in waiting status"}, 400
        
        # Get all registered teams
        teams = [tt.team for tt in tournament.teams]
        
        if len(teams) < 2:
            return {"error": "Need at least 2 teams to start tournament"}, 400
        
        # Generate round robin matches
        generate_round_robin_matches(tournament, teams)
        
        # Update tournament status
        tournament.status = "group_phase"
        db.session.commit()
        
        return {
            "message": "Group phase started",
            "tournament": tournament.to_dict()
        }, 200

@blp.route("/tournament/<string:tournament_id>/standings")
class TournamentStandings(MethodView):
    def get(self, tournament_id):
        """Get tournament standings/positions table"""
        tournament = TournamentModel.query.get_or_404(tournament_id)
        
        standings = get_tournament_standings(tournament)
        
        return {
            "tournament_id": tournament_id,
            "tournament_name": tournament.name,
            "standings": [
                {
                    "position": i + 1,
                    "team": s["team"].to_dict(),
                    "matches_played": s["matches_played"],
                    "wins": s["wins"],
                    "losses": s["losses"],
                    "points": s["points"]
                }
                for i, s in enumerate(standings)
            ]
        }, 200

@blp.route("/tournament/<string:tournament_id>/start-knockout-phase")
class StartKnockoutPhase(MethodView):
    @admin_required
    def post(self, tournament_id):
        """Start knockout phase - generates bracket from standings (admin only)"""
        tournament = TournamentModel.query.get_or_404(tournament_id)
        
        if tournament.status != "group_phase":
            return {"error": "Tournament must be in group phase"}, 400
        
        # Generate knockout bracket
        success = generate_knockout_bracket(tournament)
        
        if not success:
            return {"error": "Could not generate knockout bracket"}, 400
        
        # Update tournament status
        tournament.status = "knockout_phase"
        db.session.commit()
        
        return {
            "message": "Knockout phase started",
            "tournament": tournament.to_dict()
        }, 200

@blp.route("/tournament/<string:tournament_id>/schedule-matches")
class ScheduleMatches(MethodView):
    @admin_required
    @blp.arguments(ScheduleMatchesSchema)
    def post(self, data, tournament_id):
        """Schedule matches on courts with conflict detection (advanced scheduling)"""
        tournament = TournamentModel.query.get_or_404(tournament_id)
        
        # Get courts
        courts = []
        for court_id in data["court_ids"]:
            court = CourtModel.query.get(court_id)
            if court:
                courts.append(court)
        
        if not courts:
            return {"error": "No valid courts provided"}, 400
        
        # Parse start date
        try:
            start_date = datetime.strptime(data["start_date"], "%Y-%m-%d").date()
        except ValueError:
            return {"error": "Invalid date format. Use YYYY-MM-DD"}, 400
        
        time_slots = data.get("time_slots", ["10:00", "12:00", "14:00", "16:00", "18:00"])
        buffer_minutes = data.get("buffer_minutes", 10)
        
        # Schedule matches with advanced algorithm
        success, message, scheduled_count = schedule_matches_intelligent(
            tournament, courts, start_date, time_slots, buffer_minutes
        )
        
        return {
            "success": success,
            "message": message,
            "scheduled_count": scheduled_count,
            "tournament": tournament.to_dict()
        }, 200 if success else 400

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