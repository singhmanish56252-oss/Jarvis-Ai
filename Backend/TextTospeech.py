import pyttsx3
import threading
import queue

# Thread-safe speech queue and worker
_speech_queue = queue.Queue()
_worker_started = False
_lock = threading.Lock()

def _speech_worker():
    """Background worker that continuously speaks texts from the queue without blocking."""
    try:
        engine = pyttsx3.init('sapi5')
        voices = engine.getProperty('voices')
        if voices:
            engine.setProperty('voice', voices[0].id)  # Default voice (Jarvis-like)
        engine.setProperty('rate', 175)                # Natural speaking speed
    except Exception as e:
        print(f"[TTS Init Error] {e}")
        engine = None

    while True:
        text = _speech_queue.get()
        if text is None:
            break
        if engine and text:
            try:
                engine.say(text)
                engine.runAndWait()
            except Exception as e:
                print(f"[TTS Runtime Error] {e}")
                # Attempt to recreate engine if corrupted
                try:
                    engine = pyttsx3.init('sapi5')
                    engine.setProperty('rate', 175)
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

def Speak(text: str, wait: bool = False):
    """
    Speaks text aloud using local TTS.
    By default runs asynchronously so FastAPI responses are never blocked.
    """
    if not text:
        return
    print(f"Jarvis: {text}")
    _ensure_worker()
    _speech_queue.put(text)
    if wait:
        _speech_queue.join()

if __name__ == "__main__":
    Speak("Hello, I am Jarvis. How can I help you today?", wait=True)
