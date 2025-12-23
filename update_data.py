import json
import os
from datetime import datetime
from playwright.sync_api import sync_playwright
import time

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
    
    print("Loading news page...")
    page.goto(NEWS_URL, wait_until='networkidle', timeout=60000)

    # Scroll to load all content
    for i in range(5):
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(2000)

    # Get all news article cards
    news_cards = page.query_selector_all('a[class*="news-article-card_container"]')
    print(f"Found {len(news_cards)} news article cards\n")

    for idx, card in enumerate(news_cards):
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
                print(f"Skipping item {idx}: Missing title or link")
                continue

            print(f"[{idx+1}/{len(news_cards)}] Processing: {title}")

            # Fetch full article content
            full_content = ''
            summary = title  # Default summary
            
            try:
                print(f"  -> Fetching content from {link}")
                article_page = browser.new_page()
                article_page.goto(link, wait_until='networkidle', timeout=30000)
                
                # Wait for content to load
                article_page.wait_for_timeout(2000)
                
                # Try multiple selectors to find the main content
                content_selectors = [
                    'article',
                    'div[class*="article"]',
                    'div[class*="content"]',
                    'main',
                    'div[class*="post"]',
                    '.article-body',
                    '.post-content'
                ]
                
                content_element = None
                for selector in content_selectors:
                    content_element = article_page.query_selector(selector)
                    if content_element:
                        print(f"  -> Found content with selector: {selector}")
                        break
                
                if content_element:
                    # Get the full HTML content
                    full_content = content_element.inner_html()
                    
                    # Extract summary from first paragraph
                    first_p = content_element.query_selector('p')
                    if first_p:
                        summary_text = first_p.inner_text().strip()
                        summary = summary_text[:250] + '...' if len(summary_text) > 250 else summary_text
                    
                    print(f"  -> Content fetched successfully ({len(full_content)} chars)")
                else:
                    # Fallback: get all body content
                    body = article_page.query_selector('body')
                    if body:
                        full_content = body.inner_html()
                        print(f"  -> Using body content as fallback ({len(full_content)} chars)")
                    else:
                        full_content = '<p>Content could not be fetched. Please visit the official link.</p>'
                        print(f"  -> Failed to fetch content")
                
                article_page.close()
                
            except Exception as e:
                print(f"  -> Error fetching full content: {e}")
                full_content = f'<p>Content could not be loaded. <a href="{link}" target="_blank">Visit official page</a></p>'

            # Decide where to put it (patch notes or news)
            is_patch = any(keyword in title.lower() for keyword in ['patch', 'hotfix', 'update', 'notes'])
            target = patches if is_patch else news
            target_name = 'patches.json' if is_patch else 'news.json'
            
            print(f"  -> Category: {'Patch Notes' if is_patch else 'News'}")

            # Check for duplicates
            existing = next((item for item in target if item['title'] == title or item.get('link') == link), None)
            
            if existing:
                # Update existing entry if content is better
                if len(full_content) > len(existing.get('fullContent', '')):
                    existing['fullContent'] = full_content
                    existing['summary'] = summary
                    existing['date'] = date_str
                    print(f"  -> Updated existing entry in {target_name}")
                else:
                    print(f"  -> Already exists in {target_name}, skipping")
            else:
                # Add new entry
                target.append({
                    "title": title,
                    "date": date_str,
                    "summary": summary,
                    "link": link,
                    "isLatest": idx == 0,
                    "fullContent": full_content
                })
                print(f"  -> Added to {target_name}")
            
            print()  # Empty line for readability
            
            # Small delay to avoid overwhelming the server
            time.sleep(1)
            
        except Exception as e:
            print(f"Error processing item {idx}: {e}\n")
            continue

    browser.close()

# Sort by date (newest first)
patches.sort(key=lambda x: x.get('date', ''), reverse=True)
news.sort(key=lambda x: x.get('date', ''), reverse=True)

# Mark only the first item as latest
for i, item in enumerate(patches):
    item['isLatest'] = (i == 0)
for i, item in enumerate(news):
    item['isLatest'] = (i == 0)

# Save
with open('patches.json', 'w', encoding='utf-8') as f:
    json.dump(patches, f, indent=2, ensure_ascii=False)

with open('news.json', 'w', encoding='utf-8') as f:
    json.dump(news, f, indent=2, ensure_ascii=False)

print(f"\n{'='*60}")
print(f"Update complete!")
print(f"Patches: {len(patches)} items saved to patches.json")
print(f"News: {len(news)} items saved to news.json")
print(f"{'='*60}")

# Fetching Live Event Timers
import requests
print("\nFetching Live Event Timers...")
try:
    event_response = requests.get('https://metaforge.app/api/arc-raiders/event-timers', timeout=15)
    if event_response.status_code == 200:
        with open('events.json', 'w', encoding='utf-8') as f:
            json.dump(event_response.json(), f, indent=2)
        print("Success: events.json updated.")
    else:
        print(f"Failed to fetch events: Status {event_response.status_code}")
except Exception as e:
    print(f"Error updating events: {e}")
