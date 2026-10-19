import re
import Model
import Automation
import RealtimeSearchEngine
import ImageGeneration

# Define system persona and context
JARVIS_PERSONA = """
System Name: JARVIS
Role: Advanced AI Assistant for PC Automation and Conversations.
Personality: Professional, helpful, slightly witty.
Capabilities: 
- Answer questions on any topic.
- Perform system automation: opening websites, opening applications, opening folders, or searching.
- Search the web for real-time, up-to-date information on current events, news, or live data.
- Generate high-quality AI images upon request.

Command Mapping (If the user asks for these, prepend 'ACTION:' to your response exactly like this):
- ACTION: Open Website [Website Name or URL]
- ACTION: Open App [App Name]
- ACTION: Open Folder [Folder Name]
- ACTION: Search Google [query]
- ACTION: Play YouTube [video name]
- ACTION: Search Web [query] — Use this when the user wants LIVE, REAL-TIME, or CURRENT information from the internet.
- ACTION: Generate Image [description] — Use this when the user wants to generate, create, or draw an image.

Examples:
User: "Jarvis, open instagram."
Response: "ACTION: Open Website Instagram. Opening Instagram for you, sir."

User: "What's the latest news on AI?"
Response: "ACTION: Search Web latest news on artificial intelligence. Let me search the web for that, sir."

User: "What is the current stock price of Tesla?"
Response: "ACTION: Search Web Tesla stock price today. Fetching live data for you, sir."

User: "Jarvis, generate an image of a futuristic neon city."
Response: "ACTION: Generate Image futuristic neon city. Generating that image for you now, sir."
"""

# Keywords that suggest the user wants real-time / live information
REALTIME_KEYWORDS = [
    "latest", "current", "today", "right now", "live", "recent",
    "breaking news", "news", "stock price", "weather", "score",
    "search the web", "search online", "look up", "find out",
    "what happened", "trending", "update", "new release",
    "this week", "this month", "2024", "2025", "2026"
]

# Keywords that suggest image generation
IMAGE_KEYWORDS = [
    "generate image", "generate an image", "create image", "create an image",
    "draw an image", "draw me", "generate picture", "paint a picture", "make an image"
]


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
    sentences = re.split(r'(?<=[.!?])\s+', clean)
    if sentences:
        spoken = sentences[0]
        if len(spoken) < 120 and len(sentences) > 1:
            spoken += " " + sentences[1]
        return spoken[:250]
    return clean[:250]


def ProcessCommand(user_query: str, language: str = "en") -> dict:
    """
    Process user query and return a structured response dictionary:
    {
        "response": str,       # Complete text to display in UI
        "speech": str,         # Concise clean speech for local TTS
        "image_url": str|None, # Web/local URL to display generated image
        "action": str|None     # Action command executed
    }
    language: "en" for English, "hi" for Hindi
    """
    # Determine language instruction for Gemini
    if language == "hi":
        lang_instruction = (
            "IMPORTANT: You MUST respond entirely in Hindi (Devanagari script). "
            "All explanations, replies, and action messages should be in Hindi. "
            "Only keep system keywords like ACTION:, Open Website, Search Web, Generate Image, etc. in English exactly as defined."
        )
    else:
        lang_instruction = "Respond in clear, professional English."

    # 1. Fallback: Image generation auto-detection
    if _needs_image_generation(user_query):
        clean_prompt = user_query
        for kw in IMAGE_KEYWORDS:
            clean_prompt = clean_prompt.lower().replace(kw, "").strip()
        clean_prompt = clean_prompt.replace("of", "", 1).strip() if clean_prompt.startswith("of") else clean_prompt
        if not clean_prompt:
            clean_prompt = user_query
        print(f"[Chatbot] Auto-detecting image generation. Prompt: '{clean_prompt}'")
        res = ImageGeneration.GenerateImage(clean_prompt)
        if res.get("status") == "success":
            image_url = f"http://localhost:8000/files/{res.get('file_name')}"
            return {
                "response": f"I have generated the image for '{clean_prompt}', sir. It has been rendered and saved.",
                "speech": f"I have generated the image for {clean_prompt}, sir.",
                "image_url": image_url,
                "action": "generate_image"
            }
        else:
            return {
                "response": f"Image generation encountered an issue: {res.get('error', 'Unknown error')}.",
                "speech": "I encountered an issue generating that image, sir.",
                "image_url": None,
                "action": "generate_image_error"
            }

    # 2. Prompt with persona context
    prompt = f"{JARVIS_PERSONA}\nUser: {user_query}\nJarvis:"
    
    # Get raw response from Gemini
    raw_response = Model.GeminiResponse(prompt)
    
    # Handle automation if triggered by the LLM
    if "ACTION:" in raw_response:
        action_parts = raw_response.split("ACTION:")
        action_command = action_parts[1].split(".")[0].strip()
        
        # Web search action
        if action_command.lower().startswith("search web"):
            search_query = action_command.replace("Search Web", "").replace("search web", "").strip()
            if not search_query:
                search_query = user_query
            
            print(f"[Chatbot] Triggering Realtime Web Search: '{search_query}'")
            search_answer = RealtimeSearchEngine.SmartSearch(search_query)
            return {
                "response": search_answer,
                "speech": _extract_speech(search_answer),
                "image_url": None,
                "action": "search_web"
            }
        
        # Image generation action
        if action_command.lower().startswith("generate image"):
            img_prompt = action_command.replace("Generate Image", "").replace("generate image", "").strip()
            if not img_prompt:
                img_prompt = user_query
            print(f"[Chatbot] Triggering Image Generation: '{img_prompt}'")
            res = ImageGeneration.GenerateImage(img_prompt)
            if res.get("status") == "success":
                image_url = f"http://localhost:8000/files/{res.get('file_name')}"
                return {
                    "response": f"I have generated the image for '{img_prompt}', sir. It has been rendered and saved.",
                    "speech": f"I have generated the image for {img_prompt}, sir.",
                    "image_url": image_url,
                    "action": "generate_image"
                }
            else:
                return {
                    "response": f"I attempted to generate the image, but encountered an issue: {res.get('error', 'Unknown error')}.",
                    "speech": "I encountered an issue generating that image, sir.",
                    "image_url": None,
                    "action": "generate_image_error"
                }
        
        # Other automation actions
        Automation.PerformAction(action_command)
        clean_text = action_parts[0].strip() + " " + (action_parts[1].split(".", 1)[1].strip() if "." in action_parts[1] else "")
        return {
            "response": clean_text.strip(),
            "speech": clean_text.strip(),
            "image_url": None,
            "action": action_command
        }
    
    # Fallback 3: Realtime web search auto-detection
    if _needs_realtime_search(user_query):
        print(f"[Chatbot] Auto-detecting realtime query. Searching web for: '{user_query}'")
        search_answer = RealtimeSearchEngine.SmartSearch(user_query)
        return {
            "response": search_answer,
            "speech": _extract_speech(search_answer),
            "image_url": None,
            "action": "search_web"
        }
    
    return {
        "response": raw_response,
        "speech": _extract_speech(raw_response),
        "image_url": None,
        "action": "chat"
    }


def GetResponse(user_query: str) -> str:
    """Legacy compatibility function returning the text response."""
    result = ProcessCommand(user_query)
    return result["response"]

