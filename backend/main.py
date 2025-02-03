from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
import datetime
import csv
import os

from database import engine, SessionLocal, Base
from models import Venue, Game, Simulation

app = FastAPI()

# Enable CORS so the React frontend can communicate with the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# (Re)create all tables on startup.
Base.metadata.drop_all(bind=engine)  # Remove this line in production if you want to persist data.
Base.metadata.create_all(bind=engine)

# Dummy Login Model
class LoginRequest(BaseModel):
    username: str
    password: str

# Dummy Login Endpoint
@app.post("/login")
def login(login_req: LoginRequest):
    if login_req.username == "test" and login_req.password == "test":
        return {"message": "Login successful", "token": "dummy-token-12345"}
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

# Dependency to provide a DB session to endpoints.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def load_csv_data(db: Session):
    # Load venues.csv
    venues_file = os.path.join(os.path.dirname(__file__), "data", "venues.csv")
    with open(venues_file, newline="", encoding="utf-8") as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            venue = Venue(id=int(row["venue_id"]), name=row["venue_name"])
            db.add(venue)
    db.commit()

    # Load games.csv
    games_file = os.path.join(os.path.dirname(__file__), "data", "games.csv")
    with open(games_file, newline="", encoding="utf-8") as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            game = Game(
                home_team=row["home_team"],
                away_team=row["away_team"],
                date=datetime.datetime.strptime(row["date"], "%Y-%m-%d").date(),
                venue_id=int(row["venue_id"]),
            )
            db.add(game)
    db.commit()

    # Load simulations.csv
    simulations_file = os.path.join(os.path.dirname(__file__), "data", "simulations.csv")
    with open(simulations_file, newline="", encoding="utf-8") as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            # Find games where this team participated
            games = db.query(Game).filter(
                (Game.home_team == row["team"]) | (Game.away_team == row["team"])
            ).all()

            if not games:
                print(f"Warning: No games found for team {row['team']} in simulations.csv")
                continue

            for game in games:
                simulation = Simulation(
                    game_id=game.id,
                    team=row["team"],
                    simulation_run=int(row["simulation_run"]),
                    results=int(row["results"]),
                )
                db.add(simulation)
    db.commit()


# Load the CSV data when the app starts.
@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    load_csv_data(db)
    db.close()

@app.get("/games")
def get_games(db: Session = Depends(get_db)):
    games = db.query(Game).all()
    results = []
    seen_matches = set()  # Track seen (home, away, venue, date) combinations

    for game in games:
        match_key = (game.home_team, game.away_team, game.venue.name, game.date)
        if match_key not in seen_matches:
            seen_matches.add(match_key)
            results.append({
                "id": game.id,
                "home_team": game.home_team,
                "away_team": game.away_team,
                "venue": game.venue.name if game.venue else None,
                "date": game.date.strftime("%Y-%m-%d") if game.date else None
            })

    return results

@app.get("/games/{game_id}")
def get_game_details(game_id: int, db: Session = Depends(get_db)):
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    # Retrieve simulation runs for the home and away team, 
    # filter the simulations by the current game’s ID as well.
    home_sims = db.query(Simulation).filter(
        Simulation.game_id == game.id,
        Simulation.team == game.home_team
    ).all()
    away_sims = db.query(Simulation).filter(
        Simulation.game_id == game.id,
        Simulation.team == game.away_team
    ).all()


    # Build dictionaries keyed by simulation_run.
    home_dict = {sim.simulation_run: sim.results for sim in home_sims}
    away_dict = {sim.simulation_run: sim.results for sim in away_sims}

    # Use only simulation run numbers that exist for both teams.
    common_runs = sorted(set(home_dict.keys()).intersection(away_dict.keys()))
    
    home_scores = [home_dict[run] for run in common_runs]
    away_scores = [away_dict[run] for run in common_runs]
    
    # Compute the win count and win percentage for the home team.
    wins = sum(1 for run in common_runs if home_dict[run] > away_dict[run])
    win_percentage = (wins / len(common_runs) * 100) if common_runs else 0

    return {
        "id": game.id,
        "home_team": game.home_team,
        "away_team": game.away_team,
        "date": game.date.strftime("%Y-%m-%d") if game.date else None,
        "venue": game.venue.name if game.venue else None,
        "simulation_runs": common_runs,   # e.g. [1,2,3,...]
        "home_scores": home_scores,
        "away_scores": away_scores,
        "home_win_percentage": win_percentage
    }

@app.get("/games/filter")
def filter_games(
    start_date: str = None,
    end_date: str = None,
    venue: str = None,
    team: str = None,
    db: Session = Depends(get_db)
):
    """
    Filter games by date range, venue, or team.
    - start_date and end_date should be in YYYY-MM-DD format.
    - venue is a substring of the venue name.
    - team is a substring that should match either the home or away team.
    """
    query = db.query(Game)

    # Filter by date range if provided.
    if start_date:
        try:
            start = datetime.datetime.strptime(start_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format, expected YYYY-MM-DD")
        query = query.filter(Game.date >= start)
    if end_date:
        try:
            end = datetime.datetime.strptime(end_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format, expected YYYY-MM-DD")
        query = query.filter(Game.date <= end)
    
    # Filter by venue name if provided.
    if venue:
        query = query.join(Venue).filter(Venue.name.ilike(f"%{venue}%"))
    
    # Filter by team name if provided (searches in both home_team and away_team).
    if team:
        query = query.filter((Game.home_team.ilike(f"%{team}%")) | (Game.away_team.ilike(f"%{team}%")))
    
    games = query.all()
    results = []
    for game in games:
        results.append({
            "id": game.id,
            "home_team": game.home_team,
            "away_team": game.away_team,
            "venue": game.venue.name if game.venue else None,
            "date": game.date.strftime("%Y-%m-%d") if game.date else None
        })
    return results
