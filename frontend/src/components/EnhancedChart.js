/**
 * EnhancedChart Component
 * 
 * This component renders simulation data for a selected game using Chart.js.
 * It supports multiple chart types (Bar, Line, Scatter, and a Combined view)
 * and includes interactive controls to toggle between chart types, reset zoom,
 * and export data as CSV or PDF.
 */

import React, { useRef, useState } from "react";
// Import chart components from react-chartjs-2.
import { Bar, Line, Scatter } from "react-chartjs-2";
// Import necessary components and scales from Chart.js.
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
// Import zoom plugin for Chart.js to enable panning and zooming.
import zoomPlugin from "chartjs-plugin-zoom";
// Import export components (CSV and PDF export functionalities).
import ExportCSV from "./ExportCSV";  // Ensure that the path is correct.
import ExportPDF from "./ExportPDF";

// Register Chart.js components and plugins.
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

const EnhancedChart = ({ game }) => {
  // chartRef is used to access the Chart.js instance for resetting zoom.
  const chartRef = useRef(null);
  // chartType state determines which type of chart is rendered.
  // Options: "bar", "line", "scatter", "combined"
  const [chartType, setChartType] = useState("combined");

  // If no game data is provided or necessary data is missing, display a message.
  if (!game || !game.home_scores || !game.away_scores) {
    return <p className="text-center text-gray-400">No game data available.</p>;
  }

  // Generate labels for each simulation run (e.g., "Sim 1", "Sim 2", ...).
  const labels = game.simulation_runs.map((run, index) => `Sim ${index + 1}`);

  /**
   * getGradient - Helper function to create a vertical linear gradient.
   *
   * @param {CanvasRenderingContext2D} ctx - Chart context.
   * @param {Object} area - Chart area (defines top and bottom boundaries).
   * @param {String} startColor - Color at the bottom of the gradient.
   * @param {String} endColor - Color at the top of the gradient.
   * @returns {CanvasGradient} - The generated gradient.
   */
  const getGradient = (ctx, area, startColor, endColor) => {
    if (!ctx || !area) return startColor;
    const gradient = ctx.createLinearGradient(0, area.bottom, 0, area.top);
    gradient.addColorStop(0, startColor);
    gradient.addColorStop(1, endColor);
    return gradient;
  };

  // Compute the maximum value among scores to help set a dynamic y-axis maximum.
  const maxValue = Math.max(...game.home_scores, ...game.away_scores);
  const computedMax = maxValue * 1.5; // Increase the maximum slightly for visual padding.

  // Prepare datasets for the basic bar (or line) chart.
  const barDatasets = [
    {
      label: `${game.home_team} Score`,
      data: game.home_scores,
      // Use a gradient fill for the home team data.
      backgroundColor: (context) => {
        const { chart, chartArea } = context;
        return getGradient(
          chart?.ctx,
          chartArea,
          "rgba(0, 255, 255, 0.8)",
          "rgba(0, 255, 255, 0.2)"
        );
      },
      borderColor: "rgba(0, 255, 255, 1)",
      borderWidth: 1,
    },
    {
      label: `${game.away_team} Score`,
      data: game.away_scores,
      // Use a gradient fill for the away team data.
      backgroundColor: (context) => {
        const { chart, chartArea } = context;
        return getGradient(
          chart?.ctx,
          chartArea,
          "rgba(127, 0, 255, 0.8)",
          "rgba(127, 0, 255, 0.2)"
        );
      },
      borderColor: "rgba(127, 0, 255, 1)",
      borderWidth: 1,
    },
  ];

  // For the combined view, overlay a trend line representing the average score.
  const averageScores = game.home_scores.map((homeScore, index) => {
    const awayScore = game.away_scores[index] || 0;
    return (homeScore + awayScore) / 2;
  });
  const combinedDatasets = [
    ...barDatasets,
    {
      label: "Average Score Trend",
      data: averageScores,
      type: "line", // Render this dataset as a line.
      borderColor: "rgba(255, 206, 86, 1)",
      backgroundColor: "rgba(255, 206, 86, 0.2)",
      fill: false,
      tension: 0.3,
      borderWidth: 2,
      pointRadius: 3,
    },
  ];

  // Prepare datasets for a scatter plot.
  // Each point represents a simulation run with an x-value (run number) and y-value (score).
  const scatterDatasets = [
    {
      label: `${game.home_team} Score`,
      data: game.home_scores.map((score, index) => ({ x: index + 1, y: score })),
      backgroundColor: "rgba(0, 255, 255, 0.8)",
      borderColor: "rgba(0, 255, 255, 1)",
      pointRadius: 5,
    },
    {
      label: `${game.away_team} Score`,
      data: game.away_scores.map((score, index) => ({ x: index + 1, y: score })),
      backgroundColor: "rgba(127, 0, 255, 0.8)",
      borderColor: "rgba(127, 0, 255, 1)",
      pointRadius: 5,
    },
  ];

  // Determine which datasets to use based on the selected chart type.
  let selectedData;
  switch (chartType) {
    case "bar":
      selectedData = { labels, datasets: barDatasets };
      break;
    case "line":
      selectedData = { labels, datasets: barDatasets }; // Render as line using the <Line> component.
      break;
    case "scatter":
      selectedData = { datasets: scatterDatasets }; // Scatter charts don't use labels.
      break;
    case "combined":
    default:
      selectedData = { labels, datasets: combinedDatasets };
      break;
  }

  // Chart options for configuring appearance and interactivity.
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        // Configure legend styles.
        labels: { color: "white", font: { size: 14 } },
      },
      title: {
        display: true,
        text: "Simulation Results",
        color: "white",
        font: { size: 18, weight: "bold" },
      },
      tooltip: {
        // Custom tooltip callback to display dataset label and value.
        callbacks: {
          label: (tooltipItem) => `${tooltipItem.dataset.label}: ${tooltipItem.raw}`,
        },
      },
      zoom: {
        // Enable panning and zooming on the x-axis.
        pan: {
          enabled: true,
          mode: "x",
          modifierKey: "ctrl", // Users must hold the CTRL key to pan.
        },
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: "x",
        },
      },
    },
    scales: {
      // X-axis configuration: Use linear scale for scatter charts; otherwise, use category.
      x: {
        type: chartType === "scatter" ? "linear" : "category",
        ticks: { color: "white", font: { size: 12 } },
        grid: { color: "rgba(255,255,255,0.1)" },
      },
      // Y-axis configuration with a dynamic maximum value.
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
   * toggleChartType - Updates the chart type state and resets the zoom.
   *
   * @param {string} newType - The new chart type to switch to.
   */
  const toggleChartType = (newType) => {
    setChartType(newType);
    // Reset zoom whenever the chart type changes.
    chartRef.current?.resetZoom();
  };

  return (
    <div className="card max-w-4xl mx-auto p-4 bg-gray-900 rounded-lg shadow-lg">
      {/* Header Section */}
      <h2 className="text-neonBlue text-3xl font-bold text-center">
        {game.home_team} vs {game.away_team}
      </h2>
      <p className="text-center text-gray-400 mt-2">Date: {game.date}</p>
      <p className="text-center text-gray-400">Venue: {game.venue}</p>
      <p className="text-center text-neonAccent text-xl mt-2 font-bold">
        Home Win Percentage: {game.home_win_percentage.toFixed(2)}%
      </p>

      {/* Chart Container */}
      {/* The container has an ID used by ExportPDF for screenshot capturing */}
      <div id="chart-container" className="mt-6 w-full" style={{ height: "600px" }}>
        {chartType === "bar" && <Bar ref={chartRef} data={selectedData} options={options} />}
        {chartType === "line" && <Line ref={chartRef} data={selectedData} options={options} />}
        {chartType === "scatter" && <Scatter ref={chartRef} data={selectedData} options={options} />}
        {chartType === "combined" && <Bar ref={chartRef} data={selectedData} options={options} />}
      </div>

      {/* Control Panel */}
      {/* Contains buttons to reset zoom, toggle chart types, and export data. */}
      <div className="flex flex-wrap justify-center mt-4 space-x-4">
        <button
          className="px-4 py-2 bg-neonBlue text-gray-900 font-bold rounded hover:bg-neonAccent transition-colors"
          onClick={() => chartRef.current?.resetZoom()}
        >
          Reset Zoom
        </button>
        <button
          className="px-4 py-2 bg-gray-700 text-white font-bold rounded hover:bg-gray-600 transition-colors"
          onClick={() => toggleChartType("bar")}
        >
          Bar
        </button>
        <button
          className="px-4 py-2 bg-gray-700 text-white font-bold rounded hover:bg-gray-600 transition-colors"
          onClick={() => toggleChartType("line")}
        >
          Line
        </button>
        <button
          className="px-4 py-2 bg-gray-700 text-white font-bold rounded hover:bg-gray-600 transition-colors"
          onClick={() => toggleChartType("scatter")}
        >
          Scatter
        </button>
        <button
          className="px-4 py-2 bg-gray-700 text-white font-bold rounded hover:bg-gray-600 transition-colors"
          onClick={() => toggleChartType("combined")}
        >
          Combined
        </button>
        {/* Export Buttons */}
        <ExportCSV game={game} />
        <ExportPDF />
      </div>
    </div>
  );
};

export default EnhancedChart;
