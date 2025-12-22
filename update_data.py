import requests
from bs4 import BeautifulSoup
import json
import os
from datetime import datetime

# Headers to avoid blocks
HEADERS = {
    'User-Agent': 'ArcRaidersPatchesBot/1.0 (contact: your-github-username@gmail.com)',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
}

# Load existing news (safe if missing)
def load_json(file_path):
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

news = load_json('news.json')

# Official news page
NEWS_URL = 'https://arcraiders.com/news'

try:
    response = requests.get(NEWS_URL, headers=HEADERS, timeout=10)
    response.raise_for_status()
except requests.exceptions.RequestException as e:
    print(f"Error fetching news list: {e}")
    exit(1)

soup = BeautifulSoup(response.text, 'html.parser')

# Find all news items (adjust based on current site structure)
news_items = soup.find_all('div', class_='news-item')  # Main wrapper class
if not news_items:
    news_items = soup.find_all('article')  # Fallback

for item in news_items:
    # Title
    title_tag = item.find('h3') or item.find('a', class_='title')
    title = title_tag.text.strip() if title_tag else ''

    # Link
    link_tag = title_tag if title_tag and title_tag.name == 'a' else item.find('a')
    link = link_tag['href'] if link_tag else ''
    if link and not link.startswith('http'):
        link = f"https://arcraiders.com{link}"

    # Date
    date_tag = item.find('time') or item.find('span', class_='date')
    date_str = date_tag.text.strip() if date_tag else datetime.now().strftime('%Y-%m-%d')

    # Summary
    summary_tag = item.find('p', class_='excerpt') or item.find('p')
    summary = summary_tag.text.strip() if summary_tag else ''

    # Check if already in news.json
    if not any(n['title'] == title or n.get('link') == link for n in news):
        # Fetch full content from individual page
        full_content = '<p>No full content available.</p>'
        if link:
            try:
                full_response = requests.get(link, headers=HEADERS, timeout=10)
                full_soup = BeautifulSoup(full_response.text, 'html.parser')
                content_div = full_soup.find('div', class_='news-content') or full_soup.find('article')
                full_content = str(content_div) if content_div else '<p>Full content not scraped.</p>'
            except Exception as e:
                print(f"Error fetching full content for {title}: {e}")

        news.append({
            "title": title,
            "date": date_str,
            "summary": summary,
            "link": link,
            "isLatest": True,
            "fullContent": full_content
        })
        print(f"Added new news: {title} ({date_str})")

# Save updated news.json
with open('news.json', 'w', encoding='utf-8') as f:
    json.dump(news, f, indent=2, ensure_ascii=False)

print("News update complete. Changes saved.")
