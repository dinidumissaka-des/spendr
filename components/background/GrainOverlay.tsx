"use client";

import { useEffect, useRef } from "react";

const SCALE = 2; // render at 1/2 resolution, CSS scales it up

export default function GrainOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf: number;
    let frame = 0;
    let img: ImageData | null = null;

    function resize() {
      canvas.width = Math.ceil(window.innerWidth / SCALE);
      canvas.height = Math.ceil(window.innerHeight / SCALE);
      img = ctx.createImageData(canvas.width, canvas.height);
    }
    resize();
    window.addEventListener("resize", resize);

    function draw() {
      frame++;
      if (frame % 3 === 0 && img) {
        const d = img.data;
        for (let i = 0; i < d.length; i += 4) {
          const v = (Math.random() * 255) | 0;
          d[i] = d[i + 1] = d[i + 2] = v;
          d[i + 3] = (Math.random() * 120) | 0;
        }
        ctx.putImageData(img, 0, 0);
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
        zIndex: 9999,
        pointerEvents: "none",
        mixBlendMode: "screen",
        opacity: 0.12,
        imageRendering: "pixelated",
      }}
    />
  );
}
