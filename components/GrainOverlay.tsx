"use client";

import { useEffect, useRef } from "react";

export default function GrainOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf: number;
    let tick = 0;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("mousemove", (e) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    });

    function draw() {
      tick++;
      // Redraw noise every 2 frames (~30 fps) for performance
      if (tick % 2 === 0) {
        const { width, height } = canvas;
        const img = ctx.createImageData(width, height);
        const d = img.data;

        for (let i = 0; i < d.length; i += 4) {
          const v = (Math.random() * 255) | 0;
          d[i] = d[i + 1] = d[i + 2] = v;
          d[i + 3] = (Math.random() * 210) | 0;
        }
        ctx.putImageData(img, 0, 0);

        // Mask: keep only the flashlight circle, erase everything else
        const { x, y } = mouse.current;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, 340);
        grad.addColorStop(0,    "rgba(0,0,0,1)");
        grad.addColorStop(0.45, "rgba(0,0,0,0.6)");
        grad.addColorStop(1,    "rgba(0,0,0,0)");

        ctx.globalCompositeOperation = "destination-in";
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = "source-over";
      }

      raf = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 100,
        pointerEvents: "none",
        mixBlendMode: "screen",
        opacity: 0.35,
      }}
    />
  );
}
