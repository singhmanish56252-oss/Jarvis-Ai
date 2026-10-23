import pyttsx3
import threading
import queue
import re
import sys
import os

# Thread-safe speech queue and worker
_speech_queue = queue.Queue()
_worker_started = False
_lock = threading.Lock()

# Cached voice IDs
_VOICES = {"en": None, "hi": None, "hinglish": None}

def _discover_voices():
    """Discover installed SAPI5 and OneCore voices on Windows."""
    global _VOICES
    if _VOICES["en"] is not None:
        return _VOICES

    # 1. Inspect SAPI5 voices
    try:
        engine = pyttsx3.init('sapi5')
        sapi_voices = engine.getProperty('voices')
        for v in sapi_voices:
            vid = v.id.lower()
            vname = v.name.lower()
            if 'hindi' in vname or 'hiin' in vid or 'hemant' in vname or 'kalpana' in vname:
                if not _VOICES["hi"]:
                    _VOICES["hi"] = v.id
            elif 'ravi' in vname or 'heera' in vname or 'enin' in vid:
                if not _VOICES["hinglish"]:
                    _VOICES["hinglish"] = v.id
            elif not _VOICES["en"]:
                _VOICES["en"] = v.id
    except Exception as e:
        print(f"[TTS Voice Discovery Error] {e}")

    # 2. Check Windows OneCore voices in registry
    if sys.platform == "win32":
        try:
            import winreg
            k = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Speech_OneCore\Voices\Tokens")
            num_keys = winreg.QueryInfoKey(k)[0]
            for i in range(num_keys):
                sub = winreg.EnumKey(k, i)
                full_path = r"HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Speech_OneCore\Voices\Tokens\\" + sub
                sub_lower = sub.lower()
                # Prioritize Hemant (Male) then Kalpana
                if 'hemant' in sub_lower:
                    _VOICES["hi"] = full_path
                elif 'hiin' in sub_lower and not _VOICES["hi"]:
                    _VOICES["hi"] = full_path
                elif 'ravi' in sub_lower:
                    _VOICES["hinglish"] = full_path
                elif 'enin' in sub_lower and not _VOICES["hinglish"]:
                    _VOICES["hinglish"] = full_path
        except Exception:
            pass

    # Fallbacks if specific voices not found
    if not _VOICES["hinglish"]:
        _VOICES["hinglish"] = _VOICES["hi"] or _VOICES["en"]
    if not _VOICES["hi"]:
        _VOICES["hi"] = _VOICES["hinglish"] or _VOICES["en"]

    print(f"[TTS] Configured voices — EN: {_VOICES['en']}, HI: {_VOICES['hi']}, Hinglish: {_VOICES['hinglish']}")
    return _VOICES

def detect_voice_language(text: str) -> str:
    """Detect whether text is Hindi (Devanagari), Hinglish, or English for TTS voice routing."""
    if not text:
        return "en"
    # Devanagari script detection
    if re.search(r'[\u0900-\u097F]', text):
        return "hi"
    
    # Common Hinglish words
    hinglish_markers = {
        'kya', 'kaise', 'kaisa', 'kaisi', 'karo', 'karna', 'hai', 'hain', 'tha', 'thi',
        'hoga', 'hogi', 'batao', 'bolo', 'baat', 'chahiye', 'nahi', 'nahin', 'kyun', 'kab',
        'kahan', 'kitna', 'kaun', 'mein', 'hum', 'tum', 'aap', 'mera', 'meri', 'mere',
        'mujhe', 'apna', 'apni', 'yeh', 'theek', 'accha', 'achha', 'suno', 'kholo', 'chalao',
        'banao', 'mausam', 'samachar', 'khabar', 'aaj', 'kal', 'namaste', 'shukriya', 'dost'
    }
    words = set(re.findall(r'[a-zA-Z]+', text.lower()))
    if len(words.intersection(hinglish_markers)) >= 1:
        return "hinglish"
    return "en"

def _speech_worker():
    """Background worker that continuously speaks texts from the queue without blocking."""
    voices = _discover_voices()
    current_voice = None

    try:
        engine = pyttsx3.init('sapi5')
        engine.setProperty('rate', 175)  # Natural speaking speed
        if voices["en"]:
            engine.setProperty('voice', voices["en"])
            current_voice = voices["en"]
    except Exception as e:
        print(f"[TTS Init Error] {e}")
        engine = None

    while True:
        item = _speech_queue.get()
        if item is None:
            break
        
        text, lang = item
        if engine and text:
            try:
                # Select appropriate voice based on language
                target_voice = voices.get(lang) or voices.get("en")
                if target_voice and target_voice != current_voice:
                    try:
                        engine.setProperty('voice', target_voice)
                        current_voice = target_voice
                    except Exception as ve:
                        print(f"[TTS Voice Switch Error] {ve}")

                # Clean markdown characters for speaking
                clean_text = re.sub(r'[*_#`]', '', text).strip()
                engine.say(clean_text)
                engine.runAndWait()
            except Exception as e:
                print(f"[TTS Runtime Error] {e}")
                # Attempt to recreate engine if corrupted
                try:
                    engine = pyttsx3.init('sapi5')
                    engine.setProperty('rate', 175)
                    current_voice = None
                except Exception:
                    pass
        _speech_queue.task_done()

def _ensure_worker():
    global _worker_started
    with _lock:
        if not _worker_started:
            worker_thread = threading.Thread(target=_speech_worker, daemon=True)
            worker_thread.start()
            _worker_started = True

def Speak(text: str, lang: str = None, wait: bool = False):
    """
    Speaks text aloud using local TTS with auto language/voice selection.
    Supports Hindi (Devanagari), Hinglish, and English voices.
    By default runs asynchronously so FastAPI responses are never blocked.
    """
    if not text:
        return

    if not lang or lang == "auto":
        lang = detect_voice_language(text)

    # Safe log print with robust fallback for Windows cp1252 consoles
    try:
        if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
            try:
                sys.stdout.reconfigure(encoding='utf-8', errors='replace')
            except Exception:
                pass
        print(f"Jarvis [{lang.upper()}]: {text}")
    except Exception:
        safe_msg = text.encode('ascii', errors='backslashreplace').decode('ascii')
        print(f"Jarvis [{lang.upper()}]: {safe_msg}")

    _ensure_worker()
    _speech_queue.put((text, lang))
    if wait:
        _speech_queue.join()

if __name__ == "__main__":
    _discover_voices()
    Speak("Hello, I am Jarvis. System online.", lang="en", wait=True)
    Speak("नमस्ते सर, मैं जार्विस हूँ। आपकी क्या सेवा करूँ?", lang="hi", wait=True)
    Speak("Ji sir, main aapse Hinglish mein baat kar sakta hoon.", lang="hinglish", wait=True)
