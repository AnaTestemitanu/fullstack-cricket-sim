import React, { useEffect, useState } from "react";
import GameSelector from "./components/GameSelector";
import GameDetails from "./components/GameDetails";
// import GameFilter from "./components/GameFilter";



function App() {
  const [games, setGames] = useState([]);
  const [gameDetails, setGameDetails] = useState(null);

  useEffect(() => {
    fetch("http://localhost:8000/games")
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched games:", data); // Debugging
        if (Array.isArray(data)) {
          setGames(data);
        } else {
          console.error("Unexpected data format:", data);
          setGames([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching games:", err);
        setGames([]);
      });
  }, []);
  

  const handleGameSelect = (gameId) => {
    fetch(`http://localhost:8000/games/${gameId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch game details");
        }
        return res.json();
      })
      .then((data) => setGameDetails(data))
      .catch((err) => console.error("Error fetching game details:", err));
  };


  // Add Filtering Options (as an idea )
  // const handleFilter = ({ startDate, endDate, venue, team }) => {
  //   // Build query string based on filter parameters.
  //   const params = new URLSearchParams();
  //   if (startDate) params.append("start_date", startDate);
  //   if (endDate) params.append("end_date", endDate);
  //   if (venue) params.append("venue", venue);
  //   if (team) params.append("team", team);

  //   fetch(`http://localhost:8000/games/filter?${params.toString()}`)
  //     .then((res) => {
  //       if (!res.ok) {
  //         throw new Error("Filtering failed");
  //       }
  //       return res.json();
  //     })
  //     .then((data) => {
  //       setGames(data);
  //       setGameDetails(null); // Clear any selected game
  //     })
  //     .catch((err) => console.error(err));
  // };

  return (
    <div className="app-container">
      {/* Fixed Header */}
      <nav className="navbar fixed-navbar">
        <h1>🏏 Cricket Simulation Dashboard</h1>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {/* <GameFilter onFilter={handleFilter} /> */}
        <GameSelector games={games} onSearch={handleGameSelect} />
        {gameDetails && <GameDetails game={gameDetails} />}
      </main>
    </div>
  );
}

export default App;
