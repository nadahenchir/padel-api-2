from db import db
from models.match import MatchModel

def generate_round_robin_matches(tournament, teams):
    """
    Generate all matches for round robin phase.
    Each team plays every other team once.
    """
    
    matches_created = 0
    
    for i in range(len(teams)):
        for j in range(i + 1, len(teams)):
            team1 = teams[i]
            team2 = teams[j]
            
            # Create match
            match = MatchModel(
                tournament_id=tournament.id,
                team1_id=team1.id,
                team2_id=team2.id,
                status="pending",
                phase="group"
            )
            db.session.add(match)
            matches_created += 1
    
    db.session.commit()
    print(f"✅ Created {matches_created} round robin matches")
    return matches_created