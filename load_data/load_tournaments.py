from app import create_app
from db import db
from models.tournament import TournamentModel

def load_tournaments():
    """Load the 5 default tournaments"""
    app = create_app()
    
    with app.app_context():
        tournament_names = ["P50", "P100", "P250", "P500", "P1000"]
        
        for name in tournament_names:
            # Check if tournament already exists
            existing = TournamentModel.query.filter_by(name=name).first()
            if existing:
                print(f"⚠️ Tournament {name} already exists, skipping...")
                continue
            
            tournament = TournamentModel(name=name)
            db.session.add(tournament)
            print(f"✅ Created tournament: {name}")
        
        db.session.commit()
        print("🎉 All tournaments loaded successfully!")

if __name__ == "__main__":
    load_tournaments()