import json
import os
from datetime import datetime
from playwright.sync_api import sync_playwright
import time

# Load existing data to avoid redundant scraping
def load_json(file_path):
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

patches = load_json('patches.json')
news = load_json('news.json')

# Create a set of existing links for fast lookup
existing_links = {item['link'] for item in patches} | {item['link'] for item in news}

# Official news page
NEWS_URL = 'https://arcraiders.com/news'

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36")
    page = context.new_page()
    
    print("Loading Arc Raiders news page...")
    try:
        page.goto(NEWS_URL, wait_until='networkidle', timeout=60000)
    except Exception as e:
        print(f"Failed to load main page: {e}")
        browser.close()
        exit(1)

    # Scroll to ensure all dynamic cards are loaded
    for i in range(3):
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(1500)

    # Targeted selector for the article cards
    news_cards = page.query_selector_all('a[class*="news-article-card_container"]')
    print(f"Found {len(news_cards)} news article cards\n")

    for idx, card in enumerate(news_cards):
        try:
            # 1. Extract Basic Metadata first
            link = card.get_attribute('href') or ''
            if link and not link.startswith('http'):
                link = f"https://arcraiders.com{link}"

            # Skip if we already have this article to save time/bandwidth
            if link in existing_links:
                print(f"[{idx+1}/{len(news_cards)}] Skipping: Already exists in database.")
                continue

            title_element = card.query_selector('div[class*="news-article-card_title"]')
            title = title_element.inner_text().strip() if title_element else 'Untitled'

            date_element = card.query_selector('div[class*="news-article-card_date"]')
            date_str = date_element.inner_text().strip() if date_element else ''
            
            # Standardize date format
            if date_str:
                try:
                    parsed_date = datetime.strptime(date_str, '%B %d, %Y')
                    date_iso = parsed_date.strftime('%Y-%m-%d')
                except:
                    date_iso = datetime.now().strftime('%Y-%m-%d')
            else:
                date_iso = datetime.now().strftime('%Y-%m-%d')

            print(f"[{idx+1}/{len(news_cards)}] Scraping New Article: {title}")

            # 2. Fetch Full Article Content
            full_content = ''
            summary = ''
            
            article_page = context.new_page()
            article_page.goto(link, wait_until='domcontentloaded', timeout=30000)
            
            # Arc Raiders specific CMS content selector
            # This targets the actual text payload rather than the whole body
            content_element = article_page.query_selector('.payload-richtext')
            
            if content_element:
                full_content = content_element.inner_html()
                # Get first paragraph for summary
                first_p = content_element.query_selector('p')
                if first_p:
                    summary = first_p.inner_text().strip()[:200] + "..."
            else:
                # Fallback to general article tag
                fallback = article_page.query_selector('article')
                full_content = fallback.inner_html() if fallback else "Content unavailable."
                summary = title

            article_page.close()

            # 3. Categorize and Store
            is_patch = any(kw in title.lower() for kw in ['patch', 'hotfix', 'update', 'notes'])
            target = patches if is_patch else news
            
            target.append({
                "title": title,
                "date": date_iso,
                "summary": summary,
                "link": link,
                "isLatest": False, # Will be set during sort
                "fullContent": full_content
            })
            
            time.sleep(1) # Polite delay
            
        except Exception as e:
            print(f"Error processing item {idx}: {e}")
            continue

    browser.close()

# Sort by date (newest first)
patches.sort(key=lambda x: x.get('date', ''), reverse=True)
news.sort(key=lambda x: x.get('date', ''), reverse=True)

# Update 'isLatest' flags
for i, item in enumerate(patches):
    item['isLatest'] = (i == 0)
for i, item in enumerate(news):
    item['isLatest'] = (i == 0)

# Save updated files
with open('patches.json', 'w', encoding='utf-8') as f:
    json.dump(patches, f, indent=2, ensure_ascii=False)

with open('news.json', 'w', encoding='utf-8') as f:
    json.dump(news, f, indent=2, ensure_ascii=False)

print(f"\nUpdate complete! Patches: {len(patches)} | News: {len(news)}")
