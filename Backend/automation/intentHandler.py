"""
intentHandler.py — Fast, lightweight intent detection and dispatch layer for Jarvis AI.
Recognizes OPEN_WEBSITE, OPEN_APPLICATION, SEARCH_GOOGLE, SEARCH_YOUTUBE, and BROWSER_NAVIGATION.
Provides sub-50ms responses for common automation commands in English, Hindi, and Hinglish.
"""

import re
import urllib.parse
import webbrowser
from .websiteLauncher import open_website, SUPPORTED_WEBSITES
from .applicationLauncher import launch_application
from .browserController import match_navigation_action, execute_navigation


def extract_google_search_query(text: str) -> str:
    """Extract clean search query from Google search commands in EN, HI, Hinglish."""
    q = text.strip()
    for kw in [
        "google par search karo", "google pe search karo", "google par dhoondo",
        "search google for", "search google", "google search for", "google search",
        "search on google for", "search for", "google par", "google pe", "on google",
        "in google", "search karo", "khojo", "dhoondo",
        "गूगल पर सर्च करो", "गूगल पर खोजो", "गूगल पर", "सर्च करो", "खोजो"
    ]:
        q = re.sub(re.escape(kw), "", q, flags=re.IGNORECASE).strip()
    return q.strip(" .?!'\":-")


def extract_youtube_search_query(text: str) -> str:
    """Extract clean video / search topic from YouTube commands."""
    q = text.strip()
    for kw in [
        "youtube par search karo", "youtube pe search karo", "youtube par chalao",
        "youtube par play karo", "youtube par dhoondo", "youtube par dekho",
        "search youtube for", "youtube search for", "youtube search",
        "play on youtube", "play youtube", "open on youtube", "on youtube",
        "youtube par", "youtube pe", "search karo", "chalao", "dhoondo",
        "यूट्यूब पर सर्च करो", "यूट्यूब पर चलाओ", "यूट्यूब पर खोजो", "यूट्यूब पर"
    ]:
        q = re.sub(re.escape(kw), "", q, flags=re.IGNORECASE).strip()
    return q.strip(" .?!'\":-")


def detect_and_execute_intent(query: str, language: str = "en") -> dict | None:
    """
    Evaluates query for high-priority automation intents.
    Returns structured response dictionary if matched, or None to fall back to general LLM.
    """
    clean = query.lower().strip()
    # Strip polite greetings in English and Hindi
    clean_stripped = re.sub(
        r'^(hey jarvis|hi jarvis|hello jarvis|jarvis|हे जार्विस|जार्विस|सुनो जार्विस|हे|सुनो|hey|hi|hello|please|bhai|yaar)\s*[,:]?\s*',
        '',
        clean,
        flags=re.IGNORECASE
    ).strip()

    # 1. BROWSER NAVIGATION INTENT
    nav_key, _ = match_navigation_action(clean_stripped)
    if nav_key:
        return execute_navigation(nav_key, language=language)

    # 2. SEARCH GOOGLE INTENT
    is_google_search = any(kw in clean_stripped for kw in [
        "google par", "google pe", "search google", "google search",
        "on google", "in google", "गूगल पर", "गूगल सर्च"
    ])
    if is_google_search and not clean_stripped.startswith("open google"):
        target_query = extract_google_search_query(clean_stripped)
        if not target_query:
            target_query = "Google"

        encoded = urllib.parse.quote_plus(target_query)
        search_url = f"https://www.google.com/search?q={encoded}"
        try:
            webbrowser.open(search_url)
        except Exception:
            pass

        if language == "hi":
            msg = f"जी सर, गूगल पर '{target_query}' खोज रहा हूँ।"
            speech = f"गूगल पर {target_query} खोज रहा हूँ, सर।"
        elif language == "hinglish":
            msg = f"Ji sir, Google par '{target_query}' search kar raha hoon."
            speech = f"Google par {target_query} search kar raha hoon, sir."
        else:
            msg = f"Searching Google for '{target_query}' now, sir."
            speech = f"Searching Google for {target_query}, sir."

        return {
            "status": "success",
            "action": f"search_google:{target_query}",
            "url": search_url,
            "response": msg,
            "speech": speech,
            "language": language
        }

    # 3. SEARCH YOUTUBE INTENT
    is_youtube_action = any(kw in clean_stripped for kw in [
        "youtube par", "youtube pe", "on youtube", "play youtube",
        "search youtube", "यूट्यूब पर"
    ])
    if is_youtube_action and not clean_stripped.startswith("open youtube"):
        video_topic = extract_youtube_search_query(clean_stripped)
        if not video_topic or video_topic in ["youtube", "video", "गाने"]:
            target_url = "https://www.youtube.com"
            action_desc = "YouTube"
        else:
            encoded = urllib.parse.quote_plus(video_topic)
            target_url = f"https://www.youtube.com/results?search_query={encoded}"
            action_desc = f"'{video_topic}' on YouTube"

        try:
            webbrowser.open(target_url)
        except Exception:
            pass

        if language == "hi":
            msg = f"जी सर, आपके लिए यूट्यूब पर {action_desc} खोल रहा हूँ।"
            speech = f"यूट्यूब पर {action_desc} खोल रहा हूँ, सर।"
        elif language == "hinglish":
            msg = f"Ji sir, aapke liye YouTube par {action_desc} open kar raha hoon."
            speech = f"YouTube par {action_desc} open kar raha hoon, sir."
        else:
            msg = f"Opening {action_desc} for you now, sir."
            speech = f"Opening {action_desc}, sir."

        return {
            "status": "success",
            "action": f"search_youtube:{action_desc}",
            "url": target_url,
            "response": msg,
            "speech": speech,
            "language": language
        }

    # 4. OPEN APPLICATION INTENT
    is_app_cmd = any(clean_stripped.startswith(prefix) for prefix in [
        "open app", "launch app", "start app", "open my project", "open project"
    ]) or any(kw in clean_stripped for kw in [
        "vs code", "vscode", "notepad", "calculator", "calc",
        "file explorer", "terminal", "powershell", "task manager",
        "taskmgr", "mspaint", "paint kholo", "calc chalao", "calculator chalao",
        "नोटपैड खोलो", "कैलकुलेटर चलाओ"
    ])

    # Check if user explicitly mentioned common desktop apps
    if is_app_cmd:
        app_res = launch_application(clean_stripped, language=language)
        if app_res.get("status") in ["success", "not_installed"]:
            return {
                "status": app_res.get("status"),
                "action": f"open_app:{app_res.get('app_name')}",
                "response": app_res.get("response"),
                "speech": app_res.get("speech"),
                "language": language
            }

    # 5. OPEN WEBSITE INTENT
    # Check for direct website triggers
    is_website_cmd = any(clean_stripped.startswith(prefix) for prefix in [
        "open website", "open site", "open", "kholo", "khol do", "खोलो", "खोल दो", "ओपन करो", "ओपन", "chalao", "चलाओ"
    ]) or any(k in clean_stripped for k in SUPPORTED_WEBSITES.keys()) or any(
        clean_stripped.endswith(suf) for suf in ["kholo", "khol do", "open karo", "खोलो", "खोल दो", "चलाओ"]
    )

    if is_website_cmd:
        # Avoid false positives with pure questions
        question_words = ["kya", "kaise", "kyun", "kab", "kahan", "what", "how", "why", "who", "when"]
        first_word = clean_stripped.split()[0] if clean_stripped.split() else ""
        if first_word not in question_words:
            web_res = open_website(clean_stripped, language=language)
            return {
                "status": "success",
                "action": f"open_website:{web_res.get('name')}",
                "url": web_res.get("url"),
                "response": web_res.get("response"),
                "speech": web_res.get("speech"),
                "language": language
            }

    # No fast automation intent detected; let LLM process conversational or complex requests
    return None
