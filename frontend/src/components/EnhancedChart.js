// src/components/EnhancedChart.js
import React, { useRef, useState } from "react";
import { Bar, Line, Scatter } from "react-chartjs-2";
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
import ExportCSV from "./ExportCSV";  // Make sure these paths are correct
import ExportPDF from "./ExportPDF";

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
  const chartRef = useRef(null);
  const [chartType, setChartType] = useState("combined"); // Options: "bar", "line", "scatter", "combined"

  if (!game || !game.home_scores || !game.away_scores) {
    return <p className="text-center text-gray-400">No game data available.</p>;
  }

  const labels = game.simulation_runs.map((run, index) => `Sim ${index + 1}`);

  const getGradient = (ctx, area, startColor, endColor) => {
    if (!ctx || !area) return startColor;
    const gradient = ctx.createLinearGradient(0, area.bottom, 0, area.top);
    gradient.addColorStop(0, startColor);
    gradient.addColorStop(1, endColor);
    return gradient;
  };

  const maxValue = Math.max(...game.home_scores, ...game.away_scores);
  const computedMax = maxValue * 1.5;

  const barDatasets = [
    {
      label: `${game.home_team} Score`,
      data: game.home_scores,
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

  // Average Score Trend for the combined view.
  const averageScores = game.home_scores.map((homeScore, index) => {
    const awayScore = game.away_scores[index] || 0;
    return (homeScore + awayScore) / 2;
  });
  const combinedDatasets = [
    ...barDatasets,
    {
      label: "Average Score Trend",
      data: averageScores,
      type: "line",
      borderColor: "rgba(255, 206, 86, 1)",
      backgroundColor: "rgba(255, 206, 86, 0.2)",
      fill: false,
      tension: 0.3,
      borderWidth: 2,
      pointRadius: 3,
    },
  ];

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

  let selectedData;
  switch (chartType) {
    case "bar":
      selectedData = { labels, datasets: barDatasets };
      break;
    case "line":
      selectedData = { labels, datasets: barDatasets }; // rendered as line when using <Line>
      break;
    case "scatter":
      selectedData = { datasets: scatterDatasets }; // Scatter charts do not use labels
      break;
    case "combined":
    default:
      selectedData = { labels, datasets: combinedDatasets };
      break;
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: "white", font: { size: 14 } },
      },
      title: {
        display: true,
        text: "Simulation Results",
        color: "white",
        font: { size: 18, weight: "bold" },
      },
      tooltip: {
        callbacks: {
          label: (tooltipItem) => `${tooltipItem.dataset.label}: ${tooltipItem.raw}`,
        },
      },
      zoom: {
        pan: {
          enabled: true,
          mode: "x",
          modifierKey: "ctrl",
        },
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: "x",
        },
      },
    },
    scales: {
      x: {
        type: chartType === "scatter" ? "linear" : "category",
        ticks: { color: "white", font: { size: 12 } },
        grid: { color: "rgba(255,255,255,0.1)" },
      },
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

  const toggleChartType = (newType) => {
    setChartType(newType);
    chartRef.current?.resetZoom();
  };

  return (
    <div className="card max-w-4xl mx-auto p-4 bg-gray-900 rounded-lg shadow-lg">
      <h2 className="text-neonBlue text-3xl font-bold text-center">
        {game.home_team} vs {game.away_team}
      </h2>
      <p className="text-center text-gray-400 mt-2">Date: {game.date}</p>
      <p className="text-center text-gray-400">Venue: {game.venue}</p>
      <p className="text-center text-neonAccent text-xl mt-2 font-bold">
        Home Win Percentage: {game.home_win_percentage.toFixed(2)}%
      </p>
      {/* Chart container with increased height */}
      <div id="chart-container" className="mt-6 w-full" style={{ height: "600px" }}>
        {chartType === "bar" && <Bar ref={chartRef} data={selectedData} options={options} />}
        {chartType === "line" && <Line ref={chartRef} data={selectedData} options={options} />}
        {chartType === "scatter" && <Scatter ref={chartRef} data={selectedData} options={options} />}
        {chartType === "combined" && <Bar ref={chartRef} data={selectedData} options={options} />}
      </div>
      {/* Control panel: chart type toggles, reset, and export buttons */}
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
