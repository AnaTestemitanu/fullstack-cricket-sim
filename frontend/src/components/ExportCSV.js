// src/components/ExportCSV.js
import React from 'react';
import { CSVLink } from 'react-csv';

const ExportCSV = ({ game }) => {
  // Define headers for CSV export
  const headers = [
    { label: "Simulation Run", key: "sim" },
    { label: "Home Score", key: "home" },
    { label: "Away Score", key: "away" },
  ];

  // Prepare data: assume game.simulation_runs, game.home_scores, and game.away_scores are arrays.
  const data = game.simulation_runs.map((sim, index) => ({
    sim: sim,
    home: game.home_scores[index],
    away: game.away_scores[index],
  }));

  return (
    <CSVLink data={data} headers={headers} filename="simulation_results.csv">
      <button className="px-4 py-2 bg-green-500 text-white font-bold rounded hover:bg-green-600 transition-colors">
        Export CSV
      </button>
    </CSVLink>
  );
};

export default ExportCSV;
