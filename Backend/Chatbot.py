import re
import sys
import Model
import Automation
import RealtimeSearchEngine
import ImageGeneration

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

def safe_log(msg: str):
    try:
        print(msg)
    except Exception:
        try:
            print(msg.encode("ascii", errors="backslashreplace").decode("ascii"))
        except Exception:
            pass

# Track active conversation language across turns: "en", "hi", "hinglish"
CURRENT_LANGUAGE = "en"

# Devanagari Unicode regex range
DEVANAGARI_REGEX = re.compile(r'[\u0900-\u097F]')

# Distinctive Hinglish words (strictly avoiding common English homographs)
HINGLISH_VOCABULARY = {
    'kya', 'kaise', 'kaisa', 'kaisi', 'karo', 'karna', 'karke', 'raha', 'rahi', 'rahe',
    'hai', 'hain', 'tha', 'thi', 'hoga', 'hogi', 'hoge', 'batao', 'bolo', 'baat',
    'chahiye', 'nahi', 'nahin', 'mat', 'kyun', 'kyu', 'kab', 'kahan', 'kidhar', 'kitna', 'kitni',
    'kaun', 'kisko', 'kiska', 'mein', 'hum', 'humein', 'tum', 'tumhe', 'aap', 'aapko', 'aapka',
    'aapki', 'mera', 'meri', 'mere', 'mujhe', 'apna', 'apni', 'apne', 'yeh', 'theek', 'accha',
    'achha', 'suno', 'kholo', 'chalao', 'dikhao', 'sunao', 'mausam', 'samachar', 'khabar',
    'taza', 'taaza', 'aaj', 'kal', 'madad', 'sahayata', 'namaste', 'shukriya', 'dhanyawad',
    'kuch', 'kuchh', 'bahut', 'thoda', 'thodi', 'sab', 'sabhi', 'log', 'dost', 'bhai', 'yaar',
    'banao', 'bana', 'banaiye', 'dijiye', 'lijiye', 'kijiye', 'bataiye', 'jawab', 'sawal',
    'chal', 'raha'
}

# Define system persona and context
JARVIS_PERSONA = """
System Name: JARVIS (Mark-VII)
Role: Advanced Multilingual AI Assistant for PC Automation and Conversations.
Personality: Professional, brilliant, polite, and slightly witty (Tony Stark's trusted AI). Always address the user respectfully as 'Sir' or 'sir'.
Languages Supported: English, Hindi (हिंदी), and Hinglish (Roman Hindi).

Core Language Rules:
1. When communicating in Hindi: Respond naturally and fluently in Hindi using Devanagari script (e.g., 'जी सर, बिल्कुल...', 'मैं आपकी सहायता के लिए तैयार हूँ।').
2. When communicating in Hinglish: Respond naturally in Roman Hindi (e.g., 'Ji sir, main bilkul theek hoon. Aap batayein, aaj main aapki kya madad kar sakta hoon?').
3. When communicating in English: Respond in sophisticated, clear English ('Certainly, sir. Standing by.').
4. CRITICAL AUTOMATION RULE: All 'ACTION:' prefixes and system commands MUST REMAIN STRICTLY IN ENGLISH, regardless of the conversation language. The conversational text following or preceding it should match the user's language.

Command Mapping:
- ACTION: Open Website [Website Name or URL]
- ACTION: Open App [App Name]
- ACTION: Open Folder [Folder Name]
- ACTION: Search Google [query]
- ACTION: Play YouTube [video name]
- ACTION: Browser Refresh
- ACTION: Browser Back
- ACTION: Browser Forward
- ACTION: Browser Scroll Down
- ACTION: Browser Scroll Up
- ACTION: Browser New Tab
- ACTION: Browser Close Tab
- ACTION: Search Web [query] — Use this when the user asks for LIVE, REAL-TIME, or CURRENT information from the web.
- ACTION: Generate Image [description in English] — Use this when the user wants to generate or draw an image.

Multilingual Action Examples:
- User (English): "Jarvis, open instagram."
  Response: "ACTION: Open Website Instagram. Opening Instagram for you, sir."

- User (Hindi): "जार्विस, यूट्यूब खोलो"
  Response: "ACTION: Open Website YouTube. जी सर, मैं आपके लिए यूट्यूब खोल रहा हूँ।"

- User (Hinglish): "Jarvis, YouTube open karo"
  Response: "ACTION: Open Website YouTube. Ji sir, main aapke liye YouTube open kar raha hoon."

- User (Hinglish): "Browser refresh karo"
  Response: "ACTION: Browser Refresh. Ji sir, browser refresh kar raha hoon."

- User (English): "Scroll down"
  Response: "ACTION: Browser Scroll Down. Scrolling down for you, sir."

- User (Hinglish): "Google par React JS interview questions search karo"
  Response: "ACTION: Search Google React JS interview questions. Google par search kar raha hoon, sir."

- User (Hinglish): "YouTube par Java tutorial search karo"
  Response: "ACTION: Play YouTube Java tutorial. YouTube par Java tutorial open kar raha hoon, sir."

- User (Hinglish): "Aaj ka weather kaisa hai?"
  Response: "ACTION: Search Web current weather today. Main live weather check kar raha hoon, sir."

- User (Hindi): "एक रोबोट की फोटो बनाओ"
  Response: "ACTION: Generate Image a futuristic cyberpunk robot with neon lights. जी सर, मैं आपके लिए रोबोट की इमेज तैयार कर रहा हूँ।"
"""

# Keywords that suggest real-time / live information across languages
REALTIME_KEYWORDS = [
    "latest", "current", "today", "right now", "live", "recent",
    "breaking news", "news", "stock price", "weather", "score",
    "search the web", "search online", "look up", "find out",
    "what happened", "trending", "update", "new release",
    "this week", "this month", "2024", "2025", "2026",
    # Hinglish & Hindi keywords
    "aaj", "aaj ka", "aaj ki", "mausam", "samachar", "khabar",
    "taaza", "taza", "haal", "aaj ki khabar",
    "आज", "मौसम", "समाचार", "खबर", "ताज़ा", "ताजा", "हालचाल"
]

# Keywords that suggest image generation across languages
IMAGE_KEYWORDS = [
    "generate image", "generate an image", "create image", "create an image",
    "draw an image", "draw me", "generate picture", "paint a picture", "make an image",
    # Hinglish & Hindi keywords
    "photo banao", "image banao", "picture banao", "tasveer banao",
    "photo generate karo", "image generate karo", "chitra banao",
    "फोटो बनाओ", "इमेज बनाओ", "तस्वीर बनाओ", "चित्र बनाओ"
]


def check_language_switch_command(text: str) -> str | None:
    """Detect if the user explicitly commanded a language switch."""
    t = text.lower().strip()
    # Check English switch
    if re.search(r'(speak in english|english mein|english me|switch to english|talk in english|अंग्रेजी में|इंग्लिश में|english bolo)', t):
        return 'en'
    # Check Hindi switch
    if re.search(r'(speak in hindi|hindi mein|hindi me|switch to hindi|talk in hindi|हिंदी में|हिन्दी में|hindi bolo)', t):
        return 'hi'
    # Check Hinglish switch
    if re.search(r'(speak in hinglish|hinglish mein|hinglish me|switch to hinglish|talk in hinglish|हिंग्लिश में|hinglish bolo)', t):
        return 'hinglish'
    return None


def detect_language(text: str) -> str:
    """
    Detect whether the input is Hindi (Devanagari), Hinglish (Roman Hindi), or English.
    """
    if not text or not text.strip():
        return CURRENT_LANGUAGE

    # 1. Devanagari script indicates Hindi
    if DEVANAGARI_REGEX.search(text):
        return "hi"

    # 2. Check for Hinglish vocabulary
    words = set(re.findall(r'[a-zA-Z]+', text.lower()))
    hinglish_matches = words.intersection(HINGLISH_VOCABULARY)
    if len(hinglish_matches) >= 1:
        return "hinglish"

    # 3. Check for typical English sentence patterns
    english_markers = {'the', 'what', 'who', 'where', 'when', 'why', 'how', 'is', 'are', 'can', 'could', 'would', 'should', 'please', 'tell'}
    if len(words.intersection(english_markers)) >= 1:
        return "en"

    # If ambiguous or neutral, maintain the current conversational language
    return CURRENT_LANGUAGE


def _needs_realtime_search(query: str) -> bool:
    """Check if the query likely needs real-time web data."""
    lower = query.lower()
    return any(keyword in lower for keyword in REALTIME_KEYWORDS)


def _needs_image_generation(query: str) -> bool:
    """Check if the query is an image generation command."""
    lower = query.lower()
    return any(keyword in lower for keyword in IMAGE_KEYWORDS)


def _extract_speech(text: str) -> str:
    """Extract a concise spoken sentence from a potentially long markdown answer."""
    clean = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)
    clean = re.sub(r'[*_#`]', '', clean).strip()
    sentences = re.split(r'(?<=[.!?।])\s+', clean)
    if sentences:
        spoken = sentences[0]
        if len(spoken) < 120 and len(sentences) > 1:
            spoken += " " + sentences[1]
        return spoken[:250]
    return clean[:250]


def ProcessCommand(user_query: str, language: str = None) -> dict:
    """
    Process user query and return a structured response dictionary:
    {
        "response": str,       # Complete text to display in UI
        "speech": str,         # Concise clean speech for local TTS
        "image_url": str|None, # Web/local URL to display generated image
        "action": str|None,    # Action command executed
        "language": str        # Active language ("en", "hi", "hinglish")
    }
    """
    global CURRENT_LANGUAGE

    clean_query = user_query.strip()

    # 1. Check for explicit language switch command
    explicit_lang = check_language_switch_command(clean_query)
    if explicit_lang:
        CURRENT_LANGUAGE = explicit_lang
        # If the command was purely switching language without additional question
        switch_patterns = [
            r'^(jarvis\s*,?\s*)?(hindi|hinglish|english)\s+(mein|me)\s+(baat\s+karo|bolo|jawab\s+do).*$',
            r'^(jarvis\s*,?\s*)?(speak|talk)\s+in\s+(hindi|hinglish|english).*$',
            r'^(jarvis\s*,?\s*)?switch\s+to\s+(hindi|hinglish|english).*$',
            r'^(jarvis\s*,?\s*)?(हिंदी|हिन्दी|हिंग्लिश|इंग्लिश|अंग्रेजी)\s+में\s+(बात\s+करो|बोलो|जवाब\s+दो).*$'
        ]
        is_pure_switch = any(re.match(pat, clean_query.lower()) for pat in switch_patterns)
        if is_pure_switch:
            if explicit_lang == "hi":
                msg = "जी सर, अब से मैं आपसे हिंदी में बात करूँगा। कहिए, मैं आपकी क्या सहायता कर सकता हूँ?"
                spoken = "जी सर, अब से मैं आपसे हिंदी में बात करूँगा।"
            elif explicit_lang == "hinglish":
                msg = "Ji sir, ab se main aapse Hinglish mein baat karunga. Kahiye, main aapki kya madad kar sakta hoon?"
                spoken = "Ji sir, ab se main aapse Hinglish mein baat karunga."
            else:
                msg = "Understood, sir. Switching to English. How may I assist you today?"
                spoken = "Understood, sir. Switching to English."

            return {
                "response": msg,
                "speech": spoken,
                "image_url": None,
                "action": "switch_language",
                "language": CURRENT_LANGUAGE
            }

    # 2. Determine conversation language
    if language and language != "auto":
        active_lang = language
        CURRENT_LANGUAGE = language
    elif explicit_lang:
        active_lang = explicit_lang
    else:
        active_lang = detect_language(clean_query)
        CURRENT_LANGUAGE = active_lang

    # 2.5 Fast Intent Automation Layer (< 50ms sub-second response)
    import automation
    fast_automation = automation.detect_and_execute_intent(clean_query, language=active_lang)
    if fast_automation:
        return {
            "response": fast_automation.get("response", ""),
            "speech": fast_automation.get("speech", fast_automation.get("response", "")),
            "image_url": None,
            "action": fast_automation.get("action"),
            "url": fast_automation.get("url"),
            "language": active_lang
        }

    # 3. Fallback: Image generation auto-detection
    if _needs_image_generation(clean_query):
        clean_prompt = clean_query
        for kw in IMAGE_KEYWORDS:
            clean_prompt = clean_prompt.lower().replace(kw, "").strip()
        clean_prompt = clean_prompt.replace("of", "", 1).strip() if clean_prompt.startswith("of") else clean_prompt
        clean_prompt = clean_prompt.replace("ki", "").replace("ek", "").replace("kisi", "").strip()
        if not clean_prompt:
            clean_prompt = user_query

        print(f"[Chatbot] Auto-detecting image generation. Prompt: '{clean_prompt}'")
        res = ImageGeneration.GenerateImage(clean_prompt)
        if res.get("status") == "success":
            image_url = f"http://localhost:8000/files/{res.get('file_name')}"
            if active_lang == "hi":
                resp_text = f"मैंने '{clean_prompt}' के लिए इमेज तैयार कर दी है, सर। यह स्क्रीन पर उपलब्ध है।"
                speech_text = f"मैंने इमेज तैयार कर दी है, सर।"
            elif active_lang == "hinglish":
                resp_text = f"Maine '{clean_prompt}' ke liye image generate kar di hai, sir. Aap screen par dekh sakte hain."
                speech_text = "Maine image generate kar di hai, sir."
            else:
                resp_text = f"I have generated the image for '{clean_prompt}', sir. It has been rendered and saved."
                speech_text = f"I have generated the image for {clean_prompt}, sir."

            return {
                "response": resp_text,
                "speech": speech_text,
                "image_url": image_url,
                "action": "generate_image",
                "language": active_lang
            }
        else:
            if active_lang == "hi":
                err_text = f"इमेज बनाने में कुछ समस्या आई: {res.get('error', 'अज्ञात त्रुटि')}"
            elif active_lang == "hinglish":
                err_text = f"Image generate karne mein issue aaya: {res.get('error', 'Unknown error')}"
            else:
                err_text = f"Image generation encountered an issue: {res.get('error', 'Unknown error')}."
            return {
                "response": err_text,
                "speech": err_text,
                "image_url": None,
                "action": "generate_image_error",
                "language": active_lang
            }

    # 4. Construct language guidance for Gemini
    if active_lang == "hi":
        lang_directive = (
            "LANGUAGE DIRECTIVE: You MUST answer strictly in Hindi using Devanagari script. "
            "Keep your polite and witty Jarvis persona ('जी सर...', 'बिल्कुल सर...'). "
            "If an action is needed, write 'ACTION: [Action in English]' on its own line, "
            "followed by your Hindi response."
        )
    elif active_lang == "hinglish":
        lang_directive = (
            "LANGUAGE DIRECTIVE: You MUST answer naturally in Hinglish (Hindi written in Roman/English alphabet, "
            "e.g., 'Ji sir, main bilkul theek hoon...'). Keep your polite and witty Jarvis persona. "
            "If an action is needed, write 'ACTION: [Action in English]' on its own line, "
            "followed by your Hinglish response."
        )
    else:
        lang_directive = (
            "LANGUAGE DIRECTIVE: Answer in clear, professional English with your sophisticated Jarvis persona. "
            "If an action is needed, prepend 'ACTION: [Action in English]'."
        )

    prompt = f"{JARVIS_PERSONA}\n\n{lang_directive}\n\nUser: {clean_query}\nJarvis:"

    # 5. Get response from Gemini
    raw_response = Model.GeminiResponse(prompt)

    # 6. Handle automation if triggered by the LLM
    if "ACTION:" in raw_response:
        action_parts = raw_response.split("ACTION:")
        action_command = action_parts[1].split(".")[0].strip()

        # Web search action
        if action_command.lower().startswith("search web"):
            search_query = action_command.replace("Search Web", "").replace("search web", "").strip()
            if not search_query:
                search_query = clean_query

            print(f"[Chatbot] Triggering Realtime Web Search: '{search_query}' (Language: {active_lang})")
            search_answer = RealtimeSearchEngine.SmartSearch(search_query, language=active_lang)
            return {
                "response": search_answer,
                "speech": _extract_speech(search_answer),
                "image_url": None,
                "action": "search_web",
                "language": active_lang
            }

        # Image generation action
        if action_command.lower().startswith("generate image"):
            img_prompt = action_command.replace("Generate Image", "").replace("generate image", "").strip()
            if not img_prompt:
                img_prompt = clean_query
            print(f"[Chatbot] Triggering Image Generation: '{img_prompt}'")
            res = ImageGeneration.GenerateImage(img_prompt)
            if res.get("status") == "success":
                image_url = f"http://localhost:8000/files/{res.get('file_name')}"
                if active_lang == "hi":
                    resp_text = f"मैंने '{img_prompt}' के लिए इमेज तैयार कर दी है, सर।"
                elif active_lang == "hinglish":
                    resp_text = f"Maine '{img_prompt}' ke liye image generate kar di hai, sir."
                else:
                    resp_text = f"I have generated the image for '{img_prompt}', sir. It has been rendered and saved."
                return {
                    "response": resp_text,
                    "speech": resp_text,
                    "image_url": image_url,
                    "action": "generate_image",
                    "language": active_lang
                }

        # System automation actions (open website, open app, etc.)
        Automation.PerformAction(action_command)
        clean_text = action_parts[0].strip() + " " + (action_parts[1].split(".", 1)[1].strip() if "." in action_parts[1] else "")
        if not clean_text.strip():
            if active_lang == "hi":
                clean_text = f"जी सर, {action_command} निष्पादित किया गया।"
            elif active_lang == "hinglish":
                clean_text = f"Ji sir, {action_command} open kar diya hai."
            else:
                clean_text = f"Executing {action_command} for you now, sir."

        return {
            "response": clean_text.strip(),
            "speech": clean_text.strip(),
            "image_url": None,
            "action": action_command,
            "language": active_lang
        }

    # 7. Fallback: Realtime web search auto-detection
    if _needs_realtime_search(clean_query):
        print(f"[Chatbot] Auto-detecting realtime query. Searching web for: '{clean_query}' (Language: {active_lang})")
        search_answer = RealtimeSearchEngine.SmartSearch(clean_query, language=active_lang)
        return {
            "response": search_answer,
            "speech": _extract_speech(search_answer),
            "image_url": None,
            "action": "search_web",
            "language": active_lang
        }

    return {
        "response": raw_response,
        "speech": _extract_speech(raw_response),
        "image_url": None,
        "action": "chat",
        "language": active_lang
    }


def GetResponse(user_query: str) -> str:
    """Legacy compatibility function returning the text response."""
    result = ProcessCommand(user_query)
    return result["response"]
