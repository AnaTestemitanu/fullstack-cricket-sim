"""
This module defines the FastAPI application for the Cricket Simulation Dashboard.
It includes endpoints for:
  - Dummy login
  - Loading CSV data into the database on startup
  - Retrieving games and game details (with simulation results)
  - Filtering games based on criteria (date range, venue, team)

It also configures CORS to allow the React frontend to communicate with the API.
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
import datetime
import csv
import os

# Import database engine, session factory, and Base for model definitions
from database import engine, SessionLocal, Base
# Import the models used by the application
from models import Venue, Game, Simulation

# Create the FastAPI app instance.
app = FastAPI()

# Enable CORS middleware so that the React frontend (or any other client)
# can communicate with this API. Here we allow all origins; adjust as needed.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------
# Database Table Creation
# -------------------------------
# Drop all existing tables and recreate them on startup.
# (Remove the drop_all call in production if you wish to persist data.)
Base.metadata.drop_all(bind=engine)  # WARNING: This deletes all existing data!
Base.metadata.create_all(bind=engine)

# -------------------------------
# Dummy Login Model and Endpoint
# -------------------------------
# Define a Pydantic model for the login request payload.
class LoginRequest(BaseModel):
    username: str
    password: str

# Define a dummy login endpoint.
# If the username and password are "test", it returns a dummy token.
# Otherwise, it returns an HTTP 401 error.
@app.post("/login")
def login(login_req: LoginRequest):
    if login_req.username == "test" and login_req.password == "test":
        return {"message": "Login successful", "token": "dummy-token-12345"}
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

# -------------------------------
# Dependency: Database Session
# -------------------------------
# This function creates a new database session for each request and ensures
# that the session is closed after the request is complete.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------------------------------
# CSV Data Loading Function
# -------------------------------
# This function loads mock data from CSV files into the database.
# It reads venues, games, and simulation data from the 'data' directory.
def load_csv_data(db: Session):
    # Load venues from venues.csv
    venues_file = os.path.join(os.path.dirname(__file__), "data", "venues.csv")
    with open(venues_file, newline="", encoding="utf-8") as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            # Create a Venue instance for each row
            venue = Venue(id=int(row["venue_id"]), name=row["venue_name"])
            db.add(venue)
    db.commit()

    # Load games from games.csv
    games_file = os.path.join(os.path.dirname(__file__), "data", "games.csv")
    with open(games_file, newline="", encoding="utf-8") as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            # Parse the date string into a date object
            game_date = datetime.datetime.strptime(row["date"], "%Y-%m-%d").date()
            # Create a Game instance for each row
            game = Game(
                home_team=row["home_team"],
                away_team=row["away_team"],
                date=game_date,
                venue_id=int(row["venue_id"]),
            )
            db.add(game)
    db.commit()

    # Load simulations from simulations.csv
    simulations_file = os.path.join(os.path.dirname(__file__), "data", "simulations.csv")
    with open(simulations_file, newline="", encoding="utf-8") as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            # For each simulation row, find all games in which the team participated.
            games = db.query(Game).filter(
                (Game.home_team == row["team"]) | (Game.away_team == row["team"])
            ).all()

            if not games:
                print(f"Warning: No games found for team {row['team']} in simulations.csv")
                continue

            # Create a Simulation instance for each game that the team participated in.
            for game in games:
                simulation = Simulation(
                    game_id=game.id,
                    team=row["team"],
                    simulation_run=int(row["simulation_run"]),
                    results=int(row["results"]),
                )
                db.add(simulation)
    db.commit()

# -------------------------------
# Startup Event: Load CSV Data
# -------------------------------
# On startup, load the CSV data into the database.
@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    load_csv_data(db)
    db.close()

# -------------------------------
# API Endpoints
# -------------------------------

# Endpoint: Get All Games
# Returns a list of games with unique (home_team, away_team, venue, date) combinations.
@app.get("/games")
def get_games(db: Session = Depends(get_db)):
    games = db.query(Game).all()
    results = []
    seen_matches = set()  # To track and prevent duplicate game entries

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

# Endpoint: Get Game Details
# Returns detailed information about a game, including simulation results.
@app.get("/games/{game_id}")
def get_game_details(game_id: int, db: Session = Depends(get_db)):
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    # Retrieve simulations for the home and away teams, filtering by game_id.
    home_sims = db.query(Simulation).filter(
        Simulation.game_id == game.id,
        Simulation.team == game.home_team
    ).all()
    away_sims = db.query(Simulation).filter(
        Simulation.game_id == game.id,
        Simulation.team == game.away_team
    ).all()

    # Create dictionaries mapping simulation_run numbers to results.
    home_dict = {sim.simulation_run: sim.results for sim in home_sims}
    away_dict = {sim.simulation_run: sim.results for sim in away_sims}

    # Find simulation runs that exist for both teams.
    common_runs = sorted(set(home_dict.keys()).intersection(away_dict.keys()))
    
    # Build lists of scores for the common simulation runs.
    home_scores = [home_dict[run] for run in common_runs]
    away_scores = [away_dict[run] for run in common_runs]
    
    # Compute the win percentage for the home team.
    wins = sum(1 for run in common_runs if home_dict[run] > away_dict[run])
    win_percentage = (wins / len(common_runs) * 100) if common_runs else 0

    return {
        "id": game.id,
        "home_team": game.home_team,
        "away_team": game.away_team,
        "date": game.date.strftime("%Y-%m-%d") if game.date else None,
        "venue": game.venue.name if game.venue else None,
        "simulation_runs": common_runs,   # List of simulation run numbers (e.g., [1,2,3,...])
        "home_scores": home_scores,
        "away_scores": away_scores,
        "home_win_percentage": win_percentage
    }

# Endpoint: Filter Games
# Allows filtering of games by date range, venue substring, or team substring.
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
    - start_date and end_date must be in YYYY-MM-DD format.
    - venue: A substring to match within the venue name.
    - team: A substring to match within either the home or away team name.
    """
    query = db.query(Game)

    # Filter by start date if provided.
    if start_date:
        try:
            start = datetime.datetime.strptime(start_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format, expected YYYY-MM-DD")
        query = query.filter(Game.date >= start)

    # Filter by end date if provided.
    if end_date:
        try:
            end = datetime.datetime.strptime(end_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format, expected YYYY-MM-DD")
        query = query.filter(Game.date <= end)
    
    # Filter by venue if provided.
    if venue:
        query = query.join(Venue).filter(Venue.name.ilike(f"%{venue}%"))
    
    # Filter by team if provided (searches both home_team and away_team).
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
