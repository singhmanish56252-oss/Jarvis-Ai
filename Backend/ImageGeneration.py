"""
ImageGeneration.py — AI Image Generation Module for Jarvis AI.

Provides image generation capabilities using free, high-performance
neural models (Flux.1 / SDXL via Pollinations AI).
Generated images are saved to Backend/Files/ and automatically opened.
"""

import os
import time
import re
import urllib.parse
import requests

# Default output directory
FILES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Files")
os.makedirs(FILES_DIR, exist_ok=True)

def _sanitize_filename(name: str) -> str:
    """Sanitize string to create a safe filename."""
    clean = re.sub(r'[^a-zA-Z0-9_\- ]', '', name)
    clean = clean.strip().replace(' ', '_')[:30]
    return clean or "generated_image"

def GenerateImage(prompt: str, width: int = 1024, height: int = 1024, open_image: bool = True) -> dict:
    """
    Generate an AI image based on a prompt.
    
    Args:
        prompt: Description of the image to generate.
        width: Image width in pixels (default 1024).
        height: Image height in pixels (default 1024).
        open_image: If True, opens the generated image in the default OS image viewer.
        
    Returns:
        dict with status, prompt, file_path, and url.
    """
    print(f"[ImageGeneration] Generating image for prompt: '{prompt}'")
    
    encoded_prompt = urllib.parse.quote(prompt.strip())
    seed = int(time.time() * 1000) % 1000000
    image_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width={width}&height={height}&seed={seed}&nologo=true&enhance=true"
    
    timestamp = int(time.time())
    file_name = f"{timestamp}_{_sanitize_filename(prompt)}.jpg"
    file_path = os.path.join(FILES_DIR, file_name)
    
    try:
        response = requests.get(image_url, timeout=35)
        if response.status_code == 200:
            with open(file_path, "wb") as f:
                f.write(response.content)
            
            print(f"[ImageGeneration] Image saved to: {file_path}")
            
            if open_image:
                try:
                    os.system(f'start "" "{file_path}"')
                except Exception as e:
                    print(f"[ImageGeneration] Could not auto-open image: {e}")
                    
            return {
                "status": "success",
                "prompt": prompt,
                "file_path": file_path,
                "file_name": file_name,
                "url": image_url
            }
        else:
            return {
                "status": "error",
                "error": f"Image API returned HTTP {response.status_code}",
                "url": image_url
            }
            
    except Exception as e:
        print(f"[ImageGeneration] Error: {e}")
        return {
            "status": "error",
            "error": str(e),
            "url": image_url
        }

if __name__ == "__main__":
    test_prompt = "Futuristic Jarvis holographic artificial intelligence arc reactor glowing blue in high resolution"
    result = GenerateImage(test_prompt, open_image=False)
    print(result)
