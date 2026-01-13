from models.match import MatchModel

def get_tournament_standings(tournament):
    """
    Calculate standings based on finished matches.
    Points system: Win=3, Loss=0
    """
    
    # Get all finished matches
    finished_matches = MatchModel.query.filter_by(
        tournament_id=tournament.id,
        status="finished",
        phase="group"
    ).all()
    
    # Initialize standings
    standings = {}
    for tt in tournament.teams:
        standings[tt.team_id] = {
            "team": tt.team,
            "matches_played": 0,
            "wins": 0,
            "losses": 0,
            "points": 0
        }
    
    # Calculate standings from matches
    for match in finished_matches:
        standings[match.team1_id]["matches_played"] += 1
        standings[match.team2_id]["matches_played"] += 1
        
        if match.winner_id == match.team1_id:
            standings[match.team1_id]["wins"] += 1
            standings[match.team1_id]["points"] += 3
            standings[match.team2_id]["losses"] += 1
        elif match.winner_id == match.team2_id:
            standings[match.team2_id]["wins"] += 1
            standings[match.team2_id]["points"] += 3
            standings[match.team1_id]["losses"] += 1
    
    # Sort by points (descending)
    sorted_standings = sorted(
        standings.values(),
        key=lambda x: x["points"],
        reverse=True
    )
    
    return sorted_standings