import json
import os
from datetime import datetime
from playwright.sync_api import sync_playwright
import requests
from bs4 import BeautifulSoup

# Load existing data
def load_json(file_path):
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

patches = load_json('patches.json')
news = load_json('news.json')

# Official news page
NEWS_URL = 'https://arcraiders.com/news'

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto(NEWS_URL, wait_until='networkidle', timeout=60000)

    # Scroll to load all content
    for _ in range(5):
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(2000)

    # Get all news article cards
    news_cards = page.query_selector_all('a[class*="news-article-card_container"]')

    print(f"Found {len(news_cards)} news article cards")

    for i, card in enumerate(news_cards):
        try:
            # Link
            link = card.get_attribute('href') or ''
            if link and not link.startswith('http'):
                link = f"https://arcraiders.com{link}"

            # Title
            title_element = card.query_selector('div[class*="news-article-card_title"]')
            title = title_element.inner_text().strip() if title_element else ''

            # Date
            date_element = card.query_selector('div[class*="news-article-card_date"]')
            date_str = date_element.inner_text().strip() if date_element else ''
            if date_str:
                try:
                    parsed_date = datetime.strptime(date_str, '%B %d, %Y')
                    date_str = parsed_date.strftime('%Y-%m-%d')
                except:
                    date_str = datetime.now().strftime('%Y-%m-%d')

            # Skip if missing essential data
            if not title or not link:
                continue

            print(f"Item {i}: Title='{title}', Date='{date_str}', Link='{link}'")

            # Fetch full article content
            full_content = ''
            summary = ''
            try:
                article_page = browser.new_page()
                article_page.goto(link, wait_until='networkidle', timeout=30000)
                content_element = article_page.query_selector('div[class*="article-content"], div[class*="content"], article')
                if content_element:
                    full_content = content_element.inner_html()
                    first_p = content_element.query_selector('p')
                    if first_p:
                        summary = first_p.inner_text().strip()[:200]
                article_page.close()
            except Exception as e:
                print(f"Error fetching full content: {e}")
                full_content = '<p>Full content not available.</p>'

            # Decide where to put it
            if "Patch Notes" in title or "Hotfix" in title or "Update" in title:
                target = patches
                print(f" -> Patch Notes: {title}")
            else:
                target = news
                print(f" -> News: {title}")

            # Add if not duplicate
            if not any(n['title'] == title or n.get('link') == link for n in target):
                target.append({
                    "title": title,
                    "date": date_str,
                    "summary": summary or title,
                    "link": link,
                    "isLatest": i == 0,
                    "fullContent": full_content
                })
                print(f" Added to {'patches.json' if target is patches else 'news.json'}")
        except Exception as e:
            print(f"Error processing item {i}: {e}")
            continue

    browser.close()

# Sort by date (newest first)
patches.sort(key=lambda x: x.get('date', ''), reverse=True)
news.sort(key=lambda x: x.get('date', ''), reverse=True)

# Save
with open('patches.json', 'w', encoding='utf-8') as f:
    json.dump(patches, f, indent=2, ensure_ascii=False)

with open('news.json', 'w', encoding='utf-8') as f:
    json.dump(news, f, indent=2, ensure_ascii=False)

print(f"\nUpdate complete! Saved {len(patches)} patches to patches.json and {len(news)} news to news.json")
