/**
 * App Component
 *
 * This is the main entry point for the Cricket Simulation Dashboard React application.
 * It manages the overall application state including:
 *   - User authentication (dummy login).
 *   - Fetching the list of games from the backend.
 *   - Storing and rendering details for the selected game.
 *
 * The component conditionally renders the Login screen or the main dashboard (GameSelector and EnhancedChart)
 * based on the user's authentication state.
 *
 * Key Components:
 *   - Login: Renders the login form and handles user authentication.
 *   - GameSelector: Allows the user to select a game from the fetched list.
 *   - EnhancedChart: Displays detailed simulation results for the selected game.
 */

import React, { useEffect, useState } from "react";
import GameSelector from "./components/GameSelector";
import EnhancedChart from "./components/EnhancedChart";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import Login from "./components/Login";

function App() {
  // State to track if the user is logged in.
  const [loggedIn, setLoggedIn] = useState(false);
  // State to store the list of games fetched from the backend.
  const [games, setGames] = useState([]);
  // State to store the details of the game selected by the user.
  const [selectedGame, setSelectedGame] = useState(null);

  /**
   * useEffect Hook:
   * When the 'loggedIn' state becomes true, fetch the list of games from the backend API.
   * The fetched data is stored in the 'games' state.
   */
  useEffect(() => {
    if (loggedIn) {
      fetch("http://localhost:8000/games")
        .then((res) => res.json())
        .then((data) => setGames(data))
        .catch((err) => console.error("Error fetching games:", err));
    }
  }, [loggedIn]);

  /**
   * handleGameSelect:
   * Fetches detailed simulation data for a specific game by its ID.
   * The details are stored in the 'selectedGame' state.
   *
   * @param {number} gameId - The ID of the game to fetch details for.
   */
  const handleGameSelect = (gameId) => {
    fetch(`http://localhost:8000/games/${gameId}`)
      .then((res) => res.json())
      .then((data) => setSelectedGame(data))
      .catch((err) => console.error("Error fetching game details:", err));
  };

  /**
   * handleLoginSuccess:
   * Called when the Login component successfully logs in the user.
   * Sets the 'loggedIn' state to true, triggering the fetching of games.
   */
  const handleLoginSuccess = () => {
    setLoggedIn(true);
  };

  // If the user is not logged in, render the Login component.
  if (!loggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      <nav className="navbar fixed-navbar">
        <h1>🏏 Cricket Simulation Dashboard</h1>
      </nav>
      <main className="main-content">
        <GameSelector games={games} onSearch={handleGameSelect} />
        {selectedGame ? (
          <>
            <EnhancedChart game={selectedGame} />
            {/* Render the analytics dashboard below the chart */}
            <AnalyticsDashboard gameId={selectedGame.id} />
          </>
        ) : (
          <p className="text-center text-gray-400 mt-4">
            Please select a game to view simulation details.
          </p>
        )}
      </main>
    </div>
  );
}

export default App;
