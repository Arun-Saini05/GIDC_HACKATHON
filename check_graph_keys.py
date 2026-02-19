
import json
import os

GRAPH_FILE = 'backend/data/district_graph.json'

if os.path.exists(GRAPH_FILE):
    with open(GRAPH_FILE, 'r') as f:
        data = json.load(f)
    
    keys = list(data.keys())
    print(f"Total keys: {len(keys)}")
    
    if "MUMBAI" in data:
        print("MUMBAI found in graph!")
        print("Edges:", data["MUMBAI"])
    else:
        print("MUMBAI NOT found in graph.")
        # Check casing
        for k in keys:
            if "MUMBAI" in k.upper():
                print(f"Did you mean: {k}?")
else:
    print(f"{GRAPH_FILE} not found.")
