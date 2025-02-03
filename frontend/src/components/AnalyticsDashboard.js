/**
 * AnalyticsDashboard Component
 *
 * This component fetches simulation run clustering results for a specific game
 * from the backend's `/analytics/game/{game_id}/simulations` endpoint and displays
 * them in a table layout.
 *
 * Props:
 *   - gameId: The ID of the selected game for which simulation analytics should be performed.
 */

import React, { useEffect, useState } from "react";

const AnalyticsDashboard = ({ gameId }) => {
  // State to hold simulation clustering results (mapping: simulation_run -> cluster label)
  const [simClusters, setSimClusters] = useState({});
  // State to track loading status
  const [loading, setLoading] = useState(true);
  // State to capture any error during data fetching
  const [error, setError] = useState(null);

  // useEffect: Fetch simulation clustering data when the component mounts or when gameId changes.
  useEffect(() => {
    if (!gameId) return; // Do nothing if no gameId is provided.
    fetch(`http://localhost:8000/analytics/game/${gameId}/simulations`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch simulation clustering data");
        }
        return res.json();
      })
      .then((data) => {
        setSimClusters(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching simulation clusters:", err);
        setError(err.message);
        setLoading(false);
      });
  }, [gameId]);

  /**
   * groupByCategory - Groups simulation run numbers by their cluster label.
   *
   * Iterates over the simClusters object and groups simulation run numbers
   * based on their assigned cluster.
   *
   * @returns {Object} An object where keys are cluster labels and values are arrays of simulation run numbers.
   */
  const groupByCategory = () => {
    const groups = {};
    if (simClusters) {
      Object.entries(simClusters).forEach(([run, cluster]) => {
        const cat = Number(cluster); // Ensure the cluster is a native number.
        if (!groups[cat]) {
          groups[cat] = [];
        }
        groups[cat].push(run);
      });
    }
    return groups;
  };

  // Group the simulation clustering data.
  const groupedData = groupByCategory();

  // Map cluster labels to descriptive names.
  const clusterNames = {
    0: "Low Scoring Run",
    1: "Moderate Scoring Run",
    2: "High Scoring Run",
  };

  // If data is still loading, display a loading message.
  if (loading) {
    return <p className="text-center text-gray-400">Loading simulation analytics...</p>;
  }

  // If there was an error fetching data, display the error message.
  if (error) {
    return <p className="text-center text-red-500">Error: {error}</p>;
  }

  return (
    <div className="analytics-container">
      {/* Title for the simulation analytics section */}
      <h2 className="analytics-title">Simulation Run Clusters</h2>
      {Object.keys(groupedData).length === 0 ? (
        <p className="text-center text-gray-300">No simulation data available.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="analytics-table">
            <thead>
              <tr>
                <th className="analytics-header">Simulation Cluster</th>
                <th className="analytics-header">Simulation Runs</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedData).map(([cluster, runs]) => (
                <tr key={cluster} className="analytics-row">
                  <td className="analytics-cell">
                    {clusterNames[cluster] || `Cluster ${cluster}`}
                  </td>
                  <td className="analytics-cell">
                    <div className="game-id-container">
                      {runs.map((run) => (
                        <span key={run} className="game-id-badge">
                          Run {run}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
