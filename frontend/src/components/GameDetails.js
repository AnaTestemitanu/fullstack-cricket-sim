/**
 * GameDetails Component
 *
 * This component displays detailed simulation results for a specific game.
 * It supports two chart types (Bar and Line) using Chart.js via react-chartjs-2,
 * and includes interactive controls to switch between these chart views and reset zoom.
 *
 * Props:
 *   - game: An object containing game details and simulation data. It must include:
 *       - home_team: The home team's name.
 *       - away_team: The away team's name.
 *       - date: The date of the game.
 *       - venue: The venue where the game was played.
 *       - home_win_percentage: The calculated win percentage for the home team.
 *       - simulation_runs: An array of simulation run identifiers (e.g., [1, 2, 3, ...]).
 *       - home_scores: An array of scores for the home team (aligned with simulation_runs).
 *       - away_scores: An array of scores for the away team (aligned with simulation_runs).
 */

import React, { useRef, useState } from "react";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";

// Register necessary Chart.js components and the zoom plugin.
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  zoomPlugin
);

const GameDetails = ({ game }) => {
  // Create a reference to the Chart.js instance to control zoom.
  const chartRef = useRef(null);
  // Local state to toggle between "bar" and "line" chart types.
  const [chartType, setChartType] = useState("bar");

  // If game data or necessary arrays are missing, render an appropriate message.
  if (!game || !game.home_scores || !game.away_scores) {
    return <p className="text-center text-gray-400">No game data available.</p>;
  }

  // Generate chart labels based on simulation run numbers.
  // Example: ["Sim 1", "Sim 2", "Sim 3", ...]
  const labels = game.simulation_runs.map((run, index) => `Sim ${index + 1}`);

  /**
   * getGradient - Creates a vertical linear gradient for chart dataset backgrounds.
   *
   * @param {CanvasRenderingContext2D} ctx - The canvas context.
   * @param {Object} area - The drawing area of the chart.
   * @param {string} startColor - The color at the bottom of the gradient.
   * @param {string} endColor - The color at the top of the gradient.
   * @returns {CanvasGradient|string} - The generated gradient or the startColor if the area is not available.
   */
  const getGradient = (ctx, area, startColor, endColor) => {
    if (!ctx || !area) return startColor;
    const gradient = ctx.createLinearGradient(0, area.bottom, 0, area.top);
    gradient.addColorStop(0, startColor);
    gradient.addColorStop(1, endColor);
    return gradient;
  };

  // Determine the maximum score from both teams to compute a dynamic y-axis maximum.
  const maxValue = Math.max(...game.home_scores, ...game.away_scores);
  const computedMax = maxValue * 1.5; // Increase the max value for better visual padding.

  // Define the data configuration for the chart.
  // Here, we create two datasets: one for the home team and one for the away team.
  const data = {
    labels,
    datasets: [
      {
        label: `${game.home_team} Score`,
        data: game.home_scores,
        backgroundColor: (context) => {
          const { chart, chartArea } = context;
          return getGradient(
            chart?.ctx,
            chartArea,
            "rgba(0, 255, 255, 0.8)", // Neon cyan at the bottom
            "rgba(0, 255, 255, 0.2)"  // Lighter at the top
          );
        },
        borderColor: "rgba(0, 255, 255, 1)",
        borderWidth: 1,
        fill: true,
      },
      {
        label: `${game.away_team} Score`,
        data: game.away_scores,
        backgroundColor: (context) => {
          const { chart, chartArea } = context;
          return getGradient(
            chart?.ctx,
            chartArea,
            "rgba(127, 0, 255, 0.8)", // Neon purple at the bottom
            "rgba(127, 0, 255, 0.2)"  // Lighter at the top
          );
        },
        borderColor: "rgba(127, 0, 255, 1)",
        borderWidth: 1,
        fill: true,
      },
    ],
  };

  // Chart options configuration, including interactivity and visual styles.
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      // Configure the legend styling.
      legend: {
        labels: { color: "white", font: { size: 14 } },
      },
      // Set the chart title.
      title: {
        display: true,
        text: "Simulation Results",
        color: "white",
        font: { size: 18, weight: "bold" },
      },
      // Custom tooltip callback to display the dataset label and value.
      tooltip: {
        callbacks: {
          label: (tooltipItem) =>
            `${tooltipItem.dataset.label}: ${tooltipItem.raw}`,
        },
      },
      // Enable zooming and panning on the x-axis.
      zoom: {
        pan: {
          enabled: true,
          mode: "x",
          modifierKey: "ctrl", // Require CTRL key for panning.
        },
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: "x",
        },
      },
    },
    scales: {
      // X-axis configuration.
      x: {
        ticks: { color: "white", font: { size: 12 } },
        grid: { color: "rgba(255,255,255,0.1)" },
      },
      // Y-axis configuration, using a dynamic maximum for better visual spacing.
      y: {
        beginAtZero: true,
        ticks: { color: "white", font: { size: 12 } },
        grid: { color: "rgba(255,255,255,0.1)" },
        max: computedMax,
      },
    },
    animation: {
      duration: 1000,
      easing: "easeOutQuart",
    },
  };

  /**
   * toggleChartType - Toggles between Bar and Line chart types.
   * Resets the chart zoom whenever the chart type is switched.
   */
  const toggleChartType = () => {
    setChartType((prev) => (prev === "bar" ? "line" : "bar"));
    chartRef.current?.resetZoom();
  };

  return (
    <div className="card max-w-4xl mx-auto p-4 bg-gray-900 rounded-lg shadow-lg">
      {/* Header section with game information */}
      <h2 className="text-neonBlue text-3xl font-bold text-center">
        {game.home_team} vs {game.away_team}
      </h2>
      <p className="text-center text-gray-400 mt-2">Date: {game.date}</p>
      <p className="text-center text-gray-400">Venue: {game.venue}</p>
      <p className="text-center text-neonAccent text-xl mt-2 font-bold">
        Home Win Percentage: {game.home_win_percentage.toFixed(2)}%
      </p>

      {/* Chart container with a fixed height to ensure sufficient space */}
      <div className="mt-6 w-full" style={{ height: '600px' }}>
        {chartType === "bar" ? (
          <Bar ref={chartRef} data={data} options={options} />
        ) : (
          <Line ref={chartRef} data={data} options={options} />
        )}
      </div>

      {/* Control panel with buttons for interactivity:
          - Reset Zoom: Resets any zooming/panning on the chart.
          - Switch Chart Type: Toggles between Bar and Line chart views.
      */}
      <div className="flex justify-center mt-4 space-x-4">
        <button
          className="px-4 py-2 bg-neonBlue text-gray-900 font-bold rounded hover:bg-neonAccent transition-colors"
          onClick={() => chartRef.current?.resetZoom()}
        >
          Reset Zoom
        </button>
        <button
          className="px-4 py-2 bg-gray-700 text-white font-bold rounded hover:bg-gray-600 transition-colors"
          onClick={toggleChartType}
        >
          Switch to {chartType === "bar" ? "Line" : "Bar"} Chart
        </button>
      </div>
    </div>
  );
};

export default GameDetails;
