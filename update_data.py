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

# Official news page
NEWS_URL = 'https://arcraiders.com/news'

news = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    
    print(f"Navigating to {NEWS_URL}...")
    page.goto(NEWS_URL, wait_until='networkidle', timeout=60000)

    # Scroll to load all content
    print("Scrolling to load dynamic content...")
    for _ in range(5):
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(2000)

    # Target the specific news article card containers
    # The site uses class names like: news-article-card_container__xsniv
    news_cards = page.query_selector_all('a[class*="news-article-card_container"]')
    
    print(f"Found {len(news_cards)} news article cards")

    for i, card in enumerate(news_cards):
        try:
            # Get the link directly from the card (it's an <a> tag)
            link = card.get_attribute('href') or ''
            if link and not link.startswith('http'):
                link = f"https://arcraiders.com{link}"

            # Title - look for the title div inside the card
            title_element = card.query_selector('div[class*="news-article-card_title"]')
            title = title_element.inner_text().strip() if title_element else ''

            # Date - look for the date div inside the card
            date_element = card.query_selector('div[class*="news-article-card_date"]')
            date_str = date_element.inner_text().strip() if date_element else ''
            
            # Parse date to standard format
            if date_str:
                try:
                    parsed_date = datetime.strptime(date_str, '%B %d, %Y')
                    date_str = parsed_date.strftime('%Y-%m-%d')
                except:
                    date_str = datetime.now().strftime('%Y-%m-%d')

            # Tags/Category
            tags_element = card.query_selector('div[class*="news-article-card_tags"]')
            tags = tags_element.inner_text().strip() if tags_element else ''

            # Image
            img_element = card.query_selector('img')
            image = img_element.get_attribute('src') if img_element else ''

            print(f"Item {i}: Title='{title}', Date='{date_str}', Link='{link}'")

            # Skip if missing essential data
            if not title or not link:
                print(f"  Skipping - missing title or link")
                continue

            # Fetch full article content
            full_content = ''
            summary = ''
            try:
                print(f"  Fetching full content from {link}...")
                article_page = browser.new_page()
                article_page.goto(link, wait_until='networkidle', timeout=30000)
                
                # Get the article content
                content_element = article_page.query_selector('div[class*="article-content"], div[class*="content"], article')
                if content_element:
                    full_content = content_element.inner_html()
                    # Get first paragraph as summary
                    first_p = content_element.query_selector('p')
                    if first_p:
                        summary = first_p.inner_text().strip()[:200]
                
                article_page.close()
            except Exception as e:
                print(f"  Error fetching full content: {e}")
                full_content = '<p>Full content not available.</p>'

            news.append({
                "title": title,
                "date": date_str,
                "summary": summary or title,
                "link": link,
                "image": image,
                "tags": tags,
                "isLatest": i == 0,
                "fullContent": full_content
            })
            print(f"  Added: {title}")

        except Exception as e:
            print(f"Error processing item {i}: {e}")
            continue

    browser.close()

# Sort by date (newest first)
news.sort(key=lambda x: x.get('date', ''), reverse=True)

# Mark only the first as latest
for i, item in enumerate(news):
    item['isLatest'] = i == 0

# Save updated news.json
with open('news.json', 'w', encoding='utf-8') as f:
    json.dump(news, f, indent=2, ensure_ascii=False)

print(f"\nNews update complete! Saved {len(news)} articles to news.json")
