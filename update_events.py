import json
import requests

def update_events():
    print("Fetching Live Event Timers from MetaForge...")
    API_URL = "https://metaforge.app/api/arc-raiders/event-timers"
    try:
        response = requests.get(API_URL, timeout=15)
        if response.status_code == 200:
            events_data = response.json()
            with open('events.json', 'w', encoding='utf-8') as f:
                json.dump(events_data, f, indent=2)
            print(f"Success: {len(events_data.get('data', []))} events saved to events.json")
        else:
            print(f"Failed: HTTP {response.status_code}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    update_events()
