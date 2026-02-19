
import requests

try:
    print("Fetching /api/districts...")
    res = requests.get('http://localhost:8000/api/districts')
    if res.status_code == 200:
        data = res.json()
        print(f"Total Features: {len(data.get('features', []))}")
        if data['features']:
            props = data['features'][0]['properties']
            print("\nFirst Feature Properties Keys:")
            print(list(props.keys()))
            print("\nFirst Feature Hotspot_Category:", props.get('Hotspot_Category'))
            
            # Check for Mumbai specifically
            mumbai = next((f for f in data['features'] if f['properties'].get('district_std') == 'MUMBAI'), None)
            if mumbai:
                print("\nMUMBAI Properties:")
                print(mumbai['properties'])
            else:
                print("\nMUMBAI not found in response.")
    else:
        print(f"Error: Status {res.status_code}")
except Exception as e:
    print(f"Request failed: {e}")
