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

    # Scroll multiple times to load all dynamic content
    for _ in range(5):
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(3000)

    # Wait for real news titles
    try:
        page.wait_for_selector('h3:has-text("Cold Snap"), h3:has-text("Hotfix"), h3:has-text("Update")', timeout=60000)
        print("Real news titles loaded successfully")
    except Exception as e:
        print(f"Timeout waiting for real news titles: {e}")

    # Get all potential news cards
    news_items = page.query_selector_all('div[class*="news"], article, div[class*="card"], div[class*="post"]')

    print(f"Found {len(news_items)} potential news items")

    for i, item in enumerate(news_items):
        # Title
        title_element = item.query_selector('h3, h2, a, span[class*="title"]')
        title = title_element.inner_text().strip() if title_element else ''

        # Link
        link_element = item.query_selector('a[href]')
        link = link_element.get_attribute('href') if link_element else ''
        if link and not link.startswith('http'):
            link = f"https://arcraiders.com{link}"

        # Date
        date_element = item.query_selector('time, span[class*="date"], div[class*="date"]')
        date_str = date_element.inner_text().strip() if date_element else datetime.now().strftime('%Y-%m-%d')

        # Summary
        summary_element = item.query_selector('p, div[class*="excerpt"], div[class*="summary"]')
        summary = summary_element.inner_text().strip() if summary_element else ''

        # Skip placeholders
        if "Title" in title or not link or not summary:
            continue

        print(f"Item {i}: Title='{title}', Link='{link}', Date='{date_str}', Summary='{summary[:50]}...'")

        # Force add all items (no duplicate check for now)
        full_content = '<p>Full content not available.</p>'
        if link:
            try:
                full_response = requests.get(link, headers={'User-Agent': 'Mozilla/5.0'}, timeout=15)
                full_soup = BeautifulSoup(full_response.text, 'html.parser')
                content_div = full_soup.find('div', class_='news-content') or full_soup.find('article')
                if content_div:
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
        print(f"Added news: {title} ({date_str})")

    browser.close()

# Save updated news.json
with open('news.json', 'w', encoding='utf-8') as f:
    json.dump(news, f, indent=2, ensure_ascii=False)

print("News update complete. Changes saved.")
