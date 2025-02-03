import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const GameDetails = ({ game }) => {
  if (!game) return null;

  const labels = game.simulation_runs.map((run) => `Sim ${run}`);
  const data = {
    labels,
    datasets: [
      {
        label: `${game.home_team} Score`,
        data: game.home_scores,
        backgroundColor: "rgba(0, 255, 255, 0.8)", // Neon Blue
        borderColor: "rgba(0, 255, 255, 1)",
      },
      {
        label: `${game.away_team} Score`,
        data: game.away_scores,
        backgroundColor: "rgba(127, 0, 255, 0.8)", // Neon Purple
        borderColor: "rgba(127, 0, 255, 1)",
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { labels: { color: "white" } },
      title: { display: true, text: "Simulation Results", color: "white" },
    },
    scales: {
      x: { ticks: { color: "white" } },
      y: { ticks: { color: "white" } },
    },
  };

  return (
    <div className="card max-w-4xl">
      <h2 className="text-neonBlue text-3xl font-bold text-center">
        {game.home_team} vs {game.away_team}
      </h2>
      <p className="text-center text-gray-400 mt-2">Date: {game.date}</p>
      <p className="text-center text-gray-400">Venue: {game.venue}</p>
      <p className="text-center text-neonAccent text-xl mt-2 font-bold">
        Home Win Percentage: {game.home_win_percentage.toFixed(2)}%
      </p>
      <div className="mt-6 w-full h-[400px] flex justify-center items-center">
        <div className="w-full h-full">
        <Bar data={data} options={options} />
        </div>
      </div>
    </div>
  );
};

export default GameDetails;
