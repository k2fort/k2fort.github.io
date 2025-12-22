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

api_data = None  # Define outside the function

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    # Intercept network responses
    def handle_response(response):
        nonlocal api_data
        if 'news' in response.url and response.status == 200:
            try:
                api_data = response.json()
                print("Captured API response from:", response.url)
            except Exception as e:
                print("Failed to parse API response:", e)

    page.on("response", handle_response)

    page.goto(NEWS_URL, wait_until='networkidle', timeout=60000)

    # Wait for API call
    page.wait_for_timeout(10000)  # Wait 10s for API

    if api_data:
        print("API Data found:", api_data)
        # Process the real API data (adjust keys based on real response)
        for item in api_data.get('items', api_data.get('data', [])):
            title = item.get('title') or item.get('name') or 'Unknown Title'
            date_str = item.get('date') or item.get('published') or datetime.now().strftime('%Y-%m-%d')
            summary = item.get('excerpt') or item.get('summary') or item.get('description') or 'No summary'
            link = item.get('url') or item.get('slug') or ''
            if link and not link.startswith('http'):
                link = f"https://arcraiders.com{link}"

            full_content = item.get('content') or '<p>Full content not available.</p>'

            if not any(n['title'] == title or n.get('link') == link for n in news):
                news.append({
                    "title": title,
                    "date": date_str,
                    "summary": summary,
                    "link": link,
                    "isLatest": True,
                    "fullContent": full_content
                })
                print(f"Added new news: {title} ({date_str})")
    else:
        print("No API response captured. Site may not use API for news.")

    browser.close()

# Save updated news.json
with open('news.json', 'w', encoding='utf-8') as f:
    json.dump(news, f, indent=2, ensure_ascii=False)

print("News update complete. Changes saved.")
