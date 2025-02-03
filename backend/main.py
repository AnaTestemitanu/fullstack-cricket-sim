"""
This module defines the FastAPI application for the Cricket Simulation Dashboard.
It includes endpoints for:
  - Dummy login
  - Loading CSV data into the database on startup
  - Retrieving games and game details (with simulation results)
  - Filtering games based on criteria (date range, venue, team)
  - Clustering simulation runs for a selected game using ML (KMeans)

It also configures CORS to allow the React frontend to communicate with the API.
"""

# Import the simulation run clustering function from analytics.
from analytics import cluster_simulation_runs

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
import datetime
import csv
import os

# Import database engine, session factory, and Base.
from database import engine, SessionLocal, Base
# Import models.
from models import Venue, Game, Simulation

# Create FastAPI app instance.
app = FastAPI()

# Enable CORS middleware.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (adjust in production).
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------
# Database Table Creation
# -------------------------------
# Drop all tables and recreate them on startup (remove drop_all in production).
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

# -------------------------------
# Dummy Login Model and Endpoint
# -------------------------------
class LoginRequest(BaseModel):
    username: str
    password: str

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
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------------------------------
# CSV Data Loading Function
# -------------------------------
def load_csv_data(db: Session):
    # Load venues.
    venues_file = os.path.join(os.path.dirname(__file__), "data", "venues.csv")
    with open(venues_file, newline="", encoding="utf-8") as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            venue = Venue(id=int(row["venue_id"]), name=row["venue_name"])
            db.add(venue)
    db.commit()

    # Load games.
    games_file = os.path.join(os.path.dirname(__file__), "data", "games.csv")
    with open(games_file, newline="", encoding="utf-8") as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            game_date = datetime.datetime.strptime(row["date"], "%Y-%m-%d").date()
            game = Game(
                home_team=row["home_team"],
                away_team=row["away_team"],
                date=game_date,
                venue_id=int(row["venue_id"]),
            )
            db.add(game)
    db.commit()

    # Load simulations.
    simulations_file = os.path.join(os.path.dirname(__file__), "data", "simulations.csv")
    with open(simulations_file, newline="", encoding="utf-8") as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
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

# -------------------------------
# Startup Event: Load CSV Data
# -------------------------------
@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    load_csv_data(db)
    db.close()

# -------------------------------
# API Endpoints
# -------------------------------

@app.get("/games")
def get_games(db: Session = Depends(get_db)):
    games = db.query(Game).all()
    results = []
    seen_matches = set()
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
    
    home_sims = db.query(Simulation).filter(
        Simulation.game_id == game.id,
        Simulation.team == game.home_team
    ).all()
    away_sims = db.query(Simulation).filter(
        Simulation.game_id == game.id,
        Simulation.team == game.away_team
    ).all()

    home_dict = {sim.simulation_run: sim.results for sim in home_sims}
    away_dict = {sim.simulation_run: sim.results for sim in away_sims}
    common_runs = sorted(set(home_dict.keys()).intersection(away_dict.keys()))
    home_scores = [home_dict[run] for run in common_runs]
    away_scores = [away_dict[run] for run in common_runs]
    wins = sum(1 for run in common_runs if home_dict[run] > away_dict[run])
    win_percentage = (wins / len(common_runs) * 100) if common_runs else 0

    return {
        "id": game.id,
        "home_team": game.home_team,
        "away_team": game.away_team,
        "date": game.date.strftime("%Y-%m-%d") if game.date else None,
        "venue": game.venue.name if game.venue else None,
        "simulation_runs": common_runs,
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
    query = db.query(Game)
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
    if venue:
        query = query.join(Venue).filter(Venue.name.ilike(f"%{venue}%"))
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

# -------------------------------
# ML Endpoint: Simulation Run Clustering for a Selected Game
# -------------------------------
@app.get("/analytics/game/{game_id}/simulations")
def get_simulation_clusters(game_id: int, db: Session = Depends(get_db)):
    """
    Cluster simulation runs for a specific game based on performance.
    
    Retrieves the game by its ID, clusters its simulation runs using KMeans,
    and returns a dictionary mapping simulation run numbers to cluster labels.
    
    Args:
        game_id (int): The ID of the game to analyze.
    
    Returns:
        dict: A mapping from simulation run numbers to cluster labels.
    """
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    clusters = cluster_simulation_runs(game, db, n_clusters=3)
    return clusters
