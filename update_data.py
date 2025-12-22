import requests
from bs4 import BeautifulSoup
import json
import os
from datetime import datetime

# Headers to mimic browser
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
}

# Load existing news
def load_json(file_path):
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

news = load_json('news.json')

# Official news page
NEWS_URL = 'https://arcraiders.com/news'

try:
    response = requests.get(NEWS_URL, headers=HEADERS, timeout=15)
    response.raise_for_status()
except requests.exceptions.RequestException as e:
    print(f"Error fetching news list: {e}")
    exit(1)

soup = BeautifulSoup(response.text, 'html.parser')

# Correct selectors (inspected today)
news_items = soup.find_all('div', class_='news-item')  # Wrapper for each news card

for item in news_items:
    # Title
    title_tag = item.find('h3')
    title = title_tag.text.strip() if title_tag else ''

    # Link
    link_tag = item.find('a', href=True)
    link = link_tag['href'] if link_tag else ''
    if link and not link.startswith('http'):
        link = f"https://arcraiders.com{link}"

    # Date
    date_tag = item.find('time') or item.find('span', class_='date')
    date_str = date_tag.text.strip() if date_tag else datetime.now().strftime('%Y-%m-%d')

    # Summary
    summary_tag = item.find('p')
    summary = summary_tag.text.strip() if summary_tag else ''

    # Skip if no title/link
    if not title or not link:
        continue

    # Check duplicate
    if not any(n['title'] == title or n.get('link') == link for n in news):
        # Fetch full content
        full_content = '<p>Full content not available.</p>'
        if link:
            try:
                full_response = requests.get(link, headers=HEADERS, timeout=15)
                full_soup = BeautifulSoup(full_response.text, 'html.parser')
                content_div = full_soup.find('div', class_='news-content') or full_soup.find('div', class_='post-content') or full_soup.find('article')
                if content_div:
                    # Remove script/style tags
                    for tag in content_div.find_all(['script', 'style']):
                        tag.decompose()
                    full_content = str(content_div)
                else:
                    full_content = '<p>Content scraped, but structure unknown.</p>'
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
