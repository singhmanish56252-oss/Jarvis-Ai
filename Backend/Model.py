from google import genai
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Confirmed available models (fastest → fallback order)
MODELS = [
    "gemini-3.5-flash",
    "gemini-3.8-flash",
    "gemini-3.1-flash-lite",
    "gemini-2.0-flash",
]

def GeminiResponse(prompt: str) -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return "Error: GEMINI_API_KEY is not set in the .env file."

    client = genai.Client(api_key=api_key)

    last_error = None
    for model_name in MODELS:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=genai.types.GenerateContentConfig(
                    temperature=0.7,
                    top_p=0.95,
                    max_output_tokens=1024,
                ),
            )
            if response and response.text:
                return response.text
        except Exception as e:
            last_error = e
            continue

    return f"Error: {str(last_error)}. Please check your API Key in the .env file."
