"""
applicationLauncher.py — Safe desktop application launcher for Windows.
Verifies that requested applications are installed and avoids arbitrary shell execution.
"""

import os
import subprocess
import sys
from .supportedAppsConfig import DEFAULT_APPS, CUSTOM_APPS, is_app_installed


def find_app_entry(query: str):
    """Match natural user query against registered application aliases."""
    clean_query = query.lower().strip()
    
    # Check custom apps first
    for app_id, info in CUSTOM_APPS.items():
        for alias in info.get("aliases", []):
            if alias in clean_query or clean_query in alias:
                return info

    # Check default apps
    for app_id, info in DEFAULT_APPS.items():
        for alias in info.get("aliases", []):
            if alias in clean_query or clean_query in alias:
                return info

    return None


def launch_application(app_query: str, language: str = "en") -> dict:
    """
    Safely launch an installed desktop application without arbitrary shell commands.
    Returns:
    {
        "status": "success" | "not_found" | "error",
        "app_name": str,
        "response": str,
        "speech": str
    }
    """
    clean_query = app_query.lower()
    for prefix in ["open app", "open", "launch", "start", "kholo", "chalao", "खोलो", "चलाओ", "खोल दो", "ओपन करो"]:
        clean_query = clean_query.replace(prefix, "").strip()

    app_entry = find_app_entry(clean_query if clean_query else app_query)

    if not app_entry:
        if language == "hi":
            msg = f"मुझे '{app_query}' नाम का कोई प्रमाणित एप्लिकेशन नहीं मिला, सर। कृपया नाम की पुष्टि करें।"
            speech = f"मुझे यह एप्लिकेशन नहीं मिला, सर।"
        elif language == "hinglish":
            msg = f"Mujhe '{app_query}' application nahi mila, sir. Kripya app ka exact naam specify karein."
            speech = f"Mujhe yeh application nahi mila, sir."
        else:
            msg = f"I could not locate an installed application matching '{app_query}', sir. Please specify the application name."
            speech = f"I could not locate that application, sir."

        return {
            "status": "not_found",
            "app_name": app_query,
            "response": msg,
            "speech": speech
        }

    # Verify installation
    if not is_app_installed(app_entry):
        app_name = app_entry.get("name")
        if language == "hi":
            msg = f"'{app_name}' आपके कंप्यूटर पर इंस्टॉल नहीं पाया गया, सर।"
            speech = f"{app_name} इंस्टॉल नहीं है, सर।"
        elif language == "hinglish":
            msg = f"'{app_name}' aapke computer par installed nahi mila, sir."
            speech = f"{app_name} installed nahi mila, sir."
        else:
            msg = f"'{app_name}' does not appear to be installed on your system, sir."
            speech = f"{app_name} is not installed, sir."

        return {
            "status": "not_installed",
            "app_name": app_name,
            "response": msg,
            "speech": speech
        }

    # Launch application securely
    app_name = app_entry.get("name")
    cmd = app_entry.get("command")
    args = app_entry.get("args", [])
    app_type = app_entry.get("type", "executable")

    try:
        if app_type == "protocol":
            # Windows URI scheme (e.g. ms-settings:, whatsapp:)
            os.system(f'start "" "{cmd}"')
        else:
            # Native subprocess execution without shell injection
            full_cmd = [cmd] + args
            # If command ends with .CMD or .BAT on Windows, run with shell=False via cmd.exe safely
            if str(cmd).lower().endswith(".cmd") or str(cmd).lower().endswith(".bat") or not os.path.isabs(str(cmd)):
                subprocess.Popen(full_cmd, shell=True)
            else:
                subprocess.Popen(full_cmd)

        if language == "hi":
            msg = f"जी सर, {app_name} शुरू कर रहा हूँ।"
            speech = f"जी सर, {app_name} शुरू कर रहा हूँ।"
        elif language == "hinglish":
            msg = f"Ji sir, {app_name} open kar raha hoon."
            speech = f"Ji sir, {app_name} open kar raha hoon."
        else:
            msg = f"Launching {app_name} for you now, sir."
            speech = f"Launching {app_name}, sir."

        return {
            "status": "success",
            "app_name": app_name,
            "response": msg,
            "speech": speech
        }

    except Exception as e:
        err_msg = f"Failed to launch {app_name}: {str(e)}"
        return {
            "status": "error",
            "app_name": app_name,
            "response": err_msg,
            "speech": f"Could not launch {app_name}, sir."
        }
