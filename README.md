# 🚦 SafeTravels India
## AI-Driven Safety-Aware Navigation System

SafeTravels India is a web-based navigation system that integrates crime analytics with route planning to generate safety-optimized travel paths across Indian districts.

Unlike traditional navigation systems that optimize only for shortest distance or time, SafeTravels India incorporates historical crime data, predictive trends, and graph-based routing logic to recommend safer travel routes.

---

# 📌 Problem Statement

Traditional navigation systems do not consider crime risk while generating routes. Crime data exists but remains underutilized in real-time decision-making systems.

There is a need for a system that:

- Analyzes district-level crime patterns  
- Identifies high-risk zones  
- Predicts emerging hotspots  
- Integrates safety directly into routing algorithms  

---

# 🚀 Key Features

## 🔹 Weighted Crime Index (WCI)

A custom safety scoring system based on crime severity categories.

Severe crimes contribute more to the district risk score compared to minor offenses, resulting in a meaningful safety metric.

---

## 🔹 Dynamic Risk Classification

Districts are classified using percentile-based thresholds:

- 🟢 Low Risk  
- 🟠 Medium Risk  
- 🔴 High Risk  

---

## 🔹 Predictive Crime Trends

- Year-over-year crime trend analysis  
- Future Increase Probability estimation  
- Identification of emerging hotspots  

---

## 🔹 Safety-Optimized Routing

Modified Dijkstra’s Algorithm with adaptive penalties based on risk category.

Higher-risk districts receive higher edge weights, ensuring routes minimize exposure to unsafe zones while maintaining reasonable travel efficiency.

---

# 🏗 Project Architecture

                ┌─────────────────────┐
                │   NCRB Crime Data   │
                └──────────┬──────────┘
                           │
                           ▼
                ┌─────────────────────┐
                │ Data Cleaning &     │
                │ Standardization     │
                └──────────┬──────────┘
                           │
                           ▼
                ┌─────────────────────┐
                │ Weighted Crime      │
                │ Index Calculation   │
                └──────────┬──────────┘
                           │
                           ▼
                ┌─────────────────────┐
                │ Risk Classification │
                └──────────┬──────────┘
                           │
                           ▼
                ┌─────────────────────┐
                │ Graph Construction  │
                │ (NetworkX)          │
                └──────────┬──────────┘
                           │
                           ▼
                ┌─────────────────────┐
                │ Modified Dijkstra   │
                │ Algorithm           │
                └──────────┬──────────┘
                           │
                           ▼
                ┌─────────────────────┐
                │ React + Leaflet UI  │
                └─────────────────────┘



---

# 🛠 Tech Stack

## Frontend
- React.js  
- Leaflet.js  

## Backend
- FastAPI  
- Python  

## Data Processing
- Pandas  
- NumPy  

## Graph Algorithms
- NetworkX  

## Geospatial Data
- GeoJSON district boundary files  

---

# 📂 Project Structure

safetravels-india/
│
├── backend/
│ ├── main.py
│ ├── data_processing.py
│ ├── routing.py
│ └── requirements.txt
│
├── frontend/
│ ├── src/
│ ├── public/
│ └── package.json
│
├── assets/
│ ├── heatmap.png
│ └── route-example.png
│
└── README.md


---

# ⚙️ Installation & Setup

## Backend Setup

cd backend
pip install -r requirements.txt

## Run the backend server:

uvicorn main:app --reload

## Frontend Setup

cd frontend
npm install

## Start the frontend development server:

npm start

## License

This project is open-source and available under the MIT License.