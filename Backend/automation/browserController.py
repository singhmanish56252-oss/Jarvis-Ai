"""
browserController.py — Browser navigation and control module for Jarvis AI.
Executes desktop browser shortcut keys safely via pyautogui and passes actions to frontend.
"""

import sys

try:
    import pyautogui
    pyautogui.FAILSAFE = False
    PYAUTOGUI_AVAILABLE = True
except ImportError:
    PYAUTOGUI_AVAILABLE = False


NAV_ACTIONS = {
    "refresh": {
        "aliases": ["refresh", "reload", "page refresh", "browser refresh", "रिफ्रेश करो", "पेज रिफ्रेश"],
        "hotkey": ("f5",),
        "desc_en": "Refreshing the browser page.",
        "desc_hi": "पेज रिफ्रेश कर रहा हूँ, सर।",
        "desc_hinglish": "Browser page refresh kar raha hoon, sir."
    },
    "back": {
        "aliases": ["go back", "back", "previous page", "peeche jao", "पीछे जाओ", "बैक करो"],
        "hotkey": ("alt", "left"),
        "desc_en": "Navigating back.",
        "desc_hi": "पिछले पेज पर जा रहा हूँ, सर।",
        "desc_hinglish": "Peeche wale page par ja raha hoon, sir."
    },
    "forward": {
        "aliases": ["go forward", "forward", "next page", "aage jao", "आगे जाओ", "फॉरवर्ड करो"],
        "hotkey": ("alt", "right"),
        "desc_en": "Navigating forward.",
        "desc_hi": "आगे के पेज पर जा रहा हूँ, सर।",
        "desc_hinglish": "Aage wale page par ja raha hoon, sir."
    },
    "new_tab": {
        "aliases": ["new tab", "open a new tab", "open new tab", "naya tab", "नया टैब", "नया टैब खोलो"],
        "hotkey": ("ctrl", "t"),
        "desc_en": "Opening a new browser tab.",
        "desc_hi": "नया ब्राउज़र टैब खोल रहा हूँ, सर।",
        "desc_hinglish": "Naya browser tab open kar raha hoon, sir."
    },
    "close_tab": {
        "aliases": ["close tab", "close this tab", "tab band karo", "टैब बंद करो", "क्लोज़ टैब"],
        "hotkey": ("ctrl", "w"),
        "desc_en": "Closing the current tab.",
        "desc_hi": "वर्तमान टैब बंद कर रहा हूँ, सर।",
        "desc_hinglish": "Current tab band kar raha hoon, sir."
    },
    "scroll_down": {
        "aliases": ["scroll down", "neeche scroll", "neeche jao", "नीचे स्क्रॉल करो", "नीचे जाओ"],
        "scroll": -600,
        "desc_en": "Scrolling down.",
        "desc_hi": "नीचे स्क्रॉल कर रहा हूँ, सर।",
        "desc_hinglish": "Neeche scroll kar raha hoon, sir."
    },
    "scroll_up": {
        "aliases": ["scroll up", "upar scroll", "upar jao", "ऊपर स्क्रॉल करो", "ऊपर जाओ"],
        "scroll": 600,
        "desc_en": "Scrolling up.",
        "desc_hi": "ऊपर स्क्रॉल कर रहा हूँ, सर।",
        "desc_hinglish": "Upar scroll kar raha hoon, sir."
    }
}


def match_navigation_action(query: str):
    """Match query against known navigation commands."""
    clean = query.lower().strip()
    for action_key, info in NAV_ACTIONS.items():
        for alias in info["aliases"]:
            if alias in clean or clean == alias:
                return action_key, info
    return None, None


def execute_navigation(action_key: str, language: str = "en") -> dict:
    """
    Executes a browser navigation command and returns structured action for frontend.
    """
    info = NAV_ACTIONS.get(action_key)
    if not info:
        return {
            "status": "error",
            "action": None,
            "response": "Unsupported browser navigation command.",
            "speech": "Unsupported navigation command, sir."
        }

    # Execute desktop level shortcut if available
    if PYAUTOGUI_AVAILABLE:
        try:
            if "hotkey" in info:
                pyautogui.hotkey(*info["hotkey"])
            elif "scroll" in info:
                pyautogui.scroll(info["scroll"])
        except Exception as e:
            print(f"[BrowserController PyAutoGUI Error] {e}")

    # Determine localized response
    if language == "hi":
        msg = f"जी सर, {info['desc_hi']}"
        speech = info['desc_hi']
    elif language == "hinglish":
        msg = f"Ji sir, {info['desc_hinglish']}"
        speech = info['desc_hinglish']
    else:
        msg = f"Certainly, sir. {info['desc_en']}"
        speech = info['desc_en']

    return {
        "status": "success",
        "action": f"browser_navigate:{action_key}",
        "response": msg,
        "speech": speech
    }
