from flask import Flask, jsonify, send_file
from flask_smorest import Api
from flask_cors import CORS  # NEW: Add this import
from db import db
import os

# Import all models BEFORE creating app
from models.player import PlayerModel
from models.team import TeamModel
from models.team_member import TeamMemberModel
from models.tournament import TournamentModel, TournamentTeamModel
from models.match import MatchModel
from models.user import UserModel
from models.court import CourtModel
from models.court_booking import CourtBookingModel

# Import all resources
from resources.auth import blp as AuthBlueprint
from resources.player import blp as PlayerBlueprint
from resources.team import blp as TeamBlueprint
from resources.tournament import blp as TournamentBlueprint
from resources.match import blp as MatchBlueprint
from resources.court import blp as CourtBlueprint
from resources.weather import blp as WeatherBlueprint

def create_app():
    app = Flask(__name__)
    
    # ========== ADD CORS SUPPORT ==========
    CORS(app)  # Allow all origins for development
    # OR for more specific control:
    # CORS(app, resources={r"/*": {"origins": "*"}})
    # ======================================
    
    # Configuration
    app.config["PROPAGATE_EXCEPTIONS"] = True
    app.config["API_TITLE"] = "Padel Tournament API"
    app.config["API_VERSION"] = "v1"
    app.config["OPENAPI_VERSION"] = "3.0.3"
    app.config["OPENAPI_URL_PREFIX"] = "/"
    app.config["OPENAPI_SWAGGER_UI_PATH"] = "/swagger-ui"
    app.config["OPENAPI_SWAGGER_UI_URL"] = "https://cdn.jsdelivr.net/npm/swagger-ui-dist/"
    
    # Database configuration
    db_path = os.path.join(os.getcwd(), 'padel.db')
    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    print(f"📍 Database path: {db_path}")
    
    # Initialize database
    db.init_app(app)
    
    with app.app_context():
        db.create_all()
        print("✅ Database tables ready!")
    
    # Initialize API
    api = Api(app)
    
    # Register blueprints (AUTH FIRST)
    api.register_blueprint(AuthBlueprint)
    api.register_blueprint(PlayerBlueprint)
    api.register_blueprint(TeamBlueprint)
    api.register_blueprint(TournamentBlueprint)
    api.register_blueprint(MatchBlueprint)
    api.register_blueprint(CourtBlueprint)
    api.register_blueprint(WeatherBlueprint)
    
    # ========== ADD UI SERVING ROUTE ==========
    @app.route("/ui")
    def serve_ui():
        """Serve the HTML UI interface"""
        try:
            return send_file("padel_api_ui.html")
        except FileNotFoundError:
            return jsonify({"error": "UI file not found. Make sure padel_api_ui.html is in the same directory."}), 404
    # ==========================================
    
    # Health check
    @app.route("/ping")
    def ping():
        return jsonify({"message": "API is running!"}), 200
    
    # Root endpoint - redirect to UI
    @app.route("/")
    def home():
        """Redirect to UI or show API info"""
        return jsonify({
            "message": "Padel Tournament API",
            "version": "v1",
            "ui": "Visit /ui for the web interface",
            "endpoints": {
                "auth": {
                    "register": "POST /auth/register",
                    "login": "POST /auth/login",
                    "register_admin": "POST /auth/register-admin"
                },
                "players": {
                    "get_all": "GET /player",
                    "create": "POST /player",
                    "get_one": "GET /player/{id}",
                    "update": "PUT /player/{id}",
                    "delete": "DELETE /player/{id}"
                },
                "teams": {
                    "get_all": "GET /team",
                    "get_one": "GET /team/{id}",
                    "create": "POST /team",
                    "add_member": "POST /team/{id}/add-member",
                    "delete": "DELETE /team/{id}"
                },
                "tournaments": {
                    "get_all": "GET /tournament",
                    "get_one": "GET /tournament/{id}",
                    "register_team": "POST /tournament/{id}/register-team",
                    "start_group": "POST /tournament/{id}/start-group-phase",
                    "standings": "GET /tournament/{id}/standings",
                    "start_knockout": "POST /tournament/{id}/start-knockout-phase",
                    "schedule_matches": "POST /tournament/{id}/schedule-matches"
                },
                "matches": {
                    "get_all": "GET /match",
                    "get_one": "GET /match/{id}",
                    "tournament_matches": "GET /tournament/{id}/matches",
                    "record_result": "POST /match/{id}/record-result",
                    "team_matches": "GET /team/{id}/matches",
                    "validate_schedule": "POST /match/{id}/validate-schedule"
                },
                "courts": {
                    "get_all": "GET /court",
                    "create": "POST /court"
                },
                "weather": {
                    "check_all": "POST /tournament/{id}/check-all-weather",
                    "check_match": "POST /match/{id}/check-weather"
                },
                "swagger": "/swagger-ui",
                "openapi": "/openapi.json"
            }
        }), 200
    
    return app

app = create_app()

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)