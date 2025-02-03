"""
This module contains functions to compute performance features for games
and to cluster simulation runs for a specific game using KMeans from scikit-learn.

For simulation run clustering, each simulation run is represented by a feature vector:
  [home_score, away_score, score_difference]
where score_difference = home_score - away_score.

This enables ML analytics to be performed on the simulations for the picked game only.
"""

import numpy as np
from sklearn.cluster import KMeans
from sqlalchemy.orm import Session
from models import Game, Simulation

def compute_game_features(game, db: Session):
    """
    Compute performance features for a game using its simulation data.
    
    For each game, this function calculates:
      - The average score of the home team.
      - The average score of the away team.
      - The home win percentage based on the simulation results.
    
    These features form a numerical vector that will be used to cluster games.
    
    Args:
        game (Game): A game instance.
        db (Session): A database session.
    
    Returns:
        list or None: A feature vector in the form [avg_home, avg_away, win_percentage],
                      or None if there is insufficient data.
    """
    # Retrieve simulation records for the home team.
    home_sims = db.query(Simulation).filter(
        Simulation.game_id == game.id,
        Simulation.team == game.home_team
    ).all()
    # Retrieve simulation records for the away team.
    away_sims = db.query(Simulation).filter(
        Simulation.game_id == game.id,
        Simulation.team == game.away_team
    ).all()
    
    # If simulation data is missing for either team, return None.
    if not home_sims or not away_sims:
        return None

    # Map simulation run numbers to scores.
    home_scores = {sim.simulation_run: sim.results for sim in home_sims}
    away_scores = {sim.simulation_run: sim.results for sim in away_sims}
    
    # Identify common simulation runs available for both teams.
    common_runs = sorted(set(home_scores.keys()).intersection(away_scores.keys()))
    if not common_runs:
        return None

    # Calculate average scores and the home win percentage.
    avg_home = np.mean([home_scores[run] for run in common_runs])
    avg_away = np.mean([away_scores[run] for run in common_runs])
    wins = sum(1 for run in common_runs if home_scores[run] > away_scores[run])
    win_percentage = wins / len(common_runs) if common_runs else 0

    return [avg_home, avg_away, win_percentage]

def cluster_simulation_runs(game: Game, db: Session, n_clusters=3):
    """
    Cluster simulation runs for a specific game using KMeans.
    
    For the given game, this function:
      1. Retrieves simulation records for both the home and away teams.
      2. Identifies common simulation runs (each run should have records for both teams).
      3. For each common run, computes a feature vector comprising:
           [average_score, score_difference]
         where:
           - average_score = (home_score + away_score) / 2
           - score_difference = home_score - away_score
      4. Scales the feature vectors so that each feature contributes equally.
      5. Applies KMeans clustering to group these simulation runs.
      6. Returns a dictionary mapping each simulation run number to its cluster label.
    
    Args:
        game (Game): The game for which to cluster simulation runs.
        db (Session): A database session.
        n_clusters (int): The number of clusters to form.
    
    Returns:
        dict: A mapping from simulation run numbers to cluster labels, e.g., {1: 0, 2: 2, ...}.
    """
    # Retrieve simulation records for the selected game for both teams.
    home_sims = db.query(Simulation).filter(
        Simulation.game_id == game.id,
        Simulation.team == game.home_team
    ).all()
    away_sims = db.query(Simulation).filter(
        Simulation.game_id == game.id,
        Simulation.team == game.away_team
    ).all()

    # Build dictionaries mapping simulation run numbers to scores.
    home_scores = {sim.simulation_run: sim.results for sim in home_sims}
    away_scores = {sim.simulation_run: sim.results for sim in away_sims}

    # Identify common simulation runs available for both teams.
    common_runs = sorted(set(home_scores.keys()).intersection(away_scores.keys()))
    if not common_runs:
        return {}

    # Create a feature vector for each simulation run:
    # We now use [average_score, score_difference] to better align with the chart.
    features = []
    run_numbers = []
    for run in common_runs:
        home_score = home_scores[run]
        away_score = away_scores[run]
        avg_score = (home_score + away_score) / 2  # Average score
        diff = home_score - away_score             # Score difference
        features.append([avg_score, diff])
        run_numbers.append(run)

    # Scale the feature vectors to have zero mean and unit variance.
    from sklearn.preprocessing import StandardScaler
    scaler = StandardScaler()
    features_scaled = scaler.fit_transform(features)

    # Apply KMeans clustering on the scaled features.
    kmeans = KMeans(n_clusters=n_clusters, random_state=42)
    labels = kmeans.fit_predict(features_scaled)
    labels = [int(label) for label in labels]

    # Return a mapping from simulation run numbers to cluster labels.
    return dict(zip(run_numbers, labels))
