"use client";

import { useEffect, useRef } from "react";

interface ParticleCanvasProps {
  color: string;
  glowColor: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseSize: number;
  opacity: number;
  layer: number; // 0=far, 1=mid, 2=near
  twinklePhase: number;
  twinkleSpeed: number;
}

interface ShootingStar {
  x: number;
  y: number;
  angle: number;
  speed: number;
  length: number;
  opacity: number;
  life: number;
  maxLife: number;
}

interface DataStream {
  x: number;
  y: number;
  speed: number;
  opacity: number;
  height: number;
  maxHeight: number;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : null;
}

export default function ParticleCanvas({
  color = "#00d2ff",
  glowColor = "rgba(0, 210, 255, 0.4)",
}: ParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let frameCount = 0;

    const rgb = hexToRgb(color) ?? { r: 0, g: 210, b: 255 };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Mouse tracking
    let mouseX = -2000;
    let mouseY = -2000;
    const handleMouseMove = (e: MouseEvent) => { mouseX = e.clientX; mouseY = e.clientY; };
    const handleMouseLeave = () => { mouseX = -2000; mouseY = -2000; };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    // ── Particles (3 depth layers) ──
    const particleCount = Math.min(Math.floor((width * height) / 12000), 110);
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      const layer = i % 3; // 0=far, 1=mid, 2=near
      const speedFactor = [0.25, 0.5, 0.9][layer];
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * speedFactor,
        vy: (Math.random() - 0.5) * speedFactor,
        size: [0.8, 1.4, 2.2][layer] + Math.random() * [0.6, 0.8, 1][layer],
        baseSize: [0.8, 1.4, 2.2][layer] + Math.random() * [0.6, 0.8, 1][layer],
        opacity: [0.15, 0.3, 0.55][layer] + Math.random() * 0.2,
        layer,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.02 + Math.random() * 0.04,
      });
    }

    // ── Shooting Stars ──
    const shootingStars: ShootingStar[] = [];
    const spawnShootingStar = () => {
      if (shootingStars.length >= 4) return;
      const angle = (Math.random() * 30 - 15) * (Math.PI / 180); // roughly left-to-right
      shootingStars.push({
        x: Math.random() * width * 0.6,
        y: Math.random() * height * 0.5,
        angle,
        speed: 8 + Math.random() * 10,
        length: 80 + Math.random() * 100,
        opacity: 1,
        life: 0,
        maxLife: 60 + Math.random() * 40,
      });
    };

    // ── Data Stream Lines (vertical matrix-style) ──
    const streamCount = Math.floor(width / 60);
    const dataStreams: DataStream[] = [];
    for (let i = 0; i < streamCount; i++) {
      dataStreams.push({
        x: (i + 0.5) * (width / streamCount) + (Math.random() - 0.5) * 30,
        y: Math.random() * height,
        speed: 0.6 + Math.random() * 1.5,
        opacity: 0.04 + Math.random() * 0.08,
        height: 40 + Math.random() * 80,
        maxHeight: 50 + Math.random() * 100,
      });
    }

    const draw = () => {
      frameCount++;
      ctx.clearRect(0, 0, width, height);

      // ── Spawn shooting stars occasionally ──
      if (frameCount % 180 === 0) spawnShootingStar();

      // ── 1. Data stream lines (deepest layer) ──
      for (const stream of dataStreams) {
        stream.y += stream.speed;
        if (stream.y > height + stream.height) {
          stream.y = -stream.height;
          stream.x = Math.random() * width;
          stream.opacity = 0.03 + Math.random() * 0.08;
        }
        const grad = ctx.createLinearGradient(stream.x, stream.y, stream.x, stream.y + stream.height);
        grad.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
        grad.addColorStop(0.5, `rgba(${rgb.r},${rgb.g},${rgb.b},${stream.opacity})`);
        grad.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(stream.x, stream.y);
        ctx.lineTo(stream.x, stream.y + stream.height);
        ctx.stroke();
      }

      // ── 2. Constellation links (layered by distance) ──
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const pi = particles[i];
          const pj = particles[j];
          // Only connect nearby layers
          if (Math.abs(pi.layer - pj.layer) > 1) continue;
          const dx = pi.x - pj.x;
          const dy = pi.y - pj.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = pi.layer === 2 ? 160 : pi.layer === 1 ? 120 : 80;
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.22 * ((pi.layer + pj.layer + 2) / 4);
            ctx.strokeStyle = color;
            ctx.globalAlpha = alpha;
            ctx.lineWidth = pi.layer === 2 ? 1.0 : 0.5;
            ctx.beginPath();
            ctx.moveTo(pi.x, pi.y);
            ctx.lineTo(pj.x, pj.y);
            ctx.stroke();
          }
        }
      }

      // ── 3. Mouse-proximity energy beam ──
      if (mouseX > 0 && mouseY > 0) {
        for (const p of particles) {
          const dx = p.x - mouseX;
          const dy = p.y - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180 && p.layer >= 1) {
            const alpha = (1 - dist / 180) * 0.35;
            ctx.strokeStyle = color;
            ctx.globalAlpha = alpha;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouseX, mouseY);
            ctx.stroke();
          }
        }
      }

      // ── 4. Update & draw particles ──
      ctx.globalAlpha = 1;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -5) p.x = width + 5;
        if (p.x > width + 5) p.x = -5;
        if (p.y < -5) p.y = height + 5;
        if (p.y > height + 5) p.y = -5;

        // Twinkle
        p.twinklePhase += p.twinkleSpeed;
        const twinkle = 0.75 + 0.25 * Math.sin(p.twinklePhase);

        // Mouse repulsion
        const mdx = p.x - mouseX;
        const mdy = p.y - mouseY;
        const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
        const repelRadius = [60, 100, 140][p.layer];
        if (mDist < repelRadius) {
          const force = (1 - mDist / repelRadius) * [1.5, 2.5, 3.5][p.layer];
          p.x += (mdx / (mDist || 1)) * force;
          p.y += (mdy / (mDist || 1)) * force;
          p.size = p.baseSize * 2;
        } else {
          p.size = p.baseSize;
        }

        // Layered glow effect
        const glowBlur = [4, 8, 14][p.layer];
        ctx.save();
        ctx.fillStyle = color;
        ctx.globalAlpha = p.opacity * twinkle;
        ctx.shadowColor = color;
        ctx.shadowBlur = glowBlur;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        // Extra outer glow for near-layer
        if (p.layer === 2) {
          ctx.globalAlpha = p.opacity * twinkle * 0.3;
          ctx.shadowBlur = 20;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // ── 5. Shooting stars ──
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i];
        s.life++;
        s.x += Math.cos(s.angle) * s.speed;
        s.y += Math.sin(s.angle) * s.speed + 1.5;
        s.opacity = 1 - s.life / s.maxLife;

        if (s.life > s.maxLife || s.x > width || s.y > height) {
          shootingStars.splice(i, 1);
          continue;
        }

        const tailX = s.x - Math.cos(s.angle) * s.length;
        const tailY = s.y - Math.sin(s.angle) * s.length - 1.5 * (s.length / s.speed);
        const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
        grad.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
        grad.addColorStop(0.6, `rgba(${rgb.r},${rgb.g},${rgb.b},${s.opacity * 0.5})`);
        grad.addColorStop(1, `rgba(255,255,255,${s.opacity})`);

        ctx.save();
        ctx.strokeStyle = grad;
        ctx.globalAlpha = s.opacity;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = "#ffffff";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();
        // Bright head dot
        ctx.fillStyle = "#ffffff";
        ctx.globalAlpha = s.opacity;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [color, glowColor]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-80"
    />
  );
}
