import os
import json
import requests
import re

# Config
REPO = "k2fort/k2fort.github.io" # Replace with your repo
TOKEN = os.getenv("GITHUB_TOKEN")
JSON_FILE = "profiles.json"

def get_profile_issues():
    url = f"https://api.github.com/repos/{REPO}/issues?labels=profile-submission&state=open"
    headers = {"Authorization": f"token {TOKEN}"}
    response = requests.get(url, headers=headers)
    return response.json()

def parse_body(body):
    # Extracts data from the Markdown body
    ign = re.search(r"### IGN\n(.*?)\n", body)
    discord = re.search(r"### Discord\n(.*?)\n", body)
    bio = re.search(r"### Bio\n(.*)", body, re.DOTALL)
    
    return {
        "ign": ign.group(1).strip() if ign else "Unknown",
        "discord": discord.group(1).strip() if discord else "N/A",
        "bio": bio.group(1).strip() if bio else ""
    }

def main():
    issues = get_profile_issues()
    if not issues:
        print("No new profiles to process.")
        return

    # Load existing
    if os.path.exists(JSON_FILE):
        with open(JSON_FILE, 'r') as f:
            profiles = json.load(f)
    else:
        profiles = []

    # Process new ones
    for issue in issues:
        profile_data = parse_body(issue['body'])
        # Avoid duplicates
        if not any(p['ign'] == profile_data['ign'] for p in profiles):
            profiles.append(profile_data)
        
        # Close the issue so it doesn't get processed again
        issue_url = issue['url']
        requests.patch(issue_url, 
                       headers={"Authorization": f"token {TOKEN}"}, 
                       json={"state": "closed"})

    # Save
    with open(JSON_FILE, 'w') as f:
        json.dump(profiles, f, indent=2)
    print(f"Processed {len(issues)} profiles.")

if __name__ == "__main__":
    main()
