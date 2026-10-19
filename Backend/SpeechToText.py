import speech_recognition as sr

def Listen():
    r = sr.Recognizer()
    with sr.Microphone() as source:
        print("Listening...")
        r.pause_threshold = 1
        audio = r.listen(source)
    
    try:
        print("Recognizing...")
        query = r.recognize_google(audio, language='en-in')
        print(f"User: {query}")
        return query
    except Exception as e:
        print("Could not understand your voice. Please try again.")
        return ""

if __name__ == "__main__":
    Listen()
