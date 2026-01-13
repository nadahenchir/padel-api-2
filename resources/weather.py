from flask.views import MethodView
from flask_smorest import Blueprint
from flask import request
from marshmallow import Schema, fields
from models.match import MatchModel
from models.tournament import TournamentModel
from algorithms.weather_guard import check_match_weather_and_relocate, check_all_tournament_weather
from utils.auth_decorator import admin_required

blp = Blueprint("Weather", "weather", description="Weather-based match management")

# Schemas
class WeatherCheckSchema(Schema):
    location = fields.String(required=False, load_default="Tunis,TN", metadata={"description": "Location in format City,CountryCode (e.g., Tunis,TN)"})

@blp.route("/match/<string:match_id>/check-weather")
class MatchWeatherCheck(MethodView):
    @admin_required
    @blp.arguments(WeatherCheckSchema)
    def post(self, data, match_id):
        """
        Check live weather and auto-relocate/postpone if needed (admin only).
        
        Actions:
        - If outdoor court + bad weather + indoor available → RELOCATE
        - If outdoor court + bad weather + no indoor → POSTPONE to next day
        - If indoor court OR good weather → NO ACTION
        """
        
        match = MatchModel.query.get_or_404(match_id)
        
        location = data.get("location", "Tunis,TN")
        
        # Run weather guard
        result = check_match_weather_and_relocate(match, location)
        
        return {
            "match_id": match.id,
            "action_taken": result["action"],
            "reason": result["reason"],
            "weather": result.get("weather"),
            "old_court": result.get("old_court"),
            "new_court": result.get("new_court"),
            "original_date": result.get("original_date"),
            "new_date": result.get("new_date"),
            "match": match.to_dict()
        }, 200

@blp.route("/tournament/<string:tournament_id>/check-all-weather")
class TournamentWeatherCheck(MethodView):
    @admin_required
    @blp.arguments(WeatherCheckSchema)
    def post(self, data, tournament_id):
        """
        Check weather for ALL upcoming matches in tournament (admin only).
        Auto-relocate/postpone as needed.
        
        Returns summary of actions taken for all matches.
        """
        
        tournament = TournamentModel.query.get_or_404(tournament_id)
        
        location = data.get("location", "Tunis,TN")
        
        # Check all matches
        summary = check_all_tournament_weather(tournament, location)
        
        return {
            "tournament_id": tournament_id,
            "tournament_name": tournament.name,
            "summary": summary
        }, 200

@blp.route("/weather/test")
class WeatherTest(MethodView):
    def get(self):
        """
        Test weather API connection (no auth required).
        
        Query params:
        - location: City,CountryCode (default: Tunis,TN)
        
        Example: GET /weather/test?location=Paris,FR
        """
        
        from services.weather_service import get_live_weather
        
        location = request.args.get("location", "Tunis,TN")
        
        weather = get_live_weather(location)
        
        return {
            "location": location,
            "weather": weather,
            "message": "Weather API is working!" if "error" not in weather else "Weather API error - check your API key"
        }, 200