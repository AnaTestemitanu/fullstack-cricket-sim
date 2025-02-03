"""
This module defines the database models for the Cricket Simulation Dashboard using SQLAlchemy's ORM.
It includes the models for:
  - Venue: Represents a cricket ground.
  - Game: Represents a match between two teams.
  - Simulation: Represents a simulation run for a game and a specific team.
"""

from sqlalchemy import Column, Integer, String, ForeignKey, Date
from sqlalchemy.orm import relationship
from database import Base

class Venue(Base):
    """
    Venue model represents a cricket ground where games are played.

    Attributes:
        id (int): Primary key and unique identifier for the venue.
        name (str): Name of the venue.
        games (List[Game]): One-to-many relationship to the Game model.
    """
    __tablename__ = "venues"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    
    # Relationship: A venue can host multiple games.
    games = relationship("Game", back_populates="venue")

class Game(Base):
    """
    Game model represents a cricket match between two teams.

    Attributes:
        id (int): Primary key and unique identifier for the game.
        home_team (str): Name of the home team.
        away_team (str): Name of the away team.
        date (date): Date when the game is played.
        venue_id (int): Foreign key linking to the Venue model.
        venue (Venue): The venue where the game is played.
        simulations (List[Simulation]): One-to-many relationship to simulation runs for this game.
    """
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    home_team = Column(String)
    away_team = Column(String)
    date = Column(Date)
    venue_id = Column(Integer, ForeignKey("venues.id"))

    # Relationship: Each game is played at one venue.
    venue = relationship("Venue", back_populates="games")
    
    # Relationship: A game can have multiple simulation runs.
    simulations = relationship("Simulation", back_populates="game")

class Simulation(Base):
    """
    Simulation model represents a simulation run of a game for a specific team.

    Attributes:
        id (int): Primary key and unique identifier for the simulation record.
        game_id (int): Foreign key linking to the Game model.
        team_id (int): An identifier for the team (if available for further extension).
        team (str): Name of the team for which the simulation was run.
        simulation_run (int): The simulation run number (e.g., 1, 2, 3, ...).
        results (int): The simulation result or score.
        game (Game): The game associated with this simulation run.
    """
    __tablename__ = "simulations"

    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(Integer, ForeignKey("games.id"))
    team_id = Column(Integer)
    team = Column(String)
    simulation_run = Column(Integer)
    results = Column(Integer)

    # Relationship: Each simulation record is linked to one game.
    game = relationship("Game", back_populates="simulations")
