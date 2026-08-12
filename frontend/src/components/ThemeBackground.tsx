'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/components/ThemeContext';

export function ThemeBackground() {
  const pathname = usePathname();
  const { theme } = useTheme();
  const isGamePage = pathname?.startsWith('/game/');

  useEffect(() => {
    const canvas = document.getElementById('generative-bg') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    let mouseX = -9999;
    let mouseY = -9999;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const handleMouseLeave = () => {
      mouseX = -9999;
      mouseY = -9999;
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    const COLS = 65;
    const ROWS = 65;
    let time = 0;

    const render = () => {
      time += 0.012;
      ctx.clearRect(0, 0, width, height);

      // 3D Perspective Projection settings
      const fov = 450;
      const camY = -140;
      const camZ = -220;
      const angle = 0.52; // Radians of vertical tilt angle
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      // Loop grid back-to-front (depth-order)
      for (let r = 0; r < ROWS; r++) {
        const z3d = (r - ROWS / 2) * 21;

        for (let c = 0; c < COLS; c++) {
          const x3d = (c - COLS / 2) * 23;

          // Multi-layered sine wave height calculation
          const wave1 = Math.sin(c * 0.11 + time) * 38;
          const wave2 = Math.cos(r * 0.13 + time * 0.9) * 38;
          const wave3 = Math.sin((c + r) * 0.05 + time * 0.6) * 16;
          const y3d = wave1 + wave2 + wave3;

          // Rotate around X-axis
          const rotZ = z3d * cosA - y3d * sinA;
          const rotY = y3d * cosA + z3d * sinA;

          const depth = rotZ - camZ + 450;

          if (depth > 50) {
            const scale = fov / depth;
            const projX = width / 2 + x3d * scale;
            const projY = height / 2 + (rotY + camY) * scale;

            if (projX >= 0 && projX <= width && projY >= 0 && projY <= height) {
              const dx = projX - mouseX;
              const dy = projY - mouseY;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const maxDist = 160;

              let finalX = projX;
              let finalY = projY;
              let isInteractive = false;

              if (dist < maxDist) {
                isInteractive = true;
                const force = (maxDist - dist) / maxDist;
                // Gently push particles away from the cursor
                finalX += (dx / (dist || 1)) * force * 24;
                finalY += (dy / (dist || 1)) * force * 24;
              }

              const size = Math.max(0.6, 2.3 * scale);
              const alpha = Math.min(1.0, scale * 1.3) * 0.55;
              const isLight = theme === 'light';

              if (isInteractive) {
                // Turn bright orange in light mode, or lime-green in dark mode close to cursor
                ctx.fillStyle = isLight ? `rgba(249, 115, 22, ${alpha * 1.6})` : `rgba(212, 255, 51, ${alpha * 1.6})`;
              } else {
                ctx.fillStyle = isLight ? `rgba(0, 0, 0, ${alpha * 0.5})` : `rgba(255, 255, 255, ${alpha})`;
              }

              ctx.fillRect(finalX - size / 2, finalY - size / 2, size, size);
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isGamePage, theme]);

  if (isGamePage) return null;

  return (
    <>
      {/* 3D Dotted Generative Wavy Landscape Canvas Background */}
      <canvas id="generative-bg" className="fixed inset-0 w-full h-full pointer-events-none z-0 opacity-50" />

      {/* Large Glowing Lime-Green Spotlight Overlay (Matching Pinterest feel) */}
      <div className="fixed top-[12%] left-1/2 -translate-x-1/2 w-[550px] h-[550px] bg-[#d4ff33]/10 dark:bg-[#d4ff33]/15 rounded-full blur-[130px] pointer-events-none z-0" />
    </>
  );
}
