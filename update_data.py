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
except Exception as e:
    print(f"Error fetching news list: {e}")
    exit(1)

soup = BeautifulSoup(response.text, 'html.parser')

# Broader selectors to catch news cards
news_items = soup.find_all(['div', 'article'], class_=['news-item', 'post', 'card', 'news-card', 'entry', 'post-card'])

print(f"Found {len(news_items)} potential news items")

for item in news_items:
    # Title
    title_tag = item.find(['h1', 'h2', 'h3', 'h4', 'a'], class_=['title', 'news-title', 'post-title', 'card-title'])
    title = title_tag.text.strip() if title_tag else ''

    # Link
    link_tag = title_tag.find('a') if title_tag else item.find('a', href=True)
    link = link_tag['href'] if link_tag else ''
    if link and not link.startswith('http'):
        link = f"https://arcraiders.com{link}"

    # Date
    date_tag = item.find('time') or item.find(['span', 'div'], class_=['date', 'news-date', 'post-date'])
    date_str = date_tag.text.strip() if date_tag else datetime.now().strftime('%Y-%m-%d')

    # Summary
    summary_tag = item.find('p', class_=['excerpt', 'news-excerpt', 'post-excerpt']) or item.find('p')
    summary = summary_tag.text.strip() if summary_tag else ''

    if not title or not link:
        continue

    print(f"Found item: {title} ({link})")  # Debug

    if not any(n['title'] == title or n.get('link') == link for n in news):
        full_content = '<p>Full content not available.</p>'
        if link:
            try:
                full_response = requests.get(link, headers={'User-Agent': 'Mozilla/5.0'}, timeout=15)
                full_soup = BeautifulSoup(full_response.text, 'html.parser')
                content_div = full_soup.find('div', class_=['news-content', 'post-content', 'entry-content']) or full_soup.find('article')
                if content_div:
                    for tag in content_div.find_all(['script', 'style']):
                        tag.decompose()
                    full_content = str(content_div)
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

with open('news.json', 'w', encoding='utf-8') as f:
    json.dump(news, f, indent=2, ensure_ascii=False)

print("News update complete. Changes saved.")
