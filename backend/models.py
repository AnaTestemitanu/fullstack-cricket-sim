from sqlalchemy import Column, Integer, String, ForeignKey, Date
from sqlalchemy.orm import relationship
from database import Base

class Venue(Base):
    __tablename__ = "venues"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    games = relationship("Game", back_populates="venue")

class Game(Base):
    __tablename__ = "games"
    id = Column(Integer, primary_key=True, index=True)
    home_team = Column(String)
    away_team = Column(String)
    date = Column(Date)
    venue_id = Column(Integer, ForeignKey("venues.id"))
    venue = relationship("Venue", back_populates="games")
    simulations = relationship("Simulation", back_populates="game")

class Simulation(Base):
    __tablename__ = "simulations"
    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(Integer, ForeignKey("games.id"))
    team_id = Column(Integer)
    team = Column(String)
    simulation_run = Column(Integer)
    results = Column(Integer)
    game = relationship("Game", back_populates="simulations")
