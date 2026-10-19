import os
import webbrowser
import pywhatkit
import datetime

def OpenUrl(url):
    try:
        success = webbrowser.open(url)
        if not success:
            os.system(f'start "" "{url}"')
    except Exception:
        os.system(f'start "" "{url}"')

# Function to search Google
def GoogleSearch(query):
    search_query = query.replace("google search", "").replace("search google", "").replace("search", "").strip()
    if not search_query: search_query = query
    OpenUrl(f"https://www.google.com/search?q={search_query.replace(' ', '+')}")
    return f"Searching Google for {search_query}"

# Function to play a video on YouTube
def PlayYouTube(query):
    video_name = query.replace("play youtube", "").replace("play", "").replace("on youtube", "").replace("youtube", "").strip()
    if video_name:
        OpenUrl(f"https://www.youtube.com/results?search_query={video_name.replace(' ', '+')}")
    else:
        OpenUrl("https://www.youtube.com")
    return f"Playing {video_name} on YouTube"

# Function to perform general automation tasks
def PerformAction(command):
    # Clean the command
    command = command.strip()
    lower_command = command.lower().replace("jarvis", "").replace("hey", "").replace("hi", "").strip()

    if lower_command.startswith("open website") or "open" in lower_command and ("youtube" in lower_command or "google" in lower_command or "instagram" in lower_command or "whatsapp" in lower_command or "linkedin" in lower_command):
        site = lower_command.replace("open website", "").replace("open", "").strip()
        if "instagram" in site:
            url = "https://www.instagram.com"
        elif "whatsapp" in site:
            url = "https://web.whatsapp.com"
        elif "linkedin" in site:
            url = "https://www.linkedin.com"
        elif "youtube" in site:
            url = "https://www.youtube.com"
        elif "google" in site:
            url = "https://www.google.com"
        else:
            if "." not in site:
                 url = f"https://www.{site}.com"
            elif not site.startswith("http"):
                 url = f"https://{site}"
            else:
                 url = site
        OpenUrl(url)
        return f"Opening Website {site}"


    elif lower_command.startswith("open app"):
        app = lower_command.replace("open app", "").strip()
        if "vscode" in app or "visual studio" in app:
            os.system("code")
        elif "whatsapp" in app:
            os.system("start whatsapp:")
        else:
            os.system(f"start {app}")
        return f"Opening App {app}"

    elif lower_command.startswith("open folder"):
        folder = command.lower().replace("open folder", "").strip()
        if "antigravity" in folder:
            # specifically open the antigravity artifact folder or parent
            os.system(r"explorer C:\Users\singh\.gemini\antigravity")
        else:
            # Use original casing for folder
            folder_orig = command[command.lower().find(folder):].strip() if folder else ""
            if os.path.exists(folder_orig):
                os.system(f'explorer "{folder_orig}"')
            else:
                os.system("explorer")
        return f"Opening folder {folder}"

    elif lower_command.startswith("search google"):
        return GoogleSearch(lower_command)

    elif lower_command.startswith("play youtube"):
        return PlayYouTube(lower_command)

    # --- Fallbacks to older commands if the LLM missed the prefix ---
    elif "google search" in lower_command or "search" in lower_command:
        return GoogleSearch(lower_command)
    
    elif "open youtube" in lower_command:
        webbrowser.open("https://www.youtube.com")
        return "Opening YouTube"
    
    elif "play" in lower_command and ("youtube" in lower_command or "song" in lower_command):
        return PlayYouTube(lower_command)

    elif "open google" in lower_command:
        webbrowser.open("https://www.google.com")
        return "Opening Google"

    elif "what" in lower_command and "time" in lower_command:
        now = datetime.datetime.now().strftime("%H:%M")
        return f"The current time is {now}"

    elif "what" in lower_command and "date" in lower_command:
        today = datetime.datetime.now().strftime("%B %d, %Y")
        return f"Today's date is {today}"
    
    else:
        # If altogether unknown, fallback is to google search
        return GoogleSearch(command)
