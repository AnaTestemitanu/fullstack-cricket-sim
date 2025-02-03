/**
 * GameSelector Component
 *
 * This component provides a UI for selecting a game based on filtering criteria:
 *   - Home team
 *   - Away team (dependent on selected home team)
 *   - Venue (dependent on selected home and away teams)
 *   - Date (dependent on the above selections)
 *
 * When all fields are selected, clicking the "Go" button calls the provided `onSearch`
 * callback with the matching game's ID.
 *
 * Props:
 *   - games: An array of game objects containing fields such as home_team, away_team,
 *            venue, and date.
 *   - onSearch: A callback function to be called with the selected game’s ID.
 */

import React, { useState, useEffect } from "react";

const GameSelector = ({ games = [], onSearch }) => {
  // State for selected home team.
  const [homeTeam, setHomeTeam] = useState("");
  // State for selected away team.
  const [awayTeam, setAwayTeam] = useState("");
  // State for selected venue.
  const [venue, setVenue] = useState("");
  // State for available dates based on the filtered games.
  const [dates, setDates] = useState([]);
  // State for the selected date.
  const [selectedDate, setSelectedDate] = useState("");

  /**
   * useEffect Hook:
   * This hook updates the available dates when the home team, away team, venue, or
   * games array changes. It filters the games matching the selected criteria and
   * extracts the dates.
   */
  useEffect(() => {
    if (homeTeam && awayTeam && venue) {
      // Filter games that match the selected home team, away team, and venue.
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
      // If any of the required fields are missing, clear the available dates.
      setDates([]);
    }
    // Reset the selected date whenever any filter criteria change.
    setSelectedDate("");
  }, [homeTeam, awayTeam, venue, games]);

  /**
   * handleSearch:
   * Called when the user clicks the "Go" button.
   * It finds a game matching all selected criteria and, if found, calls the onSearch
   * callback with the game’s ID.
   */
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
      {/* Dropdown for selecting the Home Team */}
      <select
        className="dropdown"
        value={homeTeam}
        onChange={(e) => setHomeTeam(e.target.value)}
      >
        <option value="">Select Home Team</option>
        {/* Create unique options for home teams */}
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

      {/* Dropdown for selecting the Away Team */}
      <select
        className="dropdown"
        value={awayTeam}
        onChange={(e) => setAwayTeam(e.target.value)}
        disabled={!homeTeam}  // Enable only after a home team is selected.
      >
        <option value="">Select Away Team</option>
        {/* Filter games to get away teams based on the selected home team */}
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

      {/* Dropdown for selecting the Venue */}
      <select
        className="dropdown"
        value={venue}
        onChange={(e) => setVenue(e.target.value)}
        disabled={!awayTeam}  // Enable only after an away team is selected.
      >
        <option value="">Select Venue</option>
        {/* Filter games to get venues based on selected home and away teams */}
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

      {/* Dropdown for selecting the Date */}
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

      {/* "Go" button to trigger the search for a matching game */}
      <button className="btn btn-primary" onClick={handleSearch}>
        Go
      </button>
    </div>
  );
};

export default GameSelector;
