import requests
from bs4 import BeautifulSoup
import json
import os
from datetime import datetime
from playwright.sync_api import sync_playwright

# Load existing news
def load_json(file_path):
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

news = load_json('news.json')

# Official news page
NEWS_URL = 'https://arcraiders.com/news'

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto(NEWS_URL, wait_until='networkidle', timeout=60000)

    # Wait for any content to load (e.g., header or a known element)
    try:
        page.wait_for_selector('header, div, article, h1, h2, h3', timeout=60000)  # Wait for ANY content
        print("Page loaded successfully")
    except Exception as e:
        print(f"Timeout waiting for content: {e}")

    # Extra wait for dynamic content
    page.wait_for_timeout(5000)  # Wait 5 seconds for JS to render

    html = page.content()
    browser.close()

# Debug: Print HTML snippet
print("News Page HTML (first 2000 chars):")
print(html[:2000])

soup = BeautifulSoup(html, 'html.parser')

# Very broad selectors to catch any news-like items
news_items = soup.find_all(['div', 'article', 'section'], class_=['news', 'post', 'card', 'item', 'entry', 'content', 'feed'])

print(f"Found {len(news_items)} potential news items")

for item in news_items:
    # Title (try any heading)
    title_tag = item.find(['h1', 'h2', 'h3', 'h4', 'h5', 'a'])
    title = title_tag.text.strip() if title_tag else ''

    # Link
    link_tag = title_tag.find('a') if title_tag else item.find('a', href=True)
    link = link_tag['href'] if link_tag else ''
    if link and not link.startswith('http'):
        link = f"https://arcraiders.com{link}"

    # Date
    date_tag = item.find('time') or item.find(['span', 'div'], class_=['date', 'time', 'published'])
    date_str = date_tag.text.strip() if date_tag else datetime.now().strftime('%Y-%m-%d')

    # Summary
    summary_tag = item.find('p') or item.find('div', class_=['excerpt', 'summary'])
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
