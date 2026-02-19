
import json
import os

DATA_FILE = r'backend/data/crime_data_with_hotspots.geojson'

if os.path.exists(DATA_FILE):
    with open(DATA_FILE, 'r') as f:
        data = json.load(f)
    
    districts = []
    for feature in data['features']:
        # Try 'district' or 'DISTRICT' or 'dtname' etc. - the dummy generator used 'district' property from india.geojson
        props = feature['properties']
        d = props.get('district') or props.get('DISTRICT') or props.get('dtname')
        if d:
            districts.append(str(d))
            
    # Search for Mumbai
    matches = [d for d in districts if 'mumbai' in d.lower()]
    print("Matches for 'mumbai':", matches)
    print(f"Total districts: {len(districts)}")
    
    # Print first 10 districts to see format
    print("Example districts:", districts[:10])

else:
    print(f"{DATA_FILE} not found.")
