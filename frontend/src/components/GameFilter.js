/**
 * GameFilter Component
 *
 * This component provides a simple UI for filtering games based on
 * date range, venue, and team name. It is currently a basic implementation,
 * intended as an idea for further expansion.
 *
 * Props:
 *   - onFilter: A callback function provided by the parent component.
 *               When the user clicks the "Filter Games" button, the filter
 *               parameters are passed to this function.
 */

import React, { useState } from "react";

const GameFilter = ({ onFilter }) => {
  // State variables for each filter input:
  // startDate: Filter games starting from this date.
  // endDate: Filter games ending on this date.
  // venue: Filter games by a substring of the venue name.
  // team: Filter games by a substring matching either the home or away team.
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [venue, setVenue] = useState("");
  const [team, setTeam] = useState("");

  /**
   * handleFilter - Called when the user clicks the "Filter Games" button.
   * It collects the current filter parameters and passes them to the onFilter callback.
   */
  const handleFilter = () => {
    // Pass the filter parameters to the parent component.
    onFilter({ startDate, endDate, venue, team });
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-4 border rounded shadow">
      <h2 className="text-xl font-bold">Filter Games</h2>
      {/* Input for selecting the start date */}
      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        placeholder="Start Date"
        className="input input-bordered w-64"
      />
      {/* Input for selecting the end date */}
      <input
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        placeholder="End Date"
        className="input input-bordered w-64"
      />
      {/* Input for filtering by venue name */}
      <input
        type="text"
        value={venue}
        onChange={(e) => setVenue(e.target.value)}
        placeholder="Venue"
        className="input input-bordered w-64"
      />
      {/* Input for filtering by team name */}
      <input
        type="text"
        value={team}
        onChange={(e) => setTeam(e.target.value)}
        placeholder="Team"
        className="input input-bordered w-64"
      />
      {/* Button to trigger filtering; calls handleFilter when clicked */}
      <button className="btn btn-primary" onClick={handleFilter}>
        Filter Games
      </button>
    </div>
  );
};

export default GameFilter;
