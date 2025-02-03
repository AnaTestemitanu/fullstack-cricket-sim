// As an idea for filtering by date, venue and team
import React, { useState } from "react";

const GameFilter = ({ onFilter }) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [venue, setVenue] = useState("");
  const [team, setTeam] = useState("");

  const handleFilter = () => {
    // Pass filter parameters back to the parent
    onFilter({ startDate, endDate, venue, team });
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-4 border rounded shadow">
      <h2 className="text-xl font-bold">Filter Games</h2>
      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        placeholder="Start Date"
        className="input input-bordered w-64"
      />
      <input
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        placeholder="End Date"
        className="input input-bordered w-64"
      />
      <input
        type="text"
        value={venue}
        onChange={(e) => setVenue(e.target.value)}
        placeholder="Venue"
        className="input input-bordered w-64"
      />
      <input
        type="text"
        value={team}
        onChange={(e) => setTeam(e.target.value)}
        placeholder="Team"
        className="input input-bordered w-64"
      />
      <button className="btn btn-primary" onClick={handleFilter}>
        Filter Games
      </button>
    </div>
  );
};

export default GameFilter;
