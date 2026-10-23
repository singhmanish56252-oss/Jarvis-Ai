"""
websiteLauncher.py — Safe website launcher and URL validator for Jarvis AI.
Opens recognized websites and valid domains, and falls back to Google search for unknown names.
"""

import re
import urllib.parse
import webbrowser

# Verified catalog of popular websites (English + Hindi Devanagari)
SUPPORTED_WEBSITES = {
    "google": {"name": "Google", "url": "https://www.google.com"},
    "गूगल": {"name": "Google", "url": "https://www.google.com"},
    "youtube": {"name": "YouTube", "url": "https://www.youtube.com"},
    "यूट्यूब": {"name": "YouTube", "url": "https://www.youtube.com"},
    "युटुब": {"name": "YouTube", "url": "https://www.youtube.com"},
    "yt": {"name": "YouTube", "url": "https://www.youtube.com"},
    "instagram": {"name": "Instagram", "url": "https://www.instagram.com"},
    "इंस्टाग्राम": {"name": "Instagram", "url": "https://www.instagram.com"},
    "इन्स्टाग्राम": {"name": "Instagram", "url": "https://www.instagram.com"},
    "insta": {"name": "Instagram", "url": "https://www.instagram.com"},
    "whatsapp": {"name": "WhatsApp Web", "url": "https://web.whatsapp.com"},
    "whatsapp web": {"name": "WhatsApp Web", "url": "https://web.whatsapp.com"},
    "व्हाट्सएप": {"name": "WhatsApp Web", "url": "https://web.whatsapp.com"},
    "व्हाट्सऐप": {"name": "WhatsApp Web", "url": "https://web.whatsapp.com"},
    "facebook": {"name": "Facebook", "url": "https://www.facebook.com"},
    "फेसबुक": {"name": "Facebook", "url": "https://www.facebook.com"},
    "github": {"name": "GitHub", "url": "https://www.github.com"},
    "गिटहब": {"name": "GitHub", "url": "https://www.github.com"},
    "linkedin": {"name": "LinkedIn", "url": "https://www.linkedin.com"},
    "लिंक्डइन": {"name": "LinkedIn", "url": "https://www.linkedin.com"},
    "gmail": {"name": "Gmail", "url": "https://mail.google.com"},
    "जीमेल": {"name": "Gmail", "url": "https://mail.google.com"},
    "chatgpt": {"name": "ChatGPT", "url": "https://chatgpt.com"},
    "चैटजीपीटी": {"name": "ChatGPT", "url": "https://chatgpt.com"},
    "google maps": {"name": "Google Maps", "url": "https://maps.google.com"},
    "maps": {"name": "Google Maps", "url": "https://maps.google.com"},
    "मैप्स": {"name": "Google Maps", "url": "https://maps.google.com"},
    "spotify": {"name": "Spotify Web Player", "url": "https://open.spotify.com"},
    "स्पॉटिफ़ाई": {"name": "Spotify Web Player", "url": "https://open.spotify.com"},
    "twitter": {"name": "X (Twitter)", "url": "https://x.com"},
    "x": {"name": "X (Twitter)", "url": "https://x.com"},
    "ट्विटर": {"name": "X (Twitter)", "url": "https://x.com"},
    "reddit": {"name": "Reddit", "url": "https://www.reddit.com"},
    "netflix": {"name": "Netflix", "url": "https://www.netflix.com"},
    "नेटफ्लिक्स": {"name": "Netflix", "url": "https://www.netflix.com"},
    "amazon": {"name": "Amazon", "url": "https://www.amazon.com"},
    "अमेज़न": {"name": "Amazon", "url": "https://www.amazon.com"},
    "stackoverflow": {"name": "Stack Overflow", "url": "https://stackoverflow.com"},
    "wikipedia": {"name": "Wikipedia", "url": "https://www.wikipedia.org"}
}

# Regex to check if input is a valid domain or web URL
DOMAIN_REGEX = re.compile(
    r'^(https?:\/\/)?'
    r'([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+'
    r'[a-zA-Z]{2,63}'
    r'(:\d{1,5})?'
    r'(\/.*)?$',
    re.IGNORECASE
)


def resolve_website_url(site_query: str) -> tuple[str, str, bool]:
    """
    Resolves a website query to a safe URL.
    Returns: (target_url, display_name, is_search_fallback)
    """
    clean = site_query.lower().strip()
    
    # Strip greetings like 'hey jarvis', 'हे जार्विस'
    clean = re.sub(r'^(hey jarvis|hi jarvis|hello jarvis|jarvis|हे जार्विस|जार्विस|सुनो जार्विस|हे|hey|hi)\s*[,:]?\s*', '', clean, flags=re.IGNORECASE).strip()

    # Strip common command prefixes
    for prefix in [
        "open website", "open site", "open", "kholo", "khol do",
        "chalao", "खोलो", "खोल दो", "ओपन करो", "ओपन", "वेबसाइट खोलो", "chrome mein", "browser mein"
    ]:
        clean = clean.replace(prefix, "").strip()

    # 1. Match against known catalog (using word boundaries to avoid false positives like 'x' in 'unknownxyz')
    for key, site in sorted(SUPPORTED_WEBSITES.items(), key=lambda x: len(x[0]), reverse=True):
        pattern = r'\b' + re.escape(key) + r'\b'
        if re.search(pattern, clean):
            return site["url"], site["name"], False

    # 2. Check if user specified a domain (e.g. portfolio.com, dev.to, localhost:3000)
    if DOMAIN_REGEX.match(clean):
        url = clean if clean.startswith("http") else f"https://{clean}"
        return url, clean, False

    # 3. Safety fallback: If unknown website name, perform safe Google Search rather than guessing an unsafe domain
    encoded = urllib.parse.quote_plus(f"{clean} website")
    search_url = f"https://www.google.com/search?q={encoded}"
    return search_url, f"Google Search for '{clean}'", True


def open_website(site_query: str, language: str = "en") -> dict:
    """
    Opens the requested website or safe search fallback in default browser.
    """
    url, display_name, is_search = resolve_website_url(site_query)
    
    try:
        webbrowser.open(url)
    except Exception as e:
        print(f"[WebsiteLauncher Error] {e}")

    if is_search:
        if language == "hi":
            msg = f"'{site_query}' कोई प्रमाणित वेबसाइट नहीं मिली, इसलिए मैं आपके लिए गूगल पर इसे खोज रहा हूँ।"
            speech = f"मैं गूगल पर {site_query} खोज रहा हूँ, सर।"
        elif language == "hinglish":
            msg = f"'{site_query}' verified website list mein nahi mila. Main aapke liye Google par search kar raha hoon, sir."
            speech = f"Main Google par {site_query} search kar raha hoon, sir."
        else:
            msg = f"I could not verify a direct website matching '{site_query}', so I have searched for it on Google, sir."
            speech = f"Searching Google for {site_query}, sir."
    else:
        if language == "hi":
            msg = f"जी सर, आपके लिए {display_name} खोल रहा हूँ।"
            speech = f"जी सर, {display_name} खोल रहा हूँ।"
        elif language == "hinglish":
            msg = f"Ji sir, aapke liye {display_name} open kar raha hoon."
            speech = f"Ji sir, {display_name} open kar raha hoon."
        else:
            msg = f"Opening {display_name} for you now, sir."
            speech = f"Opening {display_name}, sir."

    return {
        "status": "success",
        "url": url,
        "name": display_name,
        "is_search": is_search,
        "response": msg,
        "speech": speech
    }
