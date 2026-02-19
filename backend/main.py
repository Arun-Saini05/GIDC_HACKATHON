from fastapi import FastAPI, HTTPException
# Trigger reload
from fastapi.middleware.cors import CORSMiddleware
import json
import os
import networkx as nx
from typing import List, Optional
from pydantic import BaseModel

app = FastAPI(title="SafeTravels India API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get the directory where main.py is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR, exist_ok=True)

# Optimized lookup
district_lookup = {}

def load_data():
    global crime_data, district_graph, district_lookup
    try:
        # Load GeoJSON V2
        geojson_path = os.path.join(DATA_DIR, "crime_data_v2.geojson")
        if os.path.exists(geojson_path):
            with open(geojson_path, 'r') as f:
                crime_data = json.load(f)
            
            # Filter out any lingering null districts (Paranoid check)
            valid_features = []
            print(f"DEBUG: Total raw features: {len(crime_data['features'])}")
            if len(crime_data['features']) > 0:
                print(f"DEBUG: First feature props: {crime_data['features'][0]['properties']}")

            for feature in crime_data['features']:
                props = feature['properties']
                d_name = props.get('district_std') or props.get('district')
                
                if d_name:
                    district_lookup[d_name.upper().strip()] = props
                    valid_features.append(feature)
                else:
                    # Print first failure only
                    if len(valid_features) == 0:
                        print(f"DEBUG: Skipped feature (no name): {props}")
            
            # Replace features with valid ones
            crime_data['features'] = valid_features
            print(f"Loaded crime data V2. Valid Features: {len(valid_features)}")
            
        else:
            print(f"Warning: {geojson_path} not found.")

        # Load Graph
        graph_path = os.path.join(DATA_DIR, "district_graph.json")
        if os.path.exists(graph_path):
            with open(graph_path, 'r') as f:
                adj_data = json.load(f)
                district_graph = nx.DiGraph() 
                for node, neighbors in adj_data.items():
                    district_graph.add_node(node)
                    for edge in neighbors:
                        district_graph.add_edge(node, edge['target'], weight=edge['weight'])
            print("Loaded district graph.")
        else:
            print(f"Warning: {graph_path} not found.")

    except Exception as e:
        print(f"Error loading data: {e}")

# Load data on startup
load_data()

@app.get("/")
def read_root():
    return {"message": "Welcome to SafeTravels India API V3"}

@app.get("/api/districts")
def get_districts_legacy():
    if crime_data:
        return crime_data
    return {"error": "Data not loaded"}

@app.get("/api/districts_v2")
def get_districts_v2():
    if crime_data:
        return crime_data
    return {"error": "Data not loaded"}

@app.get("/api/districts_v3")
def get_districts_v3():
    if crime_data:
        return crime_data
    return {"error": "Data not loaded"}

class RouteRequest(BaseModel):
    source: str
    destination: str

@app.post("/api/safest-route")
def get_safest_route(request: RouteRequest):
    if not district_graph:
        return {"error": "Graph data not loaded"}
    
    source = request.source.upper().strip()
    destination = request.destination.upper().strip()
    
    print(f"DEBUG: Requesting route from '{source}' to '{destination}'")
    
    if source not in district_graph:
        return {"error": f"Source district '{source}' not found."}
    if destination not in district_graph:
        return {"error": f"Destination district '{destination}' not found."}
    
    try:
        # Dijkstra's Algorithm
        path_names = nx.shortest_path(district_graph, source=source, target=destination, weight='weight')
        
        # Enrich path with details
        detailed_path = []
        for name in path_names:
            details = district_lookup.get(name, {})
            detailed_path.append({
                "name": name,
                "risk": details.get('Hotspot_Category', 'Unknown'),
                "wci": details.get('WCI', 0)
            })
            
        return {"path": detailed_path} 
    except nx.NetworkXNoPath:
        return {"error": "No path found between these districts."}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
