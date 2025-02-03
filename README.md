---
### 📌 **Fullstack Cricket Simulation Dashboard** 🏏

A **full-stack** web application that simulates cricket matches and provides interactive visualizations.
---
## 🔑 Login Details

To access the **Cricket Simulation Dashboard**, use the following test credentials:

- **Username**: `test`
- **Password**: `test`

> ⚠️ *These are test credentials and should not be used in production.*

## 📜 **Table of Contents**

* [📌 Features](https://chatgpt.com/c/67a00f57-a2c0-8003-953f-84a960ec4f9c#features)
* [📂 Project Structure](https://chatgpt.com/c/67a00f57-a2c0-8003-953f-84a960ec4f9c#project-structure)
* [🛠 Installation &amp; Setup](https://chatgpt.com/c/67a00f57-a2c0-8003-953f-84a960ec4f9c#installation--setup)
* [🚀 Running the Application](https://chatgpt.com/c/67a00f57-a2c0-8003-953f-84a960ec4f9c#running-the-application)
* [🔗 API Endpoints](https://chatgpt.com/c/67a00f57-a2c0-8003-953f-84a960ec4f9c#api-endpoints)
* [📷 Screenshots](https://chatgpt.com/c/67a00f57-a2c0-8003-953f-84a960ec4f9c#screenshots)
* [💡 Technologies Used](https://chatgpt.com/c/67a00f57-a2c0-8003-953f-84a960ec4f9c#technologies-used)

---

## 📌 **Features**

✅ **Simulated Cricket Matches** - Uses predefined data to simulate cricket results.

📊 **Interactive Charts** - Visual representation of simulation runs with  **Chart.js** .

🎯 **Game Filtering** - Filter matches based on date, venue, and teams.

🎨 **Modern UI** -**Tailwind CSS** for a sleek, neon-themed look.

⚡**REST API** - **FastAPI** backend serves cricket game data.

**🐳 Docker Support** - Easily deployable with Docker and `docker-compose`.

---

## 📂 **Project Structure**

```bash
fullstack-cricket-sim
├── backend/                     # FastAPI backend
│   ├── main.py                  # Main backend application with API endpoints
│   ├── models.py                # SQLAlchemy database models (Venue, Game, Simulation)
│   ├── database.py              # Database connection and session setup
│   ├── requirements.txt         # Python dependencies
│   ├── data/                    # CSV files for game, venue, and simulation data
│   ├── Dockerfile               # Backend Docker configuration
│   └── test_simulation.py       # Unit tests for the backend
│
├── frontend/                    # React frontend
│   ├── src/
│   │   ├── components/          # UI components
│   │   │   ├── GameDetails.js   # Displays detailed simulation results for a game
│   │   │   ├── GameSelector.js  # UI to select a game based on filtering criteria
│   │   │   ├── GameFilter.js    # UI for filtering games by date, venue, and team
│   │   │   ├── EnhancedChart.js # Enhanced chart view with interactivity and export options
│   │   │   ├── ExportCSV.js     # Exports simulation data to CSV
│   │   │   ├── ExportPDF.js     # Exports simulation view to PDF
│   │   │   └── Login.js         # Login form component
│   │   ├── App.js               # Main React application
│   │   ├── index.js             # Application entry point
│   │   └── index.css            # Global styles (TailwindCSS)
│   ├── package.json             # Frontend dependencies and scripts
│   ├── Dockerfile               # Frontend Docker configuration
│   └── public/
│       └── index.html           # HTML template for the React app
│
├── docker-compose.yml           # Orchestrates the backend and frontend containers
├── README.md                    # Project documentation (this file)
└── .gitignore                    # Files and directories to be ignored by Git
```

---

## 🛠 **Installation & Setup**

### **1️⃣ Clone the Repository**

```bash
git clone https://github.com/yourusername/fullstack-cricket-sim.git
cd fullstack-cricket-sim
```

### **2️⃣ Backend Setup**

Ensure **Python 3.9+** and `pip` are installed.

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend will start at  **`http://localhost:8000`** .

### **3️⃣ Frontend Setup**

Ensure **Node.js** and **npm** are installed.

```bash
cd frontend
npm install
npm start
```

Frontend will start at  **`http://localhost:3000`** .

---

## 🚀 **Running the Application**

### **Using Docker (Recommended)**

```bash
docker-compose up --build
```

This will start **both the backend and frontend** inside Docker containers.

---

## 🔗 **API Endpoints**

| Endpoint          | Method | Description                  |
| ----------------- | ------ | ---------------------------- |
| `/games`        | GET    | Fetch all cricket games      |
| `/games/{id}`   | GET    | Fetch a specific game by ID  |
| `/games/filter` | GET    | Fetch games based on filters |
| `/login`        | POST   | Dummy login endpoint         |

You can access the interactive API docs at  **`http://localhost:8000/docs`** .

---

## 📷 **Screenshots**

### 🎮 **Game Selector**

![Game Selector](docs/GameSelectorImage.png)

### 📊 **Match Statistics**

![Match Statistics](docs/MatchStatsImage.png)

---

## 💡 **Technologies Used**

### **Backend**

* ⚡ FastAPI (Python)
* 📦 SQLite (Database)
* 🔹 SQLAlchemy (ORM)

### **Frontend**

* ⚛ React.js
* 🎨 Tailwind CSS
* 📊 Chart.js (with `react-chartjs-2`)
* 📂 **Export Features:** `react-csv`, `jspdf`, `html2canvas`

### **DevOps**

* 🐳 Docker
* ⚙️ Docker-Compose
