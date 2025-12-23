import json
import os
from datetime import datetime
from playwright.sync_api import sync_playwright
import time

def load_json(file_path):
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

patches = load_json('patches.json')
news = load_json('news.json')
existing_links = {item['link'] for item in patches} | {item['link'] for item in news}

NEWS_URL = 'https://arcraiders.com/news'

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(user_agent="Mozilla/5.0")
    page = context.new_page()
    
    print("Fetching Arc Raiders News...")
    page.goto(NEWS_URL, wait_until='networkidle')

    # Get article cards
    news_cards = page.query_selector_all('a[class*="news-article-card_container"]')
    
    for card in news_cards:
        link = card.get_attribute('href')
        if not link.startswith('http'): link = f"https://arcraiders.com{link}"
        
        if link in existing_links:
            continue

        # Scrape detail page
        detail_page = context.new_page()
        detail_page.goto(link, wait_until='domcontentloaded')
        
        title = detail_page.query_selector('h1').inner_text()
        content_html = detail_page.query_selector('.payload-richtext').inner_html()
        date_text = detail_page.query_selector('div[class*="news-article-page_header"]').inner_text()

        new_entry = {
            "title": title.strip(),
            "date": datetime.now().strftime('%Y-%m-%d'),
            "summary": detail_page.query_selector('p').inner_text()[:150] + "...",
            "link": link,
            "fullContent": content_html
        }

        if "patch" in title.lower() or "hotfix" in title.lower():
            patches.append(new_entry)
        else:
            news.append(new_entry)
        
        print(f"Added: {title}")
        detail_page.close()
        time.sleep(1)

    browser.close()

# Save Files
with open('patches.json', 'w') as f: json.dump(patches[::-1], f, indent=2)
with open('news.json', 'w') as f: json.dump(news[::-1], f, indent=2)
