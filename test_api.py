
import requests
import json

url = "http://localhost:8000/api/safest-route"
payload = {
    "source": "MUMBAI",
    "destination": "NAVSARI"
}
headers = {
    "Content-Type": "application/json"
}

try:
    response = requests.post(url, json=payload, headers=headers)
    print(f"Status Code: {response.status_code}")
    print("Response JSON:", response.json())
except Exception as e:
    print(f"Error: {e}")
