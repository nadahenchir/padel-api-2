from flask import Flask, jsonify, send_from_directory
from flask_smorest import Api
from flask_cors import CORS
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
    app = Flask(__name__, static_folder="frontend")

    # ========== CORS ==========
    CORS(app)
    # ==========================

    # Configuration
    app.config["PROPAGATE_EXCEPTIONS"] = True
    app.config["API_TITLE"] = "Padel Tournament API"
    app.config["API_VERSION"] = "v1"
    app.config["OPENAPI_VERSION"] = "3.0.3"
    app.config["OPENAPI_URL_PREFIX"] = "/"
    app.config["OPENAPI_SWAGGER_UI_PATH"] = "/swagger-ui"
    app.config["OPENAPI_SWAGGER_UI_URL"] = "https://cdn.jsdelivr.net/npm/swagger-ui-dist/"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # ========= DATABASE =========
    os.makedirs(app.instance_path, exist_ok=True)
    db_path = os.path.join(app.instance_path, "padel.db")
    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
    print(f"📍 Database path: {db_path}")

    db.init_app(app)

    # ✅ Only initialize DB when explicitly requested (safe with multi-worker gunicorn)
    if os.environ.get("INIT_DB") == "1":
        lock_path = os.path.join(app.instance_path, ".init_db.lock")

        try:
            # Atomic lock: only one worker succeeds
            fd = os.open(lock_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
            os.close(fd)
            is_lock_owner = True
        except FileExistsError:
            is_lock_owner = False

        if is_lock_owner:
            try:
                with app.app_context():
                    db.create_all()
                    print("✅ Database tables ready!")
            finally:
                # Remove lock so future init runs are possible
                try:
                    os.remove(lock_path)
                except FileNotFoundError:
                    pass
        else:
            print("ℹ️ INIT_DB is already running in another worker. Skipping create_all().")

    # ============================

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

    # ========== FRONTEND ROUTES ==========

    @app.route("/")
    def root():
        return send_from_directory(app.static_folder, "login.html")

    @app.route("/login")
    def serve_login():
        return send_from_directory(app.static_folder, "login.html")

    @app.route("/dashboard")
    def serve_dashboard():
        return send_from_directory(app.static_folder, "index.html")

    @app.route("/user-dashboard")
    def serve_user_dashboard():
        return send_from_directory(app.static_folder, "user-dashboard.html")

    @app.route("/<path:path>")
    def serve_frontend(path):
        """
        Serve static assets correctly:
        - If file exists under frontend/, return it.
        - If it's an asset request but missing, return 404 (NOT HTML).
        - Otherwise treat as frontend route and serve login.html.
        """
        full_path = os.path.join(app.static_folder, path)

        # Serve existing static files
        if os.path.isfile(full_path):
            return send_from_directory(app.static_folder, path)

        # Asset requests should NOT fall back to HTML
        asset_exts = (
            ".js", ".css", ".png", ".jpg", ".jpeg",
            ".svg", ".ico", ".map", ".json", ".txt"
        )
        if path.lower().endswith(asset_exts):
            return "Not found", 404

        # Fallback for frontend routes
        return send_from_directory(app.static_folder, "login.html")

    # =====================================

    # Health check
    @app.route("/ping")
    def ping():
        return jsonify({"message": "API is running!"}), 200

    # Simple API info
    @app.route("/api")
    def api_info():
        return jsonify({
            "message": "Padel Tournament API",
            "version": "v1",
            "frontend": "/ (login), /dashboard (admin), /user-dashboard (user)"
        }), 200

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
