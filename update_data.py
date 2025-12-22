import requests
from bs4 import BeautifulSoup
import json
import os
from datetime import datetime

# Load existing data
with open('patches.json', 'r') as f:
    patches = json.load(f)
with open('news.json', 'r') as f:
    news = json.load(f)

# Scrape official site
url = 'https://arcraiders.com/news'
response = requests.get(url)
soup = BeautifulSoup(response.text, 'html.parser')

# Find news items (adjust selectors based on site structure)
items = soup.find_all('div', class_='news-item')  # Example class - inspect site for actual

for item in items:
    title = item.find('h3').text.strip() if item.find('h3') else ''
    date_str = item.find('time').text.strip() if item.find('time') else datetime.now().strftime('%Y-%m-%d')
    link = item.find('a')['href'] if item.find('a') else ''
    summary = item.find('p').text.strip() if item.find('p') else ''

    # Check if already in JSON (by title or link)
    if not any(n['title'] == title for n in news):
        news.append({
            "title": title,
            "date": date_str,
            "summary": summary,
            "link": f"https://arcraiders.com{link}" if link.startswith('/') else link,
            "isLatest": True,
            "fullContent": "<p>Summary from site. Full details: <a href='{link}'>here</a></p>"  # Expand later
        })
        print(f"Added new news: {title}")

# Save updated JSON
with open('news.json', 'w') as f:
    json.dump(news, f, indent=2)
with open('patches.json', 'w') as f:
    json.dump(patches, f, indent=2)  # Patches similar logic
