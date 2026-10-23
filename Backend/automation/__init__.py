"""
automation package — Modular voice and text automation for Jarvis AI.
Provides website launching, application execution, Google/YouTube search, and browser navigation.
"""

from .intentHandler import detect_and_execute_intent
from .websiteLauncher import open_website, SUPPORTED_WEBSITES
from .applicationLauncher import launch_application
from .browserController import execute_navigation, match_navigation_action
from .supportedAppsConfig import register_custom_app, DEFAULT_APPS


def PerformAction(command: str, language: str = "en") -> str:
    """
    Unified entry point for executing automation commands.
    Fully backward-compatible with legacy Automation.PerformAction(command).
    """
    clean = command.strip()

    # 1. Check for browser navigation
    nav_key, _ = match_navigation_action(clean)
    if nav_key:
        res = execute_navigation(nav_key, language=language)
        return res.get("response")

    # 2. Check for website opening
    if clean.lower().startswith("open website") or any(k in clean.lower() for k in SUPPORTED_WEBSITES):
        res = open_website(clean, language=language)
        return res.get("response")

    # 3. Check for application launching
    if clean.lower().startswith("open app") or any(k in clean.lower() for k in DEFAULT_APPS):
        res = launch_application(clean, language=language)
        return res.get("response")

    # 4. Fallback to direct intent detection
    res = detect_and_execute_intent(clean, language=language)
    if res:
        return res.get("response")

    return f"Executing {command}, sir."
