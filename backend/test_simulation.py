"""
This module contains tests for the Cricket Simulation Dashboard backend.
It uses pytest and FastAPI's TestClient to verify:
  - Data loading from CSV files into the database.
  - The correctness of game and simulation data.
  - API endpoint responses, including game details and filtering.
  
To run the tests, execute:
    pytest -v backend/test_simulation.py
"""

import sys
# Ensure /app is in the Python module search path so that imports work correctly in the container.
sys.path.append("/app")

import os
import csv
import pytest
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import text  # Used to execute raw SQL statements for data cleanup
from database import SessionLocal, engine, Base
from models import Game, Simulation, Venue
from main import get_game_details, app  # Import the FastAPI app and utility function for endpoint testing
from fastapi.testclient import TestClient

# Create a TestClient instance for API endpoint testing.
client = TestClient(app)

# Create database tables before running the tests.
# This ensures that the database schema is available for each test run.
Base.metadata.create_all(bind=engine)

def populate_test_data(db: Session):
    """
    Populates the database with test data from CSV files.
    
    Steps:
      1. Clears existing data from 'simulations', 'games', and 'venues' tables.
      2. Loads venues from 'venues.csv'.
      3. Loads games from 'games.csv'.
      4. Loads simulation data from 'simulations.csv' and attaches simulations to each game.
      
    The CSV files are expected to be in a 'data' directory located alongside this test file.
    """
    # Clear existing data to ensure a fresh state.
    db.execute(text("DELETE FROM simulations"))
    db.execute(text("DELETE FROM games"))
    db.execute(text("DELETE FROM venues"))
    db.commit()

    # Determine the base directory relative to this test file.
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(base_dir, "data")  # Adjust if your CSV files are elsewhere

    # --------------------------
    # Load Venues from CSV
    # --------------------------
    venues_csv = os.path.join(data_dir, "venues.csv")
    with open(venues_csv, newline='', encoding="utf-8-sig") as csvfile:
        reader = csv.DictReader(csvfile)
        # Strip any extraneous whitespace from field names.
        reader.fieldnames = [field.strip() for field in reader.fieldnames]
        print("DEBUG: venues.csv fieldnames =", reader.fieldnames)
        for row in reader:
            print("DEBUG: row =", row)
            venue = Venue(
                id=int(row["venue_id"].strip()),
                name=row["venue_name"].strip()
            )
            db.add(venue)
    db.commit()

    # --------------------------
    # Load Games from CSV
    # --------------------------
    games_csv = os.path.join(data_dir, "games.csv")
    with open(games_csv, newline='', encoding="utf-8-sig") as csvfile:
        reader = csv.DictReader(csvfile)
        reader.fieldnames = [field.strip() for field in reader.fieldnames]
        for row in reader:
            game_date = datetime.strptime(row["date"].strip(), "%Y-%m-%d").date()
            game = Game(
                home_team=row["home_team"].strip(),
                away_team=row["away_team"].strip(),
                date=game_date,
                venue_id=int(row["venue_id"].strip())
            )
            db.add(game)
    db.commit()

    # --------------------------
    # Load Simulations from CSV
    # --------------------------
    simulations_csv = os.path.join(data_dir, "simulations.csv")
    with open(simulations_csv, newline='', encoding="utf-8-sig") as csvfile:
        reader = csv.DictReader(csvfile)
        reader.fieldnames = [field.strip() for field in reader.fieldnames]
        simulation_rows = list(reader)
    
    # For each game, create simulation records for both the home and away teams.
    games = db.query(Game).all()
    if not games:
        raise Exception("No game found to attach simulations to.")

    for game in games:
        for row in simulation_rows:
            # Create a simulation record for the home team.
            sim_home = Simulation(
                game_id=game.id,
                team_id=int(row["team_id"].strip()),
                team=game.home_team,  # Assign the game's home team.
                simulation_run=int(row["simulation_run"].strip()),
                results=int(row["results"].strip())
            )
            db.add(sim_home)
            # Create a simulation record for the away team.
            sim_away = Simulation(
                game_id=game.id,
                team_id=int(row["team_id"].strip()),
                team=game.away_team,  # Assign the game's away team.
                simulation_run=int(row["simulation_run"].strip()),
                results=int(row["results"].strip())
            )
            db.add(sim_away)
    db.commit()

# -------------------------------
# Pytest Fixtures
# -------------------------------

@pytest.fixture(scope="function")
def db_session():
    """
    Provides a fresh database session for each test function.
    
    The fixture:
      - Populates the database with test data using 'populate_test_data'.
      - Yields a session object for use in tests.
      - Rolls back any changes and closes the session after the test.
    """
    db = SessionLocal()
    try:
        populate_test_data(db)
        yield db
    finally:
        db.rollback()
        db.close()

# -------------------------------
# Test Functions
# -------------------------------

def test_game_loading(db_session: Session):
    """
    Test that games are correctly loaded into the database.
    Asserts that at least one game exists.
    """
    games = db_session.query(Game).all()
    assert games, "❌ No games found in the database. Check data loading."

def test_simulation_loading(db_session: Session):
    """
    Test that simulation records are loaded into the database.
    Asserts that at least one simulation record exists.
    """
    simulations = db_session.query(Simulation).all()
    assert simulations, "❌ No simulations found in the database. Check data loading."

def test_game_exists(db_session: Session):
    """
    Test that there is at least one game in the database.
    """
    game = db_session.query(Game).first()
    assert game, "❌ No game found in the database. Check database initialization."

def test_simulation_data(db_session: Session):
    """
    Test that simulation data exists for a team.
    """
    simulation = db_session.query(Simulation).first()
    assert simulation, "❌ No simulation data found. Check data ingestion."

def test_game_details_endpoint(db_session: Session):
    """
    Test the /games/{game_id} endpoint to ensure it returns the expected game details.
    Checks for the presence of key fields in the response.
    """
    game = db_session.query(Game).first()
    if game:
        response = get_game_details(game.id, db_session)
        assert response, "❌ API did not return a response."
        assert "home_team" in response, "❌ Game details must include home team."
        assert "away_team" in response, "❌ Game details must include away team."
        assert "home_win_percentage" in response, "❌ Game details must include home win percentage."
    else:
        pytest.skip("⚠️ No games available in the test database.")

def test_win_percentage(db_session: Session):
    """
    Test that the win percentage for the home team is calculated correctly.
    Verifies that the percentage is a valid number between 0 and 100.
    """
    game = db_session.query(Game).first()
    if game:
        response = get_game_details(game.id, db_session)
        win_percentage = response.get("home_win_percentage", None)
        assert win_percentage is not None, "❌ Win percentage not calculated."
        assert 0 <= win_percentage <= 100, f"❌ Win percentage {win_percentage} is out of bounds."
    else:
        pytest.skip("⚠️ No games available to test win percentage.")

def test_simulation_relationship(db_session: Session):
    """
    Test that each game has associated simulation records.
    """
    games = db_session.query(Game).all()
    for game in games:
        assert game.simulations, f"Game id {game.id} has no associated simulations."

def test_api_get_game_valid():
    """
    Test the API endpoint /games/{game_id} for a valid game.
    Uses the TestClient to simulate a GET request and checks the response structure.
    """
    # Populate the in-memory database with test data.
    db = SessionLocal()
    try:
        populate_test_data(db)
    finally:
        db.close()

    response = client.get("/games/1")  # Adjust the endpoint if needed.
    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
    data = response.json()
    assert "home_team" in data, "Response does not contain home_team"
    assert "away_team" in data, "Response does not contain away_team"
    assert "home_win_percentage" in data, "Response does not contain home_win_percentage"

def test_api_get_game_invalid():
    """
    Test the API endpoint /games/{game_id} for an invalid game ID.
    Expects a 404 response status code.
    """
    response = client.get("/games/9999")  # Assuming game 9999 does not exist.
    assert response.status_code == 404, f"Expected status code 404, got {response.status_code}"
