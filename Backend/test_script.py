import Chatbot
import os
from dotenv import load_dotenv

load_dotenv()

print("Testing Chatbot response...")
try:
    response = Chatbot.GetResponse("Hello Jarvis, are you there?")
    print(f"Jarvis Response: {response}")
except Exception as e:
    print(f"Error: {e}")
