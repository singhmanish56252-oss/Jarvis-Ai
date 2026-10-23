import speech_recognition as sr

def Listen(language: str = "en-in") -> str:
    """
    Listens for speech through the microphone and converts it to text.
    Supports English ('en-in' / 'en-US') and Hindi ('hi-IN').
    """
    r = sr.Recognizer()
    with sr.Microphone() as source:
        print("Listening...")
        r.pause_threshold = 1
        r.adjust_for_ambient_noise(source, duration=0.5)
        audio = r.listen(source)

    target_lang = "hi-IN" if language in ["hi", "hi-in", "hindi"] else "en-in"

    try:
        print(f"Recognizing ({target_lang})...")
        query = r.recognize_google(audio, language=target_lang)
        print(f"User: {query}")
        return query
    except sr.UnknownValueError:
        # If Hindi was used and failed, attempt fallback to English-India (or vice versa)
        fallback_lang = "en-in" if target_lang == "hi-IN" else "hi-IN"
        try:
            print(f"Retrying recognition with {fallback_lang}...")
            query = r.recognize_google(audio, language=fallback_lang)
            print(f"User (fallback): {query}")
            return query
        except Exception:
            print("Could not understand your voice. Please try again.")
            return ""
    except Exception as e:
        print(f"Speech recognition error: {e}")
        return ""

if __name__ == "__main__":
    Listen()
