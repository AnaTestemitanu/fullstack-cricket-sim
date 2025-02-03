import React, { useState, useEffect } from "react";

const GameSelector = ({ games = [], onSearch }) => {
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [venue, setVenue] = useState("");
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    // Update the available dates based on selected team and venue
    if (homeTeam && awayTeam && venue) {
      const matchingDates = games
        .filter(
          (game) =>
            game.home_team === homeTeam &&
            game.away_team === awayTeam &&
            game.venue === venue
        )
        .map((game) => game.date);
      setDates(matchingDates);
    } else {
      setDates([]);
    }
    setSelectedDate("");
  }, [homeTeam, awayTeam, venue, games]);

  const handleSearch = () => {
    if (homeTeam && awayTeam && venue && selectedDate) {
      const matchingGame = games.find(
        (game) =>
          game.home_team === homeTeam &&
          game.away_team === awayTeam &&
          game.venue === venue &&
          game.date === selectedDate
      );
      if (matchingGame) {
        onSearch(matchingGame.id);
      } else {
        alert("No matching game found");
      }
    } else {
      alert("Please select all fields");
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <select
        className="dropdown"
        value={homeTeam}
        onChange={(e) => setHomeTeam(e.target.value)}
      >
        <option value="">Select Home Team</option>
        {games.length > 0 ? (
          [...new Set(games.map((game) => game.home_team))].map((team) => (
            <option key={team} value={team}>
              {team}
            </option>
          ))
        ) : (
          <option value="" disabled>No Teams Available</option>
        )}
      </select>

      <select
        className="dropdown"
        value={awayTeam}
        onChange={(e) => setAwayTeam(e.target.value)}
        disabled={!homeTeam}
      >
        <option value="">Select Away Team</option>
        {[...new Set(
          games
            .filter((game) => game.home_team === homeTeam)
            .map((game) => game.away_team)
        )].map((team) => (
          <option key={team} value={team}>
            {team}
          </option>
        ))}
      </select>

      <select
        className="dropdown"
        value={venue}
        onChange={(e) => setVenue(e.target.value)}
        disabled={!awayTeam}
      >
        <option value="">Select Venue</option>
        {[...new Set(
          games
            .filter(
              (game) =>
                game.home_team === homeTeam && game.away_team === awayTeam
            )
            .map((game) => game.venue)
        )].map((venue) => (
          <option key={venue} value={venue}>
            {venue}
          </option>
        ))}
      </select>

      {dates.length > 0 && (
        <select
          className="dropdown"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        >
          <option value="">Select Date</option>
          {dates.map((date) => (
            <option key={date} value={date}>
              {date}
            </option>
          ))}
        </select>
      )}

      <button className="btn btn-primary" onClick={handleSearch}>
        Go
      </button>
    </div>
  );
};

export default GameSelector;
