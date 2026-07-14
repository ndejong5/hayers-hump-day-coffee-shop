"use client";

import { useState } from "react";

const COLORS = ["#ea7317", "#f59e0b", "#16a34a", "#0e7490", "#be185d", "#fdf6ec"];
const PIECE_COUNT = 90;

function makePieces() {
  return Array.from({ length: PIECE_COUNT }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.6,
    duration: 2.2 + Math.random() * 1.4,
    rotation: Math.random() * 360,
    color: COLORS[i % COLORS.length],
    drift: (Math.random() - 0.5) * 120,
  }));
}

export function Confetti() {
  const [pieces] = useState(makePieces);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece absolute top-[-5%] block h-3 w-2 rounded-sm"
          style={{
            left: `${p.left}%`,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            // @ts-expect-error -- custom property consumed by the keyframe below
            "--drift": `${p.drift}px`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
      <style>{`
        .confetti-piece {
          animation-name: confetti-fall;
          animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
          animation-fill-mode: forwards;
        }
        @keyframes confetti-fall {
          0% {
            transform: translate3d(0, 0, 0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate3d(var(--drift), 110vh, 0) rotate(720deg);
            opacity: 0.9;
          }
        }
      `}</style>
    </div>
  );
}
