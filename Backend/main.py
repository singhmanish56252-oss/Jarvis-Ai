import os
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import Chatbot
import TextTospeech
import RealtimeSearchEngine
import ImageGeneration

app = FastAPI(
    title="Jarvis AI Backend",
    description="Advanced AI Assistant API with real-time web search, image generation, voice, and automation.",
    version="2.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure Files directory exists and mount as static route
FILES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Files")
os.makedirs(FILES_DIR, exist_ok=True)
app.mount("/files", StaticFiles(directory=FILES_DIR), name="files")

@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    """
    Root route: Returns a rich sci-fi dashboard if visited by a web browser,
    or JSON if requested by API clients.
    """
    accept = request.headers.get("accept", "")
    if "text/html" not in accept:
        return JSONResponse({
            "status": "online",
            "service": "Jarvis AI Backend",
            "version": "2.1.0",
            "frontend_hud": "http://localhost:3000",
            "docs": "http://localhost:8000/docs",
            "health": "http://localhost:8000/health",
            "endpoints": {
                "POST /execute": "Process command & automation",
                "POST /search": "Raw web search",
                "POST /search/smart": "Gemini smart web search",
                "POST /generate-image": "AI image generation",
                "GET /files": "Static files directory"
            }
        })
    
    html_content = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Jarvis AI — Backend Core</title>
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; }
            body { background: #060913; color: #e2e8f0; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
            .container { max-width: 650px; width: 100%; background: rgba(13, 20, 36, 0.85); border: 1px solid rgba(0, 210, 255, 0.3); border-radius: 20px; padding: 32px; box-shadow: 0 0 50px rgba(0, 210, 255, 0.15); backdrop-filter: blur(12px); }
            .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(0, 210, 255, 0.2); padding-bottom: 20px; margin-bottom: 24px; }
            .badge { background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); color: #34d399; font-size: 11px; padding: 4px 10px; border-radius: 999px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px; display: inline-flex; align-items: center; gap: 6px; }
            .dot { width: 8px; height: 8px; background: #34d399; border-radius: 50%; box-shadow: 0 0 8px #34d399; animation: pulse 2s infinite; }
            h1 { color: #38bdf8; font-size: 24px; letter-spacing: 2px; }
            p { color: #94a3b8; font-size: 14px; margin-top: 6px; }
            .cta-group { display: flex; gap: 12px; margin: 24px 0; flex-wrap: wrap; }
            .btn-primary { background: linear-gradient(135deg, #0284c7, #06b6d4); color: #fff; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 0 20px rgba(6, 182, 212, 0.4); transition: transform 0.2s, box-shadow 0.2s; }
            .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 0 30px rgba(6, 182, 212, 0.6); }
            .btn-secondary { background: rgba(30, 41, 59, 0.8); border: 1px solid rgba(0, 210, 255, 0.25); color: #38bdf8; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; transition: background 0.2s; }
            .btn-secondary:hover { background: rgba(15, 23, 42, 1); border-color: #38bdf8; }
            .endpoints { background: rgba(2, 6, 23, 0.6); border: 1px solid rgba(0, 210, 255, 0.15); border-radius: 12px; padding: 16px; margin-top: 20px; }
            .endpoints h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #7dd3fc; margin-bottom: 12px; }
            .endpoint-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 13px; }
            .endpoint-row:last-child { border-bottom: none; }
            .method { font-weight: bold; color: #38bdf8; font-family: monospace; }
            .desc { color: #64748b; }
            @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div>
                    <h1>J.A.R.V.I.S. BACKEND CORE</h1>
                    <p>FastAPI Server running on port 8000</p>
                </div>
                <div class="badge"><span class="dot"></span> Online</div>
            </div>
            
            <p>The backend neural services, realtime web search, and image generation are fully operational.</p>
            
            <div class="cta-group">
                <a href="http://localhost:3000" class="btn-primary">
                    ⚡ Open Jarvis Web HUD (Port 3000)
                </a>
                <a href="/docs" class="btn-secondary">
                    📚 Interactive API Docs (Swagger)
                </a>
            </div>

            <div class="endpoints">
                <h2>Active Neural Endpoints</h2>
                <div class="endpoint-row">
                    <span class="method">POST /execute</span>
                    <span class="desc">Process voice & text commands</span>
                </div>
                <div class="endpoint-row">
                    <span class="method">POST /search</span>
                    <span class="desc">Live DuckDuckGo Web Search</span>
                </div>
                <div class="endpoint-row">
                    <span class="method">POST /search/smart</span>
                    <span class="desc">Gemini-synthesized search answer</span>
                </div>
                <div class="endpoint-row">
                    <span class="method">POST /generate-image</span>
                    <span class="desc">Neural AI Image Synthesis</span>
                </div>
                <div class="endpoint-row">
                    <span class="method">GET /health</span>
                    <span class="desc">System health & capabilities</span>
                </div>
                <div class="endpoint-row">
                    <span class="method">GET /files/{name}</span>
                    <span class="desc">Static generated image repository</span>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return Response(status_code=204)

class CommandRequest(BaseModel):
    command: str

class SearchRequest(BaseModel):
    query: str
    max_results: int = 6

class ImageRequest(BaseModel):
    prompt: str
    width: int = 1024
    height: int = 1024

@app.post("/execute")
async def execute_command(request: CommandRequest):
    command = request.command
    print(f"[API] Execute Command: {command}")
    
    # 1. Use LLM / Chatbot pipeline
    result = Chatbot.ProcessCommand(command)
    response_text = result.get("response", "")
    speech_text = result.get("speech", response_text)
    image_url = result.get("image_url")
    action = result.get("action")
    
    # 2. Speak the response (Local TTS, non-blocking background queue)
    if speech_text:
        TextTospeech.Speak(speech_text)
    
    return {
        "status": "success",
        "response": response_text,
        "image_url": image_url,
        "action": action
    }

@app.post("/search")
async def search_web(request: SearchRequest):
    """
    Perform a raw web search and return structured results.
    Returns a list of results with title, snippet, and URL.
    """
    query = request.query
    print(f"[API] Web Search: {query}")
    
    try:
        results = RealtimeSearchEngine.QuickSearch(query, request.max_results)
        return {
            "status": "success",
            "query": query,
            "results": results,
            "count": len(results)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@app.post("/search/smart")
async def smart_search(request: SearchRequest):
    """
    Perform a web search and return a Gemini-summarized answer
    grounded in live web results.
    """
    query = request.query
    print(f"[API] Smart Search: {query}")
    
    try:
        answer = RealtimeSearchEngine.SmartSearch(query, request.max_results)
        return {
            "status": "success",
            "query": query,
            "answer": answer
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Smart search failed: {str(e)}")

@app.post("/generate-image")
async def generate_image(request: ImageRequest):
    """
    Generate an AI image based on a prompt.
    Returns file details and web accessible URL.
    """
    prompt = request.prompt
    print(f"[API] Image Generation: {prompt}")
    
    try:
        res = ImageGeneration.GenerateImage(prompt, width=request.width, height=request.height)
        if res.get("status") == "success":
            return {
                "status": "success",
                "prompt": prompt,
                "file_name": res.get("file_name"),
                "file_path": res.get("file_path"),
                "url": res.get("url"),
                "local_url": f"http://localhost:8000/files/{res.get('file_name')}"
            }
        else:
            raise HTTPException(status_code=500, detail=res.get("error", "Image generation failed"))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "online",
        "service": "Jarvis AI Backend",
        "version": "2.1.0",
        "capabilities": ["realtime_search", "image_generation", "voice_tts", "automation"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
