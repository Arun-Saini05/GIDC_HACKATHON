
import json
import os
import random
import networkx as nx

DATA_DIR = "backend/data"
os.makedirs(DATA_DIR, exist_ok=True)

# 1. Create Dummy GeoJSON
# We need a valid GeoJSON structure. If india.geojson exists, we use it and add dummy properties.
INDIA_GEOJSON = "india.geojson"

if os.path.exists(INDIA_GEOJSON):
    with open(INDIA_GEOJSON, 'r') as f:
        geojson = json.load(f)
    
    districts = []
    print(f"Loaded {INDIA_GEOJSON} with {len(geojson['features'])} features.")
    
    for feature in geojson['features']:
        district_name = feature['properties'].get('district', 'Unknown')
        if district_name:
            district_name = district_name.upper().strip()
            feature['properties']['district'] = district_name # Update feature too

        districts.append(district_name)
        
        # Add dummy stats
        wci = round(random.uniform(0, 15), 2)
        hotspot = "Low"
        if wci > 10: hotspot = "High"
        elif wci > 5: hotspot = "Medium"
        
        feature['properties']['Predicted_WCI'] = wci
        feature['properties']['Predicted_Hotspot_Category'] = hotspot
        feature['properties']['Future_Increase_Chance'] = f"{random.uniform(-5, 20):.1f}%"
        feature['properties']['Analysis_Date'] = "2026-02-18 10:00:00"

    # Save
    output_geojson = os.path.join(DATA_DIR, "crime_data_with_hotspots.geojson")
    with open(output_geojson, 'w') as f:
        json.dump(geojson, f)
    print(f"Created dummy {output_geojson}")

    # 2. Create Dummy Graph
    # Randomly connect districts
    adj_list = {}
    for dist in districts:
        # Connect to 2-3 random neighbors
        neighbors = random.sample(districts, k=min(len(districts), 3))
        edges = []
        for neighbor in neighbors:
            if neighbor == dist: continue
            edges.append({
                'target': neighbor,
                'weight': random.uniform(1, 10),
                'distance': random.uniform(10, 100),
                'risk': random.uniform(0, 5)
            })
        adj_list[dist] = edges

    output_graph = os.path.join(DATA_DIR, "district_graph.json")
    with open(output_graph, 'w') as f:
        json.dump(adj_list, f, indent=2)
    print(f"Created dummy {output_graph}")

else:
    print("india.geojson not found! Cannot create dummy spatial data.")
