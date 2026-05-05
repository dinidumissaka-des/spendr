"use client";

import React, { useEffect, useRef, useState } from "react";

type DottedGlowBackgroundProps = {
  className?: string;
  gap?: number;
  radius?: number;
  color?: string;
  darkColor?: string;
  glowColor?: string;
  darkGlowColor?: string;
  colorLightVar?: string;
  colorDarkVar?: string;
  glowColorLightVar?: string;
  glowColorDarkVar?: string;
  opacity?: number;
  backgroundOpacity?: number;
  speedMin?: number;
  speedMax?: number;
  speedScale?: number;
  hoverRadius?: number;
};

export const DottedGlowBackground = ({
  className,
  gap = 12,
  radius = 2,
  color = "rgba(0,0,0,0.7)",
  darkColor,
  glowColor = "rgba(0, 170, 255, 0.85)",
  darkGlowColor,
  colorLightVar,
  colorDarkVar,
  glowColorLightVar,
  glowColorDarkVar,
  opacity = 0.6,
  backgroundOpacity = 0,
  speedMin = 0.4,
  speedMax = 1.3,
  speedScale = 1,
  hoverRadius = 120,
}: DottedGlowBackgroundProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const sizeRef = useRef({ width: 0, height: 0 });
  const [resolvedColor, setResolvedColor] = useState<string>(color);
  const [resolvedGlowColor, setResolvedGlowColor] = useState<string>(glowColor);

  const resolveCssVariable = (el: Element, variableName?: string): string | null => {
    if (!variableName) return null;
    const normalized = variableName.startsWith("--") ? variableName : `--${variableName}`;
    const fromEl = getComputedStyle(el).getPropertyValue(normalized).trim();
    if (fromEl) return fromEl;
    const fromRoot = getComputedStyle(document.documentElement).getPropertyValue(normalized).trim();
    return fromRoot || null;
  };

  const detectDarkMode = (): boolean => {
    const root = document.documentElement;
    if (root.classList.contains("dark")) return true;
    if (root.classList.contains("light")) return false;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  };

  useEffect(() => {
    const container = containerRef.current ?? document.documentElement;
    const compute = () => {
      const isDark = detectDarkMode();
      let nextColor = color;
      let nextGlow = glowColor;
      if (isDark) {
        nextColor = resolveCssVariable(container, colorDarkVar) || darkColor || nextColor;
        nextGlow = resolveCssVariable(container, glowColorDarkVar) || darkGlowColor || nextGlow;
      } else {
        nextColor = resolveCssVariable(container, colorLightVar) || nextColor;
        nextGlow = resolveCssVariable(container, glowColorLightVar) || nextGlow;
      }
      setResolvedColor(nextColor);
      setResolvedGlowColor(nextGlow);
    };
    compute();
    const mql = window.matchMedia?.("(prefers-color-scheme: dark)");
    mql?.addEventListener("change", compute);
    const mo = new MutationObserver(compute);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] });
    return () => { mql?.removeEventListener("change", compute); mo.disconnect(); };
  }, [color, darkColor, glowColor, darkGlowColor, colorLightVar, colorDarkVar, glowColorLightVar, glowColorDarkVar]);

  useEffect(() => {
    const el = canvasRef.current;
    const container = containerRef.current;
    if (!el || !container) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let stopped = false;
    let isVisible = true;
    const dpr = Math.min(Math.max(1, window.devicePixelRatio || 1), 2);

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      sizeRef.current = { width, height };
      el.width = Math.max(1, Math.floor(width * dpr));
      el.height = Math.max(1, Math.floor(height * dpr));
      el.style.width = `${Math.floor(width)}px`;
      el.style.height = `${Math.floor(height)}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();

    let dots: { x: number; y: number; phase: number; speed: number }[] = [];

    const regenDots = () => {
      dots = [];
      const { width, height } = sizeRef.current;
      const cols = Math.ceil(width / gap) + 2;
      const rows = Math.ceil(height / gap) + 2;
      const min = Math.min(speedMin, speedMax);
      const max = Math.max(speedMin, speedMax);
      for (let i = -1; i < cols; i++) {
        for (let j = -1; j < rows; j++) {
          const x = i * gap + (j % 2 === 0 ? 0 : gap * 0.5);
          const y = j * gap;
          dots.push({
            x, y,
            phase: Math.random() * Math.PI * 2,
            speed: min + Math.random() * Math.max(max - min, 0),
          });
        }
      }
    };
    regenDots();

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onMouseLeave = () => { mouseRef.current = null; };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", onMouseLeave);

    // Alpha buckets for batched drawing (avoids per-dot fill calls)
    const BUCKETS = 12;
    const buckets: number[][] = Array.from({ length: BUCKETS }, () => []);

    const draw = (now: number) => {
      if (stopped) return;
      if (!isVisible) { raf = requestAnimationFrame(draw); return; }

      const { width, height } = sizeRef.current; // cached — no reflow
      ctx.clearRect(0, 0, width, height);

      const time = (now / 1000) * Math.max(speedScale, 0);
      const mouse = mouseRef.current;
      const hr2 = hoverRadius * hoverRadius;

      // Clear buckets
      for (let b = 0; b < BUCKETS; b++) buckets[b].length = 0;

      // Classify non-hover dots into alpha buckets
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];

        // Skip dots in hover zone — drawn separately
        if (mouse) {
          const dx = d.x - mouse.x;
          const dy = d.y - mouse.y;
          if (dx * dx + dy * dy < hr2) continue;
        }

        const mod = (time * d.speed + d.phase) % 2;
        const lin = mod < 1 ? mod : 2 - mod;
        const a = (0.25 + 0.55 * lin) * opacity;
        const bucket = Math.min(Math.floor(a * BUCKETS), BUCKETS - 1);
        buckets[bucket].push(i);
      }

      // Draw each bucket as a single path — massively reduces GPU state changes
      ctx.save();
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.fillStyle = resolvedColor;

      for (let b = 0; b < BUCKETS; b++) {
        if (buckets[b].length === 0) continue;
        const alpha = (b + 0.5) / BUCKETS;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        for (let k = 0; k < buckets[b].length; k++) {
          const d = dots[buckets[b][k]];
          ctx.moveTo(d.x + radius, d.y);
          ctx.arc(d.x, d.y, radius, 0, Math.PI * 2);
        }
        ctx.fill();
      }

      // Draw hover dots individually with glow
      if (mouse) {
        ctx.fillStyle = resolvedColor;
        ctx.shadowColor = resolvedGlowColor;
        for (let i = 0; i < dots.length; i++) {
          const d = dots[i];
          const dx = d.x - mouse.x;
          const dy = d.y - mouse.y;
          const dist2 = dx * dx + dy * dy;
          if (dist2 >= hr2) continue;

          const dist = Math.sqrt(dist2);
          const hoverBoost = Math.pow(1 - dist / hoverRadius, 2);
          const mod = (time * d.speed + d.phase) % 2;
          const lin = mod < 1 ? mod : 2 - mod;
          const a = Math.min((0.25 + 0.55 * lin + hoverBoost * 0.75), 1);

          ctx.shadowBlur = hoverBoost * 14;
          ctx.globalAlpha = a * opacity;
          const r = radius + hoverBoost * radius * 1.2;
          ctx.beginPath();
          ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
      raf = requestAnimationFrame(draw);
    };

    const handleResize = () => { resize(); regenDots(); };
    const observer = new IntersectionObserver(
      (entries) => { isVisible = entries[0]?.isIntersecting ?? true; },
      { threshold: 0.1 }
    );
    observer.observe(container);
    window.addEventListener("resize", handleResize);
    raf = requestAnimationFrame(draw);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
      ro.disconnect();
    };
  }, [gap, radius, resolvedColor, resolvedGlowColor, opacity, backgroundOpacity, speedMin, speedMax, speedScale, hoverRadius]);

  return (
    <div ref={containerRef} className={className} style={{ position: "absolute", inset: 0 }}>
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
    </div>
  );
};
