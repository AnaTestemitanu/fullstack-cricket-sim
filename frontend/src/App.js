import React, { useEffect, useState } from "react";
import GameSelector from "./components/GameSelector";
import EnhancedChart from "./components/EnhancedChart";
import Login from "./components/Login";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);

  useEffect(() => {
    if (loggedIn) {
      fetch("http://localhost:8000/games")
        .then((res) => res.json())
        .then((data) => setGames(data))
        .catch((err) => console.error("Error fetching games:", err));
    }
  }, [loggedIn]);

  const handleGameSelect = (gameId) => {
    fetch(`http://localhost:8000/games/${gameId}`)
      .then((res) => res.json())
      .then((data) => setSelectedGame(data))
      .catch((err) => console.error("Error fetching game details:", err));
  };

  const handleLoginSuccess = () => {
    setLoggedIn(true);
  };

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
          <EnhancedChart game={selectedGame} />
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
