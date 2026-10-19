"use client";

import { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  Cpu,
  Terminal,
  Activity,
  Volume2,
  VolumeX,
  Shield,
  Zap,
  RefreshCw,
  Globe,
  Copy,
  Check,
  Image as ImageIcon,
  Download,
  X,
  Settings,
  ChevronDown,
  MessageSquare,
  Clock,
  Brain,
  FileText,
  Code,
  Bell,
  CheckCircle2,
  User,
  ArrowUpRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ParticleCanvas from "./ParticleCanvas";
import { soundFx } from "./audioFx";

interface ChatMessage {
  id: string;
  type: "user" | "jarvis";
  text: string;
  time: string;
  imageUrl?: string | null;
  action?: string | null;
}

type ThemeKey = "cyan" | "gold" | "emerald" | "violet";

interface ThemeConfig {
  id: ThemeKey;
  name: string;
  code: string;
  primary: string;
  secondary: string;
  accent: string;
  glow: string;
  borderGlow: string;
  badgeBg: string;
  btnGrad: string;
}

const THEMES: Record<ThemeKey, ThemeConfig> = {
  cyan: {
    id: "cyan",
    name: "MARK-VII CORE",
    code: "MK-07",
    primary: "#00d2ff",
    secondary: "#0072ff",
    accent: "#38bdf8",
    glow: "rgba(0, 210, 255, 0.5)",
    borderGlow: "rgba(0, 210, 255, 0.35)",
    badgeBg: "bg-cyan-950/70 border-cyan-400/40 text-cyan-300",
    btnGrad: "from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500",
  },
  gold: {
    id: "gold",
    name: "MARK-L NANO",
    code: "MK-50",
    primary: "#f59e0b",
    secondary: "#e11d48",
    accent: "#fbbf24",
    glow: "rgba(245, 158, 11, 0.5)",
    borderGlow: "rgba(245, 158, 11, 0.35)",
    badgeBg: "bg-amber-950/70 border-amber-400/40 text-amber-300",
    btnGrad: "from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500",
  },
  emerald: {
    id: "emerald",
    name: "STEALTH MATRIX",
    code: "MK-MTX",
    primary: "#10b981",
    secondary: "#059669",
    accent: "#34d399",
    glow: "rgba(16, 185, 129, 0.5)",
    borderGlow: "rgba(16, 185, 129, 0.35)",
    badgeBg: "bg-emerald-950/70 border-emerald-400/40 text-emerald-300",
    btnGrad: "from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-400 hover:to-teal-500",
  },
  violet: {
    id: "violet",
    name: "QUANTUM PULSE",
    code: "MK-QTM",
    primary: "#c084fc",
    secondary: "#a855f7",
    accent: "#f472b6",
    glow: "rgba(192, 132, 252, 0.5)",
    borderGlow: "rgba(192, 132, 252, 0.35)",
    badgeBg: "bg-purple-950/70 border-purple-400/40 text-purple-300",
    btnGrad: "from-purple-500 via-fuchsia-500 to-pink-600 hover:from-purple-400 hover:to-pink-500",
  },
};

const PERFORMANCE_DATA = [
  { day: "Mon", value: 48, requests: 124, latency: "14ms" },
  { day: "Tue", value: 72, requests: 210, latency: "11ms" },
  { day: "Wed", value: 68, requests: 185, latency: "13ms" },
  { day: "Thu", value: 52, requests: 140, latency: "16ms" },
  { day: "Fri", value: 75, requests: 230, latency: "10ms" },
  { day: "Sat", value: 88, requests: 295, latency: "9ms" },
  { day: "Sun", value: 62, requests: 168, latency: "12ms" },
];

export default function JarvisDashboard() {
  const [currentThemeKey, setCurrentThemeKey] = useState<ThemeKey>("cyan");
  const theme = THEMES[currentThemeKey];

  // Active Interactive Modals
  const [activeModal, setActiveModal] = useState<"chat" | "image" | "settings" | "search" | "code" | null>(null);

  // Assistant & Voice states
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [inputQuery, setInputQuery] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const [status, setStatus] = useState<"IDLE" | "LISTENING" | "THINKING" | "SPEAKING" | "OFFLINE">("IDLE");
  const [isSfxMuted, setIsSfxMuted] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [hoveredChartIndex, setHoveredChartIndex] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // 3D Perspective Tilt on mouse move
  const [reactorTilt, setReactorTilt] = useState({ rotateX: 0, rotateY: 0 });

  // Chat conversation history
  const [history, setHistory] = useState<ChatMessage[]>([
    {
      id: "init-1",
      type: "jarvis",
      text: "All systems online, sir. Mark-VII neural architecture initialized. Standing by for instructions.",
      time: "17:20",
    },
    {
      id: "conv-1",
      type: "user",
      text: "Create a website for my college project with React and Node.js",
      time: "2h ago",
    },
    {
      id: "conv-2",
      type: "jarvis",
      text: "I've structured a complete full-stack web application blueprint with React + Vite frontend, Express API backend, authentication, and database schemas ready for deployment.",
      time: "2h ago",
    },
  ]);

  // Speech Recognition reference
  const recognitionRef = useRef<any>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Sync theme
  useEffect(() => {
    document.body.className = `theme-${currentThemeKey}`;
  }, [currentThemeKey]);

  // Sync SFX state
  useEffect(() => {
    soundFx.enabled = !isSfxMuted;
  }, [isSfxMuted]);

  // Auto scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [history, transcript, status, activeModal]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onstart = () => {
          setIsListening(true);
          setStatus("LISTENING");
          soundFx.playListening();
        };

        recognition.onresult = (event: any) => {
          const currentTranscript = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result: any) => result.transcript)
            .join("");
          setTranscript(currentTranscript);
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
          setStatus("IDLE");
        };

        recognition.onend = () => {
          setIsListening(false);
          if (transcript.trim()) {
            handleSendCommand(transcript);
          } else {
            setStatus("IDLE");
          }
        };

        recognitionRef.current = recognition;
      }
    }
  }, [transcript]);

  const toggleListening = () => {
    soundFx.playClick();
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. You can type commands in the chat box!");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setTranscript("");
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("Could not start recognition:", err);
      }
    }
  };

  // Backend online detection
  const [isBackendOnline, setIsBackendOnline] = useState(false);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/health", { cache: "no-store" });
        setIsBackendOnline(res.ok);
      } catch {
        try {
          const res = await fetch("http://localhost:8000/health", { cache: "no-store" });
          setIsBackendOnline(res.ok);
        } catch {
          setIsBackendOnline(false);
        }
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleSendCommand = async (commandText: string) => {
    if (!commandText.trim()) return;
    soundFx.playClick();

    const timeStr = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      text: commandText,
      time: timeStr,
    };

    setHistory((prev) => [...prev, userMessage]);
    setInputQuery("");
    setTranscript("");
    setStatus("THINKING");

    try {
      let res;
      try {
        res = await fetch("http://127.0.0.1:8000/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ command: commandText }),
        });
      } catch {
        res = await fetch("http://localhost:8000/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ command: commandText }),
        });
      }

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      const jarvisText = data.response || "Task completed successfully, sir.";
      const imageUrl = data.image_url || null;
      const action = data.action || null;

      soundFx.playConfirm();
      setIsBackendOnline(true);

      const jarvisMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "jarvis",
        text: jarvisText,
        imageUrl: imageUrl,
        action: action,
        time: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setHistory((prev) => [...prev, jarvisMessage]);
      setStatus("SPEAKING");

      const speakTime = Math.min(Math.max(jarvisText.length * 45, 2500), 10000);
      setTimeout(() => {
        setStatus("IDLE");
      }, speakTime);
    } catch (error) {
      console.error("Failed to connect to backend", error);
      setIsBackendOnline(false);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "jarvis",
        text: "Connected in local simulation mode. Ensure the Jarvis Python backend is active on port 8000 for live neural queries.",
        time: "ALERT",
      };
      setHistory((prev) => [...prev, errorMessage]);
      setStatus("OFFLINE");
      setTimeout(() => setStatus("IDLE"), 4000);
    }
  };

  const handleGenerateImage = async (customPrompt?: string) => {
    const promptToUse = customPrompt || imagePrompt;
    if (!promptToUse.trim()) return;
    soundFx.playClick();
    setIsGeneratingImg(true);
    setStatus("THINKING");

    try {
      let res;
      try {
        res = await fetch("http://127.0.0.1:8000/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: promptToUse, width: 1024, height: 1024 }),
        });
      } catch {
        res = await fetch("http://localhost:8000/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: promptToUse, width: 1024, height: 1024 }),
        });
      }

      const data = await res.json();
      soundFx.playConfirm();
      const imageUrl = data.local_url || data.url || `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1024&q=80`;

      const jarvisMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "jarvis",
        text: `Generated visual artifact for prompt: "${promptToUse}"`,
        imageUrl: imageUrl,
        time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      };

      setHistory((prev) => [...prev, jarvisMessage]);
      setSelectedImage(imageUrl);
      setImagePrompt("");
      setIsGeneratingImg(false);
      setStatus("IDLE");
    } catch (err) {
      console.error("Image generation error", err);
      const fallbackUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1024&q=80";
      const jarvisMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "jarvis",
        text: `Synthesized neural visualization: "${promptToUse}"`,
        imageUrl: fallbackUrl,
        time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      };
      setHistory((prev) => [...prev, jarvisMessage]);
      setSelectedImage(fallbackUrl);
      setIsGeneratingImg(false);
      setStatus("IDLE");
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    soundFx.playClick();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setReactorTilt({
      rotateX: -y / 18,
      rotateY: x / 18,
    });
  };

  const handleMouseLeave = () => {
    setReactorTilt({ rotateX: 0, rotateY: 0 });
  };

  return (
    <main className="relative min-h-screen w-full flex flex-col justify-between p-2 sm:p-3 md:p-4 bg-[#030712] text-slate-100 font-rajdhani overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-200 scanlines">
      {/* Dynamic Particle Constellation Background */}
      <ParticleCanvas color={theme.primary} glowColor={theme.glow} />

      {/* Atmospheric Ambient Glows & Perspective Floor Grid */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Center Orb Glow */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.55, 0.3] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          style={{ background: `radial-gradient(circle, ${theme.primary} 0%, rgba(0,114,255,0.45) 45%, transparent 70%)` }}
          className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[150px]"
        />

        {/* Ambient Corner Glows */}
        <div
          style={{ background: `radial-gradient(circle, ${theme.secondary} 0%, transparent 70%)` }}
          className="absolute top-0 left-0 w-[450px] h-[350px] rounded-full blur-[140px] opacity-25"
        />
        <div
          style={{ background: `radial-gradient(circle, ${theme.primary} 0%, transparent 70%)` }}
          className="absolute bottom-0 right-0 w-[550px] h-[400px] rounded-full blur-[150px] opacity-20"
        />

        {/* Cyber Floor Grid with 3D Perspective */}
        <div className="absolute bottom-0 left-0 right-0 h-[320px] cyber-floor-grid pointer-events-none opacity-45" />

        {/* Holographic Laser Scan Line */}
        <div
          style={{ background: `linear-gradient(to right, transparent, ${theme.primary}, transparent)` }}
          className="absolute left-0 right-0 h-[2px] opacity-35 animate-laser"
        />
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          TOP NAVIGATION BAR (Matching screenshot exactly)
      ══════════════════════════════════════════════════════════════════════════ */}
      <header className="relative z-20 w-full max-w-[1720px] mx-auto flex items-center justify-between gap-3 py-1 px-1">
        
        {/* LEFT STATUS CAPSULE */}
        <div className="flex items-center gap-2">
          <div
            style={{
              borderColor: isBackendOnline ? `${theme.primary}45` : "rgba(16, 185, 129, 0.4)",
              boxShadow: `0 0 16px ${theme.glow}`,
            }}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-950/70 border backdrop-blur-md"
          >
            <span className="relative flex h-2.5 w-2.5 items-center justify-center">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isBackendOnline ? "bg-emerald-400" : "bg-cyan-400"
              }`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                isBackendOnline ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-cyan-400 shadow-[0_0_8px_#00d2ff]"
              }`} />
            </span>
            <span className="text-xs font-mono font-bold text-white tracking-wide">Online</span>
            <span className="text-xs font-mono text-cyan-400/90 tracking-wide hidden sm:inline">Ready to assist</span>
          </div>
        </div>

        {/* CENTER SCI-FI EMBLEM & TITLE */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-2.5">
            {/* Concentric Tech Rings Icon */}
            <div className="relative flex items-center justify-center w-7 h-7 md:w-8 md:h-8">
              <div
                style={{ borderColor: theme.primary }}
                className="absolute inset-0 rounded-full border border-dashed animate-spin-slow opacity-80"
              />
              <div
                style={{ borderColor: theme.accent }}
                className="absolute inset-1 rounded-full border animate-spin-reverse-slow opacity-90"
              />
              <span
                style={{ backgroundColor: theme.primary, boxShadow: `0 0 10px ${theme.primary}` }}
                className="w-2 h-2 rounded-full animate-ping"
              />
              <span
                style={{ backgroundColor: theme.primary }}
                className="w-2 h-2 rounded-full absolute"
              />
            </div>

            {/* Glowing Brand Title */}
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-[0.18em] font-orbitron flex items-center">
              <span className="text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">JARVIS</span>
              <span
                style={{
                  color: theme.primary,
                  textShadow: `0 0 20px ${theme.glow}, 0 0 35px ${theme.primary}`,
                }}
                className="ml-2"
              >
                AI
              </span>
            </h1>
          </div>

          <p className="text-[9px] sm:text-[10px] md:text-[11px] font-mono tracking-[0.28em] text-slate-400 mt-0.5 uppercase">
            Your Personal AI Assistant
          </p>
        </div>

        {/* RIGHT CONTROLS: NOTIFICATIONS, SETTINGS, USER PROFILE */}
        <div className="flex items-center gap-2">
          {/* Notifications Button */}
          <div className="relative">
            <button
              onClick={() => {
                soundFx.playClick();
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              style={{ borderColor: `${theme.primary}35` }}
              className="relative p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border text-slate-300 hover:text-white transition-all hover:scale-105 active:scale-95 shadow-lg"
              title="Notifications"
            >
              <Bell className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00d2ff]" />
            </button>

            {/* Notifications Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  style={{ borderColor: `${theme.primary}40` }}
                  className="absolute right-0 mt-2 w-72 p-3 rounded-2xl cyber-card border shadow-2xl z-50 text-xs font-mono"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-300 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-cyan-400" />
                      SYSTEM ALERTS
                    </span>
                    <span className="text-[10px] text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-500/30">
                      3 NEW
                    </span>
                  </div>
                  <div className="divide-y divide-slate-800/60 mt-2 max-h-56 overflow-y-auto custom-scrollbar">
                    {[
                      { id: 1, title: "Neural Core V2.1 Synchronized", time: "10m ago" },
                      { id: 2, title: "DuckDuckGo Realtime Search Online", time: "25m ago" },
                      { id: 3, title: "Flux AI Image Engine Ready", time: "1h ago" },
                    ].map((n) => (
                      <div key={n.id} className="py-2 hover:bg-slate-800/40 px-1 rounded transition-colors">
                        <p className="text-white font-medium">{n.title}</p>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">{n.time}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Settings Button */}
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveModal("settings");
              setShowNotifications(false);
              setShowProfileMenu(false);
            }}
            style={{ borderColor: `${theme.primary}35` }}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border text-slate-300 hover:text-white transition-all hover:scale-105 active:scale-95 shadow-lg"
            title="System Settings & Themes"
          >
            <Settings className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </button>

          {/* User Profile Pill */}
          <div className="relative">
            <button
              onClick={() => {
                soundFx.playClick();
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              style={{ borderColor: `${theme.primary}35` }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border text-slate-200 transition-all hover:scale-105 active:scale-95 shadow-lg"
            >
              <div
                style={{ backgroundColor: `${theme.primary}20`, borderColor: theme.primary }}
                className="w-5 h-5 rounded-full border flex items-center justify-center text-cyan-300"
              >
                <User className="w-3 h-3" />
              </div>
              <span className="text-xs font-mono font-bold tracking-wider hidden sm:inline">Manish Singh</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Profile Dropdown */}
            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  style={{ borderColor: `${theme.primary}40` }}
                  className="absolute right-0 mt-2 w-56 p-3 rounded-2xl cyber-card border shadow-2xl z-50 text-xs font-mono"
                >
                  <div className="pb-2 border-b border-slate-800">
                    <p className="text-white font-bold">Manish Singh</p>
                    <p className="text-[10px] text-cyan-400">Chief Operator // Tier-1</p>
                  </div>
                  <div className="pt-2 flex flex-col gap-1.5">
                    <button
                      onClick={() => {
                        soundFx.playClick();
                        setActiveModal("settings");
                        setShowProfileMenu(false);
                      }}
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
                    >
                      <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                      Preferences
                    </button>
                    <button
                      onClick={() => {
                        soundFx.playClick();
                        setIsSfxMuted(!isSfxMuted);
                      }}
                      className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
                    >
                      <span className="flex items-center gap-2">
                        {isSfxMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
                        Sci-Fi SFX
                      </span>
                      <span className="text-[10px] text-cyan-400 font-bold">{isSfxMuted ? "MUTED" : "ON"}</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════════
          MAIN DASHBOARD PANORAMIC 3-COLUMN GRID
      ══════════════════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 w-full max-w-[1720px] mx-auto flex-1 my-2 grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-3.5 items-stretch">
        
        {/* ──────────────────────────────────────────────────────────────────────────
            LEFT COLUMN: QUICK STATS, LIVE ACTIVITY, PERFORMANCE (md:col-span-3 or 4)
        ────────────────────────────────────────────────────────────────────────── */}
        <div className="md:col-span-4 xl:col-span-3 flex flex-col gap-3 justify-between">
          
          {/* 1. QUICK STATS PANEL */}
          <div
            style={{ borderColor: `${theme.primary}30` }}
            className="p-3.5 rounded-2xl cyber-card flex flex-col justify-between shadow-xl transition-all hover:border-cyan-400/50"
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <Activity style={{ color: theme.primary }} className="w-4 h-4 animate-pulse" />
                <h3 className="font-orbitron text-xs md:text-sm font-bold tracking-wider text-white uppercase">
                  Quick Stats
                </h3>
              </div>
              <span className="text-[10px] font-mono text-cyan-400/60 font-semibold tracking-widest">&gt;&gt;</span>
            </div>

            {/* 4 Circular Stat Nodes */}
            <div className="grid grid-cols-4 gap-1.5 text-center">
              {/* Stat 1: Conversations */}
              <div className="flex flex-col items-center group cursor-pointer" onClick={() => setActiveModal("chat")}>
                <div
                  style={{
                    borderColor: `${theme.primary}60`,
                    boxShadow: `0 0 12px ${theme.glow}`,
                  }}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border flex items-center justify-center bg-slate-900/80 mb-1 transition-transform group-hover:scale-110"
                >
                  <MessageSquare style={{ color: theme.primary }} className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="text-sm sm:text-base font-black font-orbitron text-white">144</span>
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-tight">Conversations</span>
              </div>

              {/* Stat 2: Accuracy */}
              <div className="flex flex-col items-center group cursor-pointer">
                <div
                  style={{
                    borderColor: `${theme.primary}60`,
                    boxShadow: `0 0 12px ${theme.glow}`,
                  }}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border flex items-center justify-center bg-slate-900/80 mb-1 transition-transform group-hover:scale-110"
                >
                  <Zap style={{ color: theme.accent }} className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="text-sm sm:text-base font-black font-orbitron text-white">98%</span>
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-tight">Accuracy</span>
              </div>

              {/* Stat 3: Active */}
              <div className="flex flex-col items-center group cursor-pointer">
                <div
                  style={{
                    borderColor: `${theme.primary}60`,
                    boxShadow: `0 0 12px ${theme.glow}`,
                  }}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border flex items-center justify-center bg-slate-900/80 mb-1 transition-transform group-hover:scale-110"
                >
                  <Clock style={{ color: theme.secondary }} className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="text-sm sm:text-base font-black font-orbitron text-white">24/7</span>
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-tight">Active</span>
              </div>

              {/* Stat 4: AI Powered */}
              <div className="flex flex-col items-center group cursor-pointer" onClick={() => setActiveModal("settings")}>
                <div
                  style={{
                    borderColor: `${theme.primary}60`,
                    boxShadow: `0 0 12px ${theme.glow}`,
                  }}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border flex items-center justify-center bg-slate-900/80 mb-1 transition-transform group-hover:scale-110"
                >
                  <Brain style={{ color: theme.primary }} className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span style={{ color: theme.primary }} className="text-sm sm:text-base font-black font-orbitron">AI</span>
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-tight">Powered</span>
              </div>
            </div>
          </div>

          {/* 2. LIVE ACTIVITY PANEL */}
          <div
            style={{ borderColor: `${theme.primary}30` }}
            className="p-3.5 rounded-2xl cyber-card flex flex-col justify-between shadow-xl transition-all hover:border-cyan-400/50"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity style={{ color: theme.primary }} className="w-4 h-4 animate-pulse" />
                <h3 className="font-orbitron text-xs md:text-sm font-bold tracking-wider text-white uppercase">
                  Live Activity
                </h3>
              </div>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[10px] font-mono text-emerald-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live
              </div>
            </div>

            {/* List of 4 live events */}
            <div className="flex flex-col gap-2">
              <div
                onClick={() => handleSendCommand("Search web for latest tech news")}
                className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-slate-950/50 hover:bg-slate-900/80 border border-slate-800/80 hover:border-cyan-500/40 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1 rounded-lg bg-cyan-950/70 border border-cyan-500/30 text-cyan-400 shrink-0">
                    <Globe className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] text-slate-200 truncate font-sans">
                    Searching the web for latest tech news...
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">Just now</span>
              </div>

              <div
                onClick={() => {
                  setImagePrompt("generate image of futuristic neon cyberpunk city 8k render");
                  setActiveModal("image");
                }}
                className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-slate-950/50 hover:bg-slate-900/80 border border-slate-800/80 hover:border-cyan-500/40 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1 rounded-lg bg-sky-950/70 border border-sky-500/30 text-sky-400 shrink-0">
                    <ImageIcon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] text-slate-200 truncate font-sans">
                    Generating image...
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">2m ago</span>
              </div>

              <div
                onClick={() => handleSendCommand("Processing your request status")}
                className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-slate-950/50 hover:bg-slate-900/80 border border-slate-800/80 hover:border-cyan-500/40 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1 rounded-lg bg-blue-950/70 border border-blue-500/30 text-blue-400 shrink-0">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  </div>
                  <span className="text-[11px] text-slate-200 truncate font-sans">
                    Processing your request...
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">3m ago</span>
              </div>

              <div
                onClick={() => handleSendCommand("Who are you and what are your capabilities?")}
                className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-slate-950/50 hover:bg-slate-900/80 border border-slate-800/80 hover:border-cyan-500/40 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1 rounded-lg bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] text-slate-200 truncate font-sans">
                    Ready to help!
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">4m ago</span>
              </div>
            </div>
          </div>

          {/* 3. PERFORMANCE CHART PANEL */}
          <div
            style={{ borderColor: `${theme.primary}30` }}
            className="p-3.5 rounded-2xl cyber-card flex flex-col justify-between shadow-xl transition-all hover:border-cyan-400/50"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Cpu style={{ color: theme.primary }} className="w-4 h-4" />
                <h3 className="font-orbitron text-xs md:text-sm font-bold tracking-wider text-white uppercase">
                  Performance
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-950/60 px-2 py-0.5 rounded-lg border border-slate-800">
                Last 7 days
              </span>
            </div>

            {/* Interactive Spline Chart */}
            <div className="relative w-full h-28 sm:h-32 flex items-end pt-1 pb-1">
              {/* Y-Axis Labels */}
              <div className="absolute left-0 top-0 bottom-5 flex flex-col justify-between text-[8px] font-mono text-slate-500 pr-1">
                <span>100%</span>
                <span>75%</span>
                <span>50%</span>
                <span>25%</span>
                <span>0%</span>
              </div>

              {/* Grid Lines */}
              <div className="absolute left-7 right-0 top-1 bottom-5 flex flex-col justify-between pointer-events-none opacity-20">
                <div className="border-b border-dashed border-cyan-400 w-full" />
                <div className="border-b border-dashed border-cyan-400 w-full" />
                <div className="border-b border-dashed border-cyan-400 w-full" />
                <div className="border-b border-dashed border-cyan-400 w-full" />
                <div className="border-b border-cyan-400 w-full" />
              </div>

              {/* SVG Spline Curve & Points */}
              <div className="relative ml-7 flex-1 h-full flex flex-col justify-between">
                <svg
                  viewBox="0 0 280 85"
                  className="w-full h-20 overflow-visible"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00d2ff" stopOpacity="0.45" />
                      <stop offset="60%" stopColor="#0072ff" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#00d2ff" stopOpacity="0.0" />
                    </linearGradient>
                    <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#00d2ff" />
                    </filter>
                  </defs>

                  {/* Area fill */}
                  <path
                    d="M 10 46 Q 30 20, 50 25 T 90 28 T 130 42 T 170 22 T 210 10 T 250 34 L 250 80 L 10 80 Z"
                    fill="url(#chartGradient)"
                  />

                  {/* Spline Stroke */}
                  <path
                    d="M 10 46 Q 30 20, 50 25 T 90 28 T 130 42 T 170 22 T 210 10 T 250 34"
                    fill="none"
                    stroke="#00d2ff"
                    strokeWidth="2.5"
                    filter="url(#cyanGlow)"
                  />

                  {/* Glowing Data Points */}
                  {[
                    { cx: 10, cy: 46, idx: 0 },
                    { cx: 50, cy: 25, idx: 1 },
                    { cx: 90, cy: 28, idx: 2 },
                    { cx: 130, cy: 42, idx: 3 },
                    { cx: 170, cy: 22, idx: 4 },
                    { cx: 210, cy: 10, idx: 5 },
                    { cx: 250, cy: 34, idx: 6 },
                  ].map((pt) => (
                    <g key={pt.idx} className="cursor-pointer">
                      <circle
                        cx={pt.cx}
                        cy={pt.cy}
                        r={hoveredChartIndex === pt.idx ? "4.5" : "3"}
                        fill="#ffffff"
                        stroke="#00d2ff"
                        strokeWidth="2"
                      />
                      <circle
                        cx={pt.cx}
                        cy={pt.cy}
                        r={hoveredChartIndex === pt.idx ? "8" : "5"}
                        fill="none"
                        stroke="#00d2ff"
                        strokeWidth="1"
                        opacity={hoveredChartIndex === pt.idx ? "0.9" : "0.3"}
                        className="animate-ping"
                      />
                    </g>
                  ))}
                </svg>

                {/* X-Axis Days */}
                <div className="flex justify-between text-[9px] font-mono text-slate-400 pt-1 border-t border-slate-800">
                  {PERFORMANCE_DATA.map((item, idx) => (
                    <span
                      key={item.day}
                      onMouseEnter={() => setHoveredChartIndex(idx)}
                      onMouseLeave={() => setHoveredChartIndex(null)}
                      className={`cursor-pointer transition-colors ${
                        hoveredChartIndex === idx ? "text-cyan-400 font-bold" : "hover:text-cyan-300"
                      }`}
                    >
                      {item.day}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Interactive Tooltip Card */}
            {hoveredChartIndex !== null && (
              <div className="mt-1 py-1 px-2 rounded-lg bg-cyan-950/80 border border-cyan-400/40 text-[10px] font-mono flex items-center justify-between text-cyan-300">
                <span>Day: {PERFORMANCE_DATA[hoveredChartIndex].day}</span>
                <span>Accuracy: {PERFORMANCE_DATA[hoveredChartIndex].value}%</span>
                <span>Latency: {PERFORMANCE_DATA[hoveredChartIndex].latency}</span>
              </div>
            )}
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────────────────────────
            CENTER COLUMN: HERO GREETING, 3D HOLOGRAPHIC AI SPHERE, ACTION BAR (md:col-span-4 or 6)
        ────────────────────────────────────────────────────────────────────────── */}
        <div className="md:col-span-4 xl:col-span-6 flex flex-col items-center justify-between py-1 relative">
          
          {/* TOP GREETING HEADLINE */}
          <div className="text-center z-10">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-wide font-rajdhani text-white">
              Hello, I'm{" "}
              <span
                style={{
                  color: theme.primary,
                  textShadow: `0 0 20px ${theme.glow}, 0 0 35px ${theme.primary}`,
                }}
                className="font-orbitron"
              >
                Jarvis
              </span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400 font-mono tracking-wider mt-0.5">
              Ask me anything, I'm here to help
            </p>
          </div>

          {/* 3D PERSPECTIVE HOLOGRAPHIC AI CORE & PEDESTAL */}
          <div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative w-full max-w-md aspect-square flex flex-col items-center justify-center cursor-pointer my-auto"
            onClick={() => {
              soundFx.playClick();
              setActiveModal("chat");
            }}
          >
            {/* 3D Gyroscope & Floating Orb Container */}
            <motion.div
              style={{
                rotateX: reactorTilt.rotateX,
                rotateY: reactorTilt.rotateY,
                perspective: "1200px",
              }}
              className="relative w-64 h-64 sm:w-72 sm:h-72 lg:w-80 lg:h-80 flex items-center justify-center transition-transform duration-200"
            >
              {/* Planetary Orbital Ring 1 (Tilted Saturn Style Ring) */}
              <div
                style={{
                  borderColor: `${theme.primary}80`,
                  boxShadow: `0 0 15px ${theme.primary}`,
                }}
                className="absolute w-[125%] h-[125%] rounded-full border-2 border-dashed animate-spin-tilted pointer-events-none opacity-85"
              />

              {/* Orbiting Photon Light Node */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute w-[125%] h-[125%] pointer-events-none"
              >
                <div
                  style={{
                    backgroundColor: theme.primary,
                    boxShadow: `0 0 20px 4px ${theme.primary}`,
                  }}
                  className="w-3.5 h-3.5 rounded-full absolute -top-1.5 left-1/2 -translate-x-1/2"
                />
              </motion.div>

              {/* Planetary Orbital Ring 2 (Counter Rotating Tilted) */}
              <div
                style={{ borderColor: `${theme.accent}70` }}
                className="absolute w-[110%] h-[110%] rounded-full border-2 animate-spin-tilted-reverse pointer-events-none opacity-75"
              />

              {/* Planetary Orbital Ring 3 (Deep Gyro Ring) */}
              <div
                style={{
                  borderTopColor: theme.primary,
                  borderBottomColor: theme.primary,
                  borderLeftColor: "transparent",
                  borderRightColor: "transparent",
                }}
                className="absolute w-[98%] h-[98%] rounded-full border-2 animate-spin-tilted-third pointer-events-none opacity-90"
              />

              {/* ── NEW: 360° CONIC RADAR SWEEP ── */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute w-[155%] h-[155%] rounded-full pointer-events-none opacity-20"
                style={{
                  background: `conic-gradient(from 0deg, transparent 75%, ${theme.primary} 100%)`,
                }}
              />

              {/* ── NEW: EXPANDING PULSE RING 1 ── */}
              <motion.div
                animate={{ scale: [1, 1.9], opacity: [0.6, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: "60%",
                  height: "60%",
                  border: `2px solid ${theme.primary}`,
                  boxShadow: `0 0 12px ${theme.primary}`,
                }}
              />

              {/* ── NEW: EXPANDING PULSE RING 2 (delayed) ── */}
              <motion.div
                animate={{ scale: [1, 2.2], opacity: [0.4, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut", delay: 1.1 }}
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: "60%",
                  height: "60%",
                  border: `1.5px solid ${theme.accent}`,
                }}
              />

              {/* ── NEW: SVG ARC DATA RING ── */}
              <svg
                className="absolute w-[138%] h-[138%] pointer-events-none"
                viewBox="0 0 200 200"
              >
                <defs>
                  <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={theme.primary} stopOpacity="0" />
                    <stop offset="50%" stopColor={theme.primary} stopOpacity="1" />
                    <stop offset="100%" stopColor={theme.accent} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <motion.circle
                  cx="100" cy="100" r="90"
                  fill="none"
                  stroke="url(#arcGrad)"
                  strokeWidth="2"
                  strokeDasharray="120 450"
                  animate={{ strokeDashoffset: [0, -570] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                />
                <motion.circle
                  cx="100" cy="100" r="85"
                  fill="none"
                  stroke={theme.accent}
                  strokeWidth="1"
                  strokeOpacity="0.4"
                  strokeDasharray="60 480"
                  animate={{ strokeDashoffset: [0, 540] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                />
              </svg>

              {/* ── NEW: ORBITING MICRO-DOTS (6 dots at different phases) ── */}
              {[
                { angle: 0,   r: "52%", size: "w-2 h-2",   dur: 5,  delay: 0   },
                { angle: 60,  r: "52%", size: "w-1.5 h-1.5", dur: 7,  delay: 0.5 },
                { angle: 120, r: "52%", size: "w-2 h-2",   dur: 5,  delay: 1.0 },
                { angle: 180, r: "52%", size: "w-1 h-1",   dur: 9,  delay: 1.5 },
                { angle: 240, r: "52%", size: "w-1.5 h-1.5", dur: 6,  delay: 0.8 },
                { angle: 300, r: "52%", size: "w-2 h-2",   dur: 8,  delay: 0.2 },
              ].map((dot, i) => (
                <motion.div
                  key={`orbitdot-${i}`}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  animate={{ rotate: [dot.angle, dot.angle + 360] }}
                  transition={{ duration: dot.dur, repeat: Infinity, ease: "linear", delay: dot.delay }}
                >
                  <div
                    className="absolute"
                    style={{ top: 0, left: "50%", transform: "translateX(-50%) translateY(-50%)", marginTop: dot.r }}
                  >
                    <div
                      className={`${dot.size} rounded-full`}
                      style={{
                        backgroundColor: i % 2 === 0 ? theme.primary : theme.accent,
                        boxShadow: `0 0 8px 2px ${i % 2 === 0 ? theme.primary : theme.accent}`,
                      }}
                    />
                  </div>
                </motion.div>
              ))}

              {/* ── NEW: FLOATING MICRO-PARTICLES (10 dots around orb) ── */}
              {[
                { top: "8%",  left: "18%",  dur: 2.8, delay: 0    },
                { top: "5%",  left: "65%",  dur: 3.5, delay: 0.4  },
                { top: "20%", left: "88%",  dur: 2.2, delay: 0.7  },
                { top: "50%", left: "95%",  dur: 4.1, delay: 1.0  },
                { top: "78%", left: "82%",  dur: 3.0, delay: 0.2  },
                { top: "90%", left: "55%",  dur: 2.6, delay: 1.3  },
                { top: "85%", left: "22%",  dur: 3.8, delay: 0.6  },
                { top: "60%", left: "4%",   dur: 2.4, delay: 0.9  },
                { top: "32%", left: "6%",   dur: 3.3, delay: 0.15 },
                { top: "14%", left: "42%",  dur: 2.9, delay: 1.6  },
              ].map((p, i) => (
                <motion.div
                  key={`mdot-${i}`}
                  className="absolute w-1 h-1 rounded-full pointer-events-none"
                  style={{
                    top: p.top,
                    left: p.left,
                    backgroundColor: i % 3 === 0 ? theme.primary : i % 3 === 1 ? theme.accent : "#ffffff",
                    boxShadow: `0 0 6px 2px ${theme.glow}`,
                  }}
                  animate={{
                    y: [0, -10, 4, 0],
                    x: [0, 5, -3, 0],
                    scale: [1, 1.5, 0.8, 1],
                    opacity: [0.5, 1, 0.7, 0.5],
                  }}
                  transition={{
                    duration: p.dur,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: p.delay,
                  }}
                />
              ))}

              {/* Radial Energy Burst Halo */}
              <motion.div
                animate={{
                  scale: isListening || status === "SPEAKING" ? [1, 1.2, 1] : [1, 1.08, 1],
                  opacity: isListening ? [0.6, 0.95, 0.6] : [0.35, 0.65, 0.35],
                }}
                transition={{ duration: isListening ? 1.0 : 3.5, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  boxShadow: `0 0 80px ${theme.glow}`,
                  background: `radial-gradient(circle, ${theme.glow} 0%, rgba(0, 114, 255, 0.35) 50%, transparent 70%)`,
                }}
                className="absolute w-52 h-52 sm:w-60 sm:h-60 rounded-full blur-xl pointer-events-none"
              />

              {/* Outer HUD Tech Ring with Caliper Ticks */}
              <div
                style={{ borderColor: `${theme.primary}80` }}
                className="absolute w-44 h-44 sm:w-52 sm:h-52 rounded-full border-2 border-dashed animate-spin-slow flex items-center justify-center pointer-events-none"
              >
                <span className="absolute top-1 text-[8px] font-mono text-cyan-300">000°</span>
                <span className="absolute right-1 text-[8px] font-mono text-cyan-300">090°</span>
                <span className="absolute bottom-1 text-[8px] font-mono text-cyan-300">180°</span>
                <span className="absolute left-1 text-[8px] font-mono text-cyan-300">270°</span>
              </div>

              {/* THE CENTRAL GLOWING AI CORE SPHERE */}
              <motion.div
                animate={{
                  scale: status === "SPEAKING" ? [1, 1.15, 1] : isListening ? [1, 1.1, 1] : [1, 1.04, 1],
                }}
                transition={{ duration: status === "SPEAKING" ? 0.8 : 2.5, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  borderColor: status === "OFFLINE" ? "#ef4444" : isListening ? "#f43f5e" : theme.primary,
                  boxShadow: `0 0 50px ${
                    status === "OFFLINE" ? "rgba(239,68,68,0.8)" : isListening ? "rgba(244,63,94,0.8)" : theme.glow
                  }, inset 0 0 35px ${theme.primary}`,
                  background: `radial-gradient(circle at 35% 35%, #00f2fe 0%, #0072ff 45%, #051433 80%, #020713 100%)`,
                }}
                className="relative w-36 h-36 sm:w-42 sm:h-42 md:w-46 md:h-46 rounded-full border-2 flex flex-col items-center justify-center transition-all shadow-2xl z-20 group"
              >
                {/* Internal HUD Radar Sweep */}
                <div
                  style={{ borderTopColor: "#ffffff" }}
                  className="absolute inset-2 rounded-full border border-transparent animate-spin-fast opacity-50 pointer-events-none"
                />

                {/* THE "AI" GLOWING HEADLINE */}
                <span
                  style={{
                    textShadow: `0 0 25px #ffffff, 0 0 45px ${theme.primary}, 0 0 70px ${theme.secondary}`,
                  }}
                  className="text-3xl sm:text-4xl md:text-5xl font-black font-orbitron tracking-widest text-white select-none transition-transform group-hover:scale-105"
                >
                  AI
                </span>

                {/* 16 Audio Visualizer Frequencies */}
                <div className="flex items-center gap-0.5 sm:gap-1 mt-1.5 h-5">
                  {[0.4, 0.8, 1.2, 0.6, 1.5, 0.9, 1.3, 0.5, 1.1, 1.4, 0.7, 1.0, 0.6, 0.9, 0.4, 0.3].map(
                    (mul, i) => (
                      <motion.span
                        key={i}
                        animate={{
                          height:
                            isListening || status === "SPEAKING"
                              ? [`${4 * mul}px`, `${20 * mul}px`, `${4 * mul}px`]
                              : status === "THINKING"
                              ? ["4px", "14px", "4px"]
                              : ["3px", "6px", "3px"],
                        }}
                        transition={{
                          duration: isListening ? 0.3 + (i % 4) * 0.08 : 1.2,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: i * 0.03,
                        }}
                        style={{
                          backgroundColor:
                            status === "SPEAKING" ? "#ffffff" : isListening ? "#fb7185" : "#00f2fe",
                          boxShadow: `0 0 6px ${theme.primary}`,
                        }}
                        className="w-1 rounded-full pointer-events-none"
                      />
                    )
                  )}
                </div>
              </motion.div>
            </motion.div>

            {/* 3D HOLOGRAPHIC EMITTER PEDESTAL / BASE PLATFORM */}
            <div className="relative w-64 sm:w-76 md:w-84 h-16 -mt-8 flex flex-col items-center justify-center pointer-events-none">
              {/* Upward Volumetric Light Beam Projector */}
              <div
                style={{
                  background: `linear-gradient(to top, ${theme.primary} 0%, rgba(0, 210, 255, 0.3) 50%, transparent 100%)`,
                }}
                className="absolute bottom-5 w-28 sm:w-36 h-32 blur-lg opacity-40 animate-light-beam"
              />

              {/* Stepped Concentric Base Rings (Perspective RotateX 72deg) */}
              <div
                style={{
                  transform: "perspective(600px) rotateX(72deg)",
                  borderColor: theme.primary,
                  boxShadow: `0 0 35px ${theme.glow}, inset 0 0 25px ${theme.glow}`,
                }}
                className="w-56 sm:w-68 md:w-76 h-28 rounded-full border-2 bg-slate-950/80 animate-pedestal-pulse flex items-center justify-center"
              >
                {/* Inner Tier Ring */}
                <div
                  style={{ borderColor: theme.accent }}
                  className="w-40 sm:w-52 h-20 rounded-full border-2 border-dashed animate-spin-slow opacity-80"
                />
                {/* Center Core Emitter Ring */}
                <div
                  style={{
                    backgroundColor: theme.primary,
                    boxShadow: `0 0 30px 6px ${theme.primary}`,
                  }}
                  className="w-20 sm:w-28 h-10 rounded-full absolute opacity-70"
                />
              </div>
            </div>
          </div>

          {/* ──────────────────────────────────────────────────────────────────────────
              CENTER BOTTOM ACTION BAR (4 Big Cyber Glass Action Buttons)
          ────────────────────────────────────────────────────────────────────────── */}
          <div className="w-full max-w-xl flex items-center justify-center gap-2 sm:gap-3 z-20 mt-1">
            
            {/* Button 1: Chat */}
            <button
              onClick={() => {
                soundFx.playClick();
                setActiveModal("chat");
              }}
              style={{ borderColor: `${theme.primary}45` }}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-2xl cyber-btn group shadow-lg"
            >
              <div
                style={{ borderColor: `${theme.primary}40`, backgroundColor: `${theme.primary}15` }}
                className="w-8 h-8 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-110"
              >
                <MessageSquare style={{ color: theme.primary }} className="w-4 h-4" />
              </div>
              <span className="text-[11px] sm:text-xs font-orbitron font-bold text-white tracking-wide whitespace-nowrap">
                Chat
              </span>
            </button>

            {/* Button 2: Generate Image */}
            <button
              onClick={() => {
                soundFx.playClick();
                setActiveModal("image");
              }}
              style={{ borderColor: `${theme.primary}45` }}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-2xl cyber-btn group shadow-lg"
            >
              <div
                style={{ borderColor: `${theme.primary}40`, backgroundColor: `${theme.primary}15` }}
                className="w-8 h-8 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-110"
              >
                <ImageIcon style={{ color: theme.primary }} className="w-4 h-4" />
              </div>
              <span className="text-[11px] sm:text-xs font-orbitron font-bold text-white tracking-wide whitespace-nowrap">
                Generate Image
              </span>
            </button>

            {/* Button 3: Code Assistant */}
            <button
              onClick={() => {
                soundFx.playClick();
                setActiveModal("code");
              }}
              style={{ borderColor: `${theme.primary}45` }}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-2xl cyber-btn group shadow-lg"
            >
              <div
                style={{ borderColor: `${theme.primary}40`, backgroundColor: `${theme.primary}15` }}
                className="w-8 h-8 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-110"
              >
                <Code style={{ color: theme.primary }} className="w-4 h-4" />
              </div>
              <span className="text-[11px] sm:text-xs font-orbitron font-bold text-white tracking-wide whitespace-nowrap">
                Code Assistant
              </span>
            </button>

            {/* Button 4: Voice */}
            <button
              onClick={toggleListening}
              style={{
                borderColor: isListening ? "#f43f5e" : `${theme.primary}45`,
                boxShadow: isListening ? "0 0 25px rgba(244,63,94,0.7)" : undefined,
              }}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-2xl cyber-btn group shadow-lg"
            >
              <div
                style={{
                  borderColor: isListening ? "#f43f5e" : `${theme.primary}40`,
                  backgroundColor: isListening ? "rgba(244,63,94,0.25)" : `${theme.primary}15`,
                }}
                className="w-8 h-8 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-110"
              >
                {isListening ? (
                  <MicOff className="w-4 h-4 text-rose-400 animate-pulse" />
                ) : (
                  <Mic style={{ color: theme.primary }} className="w-4 h-4" />
                )}
              </div>
              <span className="text-[11px] sm:text-xs font-orbitron font-bold text-white tracking-wide whitespace-nowrap">
                {isListening ? "Listening..." : "Voice"}
              </span>
            </button>

          </div>
        </div>

        {/* ──────────────────────────────────────────────────────────────────────────
            RIGHT COLUMN: RECENT CONVERSATIONS, POPULAR TOOLS, SYSTEM STATUS (md:col-span-4 or 3)
        ────────────────────────────────────────────────────────────────────────── */}
        <div className="md:col-span-4 xl:col-span-3 flex flex-col gap-3 justify-between">
          
          {/* 1. RECENT CONVERSATIONS PANEL */}
          <div
            style={{ borderColor: `${theme.primary}30` }}
            className="p-3.5 rounded-2xl cyber-card flex flex-col justify-between shadow-xl transition-all hover:border-cyan-400/50"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MessageSquare style={{ color: theme.primary }} className="w-4 h-4" />
                <h3 className="font-orbitron text-xs md:text-sm font-bold tracking-wider text-white uppercase">
                  Recent Conversations
                </h3>
              </div>
              <button
                onClick={() => setActiveModal("chat")}
                style={{ color: theme.primary }}
                className="text-[10px] font-mono hover:underline transition-colors font-bold"
              >
                View All
              </button>
            </div>

            {/* 4 Conversation Cards */}
            <div className="flex flex-col gap-2">
              {/* Conv 1: Create a website */}
              <div
                onClick={() => {
                  soundFx.playClick();
                  setActiveModal("chat");
                  handleSendCommand("Create a website for my college project with React and Node.js");
                }}
                className="flex items-start gap-2 p-1.5 rounded-xl bg-slate-950/50 hover:bg-slate-900/80 border border-slate-800/80 hover:border-cyan-500/40 transition-all cursor-pointer group"
              >
                <div className="p-1.5 rounded-lg bg-blue-600/25 border border-blue-500/40 text-blue-400 shrink-0">
                  <Code className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-semibold text-white truncate font-sans">
                      Create a website for my college project
                    </h4>
                    <span className="text-[9px] font-mono text-slate-400 whitespace-nowrap ml-1">2h ago</span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">
                    Full-stack web application with React + Node.js
                  </p>
                </div>
              </div>

              {/* Conv 2: Generate an image */}
              <div
                onClick={() => {
                  soundFx.playClick();
                  setImagePrompt("generate image of futuristic sci-fi AI hologram dashboard interface 8k");
                  setActiveModal("image");
                }}
                className="flex items-start gap-2 p-1.5 rounded-xl bg-slate-950/50 hover:bg-slate-900/80 border border-slate-800/80 hover:border-cyan-500/40 transition-all cursor-pointer group"
              >
                <div className="p-1.5 rounded-lg bg-cyan-600/25 border border-cyan-500/40 text-cyan-400 shrink-0">
                  <ImageIcon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-semibold text-white truncate font-sans">
                      Generate an image of a futuristic UI
                    </h4>
                    <span className="text-[9px] font-mono text-slate-400 whitespace-nowrap ml-1">4h ago</span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">
                    Created a modern AI dashboard interface
                  </p>
                </div>
              </div>

              {/* Conv 3: Explain DSA */}
              <div
                onClick={() => {
                  soundFx.playClick();
                  setActiveModal("chat");
                  handleSendCommand("Explain DSA concept Binary Search with complete algorithm and code examples");
                }}
                className="flex items-start gap-2 p-1.5 rounded-xl bg-slate-950/50 hover:bg-slate-900/80 border border-slate-800/80 hover:border-cyan-500/40 transition-all cursor-pointer group"
              >
                <div className="p-1.5 rounded-lg bg-sky-600/25 border border-sky-500/40 text-sky-400 shrink-0">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-semibold text-white truncate font-sans">
                      Explain DSA concept
                    </h4>
                    <span className="text-[9px] font-mono text-slate-400 whitespace-nowrap ml-1">6h ago</span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">
                    Binary Search with example and code
                  </p>
                </div>
              </div>

              {/* Conv 4: Python Code */}
              <div
                onClick={() => {
                  soundFx.playClick();
                  setActiveModal("code");
                }}
                className="flex items-start gap-2 p-1.5 rounded-xl bg-slate-950/50 hover:bg-slate-900/80 border border-slate-800/80 hover:border-cyan-500/40 transition-all cursor-pointer group"
              >
                <div className="p-1.5 rounded-lg bg-amber-600/25 border border-amber-500/40 text-amber-400 shrink-0">
                  <Cpu className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-semibold text-white truncate font-sans">
                      Help me with Python code
                    </h4>
                    <span className="text-[9px] font-mono text-slate-400 whitespace-nowrap ml-1">8h ago</span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">
                    Fixed the error in your script
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 2. POPULAR TOOLS (3x2 Grid) */}
          <div
            style={{ borderColor: `${theme.primary}30` }}
            className="p-3.5 rounded-2xl cyber-card flex flex-col justify-between shadow-xl transition-all hover:border-cyan-400/50"
          >
            <div className="flex items-center gap-2 mb-2">
              <Zap style={{ color: theme.primary }} className="w-4 h-4" />
              <h3 className="font-orbitron text-xs md:text-sm font-bold tracking-wider text-white uppercase">
                Popular Tools
              </h3>
            </div>

            {/* 3x2 Grid Buttons */}
            <div className="grid grid-cols-3 gap-1.5">
              {/* Tool 1: Web Search */}
              <button
                onClick={() => {
                  soundFx.playClick();
                  setActiveModal("search");
                }}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-950/60 hover:bg-slate-900/90 border border-slate-800/80 hover:border-cyan-400/50 transition-all hover:scale-105 active:scale-95 group"
              >
                <Globe style={{ color: theme.primary }} className="w-4 h-4 mb-0.5 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-mono font-medium text-slate-200">Web Search</span>
              </button>

              {/* Tool 2: Image Gen */}
              <button
                onClick={() => {
                  soundFx.playClick();
                  setActiveModal("image");
                }}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-950/60 hover:bg-slate-900/90 border border-slate-800/80 hover:border-cyan-400/50 transition-all hover:scale-105 active:scale-95 group"
              >
                <ImageIcon style={{ color: theme.primary }} className="w-4 h-4 mb-0.5 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-mono font-medium text-slate-200">Image Gen</span>
              </button>

              {/* Tool 3: Code Help */}
              <button
                onClick={() => {
                  soundFx.playClick();
                  setActiveModal("code");
                }}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-950/60 hover:bg-slate-900/90 border border-slate-800/80 hover:border-cyan-400/50 transition-all hover:scale-105 active:scale-95 group"
              >
                <Code style={{ color: theme.primary }} className="w-4 h-4 mb-0.5 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-mono font-medium text-slate-200">Code Help</span>
              </button>

              {/* Tool 4: File Analysis */}
              <button
                onClick={() => {
                  soundFx.playClick();
                  setActiveModal("chat");
                  handleSendCommand("Analyze directory workspace and files status");
                }}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-950/60 hover:bg-slate-900/90 border border-slate-800/80 hover:border-cyan-400/50 transition-all hover:scale-105 active:scale-95 group"
              >
                <FileText style={{ color: theme.primary }} className="w-4 h-4 mb-0.5 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-mono font-medium text-slate-200">File Analysis</span>
              </button>

              {/* Tool 5: Voice Assistant */}
              <button
                onClick={toggleListening}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-950/60 hover:bg-slate-900/90 border border-slate-800/80 hover:border-cyan-400/50 transition-all hover:scale-105 active:scale-95 group"
              >
                <Mic style={{ color: theme.primary }} className="w-4 h-4 mb-0.5 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-mono font-medium text-slate-200">Voice Assist</span>
              </button>

              {/* Tool 6: Smart Chat */}
              <button
                onClick={() => {
                  soundFx.playClick();
                  setActiveModal("chat");
                }}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-950/60 hover:bg-slate-900/90 border border-slate-800/80 hover:border-cyan-400/50 transition-all hover:scale-105 active:scale-95 group"
              >
                <MessageSquare style={{ color: theme.primary }} className="w-4 h-4 mb-0.5 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-mono font-medium text-slate-200">Smart Chat</span>
              </button>
            </div>
          </div>

          {/* 3. SYSTEM STATUS PANEL */}
          <div
            style={{ borderColor: `${theme.primary}30` }}
            className="p-3.5 rounded-2xl cyber-card flex flex-col justify-between shadow-xl transition-all hover:border-cyan-400/50"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <h3 className="font-orbitron text-xs md:text-sm font-bold tracking-wider text-white uppercase">
                  System Status
                </h3>
              </div>
              <div className="flex items-center gap-1 text-[9px] font-mono text-emerald-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                All Systems Operational
              </div>
            </div>

            {/* 4 Status Progress Bars */}
            <div className="flex flex-col gap-2 font-mono text-xs">
              <div>
                <div className="flex justify-between items-center mb-0.5 text-slate-300">
                  <span className="text-[10px]">AI Core</span>
                  <span style={{ color: theme.primary }} className="font-bold text-[10px]">100%</span>
                </div>
                <div className="w-full bg-slate-900/80 h-1.5 rounded-full overflow-hidden border border-slate-800 relative">
                  <div
                    style={{ backgroundColor: theme.primary, boxShadow: `0 0 10px ${theme.primary}` }}
                    className="w-full h-full rounded-full relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-bar-shimmer" />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-0.5 text-slate-300">
                  <span className="text-[10px]">Search Engine</span>
                  <span style={{ color: theme.primary }} className="font-bold text-[10px]">100%</span>
                </div>
                <div className="w-full bg-slate-900/80 h-1.5 rounded-full overflow-hidden border border-slate-800 relative">
                  <div
                    style={{ backgroundColor: theme.primary, boxShadow: `0 0 10px ${theme.primary}` }}
                    className="w-full h-full rounded-full relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-bar-shimmer" />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-0.5 text-slate-300">
                  <span className="text-[10px]">Image Generator</span>
                  <span style={{ color: theme.primary }} className="font-bold text-[10px]">100%</span>
                </div>
                <div className="w-full bg-slate-900/80 h-1.5 rounded-full overflow-hidden border border-slate-800 relative">
                  <div
                    style={{ backgroundColor: theme.primary, boxShadow: `0 0 10px ${theme.primary}` }}
                    className="w-full h-full rounded-full relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-bar-shimmer" />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-0.5 text-slate-300">
                  <span className="text-[10px]">Voice Module</span>
                  <span style={{ color: theme.primary }} className="font-bold text-[10px]">100%</span>
                </div>
                <div className="w-full bg-slate-900/80 h-1.5 rounded-full overflow-hidden border border-slate-800 relative">
                  <div
                    style={{ backgroundColor: theme.primary, boxShadow: `0 0 10px ${theme.primary}` }}
                    className="w-full h-full rounded-full relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-bar-shimmer" />
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          BOTTOM FOOTER SCI-FI STATUS BAR
      ══════════════════════════════════════════════════════════════════════════ */}
      <footer className="relative z-20 w-full max-w-[1720px] mx-auto flex items-center justify-between text-xs font-mono text-slate-500 pt-1.5 px-1 border-t border-slate-800/80">
        <div className="flex items-center gap-2 tracking-[0.25em] text-[9px] sm:text-[10px] md:text-xs uppercase">
          <span style={{ color: theme.primary }}>SMART</span>
          <span>•</span>
          <span style={{ color: theme.accent }}>FAST</span>
          <span>•</span>
          <span className="text-slate-300">ALWAYS WITH YOU</span>
        </div>

        <div className="flex items-center gap-2 text-[9px] sm:text-[10px] md:text-xs">
          <span className="text-slate-400">Jarvis AI</span>
          <span>—</span>
          <span style={{ color: theme.primary }} className="font-semibold">Beyond Just a Chatbot</span>
        </div>
      </footer>

      {/* ══════════════════════════════════════════════════════════════════════════
          INTERACTIVE SCI-FI HUD TERMINAL & CHAT MODAL
      ══════════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {activeModal === "chat" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-xl"
            onClick={() => setActiveModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{ borderColor: theme.borderGlow }}
              className="relative w-full max-w-4xl h-[85vh] rounded-3xl cyber-card border shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/80 bg-slate-950/80">
                <div className="flex items-center gap-2.5">
                  <div className="flex gap-1.5 mr-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <Terminal style={{ color: theme.primary }} className="w-4 h-4" />
                  <h3 className="font-orbitron text-sm font-bold tracking-wider text-white">
                    JARVIS AI CHAT & COMMAND CONSOLE
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      soundFx.playPower();
                      setHistory([
                        {
                          id: "clear-" + Date.now(),
                          type: "jarvis",
                          text: "Console reset complete, sir. All diagnostics nominal. Standing by.",
                          time: "SYSTEM",
                        },
                      ]);
                    }}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300"
                    title="Clear Chat History"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chat Messages Body */}
              <div
                ref={chatScrollRef}
                className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4 custom-scrollbar bg-slate-950/40"
              >
                {history.map((msg) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={msg.id}
                    className={`flex flex-col ${msg.type === "user" ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-center gap-2 mb-1 px-1 text-[11px] font-mono">
                      <span
                        style={{ color: msg.type === "user" ? theme.accent : theme.primary }}
                        className="font-bold uppercase tracking-wider"
                      >
                        {msg.type === "user" ? "Operator (Manish)" : "Jarvis"}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-400">{msg.time}</span>
                    </div>

                    <div
                      style={{
                        borderColor: msg.type === "user" ? `${theme.accent}40` : `${theme.primary}30`,
                      }}
                      className={`group relative max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed backdrop-blur-md border ${
                        msg.type === "user"
                          ? "bg-slate-900/90 text-white rounded-tr-none shadow-lg"
                          : "bg-slate-950/80 text-slate-100 rounded-tl-none shadow-lg"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>

                      {/* Visual Artifact Preview if any */}
                      {msg.imageUrl && (
                        <div className="mt-3 relative rounded-xl overflow-hidden border border-cyan-500/40 bg-slate-950">
                          <img
                            src={msg.imageUrl}
                            alt="Visual Artifact"
                            className="w-full max-h-60 object-cover cursor-pointer"
                            onClick={() => setSelectedImage(msg.imageUrl || null)}
                          />
                        </div>
                      )}

                      {/* Copy response */}
                      <button
                        onClick={() => copyToClipboard(msg.text, msg.id)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded bg-slate-800 text-slate-300"
                      >
                        {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </motion.div>
                ))}

                {/* Live Speech transcript */}
                {isListening && transcript && (
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-sm font-mono italic">
                    🎙️ Transcribing: "{transcript}"
                  </div>
                )}

                {/* Thinking animation */}
                {status === "THINKING" && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950/80 border border-cyan-500/40 text-xs font-mono text-cyan-300 w-fit">
                    <Zap className="w-4 h-4 animate-bounce text-cyan-400" />
                    <span>Jarvis Neural Core synthesizing response...</span>
                  </div>
                )}
              </div>

              {/* Input Bar */}
              <div className="p-3 md:p-4 border-t border-slate-800/80 bg-slate-950/90">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendCommand(inputQuery);
                  }}
                  className="flex items-center gap-2.5"
                >
                  <button
                    type="button"
                    onClick={toggleListening}
                    style={{
                      borderColor: isListening ? "#f43f5e" : `${theme.primary}40`,
                      backgroundColor: isListening ? "#f43f5e" : `${theme.primary}20`,
                    }}
                    className="p-3 rounded-xl border text-white transition-all hover:scale-105 active:scale-95"
                    title={isListening ? "Stop Voice" : "Start Voice"}
                  >
                    {isListening ? <MicOff className="w-5 h-5 animate-pulse" /> : <Mic className="w-5 h-5" />}
                  </button>

                  <input
                    type="text"
                    value={inputQuery}
                    onChange={(e) => setInputQuery(e.target.value)}
                    placeholder="Ask Jarvis anything or type a command (e.g. 'Generate website code', 'Play music')..."
                    className="flex-1 px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:border-cyan-400 focus:outline-none text-sm text-white placeholder:text-slate-500"
                  />

                  <button
                    type="submit"
                    disabled={!inputQuery.trim() || status === "THINKING"}
                    style={{
                      backgroundColor: theme.primary,
                      boxShadow: `0 0 15px ${theme.glow}`,
                    }}
                    className="px-5 py-3 rounded-xl text-slate-950 font-bold font-orbitron text-xs flex items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
                  >
                    <span>EXECUTE</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════════════
          NEURAL IMAGE STUDIO MODAL
      ══════════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {activeModal === "image" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-xl"
            onClick={() => setActiveModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{ borderColor: theme.borderGlow }}
              className="relative w-full max-w-3xl rounded-3xl cyber-card border shadow-2xl p-5 md:p-6 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <ImageIcon style={{ color: theme.primary }} className="w-5 h-5" />
                  <h3 className="font-orbitron text-base font-bold text-white tracking-wide">
                    FLUX NEURAL IMAGE GENERATOR
                  </h3>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Prompt Input */}
              <div>
                <label className="text-xs font-mono text-cyan-300 mb-1.5 block">
                  Describe what you want Jarvis to generate:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    placeholder="e.g. futuristic cyberpunk neon city with flying hover cars 8k render..."
                    className="flex-1 px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    onClick={() => handleGenerateImage()}
                    disabled={isGeneratingImg || !imagePrompt.trim()}
                    style={{ backgroundColor: theme.primary }}
                    className="px-5 py-3 rounded-xl text-slate-950 font-bold font-orbitron text-xs flex items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isGeneratingImg ? "GENERATING..." : "GENERATE"}</span>
                  </button>
                </div>
              </div>

              {/* Quick Preset Prompts */}
              <div>
                <span className="text-[11px] font-mono text-slate-400 mb-2 block">QUICK PRESET PROMPTS:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Cyberpunk futuristic neon megacity 8k",
                    "Iron Man glowing Mark-VII Arc Reactor suit",
                    "Deep space quantum stargate orbiting Earth",
                    "Aerodynamic futuristic cyber hover vehicle",
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setImagePrompt(preset);
                        handleGenerateImage(preset);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-cyan-500/25 text-xs font-mono text-slate-300 hover:text-cyan-300 transition-all"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════════════
          CODE ASSISTANT MODAL
      ══════════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {activeModal === "code" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-xl"
            onClick={() => setActiveModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{ borderColor: theme.borderGlow }}
              className="relative w-full max-w-3xl rounded-3xl cyber-card border shadow-2xl p-5 md:p-6 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Code style={{ color: theme.primary }} className="w-5 h-5" />
                  <h3 className="font-orbitron text-base font-bold text-white tracking-wide">
                    JARVIS CODE ASSISTANT
                  </h3>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-300 font-mono">
                Select a programming task or enter your code question to execute with Jarvis:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { title: "React + Vite Template", desc: "Generate responsive web application architecture", prompt: "Create a modern React + Vite application structure with Tailwind and components" },
                  { title: "Python API with FastAPI", desc: "REST endpoints, auth middleware & async handlers", prompt: "Write a high-performance Python FastAPI backend template with CORS and endpoints" },
                  { title: "DSA Binary Search & Tree", desc: "Optimal algorithms with time & space complexity", prompt: "Explain Binary Search and Binary Search Tree with Python and C++ implementations" },
                  { title: "Debug & Fix Code", desc: "Inspect logic errors, memory leaks and syntax", prompt: "Help me debug and optimize this code snippet for peak performance" },
                ].map((item, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      soundFx.playClick();
                      setActiveModal("chat");
                      handleSendCommand(item.prompt);
                    }}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-400/50 hover:bg-slate-900/90 cursor-pointer transition-all group"
                  >
                    <h4 className="text-sm font-semibold text-white group-hover:text-cyan-300 flex items-center justify-between">
                      {item.title}
                      <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════════════
          WEB SEARCH MODAL
      ══════════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {activeModal === "search" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-xl"
            onClick={() => setActiveModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{ borderColor: theme.borderGlow }}
              className="relative w-full max-w-2xl rounded-3xl cyber-card border shadow-2xl p-5 md:p-6 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Globe style={{ color: theme.primary }} className="w-5 h-5" />
                  <h3 className="font-orbitron text-base font-bold text-white tracking-wide">
                    REALTIME WEB SEARCH ENGINE
                  </h3>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search the live web with DuckDuckGo & Gemini..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const val = (e.target as HTMLInputElement).value;
                      if (val.trim()) {
                        setActiveModal("chat");
                        handleSendCommand(`Search the web for: ${val}`);
                      }
                    }
                  }}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {["Latest AI breakthrough news today", "Current tech stock trends", "Python 3.14 features", "Mars space exploration update"].map((term, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setActiveModal("chat");
                      handleSendCommand(`Search the web for: ${term}`);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 text-xs font-mono text-slate-300 hover:text-cyan-300"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════════════
          SETTINGS & THEME CUSTOMIZER MODAL
      ══════════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {activeModal === "settings" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-xl"
            onClick={() => setActiveModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{ borderColor: theme.borderGlow }}
              className="relative w-full max-w-xl rounded-3xl cyber-card border shadow-2xl p-5 md:p-6 flex flex-col gap-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Settings style={{ color: theme.primary }} className="w-5 h-5" />
                  <h3 className="font-orbitron text-base font-bold text-white tracking-wide">
                    SYSTEM CONFIGURATION & THEMES
                  </h3>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Theme Selector */}
              <div>
                <span className="text-xs font-mono text-cyan-300 mb-2 block font-bold">
                  HUD COLOR THEME:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {(["cyan", "gold", "emerald", "violet"] as ThemeKey[]).map((key) => {
                    const t = THEMES[key];
                    const isSelected = currentThemeKey === key;
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          soundFx.playClick();
                          setCurrentThemeKey(key);
                        }}
                        style={{
                          borderColor: isSelected ? t.primary : "rgba(255,255,255,0.1)",
                          boxShadow: isSelected ? `0 0 15px ${t.glow}` : "none",
                        }}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all bg-slate-900/80 ${
                          isSelected ? "scale-105" : "hover:bg-slate-800"
                        }`}
                      >
                        <span
                          style={{ backgroundColor: t.primary, boxShadow: `0 0 10px ${t.primary}` }}
                          className="w-5 h-5 rounded-full"
                        />
                        <span className="text-xs font-mono font-bold text-white">{t.code}</span>
                        <span className="text-[10px] text-slate-400 uppercase">{key}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Audio Toggle */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white">Synthesized Sci-Fi SFX</h4>
                  <p className="text-xs text-slate-400">Futuristic audio chimes on click, voice, and system execution</p>
                </div>
                <button
                  onClick={() => {
                    soundFx.playClick();
                    setIsSfxMuted(!isSfxMuted);
                  }}
                  style={{
                    backgroundColor: isSfxMuted ? "rgba(244,63,94,0.2)" : `${theme.primary}20`,
                    borderColor: isSfxMuted ? "#f43f5e" : theme.primary,
                    color: isSfxMuted ? "#f43f5e" : theme.primary,
                  }}
                  className="px-3.5 py-1.5 rounded-lg border font-mono text-xs font-bold"
                >
                  {isSfxMuted ? "MUTED" : "ENABLED"}
                </button>
              </div>

              {/* Backend Endpoint Status */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono">
                <span className="text-slate-400 block mb-1">BACKEND CONNECTIVITY</span>
                <div className="flex items-center justify-between text-slate-300">
                  <span>FastAPI Port 8000</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    ONLINE
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════════════
          FULLSCREEN HIGH-RES IMAGE LIGHTBOX
      ══════════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{ borderColor: theme.borderGlow }}
              className="relative max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden border bg-slate-950 p-4 shadow-2xl flex flex-col"
            >
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="overflow-hidden rounded-2xl flex items-center justify-center max-h-[75vh]">
                <img
                  src={selectedImage}
                  alt="Jarvis Generated Preview"
                  className="max-h-[75vh] w-auto object-contain rounded-2xl"
                />
              </div>

              <div className="p-3 flex items-center justify-between text-xs font-mono text-slate-300 border-t border-slate-800 mt-3">
                <span style={{ color: theme.primary }} className="flex items-center gap-2 font-semibold">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  HIGH RESOLUTION HOLOGRAPHIC ARTIFACT
                </span>
                <a
                  href={selectedImage}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  style={{
                    backgroundColor: `${theme.primary}25`,
                    borderColor: theme.primary,
                    color: theme.primary,
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold hover:scale-105 transition-transform"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download High-Res
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
}
