"""
run_jarvis.py — One-click launcher for Jarvis AI (Backend + Frontend).

Starts FastAPI backend on http://127.0.0.1:8000 and Next.js frontend on http://localhost:3000.
Automatically launches your default web browser once both are ready.
"""

import os
import sys
import time
import subprocess
import webbrowser
import signal

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT_DIR, "Backend")
FRONTEND_DIR = os.path.join(ROOT_DIR, "Frontend", "jarvis-frontend")

processes = []

def cleanup(sig=None, frame=None):
    print("\n[Jarvis Launcher] Shutting down services...")
    for p in processes:
        try:
            if sys.platform == "win32":
                subprocess.call(["taskkill", "/F", "/T", "/PID", str(p.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            else:
                p.terminate()
        except Exception:
            pass
    print("[Jarvis Launcher] All services stopped.")
    sys.exit(0)

signal.signal(signal.SIGINT, cleanup)
signal.signal(signal.SIGTERM, cleanup)

def main():
    print("=" * 60)
    print("   J.A.R.V.I.S. MARK-VII INTEGRATED SYSTEM LAUNCHER")
    print("=" * 60)
    print("Starting FastAPI Backend (port 8000)...")
    
    # 1. Start Backend
    backend_cmd = [sys.executable, "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
    backend_proc = subprocess.Popen(backend_cmd, cwd=BACKEND_DIR)
    processes.append(backend_proc)

    # 2. Start Frontend
    print("Starting Next.js Frontend (port 3000)...")
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    frontend_proc = subprocess.Popen([npm_cmd, "run", "dev"], cwd=FRONTEND_DIR)
    processes.append(frontend_proc)

    print("\nWaiting for servers to initialize...")
    time.sleep(4)

    url = "http://localhost:3000"
    print(f"\n[Ready] Opening {url} in your browser...")
    webbrowser.open(url)

    print("\nJarvis is now active!")
    print("Press Ctrl+C in this terminal window to stop all services.\n")

    try:
        while True:
            time.sleep(1)
            # Check if any process terminated unexpectedly
            for p in processes:
                exit_code = p.poll()
                if exit_code is not None:
                    print(f"[Warning] A service exited with code {exit_code}. Shutting down...")
                    cleanup()
    except KeyboardInterrupt:
        cleanup()

if __name__ == "__main__":
    main()
