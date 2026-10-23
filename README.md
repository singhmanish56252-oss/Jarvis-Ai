# 🤖 J.A.R.V.I.S. MARK-VII — Advanced AI Assistant & HUD

[![Live Demo](https://img.shields.io/badge/Demo-Live_Project_Link-cyan?style=for-the-badge&logo=cloudflare)](https://programmer-anaheim-understanding-fruit.trycloudflare.com)
[![Open in GitHub Codespaces](https://img.shields.io/badge/Codespaces-Run_in_Browser-blue?style=for-the-badge&logo=github)](https://codespaces.new/singhmanish56252-oss/Jarvis-Ai)
[![Deploy with Vercel](https://img.shields.io/badge/Vercel-Deploy_Live-black?style=for-the-badge&logo=vercel)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fsinghmanish56252-oss%2FJarvis-Ai&root-directory=Frontend/jarvis-frontend)

An Iron Man inspired AI Assistant featuring a sci-fi HUD interface, real-time web search, AI image generation, local voice TTS, and Windows desktop automation.

---

## 🌐 Live Project Links

| Platform | Purpose | Link |
| :--- | :--- | :--- |
| ⚡ **Live Running Web App** | Instant access without installing | [**Launch Live Jarvis HUD**](https://programmer-anaheim-understanding-fruit.trycloudflare.com) |
| ☁️ **GitHub Codespaces** | Run in cloud browser with 1-click | [**Open in GitHub Codespaces**](https://codespaces.new/singhmanish56252-oss/Jarvis-Ai) |
| ▲ **Vercel Cloud Deploy** | Deploy your own copy on Vercel | [**Deploy to Vercel**](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fsinghmanish56252-oss%2FJarvis-Ai&root-directory=Frontend/jarvis-frontend) |


## 🚀 Quick Start (One-Click Launch)

### Option 1: Windows Batch File (Easiest)
Simply double-click:
```bat
start_jarvis.bat
```

### Option 2: Python Launcher
Run from the root directory:
```bash
python run_jarvis.py
```
This automatically starts:
- **Backend API (FastAPI)** on `http://127.0.0.1:8000`
- **Frontend HUD (Next.js)** on `http://localhost:3000`
- Opens your default web browser to the HUD interface.

---

## ⚡ Core Features

1. **Iron Man Arc Reactor Visualizer**
   - Multi-layered counter-rotating glowing rings, radar sweep, and orbiting energy nodes.
   - Dynamic reactivity: pulses and reacts when listening, thinking, or speaking.

2. **Real-time Web Search**
   - DuckDuckGo search integration with Gemini-powered summarization.
   - Ask for live news, current stock prices, weather, or recent tech developments.

3. **AI Image Generation Studio**
   - Powered by Flux / Neural image synthesis.
   - Render high-resolution images right inside the chat feed.
   - Dedicated "Visuals" gallery tab and fullscreen image modal with download capabilities.

4. **Speech Recognition & Non-blocking TTS**
   - Click the microphone button to dictate commands by voice.
   - Thread-safe background TTS queue worker ensures smooth responses without freezing.

5. **Windows Automation**
   - Open websites (YouTube, Google, Instagram, WhatsApp, etc.).
   - Launch apps (`code` / VSCode, WhatsApp, etc.).
   - Open folders and files.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, Tailwind CSS, Framer Motion, Lucide Icons, Web Speech API
- **Backend**: FastAPI, Uvicorn, Python 3.14
- **AI Core**: Google Gemini Generative AI (`gemini-3.5-flash` / `gemini-3.8-flash`)
- **Speech**: pyttsx3 (SAPI5)
- **Web Search**: DuckDuckGo Search (`ddgs`)
- **Image Generation**: Pollinations AI (Flux.1 / SDXL)
