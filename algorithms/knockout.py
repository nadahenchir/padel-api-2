from db import db
from models.match import MatchModel
from algorithms.positions_table import get_tournament_standings

def generate_knockout_bracket(tournament):
    """
    Generate knockout bracket based on group phase standings.
    Takes top teams and creates semi-finals and finals.
    """
    
    # Get standings from group phase
    standings = get_tournament_standings(tournament)
    
    if len(standings) < 2:
        return False
    
    # Determine number of knockout teams
    # If 2-4 teams: direct finals
    # If 5-8 teams: semi-finals + finals
    # If 9+ teams: quarter-finals + semi-finals + finals
    
    num_teams = len(standings)
    
    if num_teams == 2:
        # Direct final
        create_final(tournament, standings[0]["team"], standings[1]["team"])
    elif num_teams <= 4:
        # Semi-finals (top 2 vs bottom 2)
        create_semifinals(tournament, standings)
    elif num_teams <= 8:
        # Semi-finals (top 4 advance)
        create_semifinals(tournament, standings[:4])
    else:
        # Quarter-finals (top 8 advance)
        create_quarterfinals(tournament, standings[:8])
    
    print(f"✅ Knockout bracket generated with {num_teams} teams")
    return True

def create_quarterfinals(tournament, top_teams):
    """Create quarter-final matches"""
    matches_created = 0
    
    # Seed 1 vs Seed 8, Seed 2 vs Seed 7, etc.
    for i in range(0, 8, 2):
        team1 = top_teams[i]["team"]
        team2 = top_teams[7 - i]["team"]
        
        match = MatchModel(
            tournament_id=tournament.id,
            team1_id=team1.id,
            team2_id=team2.id,
            status="pending",
            phase="knockout",
            round_num=1  # Quarter-finals
        )
        db.session.add(match)
        matches_created += 1
    
    db.session.commit()
    print(f"✅ Created {matches_created} quarter-final matches")

def create_semifinals(tournament, top_teams):
    """Create semi-final matches"""
    matches_created = 0
    
    # Top 2 teams and bottom 2 teams
    if len(top_teams) >= 4:
        team1 = top_teams[0]["team"]
        team2 = top_teams[1]["team"]
        team3 = top_teams[2]["team"]
        team4 = top_teams[3]["team"]
        
        # Semi-final 1: Seed 1 vs Seed 4
        match1 = MatchModel(
            tournament_id=tournament.id,
            team1_id=team1.id,
            team2_id=team4.id,
            status="pending",
            phase="knockout",
            round_num=2  # Semi-finals
        )
        
        # Semi-final 2: Seed 2 vs Seed 3
        match2 = MatchModel(
            tournament_id=tournament.id,
            team1_id=team2.id,
            team2_id=team3.id,
            status="pending",
            phase="knockout",
            round_num=2  # Semi-finals
        )
        
        db.session.add(match1)
        db.session.add(match2)
        matches_created = 2
    
    db.session.commit()
    print(f"✅ Created {matches_created} semi-final matches")

def create_final(tournament, team1, team2):
    """Create final match"""
    match = MatchModel(
        tournament_id=tournament.id,
        team1_id=team1.id,
        team2_id=team2.id,
        status="pending",
        phase="knockout",
        round_num=3  # Final
    )
    db.session.add(match)
    db.session.commit()
    print(f"✅ Created final match")