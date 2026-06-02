"use client";

import { useEffect, useRef, useCallback } from "react";
import { SEGMENTS, SWE_SEGMENTS } from "@/lib/segments";

interface WheelProps {
  targetIndex: number | null;
  spinning: boolean;
  freeSpin: boolean;
  onSpinComplete: () => void;
  variant?: string;
}

const FULL_CIRCLE = Math.PI * 2;
const RING_COLOR = "#e0e8ff";
const SPIN_DURATION = 5000;
const FULL_ROTATIONS = 7;
const FREE_SPIN_SPEED = 0.006; // radians per frame

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  // "|" acts as a forced line break between items
  const paragraphs = text.split("|");
  const allLines: string[] = [];
  for (const para of paragraphs) {
    const words = para.trim().split(/\s+/);
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width <= maxWidth) {
        line = test;
      } else {
        if (line) allLines.push(line);
        line = word;
      }
    }
    if (line) allLines.push(line);
  }
  return allLines.length ? allLines : [text];
}

function parseLabel(label: string): { top: string; big: string; bottom: string } {
  const discountMatch = label.match(/Diskon\s+(\d+%)/);
  if (discountMatch) return { top: "", big: discountMatch[1], bottom: "" };

  // "Jaminan Refund X juta [+ AI video learning]"
  // top: "Jaminan Refund", big: amount, bottom: extra offer if any
  const jaminanMatch = label.match(/^Jaminan [Rr]efund\s+([\d.]+\s*juta)(.*)?$/i);
  if (jaminanMatch) {
    const amount = jaminanMatch[1].trim();
    const extra = (jaminanMatch[2] ?? "").trim();
    return { top: "Jaminan Refund", big: amount, bottom: extra ? "+ AI Video" : "" };
  }

  const bnspMatch = label.match(/^(BNSP)\s*\+\s*(.+)$/);
  if (bnspMatch) {
    const parts = bnspMatch[2].split(/\s*\+\s*/);
    const bottom = parts
      .map(p => "+ " + p.replace("AI Free Learning", "AI Learning").replace("Starter Kit", "Starter Kit").trim())
      .join("|");
    return { top: "", big: "BNSP", bottom };
  }
  return { top: "", big: label, bottom: "" };
}

export default function Wheel({ targetIndex, spinning, freeSpin, onSpinComplete, variant }: WheelProps) {
  const segments = variant === "swe" ? SWE_SEGMENTS : SEGMENTS;
  const SEGMENT_ANGLE = FULL_CIRCLE / segments.length;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentAngleRef = useRef(0);
  const animRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const startAngleRef = useRef(0);
  const targetAngleRef = useRef(0);
  const freeSpinRef = useRef(false);

  const drawWheel = useCallback((angle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = canvas.width;
    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 22;

    ctx.clearRect(0, 0, size, size);

    // Outer glow — stays within canvas bounds
    const glowGradient = ctx.createRadialGradient(cx, cy, radius * 0.7, cx, cy, radius + 16);
    glowGradient.addColorStop(0, "rgba(100, 150, 255, 0)");
    glowGradient.addColorStop(0.7, "rgba(100, 150, 255, 0.1)");
    glowGradient.addColorStop(1, "rgba(100, 150, 255, 0.3)");
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 16, 0, FULL_CIRCLE);
    ctx.fillStyle = glowGradient;
    ctx.fill();

    // Draw segments
    segments.forEach((seg, i) => {
      const startAngle = angle + i * SEGMENT_ANGLE - Math.PI / 2;
      const endAngle = startAngle + SEGMENT_ANGLE;
      const midAngle = startAngle + SEGMENT_ANGLE / 2;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.closePath();

      // Jackpot segment (index 0) gets a vivid bright-blue gradient
      if (i === 0) {
        const innerX = cx + Math.cos(midAngle) * radius * 0.15;
        const innerY = cy + Math.sin(midAngle) * radius * 0.15;
        const outerX = cx + Math.cos(midAngle) * radius;
        const outerY = cy + Math.sin(midAngle) * radius;
        const jackpotGrad = ctx.createLinearGradient(innerX, innerY, outerX, outerY);
        jackpotGrad.addColorStop(0, "#1e3aaa");
        jackpotGrad.addColorStop(1, "#4b78f0");
        ctx.fillStyle = jackpotGrad;
      } else {
        ctx.fillStyle = seg.color;
      }

      ctx.fill();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 0.75;
      ctx.stroke();
    });

    // Depth overlay: darker at center, adds 3D feel
    const depthGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    depthGradient.addColorStop(0, "rgba(0, 10, 40, 0.5)");
    depthGradient.addColorStop(0.4, "rgba(0, 10, 40, 0.18)");
    depthGradient.addColorStop(1, "rgba(0, 30, 80, 0.04)");
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, FULL_CIRCLE);
    ctx.fillStyle = depthGradient;
    ctx.fill();

    const bigSize = size < 320 ? 18 : size < 400 ? 22 : 26;
    const smallSize = size < 320 ? 10 : size < 400 ? 11 : 13;
    const textRadius = radius * 0.78;
    // Max width a text line can occupy along the radial direction (rim → hub)
    const smallMaxWidth = textRadius - 36;
    const lineGap = 2;

    segments.forEach((seg, i) => {
      const startAngle = angle + i * SEGMENT_ANGLE - Math.PI / 2;
      const { top, big, bottom } = parseLabel(seg.label);
      const midAngle = startAngle + SEGMENT_ANGLE / 2;
      const normMid = ((midAngle % FULL_CIRCLE) + FULL_CIRCLE) % FULL_CIRCLE;
      const isFlipped = normMid > Math.PI / 2 && normMid < Math.PI * 1.5;

      // Pre-wrap all text before save/rotate so measureText uses unrotated state
      ctx.font = `800 ${smallSize}px Poppins, sans-serif`;
      const topLines = top ? wrapText(ctx, top, smallMaxWidth) : [];
      const bottomLines = bottom ? wrapText(ctx, bottom, smallMaxWidth) : [];

      const topH = topLines.length > 0
        ? topLines.length * smallSize + (topLines.length - 1) * lineGap
        : 0;
      const bottomH = bottomLines.length > 0
        ? bottomLines.length * smallSize + (bottomLines.length - 1) * lineGap
        : 0;
      const totalH = topH + (topH > 0 ? lineGap : 0) + bigSize + (bottomH > 0 ? lineGap : 0) + bottomH;
      const baseY = -totalH / 2;

      const bigY = baseY + topH + (topH > 0 ? lineGap : 0) + bigSize * 0.75;
      const bottomStartY = baseY + topH + (topH > 0 ? lineGap : 0) + bigSize + lineGap;

      ctx.save();

      // Clip text to this segment's wedge so it never bleeds into neighbors
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius - 2, startAngle, startAngle + SEGMENT_ANGLE);
      ctx.closePath();
      ctx.clip();

      ctx.translate(cx, cy);
      ctx.fillStyle = seg.textColor;
      ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
      ctx.shadowBlur = 5;

      // Position text closer to rim — 75% of textRadius
      const textCenter = textRadius * 0.75;
      const xPos = isFlipped ? -textCenter : textCenter;
      const textAlign: CanvasTextAlign = "center";
      ctx.rotate(isFlipped ? midAngle + Math.PI : midAngle);
      ctx.textAlign = textAlign;

      // Top small lines (e.g. "Jaminan Refund")
      if (topLines.length > 0) {
        ctx.font = `800 ${smallSize}px Poppins, sans-serif`;
        ctx.globalAlpha = 0.82;
        topLines.forEach((line, li) => {
          const y = baseY + li * (smallSize + lineGap) + smallSize * 0.75;
          ctx.fillText(line, xPos, y);
        });
        ctx.globalAlpha = 1;
      }

      // Big (amount) text
      ctx.font = `800 ${bigSize}px Poppins, sans-serif`;
      ctx.fillText(big, xPos, bigY);

      // Bottom small lines (e.g. "+ AI Video" or BNSP add-ons)
      if (bottomLines.length > 0) {
        ctx.font = `800 ${smallSize}px Poppins, sans-serif`;
        ctx.globalAlpha = 0.82;
        bottomLines.forEach((line, li) => {
          const y = bottomStartY + li * (smallSize + lineGap) + smallSize * 0.75;
          ctx.fillText(line, xPos, y);
        });
        ctx.globalAlpha = 1;
      }

      ctx.restore();
    });

    // Outer ring — white-blue border + inner accent
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, FULL_CIRCLE);
    ctx.strokeStyle = RING_COLOR;
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, radius - 8, 0, FULL_CIRCLE);
    ctx.strokeStyle = "rgba(200, 220, 255, 0.3)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Glassmorphic center button
    // Dark navy base
    ctx.beginPath();
    ctx.arc(cx, cy, 30, 0, FULL_CIRCLE);
    ctx.fillStyle = "#0d1854";
    ctx.fill();

    // Glass shimmer arc (top-left highlight)
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, 26, Math.PI * 1.1, Math.PI * 1.85);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    // White border ring with blue glow
    ctx.shadowColor = "rgba(99, 150, 255, 0.65)";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(cx, cy, 30, 0, FULL_CIRCLE);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Inner subtle ring
    ctx.beginPath();
    ctx.arc(cx, cy, 21, 0, FULL_CIRCLE);
    ctx.strokeStyle = "rgba(200, 220, 255, 0.3)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }, [segments, SEGMENT_ANGLE]);

  // Initial draw — wait for Poppins to load
  useEffect(() => {
    document.fonts.ready.then(() => drawWheel(0));
  }, [drawWheel]);

  // Phase 1: free spin — constant speed loop while waiting for API
  useEffect(() => {
    freeSpinRef.current = freeSpin;

    if (!freeSpin) return;

    if (animRef.current) cancelAnimationFrame(animRef.current);

    const loop = () => {
      if (!freeSpinRef.current) return;
      currentAngleRef.current += FREE_SPIN_SPEED;
      drawWheel(currentAngleRef.current);
      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [freeSpin, drawWheel]);

  // Phase 2: landing — decelerate to target segment
  useEffect(() => {
    if (!spinning || targetIndex === null) return;

    if (animRef.current) cancelAnimationFrame(animRef.current);

    const segmentCenterAngle = -(targetIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2);
    const normalizedTarget = ((segmentCenterAngle % FULL_CIRCLE) + FULL_CIRCLE) % FULL_CIRCLE;

    startAngleRef.current = currentAngleRef.current;
    const currentNorm = ((currentAngleRef.current % FULL_CIRCLE) + FULL_CIRCLE) % FULL_CIRCLE;
    let delta = normalizedTarget - currentNorm;
    if (delta < 0) delta += FULL_CIRCLE;

    targetAngleRef.current =
      currentAngleRef.current + FULL_ROTATIONS * FULL_CIRCLE + delta;

    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / SPIN_DURATION, 1);
      const easedProgress = easeOut(progress);

      currentAngleRef.current =
        startAngleRef.current +
        (targetAngleRef.current - startAngleRef.current) * easedProgress;

      drawWheel(currentAngleRef.current);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        currentAngleRef.current = targetAngleRef.current;
        drawWheel(currentAngleRef.current);
        onSpinComplete();
      }
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [spinning, targetIndex, drawWheel, onSpinComplete]);

  const size = 380;

  return (
    <div className="relative flex items-center justify-center">
      {/* SVG pointer pin — crisp, glowing, gradient-filled */}
      <svg
        className="absolute left-1/2 z-10"
        style={{
          top: 0,
          transform: "translateX(-50%) translateY(-6px)",
          filter: "drop-shadow(0 3px 8px rgba(255,222,61,0.75))",
        }}
        width="28" height="38" viewBox="0 0 28 38"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="ptrGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFF5B0" />
            <stop offset="55%" stopColor="#FFDE3D" />
            <stop offset="100%" stopColor="#C8A000" />
          </linearGradient>
        </defs>
        {/* Arrow body pointing down */}
        <polygon points="14,38 0,6 28,6" fill="url(#ptrGrad)" />
        {/* Flat top cap */}
        <rect x="0" y="0" width="28" height="7" rx="3.5" fill="#FFF5B0" />
      </svg>

      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="max-w-full"
        style={{ maxWidth: "min(380px, 90vw)", maxHeight: "min(380px, 90vw)" }}
      />
    </div>
  );
}
