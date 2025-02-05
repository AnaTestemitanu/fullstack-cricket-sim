/**
 * EnhancedChart Component
 * 
 * This component renders simulation data for a selected game using Chart.js.
 * It supports multiple chart types:
 *   - Bar chart - removed
 *   - Histogram: Aggregates simulation results into bins and displays two grouped histograms 
 *                with the vertical axis showing the proportion of simulation runs.
 *   - Line: A line chart.
 *   - Scatter: A scatter plot.
 *   - Combined: A chart with bars and an overlayed trend line.
 * 
 * It also includes interactive controls to toggle between chart types, reset zoom,
 * and export data as CSV or PDF.
 */

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
import ExportCSV from "./ExportCSV";
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

/**
 * binDataTwoSets - Bins two sets of numeric data into the same bins and returns proportions.
 *
 * @param {Array<number>} data1 - The first dataset (home team scores).
 * @param {Array<number>} data2 - The second dataset (away team scores).
 * @param {number} numBins - The number of bins to create (default is 10).
 * @returns {Object} An object with:
 *   - labels: An array of bin range labels.
 *   - percents1: Array of proportions (0 to 1) for data1 per bin.
 *   - percents2: Array of proportions (0 to 1) for data2 per bin.
 */
const binDataTwoSets = (data1, data2, numBins = 10) => {
  const combined = data1.concat(data2);
  const min = Math.min(...combined);
  const max = Math.max(...combined);
  const binWidth = (max - min) / numBins;
  const counts1 = new Array(numBins).fill(0);
  const counts2 = new Array(numBins).fill(0);

  data1.forEach(d => {
    let index = Math.floor((d - min) / binWidth);
    if (index === numBins) index--;
    counts1[index]++;
  });
  data2.forEach(d => {
    let index = Math.floor((d - min) / binWidth);
    if (index === numBins) index--;
    counts2[index]++;
  });

  const total1 = data1.length;
  const total2 = data2.length;
  const percents1 = counts1.map(count => count / total1);
  const percents2 = counts2.map(count => count / total2);

  const labels = [];
  for (let i = 0; i < numBins; i++) {
    const lower = (min + i * binWidth).toFixed(1);
    const upper = (min + (i + 1) * binWidth).toFixed(1);
    labels.push(`${lower} - ${upper}`);
  }
  return { labels, percents1, percents2 };
};

const EnhancedChart = ({ game }) => {
  const chartRef = useRef(null);
  // Available chart types: "histogram", "line", "scatter", "combined"
  const [chartType, setChartType] = useState("combined");

  if (!game || !game.home_scores || !game.away_scores) {
    return <p className="text-center text-gray-400">No game data available.</p>;
  }

  // Standard labels for simulation runs (used for line, scatter, combined views).
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

  const maxValue = Math.max(...game.home_scores, ...game.away_scores);
  const computedMax = maxValue * 1.5; // For non-histogram charts: y-axis shows score values

  // Datasets for the standard grouped bar chart.
  const barDatasets = [
    {
      label: `${game.home_team} Score`,
      data: game.home_scores,
      backgroundColor: (context) => {
        const { chart, chartArea } = context;
        return getGradient(chart?.ctx, chartArea, "rgba(0, 255, 255, 0.8)", "rgba(0, 255, 255, 0.2)");
      },
      borderColor: "rgba(0, 255, 255, 1)",
      borderWidth: 1,
    },
    {
      label: `${game.away_team} Score`,
      data: game.away_scores,
      backgroundColor: (context) => {
        const { chart, chartArea } = context;
        return getGradient(chart?.ctx, chartArea, "rgba(127, 0, 255, 0.8)", "rgba(127, 0, 255, 0.2)");
      },
      borderColor: "rgba(127, 0, 255, 1)",
      borderWidth: 1,
    },
  ];

  // Datasets for the histogram.
  // Bin the raw scores into 10 bins and compute the proportion of simulation runs per bin.
  const { labels: histLabels, percents1: homePercents, percents2: awayPercents } = binDataTwoSets(game.home_scores, game.away_scores, 10);
  const histogramDatasets = [
    {
      label: `${game.home_team} Score (%)`,
      data: homePercents,
      backgroundColor: "rgba(0, 255, 255, 0.8)",
      borderColor: "rgba(0, 255, 255, 1)",
      borderWidth: 1,
      barThickness: "flex", // Force bars to fill the category.
    },
    {
      label: `${game.away_team} Score (%)`,
      data: awayPercents,
      backgroundColor: "rgba(127, 0, 255, 0.8)",
      borderColor: "rgba(127, 0, 255, 1)",
      borderWidth: 1,
      barThickness: "flex",
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
      type: "line",
      borderColor: "rgba(255, 206, 86, 1)",
      backgroundColor: "rgba(255, 206, 86, 0.2)",
      fill: false,
      tension: 0.3,
      borderWidth: 2,
      pointRadius: 3,
    },
  ];

  // Datasets for a scatter chart.
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

  // Determine which dataset to use based on the selected chart type.
  let selectedData;
  // case "bar":
  //   selectedData = { labels, datasets: barDatasets };
  //   break;
  switch (chartType) {
    case "histogram":
      selectedData = { labels: histLabels, datasets: histogramDatasets };
      break;
    case "line":
      selectedData = { labels, datasets: barDatasets };
      break;
    case "scatter":
      selectedData = { datasets: scatterDatasets };
      break;
    case "combined":
    default:
      selectedData = { labels, datasets: combinedDatasets };
      break;
  }


  const xAxisOptions = {
    type: chartType === "scatter" ? "linear" : "category",
    ticks: { color: "white", font: { size: 12 } },
    grid: { color: "rgba(255,255,255,0.1)" },
  };

  // For histogram
  if (chartType === "histogram") {
    xAxisOptions.categoryPercentage = 1.0;
    xAxisOptions.barPercentage = 1.0;
  }

  let yAxisOptions;
  if (chartType === "histogram") {
    yAxisOptions = {
      beginAtZero: true,
      ticks: {
        color: "white",
        font: { size: 12 },
        stepSize: 0.05,
        callback: value => value.toFixed(2)
      },
      grid: { color: "rgba(255,255,255,0.1)" },
      // Set maximum as the highest proportion plus a small buffer.
      max: Math.max(...histogramDatasets[0].data, ...histogramDatasets[1].data) + 0.05,
    };
  } else {
    yAxisOptions = {
      beginAtZero: true,
      ticks: { color: "white", font: { size: 12 } },
      grid: { color: "rgba(255,255,255,0.1)" },
      max: computedMax,
    };
  }

  // Chart config
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
        ...xAxisOptions,
        title: {
          display: true,
          text: chartType === "histogram" ? "Score Range" : "Simulation Run",
          color: "white",
          font: { size: 14, weight: "bold" },
        },
      },
      y: {
        ...yAxisOptions,
        title: {
          display: true,
          text: chartType === "histogram" ? "Proportion of Simulation Runs" : "Score",
          color: "white",
          font: { size: 14, weight: "bold" },
        },
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
      <div id="chart-container" className="mt-6 w-full" style={{ height: "600px" }}>
        {chartType === "histogram" && <Bar ref={chartRef} data={selectedData} options={options} />}
        {chartType === "line" && <Line ref={chartRef} data={selectedData} options={options} />}
        {chartType === "scatter" && <Scatter ref={chartRef} data={selectedData} options={options} />}
        {chartType === "combined" && <Bar ref={chartRef} data={selectedData} options={options} />}
      </div>
      <div className="flex flex-wrap justify-center mt-4 space-x-4">
        <button
          className="px-4 py-2 bg-neonBlue text-gray-900 font-bold rounded hover:bg-neonAccent transition-colors"
          onClick={() => chartRef.current?.resetZoom()}
        >
          Reset Zoom
        </button>
        {/*
        <button
          className="px-4 py-2 bg-gray-700 text-white font-bold rounded hover:bg-gray-600 transition-colors"
          onClick={() => toggleChartType("bar")}
        >
          Bar
        </button>
        */}
        <button
          className="px-4 py-2 bg-gray-700 text-white font-bold rounded hover:bg-gray-600 transition-colors"
          onClick={() => toggleChartType("histogram")}
        >
          Histogram
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
        <ExportCSV game={game} />
        <ExportPDF />
      </div>
    </div>
  );
};

export default EnhancedChart;
