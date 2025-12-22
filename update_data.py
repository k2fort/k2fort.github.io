import requests
from bs4 import BeautifulSoup
import json
import os
from datetime import datetime

# Headers to mimic a real browser and avoid blocks
HEADERS = {
    'User-Agent': 'ArcRaidersPatchesBot/1.0 (contact: your-github-username@gmail.com)',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
}

# Load existing data (safe if files missing)
def load_json(file_path):
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

patches = load_json('patches.json')
news = load_json('news.json')

# Official news page URL
URL = 'https://arcraiders.com/news'

try:
    response = requests.get(URL, headers=HEADERS, timeout=10)
    response.raise_for_status()  # Raise error if not 200
except requests.exceptions.RequestException as e:
    print(f"Error fetching {URL}: {e}")
    exit(1)

soup = BeautifulSoup(response.text, 'html.parser')

# Find all news items (adjust selectors after inspecting the site)
# Inspect https://arcraiders.com/news with browser DevTools to get exact classes
news_items = soup.find_all('div', class_='news-item')  # Example - change to actual class

if not news_items:
    news_items = soup.find_all('article')  # Fallback selector

for item in news_items:
    # Extract title
    title_tag = item.find('h3') or item.find('h2') or item.find('a')
    title = title_tag.text.strip() if title_tag else ''

    # Extract link
    link_tag = title_tag if title_tag and title_tag.name == 'a' else item.find('a')
    link = link_tag['href'] if link_tag else ''
    if link and not link.startswith('http'):
        link = f"https://arcraiders.com{link}"

    # Extract date
    date_tag = item.find('time') or item.find('span', class_='date')
    date_str = date_tag.text.strip() if date_tag else datetime.now().strftime('%Y-%m-%d')

    # Extract summary
    summary_tag = item.find('p') or item.find('div', class_='excerpt')
    summary = summary_tag.text.strip() if summary_tag else ''

    # Check if already exists (by title or link)
    if not any(n['title'] == title or n.get('link') == link for n in news):
        news.append({
            "title": title,
            "date": date_str,
            "summary": summary,
            "link": link,
            "isLatest": True,
            "fullContent": f"<p>Summary: {summary}</p><p>Full details: <a href='{link}'>Official Source</a></p>"
        })
        print(f"Added new news: {title} ({date_str})")

# Save updated JSON files
with open('news.json', 'w', encoding='utf-8') as f:
    json.dump(news, f, indent=2, ensure_ascii=False)

with open('patches.json', 'w', encoding='utf-8') as f:
    json.dump(patches, f, indent=2, ensure_ascii=False)

print("Update complete. Changes saved.")
