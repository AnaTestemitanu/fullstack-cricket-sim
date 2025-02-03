import sys
sys.path.append("/app")  # Ensure /app is in the Python module search path

import os
import csv
import pytest
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import text  # Wrap raw SQL statements
from database import SessionLocal, engine, Base
from models import Game, Simulation, Venue
from main import get_game_details, app  # Import the FastAPI app for endpoint testing
from fastapi.testclient import TestClient

# Create a TestClient instance for API testing.
client = TestClient(app)

# Create tables before running the tests.
Base.metadata.create_all(bind=engine)

def populate_test_data(db: Session):
    """Populate the database with test data from CSV files.
    
    This function first clears the tables to avoid duplicate records,
    then loads venues and games from CSV, and finally assigns simulation data
    to every game for both the home and away teams.
    """
    # Clear existing data from the tables.
    db.execute(text("DELETE FROM simulations"))
    db.execute(text("DELETE FROM games"))
    db.execute(text("DELETE FROM venues"))
    db.commit()  # Commit the deletion.

    # --------------------------
    # Load venues.
    # --------------------------
    with open("/app/data/venues.csv", newline='', encoding="utf-8-sig") as csvfile:
        reader = csv.DictReader(csvfile)  # Using the default comma delimiter.
        # Strip extra whitespace from fieldnames.
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
    # Load games.
    # --------------------------
    with open("/app/data/games.csv", newline='', encoding="utf-8-sig") as csvfile:
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
    # Load simulations and assign to each game.
    # --------------------------
    # Read simulation data once from the CSV.
    with open("/app/data/simulations.csv", newline='', encoding="utf-8-sig") as csvfile:
        reader = csv.DictReader(csvfile)
        reader.fieldnames = [field.strip() for field in reader.fieldnames]
        simulation_rows = list(reader)
    
    # For each game, create simulation records for both the home and away teams.
    games = db.query(Game).all()
    if not games:
        raise Exception("No game found to attach simulations to.")

    for game in games:
        for row in simulation_rows:
            # Create simulation record for the home team.
            sim_home = Simulation(
                game_id=game.id,
                team_id=int(row["team_id"].strip()),
                team=game.home_team,  # Use the game's home team.
                simulation_run=int(row["simulation_run"].strip()),
                results=int(row["results"].strip())
            )
            db.add(sim_home)
            # Create simulation record for the away team.
            sim_away = Simulation(
                game_id=game.id,
                team_id=int(row["team_id"].strip()),
                team=game.away_team,  # Use the game's away team.
                simulation_run=int(row["simulation_run"].strip()),
                results=int(row["results"].strip())
            )
            db.add(sim_away)
    db.commit()


@pytest.fixture(scope="function")
def db_session():
    """
    Provides a fresh database session for each test.
    Rolls back any changes and closes the session after each test.
    """
    db = SessionLocal()
    try:
        populate_test_data(db)
        yield db
    finally:
        db.rollback()
        db.close()


def test_game_loading(db_session: Session):
    """Test if the database correctly loads games."""
    games = db_session.query(Game).all()
    assert games, "❌ No games found in the database. Check data loading."


def test_simulation_loading(db_session: Session):
    """Test if the database correctly loads simulations."""
    simulations = db_session.query(Simulation).all()
    assert simulations, "❌ No simulations found in the database. Check data loading."


def test_game_exists(db_session: Session):
    """Test if at least one game exists in the database."""
    game = db_session.query(Game).first()
    assert game, "❌ No game found in the database. Check database initialization."


def test_simulation_data(db_session: Session):
    """Test if simulation data exists for a team."""
    simulation = db_session.query(Simulation).first()
    assert simulation, "❌ No simulation data found. Check data ingestion."


def test_game_details_endpoint(db_session: Session):
    """Test if the game details endpoint returns correct data."""
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
    """Test if the win percentage is calculated correctly."""
    game = db_session.query(Game).first()
    if game:
        response = get_game_details(game.id, db_session)
        win_percentage = response.get("home_win_percentage", None)
        assert win_percentage is not None, "❌ Win percentage not calculated."
        assert 0 <= win_percentage <= 100, f"❌ Win percentage {win_percentage} is out of bounds."
    else:
        pytest.skip("⚠️ No games available to test win percentage.")


def test_simulation_relationship(db_session: Session):
    """Test that each game has associated simulation records."""
    games = db_session.query(Game).all()
    for game in games:
        assert game.simulations, f"Game id {game.id} has no associated simulations."


def test_api_get_game_valid():
    """Test API endpoint for valid game retrieval using FastAPI TestClient."""
    # First, ensure the in-memory database is populated.
    db = SessionLocal()
    try:
        populate_test_data(db)
    finally:
        db.close()

    response = client.get("/games/1")  # Adjust the endpoint as needed.
    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
    data = response.json()
    assert "home_team" in data, "Response does not contain home_team"
    assert "away_team" in data, "Response does not contain away_team"
    assert "home_win_percentage" in data, "Response does not contain home_win_percentage"


def test_api_get_game_invalid():
    """Test API endpoint for an invalid game ID returns 404."""
    response = client.get("/games/9999")  # Assuming game 9999 does not exist.
    assert response.status_code == 404, f"Expected status code 404, got {response.status_code}"
