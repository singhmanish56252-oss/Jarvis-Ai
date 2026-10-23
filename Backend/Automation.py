"""
Automation.py — Legacy compatibility wrapper routing to modular automation package.
Preserves existing functions while delivering fast, safe voice-controlled app and website automation.
"""

import webbrowser
from automation import (
    detect_and_execute_intent,
    open_website,
    launch_application,
    execute_navigation,
    PerformAction as ModularPerformAction
)


def OpenUrl(url: str):
    """Opens a URL in the default browser."""
    try:
        webbrowser.open(url)
    except Exception as e:
        print(f"[Automation OpenUrl Error] {e}")


def GoogleSearch(query: str) -> str:
    """Performs a Google Search with properly encoded query."""
    clean = query.replace("google search", "").replace("search google", "").replace("search", "").strip()
    if not clean:
        clean = query
    res = detect_and_execute_intent(f"search google for {clean}")
    return res.get("response") if res else f"Searching Google for {clean}"


def PlayYouTube(query: str) -> str:
    """Searches or plays video on YouTube with properly encoded query."""
    res = detect_and_execute_intent(f"play {query} on youtube")
    return res.get("response") if res else f"Opening YouTube for {query}"


def PerformAction(command: str, language: str = "en") -> str:
    """Executes general automation action via modular automation package."""
    return ModularPerformAction(command, language=language)
