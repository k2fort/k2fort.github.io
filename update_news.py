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
NEWS_URL = 'https://arcraiders.com/news'

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    print("Loading news page...")
    page.goto(NEWS_URL, wait_until='networkidle', timeout=60000)

    for i in range(5):
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(2000)

    news_cards = page.query_selector_all('a[class*="news-article-card_container"]')
    print(f"Found {len(news_cards)} news article cards\n")

    for idx, card in enumerate(news_cards):
        try:
            link = card.get_attribute('href') or ''
            if link and not link.startswith('http'):
                link = f"https://arcraiders.com{link}"

            title_element = card.query_selector('div[class*="news-article-card_title"]')
            title = title_element.inner_text().strip() if title_element else ''

            date_element = card.query_selector('div[class*="news-article-card_date"]')
            date_str = date_element.inner_text().strip() if date_element else ''
            if date_str:
                try:
                    parsed_date = datetime.strptime(date_str, '%B %d, %Y')
                    date_str = parsed_date.strftime('%Y-%m-%d')
                except:
                    date_str = datetime.now().strftime('%Y-%m-%d')

            if not title or not link: continue

            full_content = ''
            summary = title
            
            # Fetch full article
            article_page = browser.new_page()
            article_page.goto(link, wait_until='networkidle', timeout=30000)
            article_page.wait_for_timeout(2000)
            
            content_element = article_page.query_selector('article') or article_page.query_selector('div[class*="article"]')
            if content_element:
                full_content = content_element.inner_html()
                first_p = content_element.query_selector('p')
                if first_p:
                    summary = first_p.inner_text().strip()[:250] + "..."
            
            article_page.close()

            is_patch = any(kw in title.lower() for kw in ['patch', 'hotfix', 'update', 'notes'])
            target = patches if is_patch else news
            
            existing = next((item for item in target if item['title'] == title or item.get('link') == link), None)
            if not existing:
                target.append({"title": title, "date": date_str, "summary": summary, "link": link, "fullContent": full_content})
            
            time.sleep(1)
        except Exception as e:
            print(f"Error: {e}")

    browser.close()

# Save
for lst in [patches, news]:
    lst.sort(key=lambda x: x.get('date', ''), reverse=True)
    for i, item in enumerate(lst): item['isLatest'] = (i == 0)

with open('patches.json', 'w', encoding='utf-8') as f: json.dump(patches, f, indent=2, ensure_ascii=False)
with open('news.json', 'w', encoding='utf-8') as f: json.dump(news, f, indent=2, ensure_ascii=False)
print("News and patches updated.")
