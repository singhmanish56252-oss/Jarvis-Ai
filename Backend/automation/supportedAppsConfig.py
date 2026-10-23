"""
supportedAppsConfig.py — Configurable registry of supported desktop applications.
Validates applications on Windows and allows dynamic registration of custom apps.
"""

import os
import shutil
import sys

# Root directory of the Jarvis project
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

# Locate common browser executables
CHROME_PATHS = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    os.path.expanduser(r"~\AppData\Local\Google\Chrome\Application\chrome.exe"),
]
CHROME_PATH = next((p for p in CHROME_PATHS if os.path.exists(p)), None)

EDGE_PATHS = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
]
EDGE_PATH = next((p for p in EDGE_PATHS if os.path.exists(p)), None)

# Default registry of safe, verified desktop applications
DEFAULT_APPS = {
    "vscode": {
        "name": "Visual Studio Code",
        "aliases": ["vs code", "vscode", "code", "visual studio code", "वीएस कोड", "कोड"],
        "command": "code",
        "args": [],
        "type": "executable"
    },
    "project_vscode": {
        "name": "Jarvis Project in VS Code",
        "aliases": [
            "my project in vs code", "project in vs code", "project in code",
            "mera project", "project kholo", "project open karo", "open my project",
            "मेरा प्रोजेक्ट खोलो", "प्रोजेक्ट खोलो"
        ],
        "command": "code",
        "args": [PROJECT_ROOT],
        "type": "executable"
    },
    "notepad": {
        "name": "Notepad",
        "aliases": ["notepad", "note pad", "नोटपैड"],
        "command": "notepad",
        "args": [],
        "type": "executable"
    },
    "calculator": {
        "name": "Calculator",
        "aliases": ["calculator", "calc", "कैलकुलेटर", "हिसाब किताब"],
        "command": "calc",
        "args": [],
        "type": "executable"
    },
    "chrome": {
        "name": "Google Chrome",
        "aliases": ["chrome", "google chrome", "क्रोम", "गूगल क्रोम"],
        "command": CHROME_PATH if CHROME_PATH else "chrome",
        "args": [],
        "type": "executable"
    },
    "edge": {
        "name": "Microsoft Edge",
        "aliases": ["edge", "ms edge", "microsoft edge", "एज"],
        "command": EDGE_PATH if EDGE_PATH else "msedge",
        "args": [],
        "type": "executable"
    },
    "explorer": {
        "name": "File Explorer",
        "aliases": ["file explorer", "explorer", "files", "my computer", "this pc", "फ़ाइल एक्सप्लोरर", "फाइल एक्सप्लोरर"],
        "command": "explorer",
        "args": [],
        "type": "executable"
    },
    "terminal": {
        "name": "Windows Terminal / PowerShell",
        "aliases": ["terminal", "powershell", "cmd", "command prompt", "टर्मिनल", "कमांड प्रॉम्प्ट"],
        "command": "wt" if shutil.which("wt") else "powershell",
        "args": [],
        "type": "executable"
    },
    "taskmgr": {
        "name": "Task Manager",
        "aliases": ["task manager", "taskmgr", "टास्क मैनेजर"],
        "command": "taskmgr",
        "args": [],
        "type": "executable"
    },
    "paint": {
        "name": "Paint",
        "aliases": ["paint", "mspaint", "पेंट"],
        "command": "mspaint",
        "args": [],
        "type": "executable"
    },
    "settings": {
        "name": "Windows Settings",
        "aliases": ["settings", "windows settings", "सेटिंग्स"],
        "command": "ms-settings:",
        "args": [],
        "type": "protocol"
    },
    "whatsapp": {
        "name": "WhatsApp",
        "aliases": ["whatsapp", "whatsapp app", "व्हाट्सएप"],
        "command": "whatsapp:",
        "args": [],
        "type": "protocol"
    },
    "spotify": {
        "name": "Spotify",
        "aliases": ["spotify", "spotify app", "स्पॉटिफ़ाई"],
        "command": "spotify:",
        "args": [],
        "type": "protocol"
    }
}

# In-memory dictionary for user-registered custom apps
CUSTOM_APPS = {}


def register_custom_app(app_id: str, name: str, command: str, aliases: list[str] = None):
    """Allow adding custom desktop applications safely without shell injection."""
    CUSTOM_APPS[app_id.lower()] = {
        "name": name,
        "aliases": [a.lower() for a in (aliases or [name])],
        "command": command,
        "args": [],
        "type": "executable"
    }


def is_app_installed(app_info: dict) -> bool:
    """Check if the application is installed or can be launched on this system."""
    if sys.platform != "win32":
        return False

    app_type = app_info.get("type", "executable")
    if app_type == "protocol":
        # Windows protocols (e.g. ms-settings:, whatsapp:)
        return True

    cmd = app_info.get("command", "")
    if os.path.isabs(cmd):
        return os.path.exists(cmd)

    # Check in PATH
    return shutil.which(cmd) is not None
