/**
 * ExportCSV Component
 *
 * This component exports simulation data for a given game to a CSV file.
 * It uses the `react-csv` library's CSVLink component to generate and download the CSV.
 *
 * Props:
 *  - game: An object containing simulation data. It is expected to have the following arrays:
 *      - simulation_runs: An array of simulation run identifiers.
 *      - home_scores: An array of scores for the home team.
 *      - away_scores: An array of scores for the away team.
 */

import React from 'react';
import { CSVLink } from 'react-csv';

const ExportCSV = ({ game }) => {
  // Define the CSV headers.
  // Each header object contains a label (for display) and a key (to extract corresponding data).
  const headers = [
    { label: "Simulation Run", key: "sim" },
    { label: "Home Score", key: "home" },
    { label: "Away Score", key: "away" },
  ];

  // Prepare the data for CSV export.
  // Map each simulation run to an object with simulation run number, home team score, and away team score.
  const data = game.simulation_runs.map((sim, index) => ({
    sim: sim,                   // The simulation run identifier (e.g., 1, 2, 3, ...)
    home: game.home_scores[index],  // Corresponding score for the home team
    away: game.away_scores[index],  // Corresponding score for the away team
  }));

  return (
    // CSVLink component from react-csv generates a downloadable CSV file.
    // The 'data' prop provides the CSV data,
    // 'headers' defines the columns, and 'filename' sets the file name.
    <CSVLink data={data} headers={headers} filename="simulation_results.csv">
      {/* 
        The button element inside CSVLink is styled using Tailwind CSS classes.
        When clicked, it triggers the CSV download.
      */}
      <button className="px-4 py-2 bg-green-500 text-white font-bold rounded hover:bg-green-600 transition-colors">
        Export CSV
      </button>
    </CSVLink>
  );
};

export default ExportCSV;
