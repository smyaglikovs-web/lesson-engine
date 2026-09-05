import React, { useState, useRef, useEffect, useCallback } from 'react';
import { playCorrectSound, triggerConfetti } from '../utils/sounds.js';

// Modern 2026 Tech & Creative Palette (Luminescent Indigo, Cyan, Violet, Emerald, Coral)
const MODERN_WHEEL_PALETTE = [
  '#4f46e5', // Deep Indigo
  '#06b6d4', // Electric Cyan
  '#7c3aed', // Radiant Purple
  '#10b981', // Emerald Mint
  '#f43f5e', // Neon Coral
  '#0284c7', // Sky Blue
  '#d946ef', // Magenta Glow
  '#059669', // Deep Teal
  '#f59e0b', // Warm Amber
  '#6366f1'  // Bright Indigo
];

// Safe Web Audio API Singleton for tactile tick sounds
let wheelAudioContextInstance = null;

function getWheelAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!wheelAudioContextInstance) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) wheelAudioContextInstance = new AudioCtx();
  }
  if (wheelAudioContextInstance && wheelAudioContextInstance.state === 'suspended') {
    wheelAudioContextInstance.resume().catch(() => {});
  }
  return wheelAudioContextInstance;
}

function playWheelTick() {
  try {
    const ctx = getWheelAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.022);

    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.022);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.025);
  } catch (e) {}
}

export const BlockSpinningWheel = ({ block = {}, value = {}, onChange }) => {
  const canvasRef = useRef(null);
  const [items, setItems] = useState(() => {
    if (Array.isArray(block.items) && block.items.length > 0) {
      return block.items;
    }
    return [
      'How would you apply this in real life?',
      'Have you ever had a memorable experience like this?',
      'What was the most surprising concept?',
      'If you were in their shoes, what would you do?',
      'Summarize the core idea in two sentences.',
      'What advice would you give regarding this?'
    ];
  });

  const [spinning, setSpinning] = useState(false);
  const [selectedItem, setSelectedItem] = useState(value?.selectedText || '');
  const rotationAngleRef = useRef(0);
  const lastTickIndexRef = useRef(-1);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    if (Array.isArray(block.items) && block.items.length > 0) {
      setItems(block.items);
    }
  }, [JSON.stringify(block.items)]);

  const numItems = items.length;
  const arcSize = numItems > 0 ? (2 * Math.PI) / numItems : 0;

  // Clean title to eliminate double emoji (🎡 🎡)
  const rawTitle = block.title || 'Discussion Roulette';
  const cleanTitle = rawTitle.replace(/^[🎡🎲🎯\s]+/gu, '').trim() || 'Discussion Roulette';

  // Smart text wrapping for readability
  const wrapTextToLines = (text, maxCharsPerLine = 13) => {
    const words = String(text || '').split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach(word => {
      if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
        currentLine = (currentLine + ' ' + word).trim();
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });
    if (currentLine) lines.push(currentLine);

    if (lines.length > 3) {
      lines[2] = lines[2].slice(0, 10) + '...';
      return lines.slice(0, 3);
    }
    return lines;
  };

  const drawWheel = useCallback((currentAngle) => {
    const canvas = canvasRef.current;
    if (!canvas || numItems === 0) return;
    const ctx = canvas.getContext('2d');

    // 2x Retina DPI Scaling for Ultra-Sharp Edges
    const dpr = window.devicePixelRatio || 2;
    const displaySize = 380;

    if (canvas.width !== displaySize * dpr || canvas.height !== displaySize * dpr) {
      canvas.width = displaySize * dpr;
      canvas.height = displaySize * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, displaySize, displaySize);

    const center = displaySize / 2;
    const outerRadius = center - 16;
    const hubRadius = 38;

    // 1. Sleek Outer Rim Shadow & Border
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, outerRadius + 6, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(15, 23, 42, 0.12)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 6;
    ctx.fill();
    ctx.restore();

    // 2. Wheel Slices with Subtle Shading & Thin Crisp Dividers
    for (let i = 0; i < numItems; i++) {
      const angle = currentAngle + i * arcSize;
      const sliceColor = MODERN_WHEEL_PALETTE[i % MODERN_WHEEL_PALETTE.length];

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, outerRadius, angle, angle + arcSize);
      ctx.lineTo(center, center);
      ctx.fillStyle = sliceColor;
      ctx.fill();

      // Thin frosted white dividers
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // Slices Text Layout
      const midAngle = angle + arcSize / 2;
      const normalizedMid = (midAngle % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
      const isLeftHalf = normalizedMid > Math.PI / 2 && normalizedMid < (3 * Math.PI) / 2;

      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(midAngle);

      const rawLabel = items[i];
      const maxChars = numItems > 8 ? 10 : 13;
      const textLines = wrapTextToLines(rawLabel, maxChars);
      const fontSize = numItems > 8 ? 10 : 11.5;

      ctx.font = `700 ${fontSize}px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 4;

      const lineHeight = fontSize + 3;
      const totalHeight = (textLines.length - 1) * lineHeight;

      if (isLeftHalf) {
        ctx.rotate(Math.PI);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const startX = -outerRadius + 18;

        textLines.forEach((line, lineIdx) => {
          const yPos = (lineIdx * lineHeight) - (totalHeight / 2);
          ctx.fillText(line, startX, yPos);
        });
      } else {
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        const startX = outerRadius - 18;

        textLines.forEach((line, lineIdx) => {
          const yPos = (lineIdx * lineHeight) - (totalHeight / 2);
          ctx.fillText(line, startX, yPos);
        });
      }

      ctx.restore();
    }

    // 3. 2026 Brushed Titanium & Glassmorphic Center Hub
    ctx.save();
    // Outer glass ring
    ctx.beginPath();
    ctx.arc(center, center, hubRadius + 4, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.shadowColor = 'rgba(15, 23, 42, 0.2)';
    ctx.shadowBlur = 10;
    ctx.fill();

    // Metallic inner core
    ctx.beginPath();
    ctx.arc(center, center, hubRadius - 4, 0, 2 * Math.PI);
    const hubGradient = ctx.createLinearGradient(center - 30, center - 30, center + 30, center + 30);
    hubGradient.addColorStop(0, '#4f46e5');
    hubGradient.addColorStop(1, '#7c3aed');
    ctx.fillStyle = hubGradient;
    ctx.fill();

    // Center icon
    ctx.font = 'bold 16px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('✨', center, center);
    ctx.restore();

    // 4. Sleek Floating Laser-Cut Indicator Needle
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(center - 10, 2);
    ctx.lineTo(center + 10, 2);
    ctx.lineTo(center, 28);
    ctx.closePath();
    ctx.fillStyle = '#f43f5e';
    ctx.shadowColor = 'rgba(244, 63, 94, 0.5)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }, [items, numItems, arcSize]);

  useEffect(() => {
    drawWheel(rotationAngleRef.current);
  }, [drawWheel]);

  const handleSpin = () => {
    if (spinning || numItems === 0) return;
    setSpinning(true);
    setSelectedItem('');

    const extraSpins = 6 + Math.random() * 4;
    const targetAngle = rotationAngleRef.current + extraSpins * 2 * Math.PI + Math.random() * 2 * Math.PI;
    const duration = 4200;
    const startTime = performance.now();
    const startAngle = rotationAngleRef.current;

    const animateSpin = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Smooth Quintic deceleration curve for realistic inertia
      const easeOut = 1 - Math.pow(1 - progress, 5);
      const currentAngle = startAngle + (targetAngle - startAngle) * easeOut;
      rotationAngleRef.current = currentAngle;

      drawWheel(currentAngle);

      const currentNormalized = (currentAngle % (2 * Math.PI));
      const currentSliceIdx = Math.floor((currentNormalized / arcSize)) % numItems;
      if (currentSliceIdx !== lastTickIndexRef.current) {
        lastTickIndexRef.current = currentSliceIdx;
        playWheelTick();
      }

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animateSpin);
      } else {
        setSpinning(false);

        const normalizedAngle = (2 * Math.PI - (currentAngle % (2 * Math.PI)) + 1.5 * Math.PI) % (2 * Math.PI);
        const winningIndex = Math.floor(normalizedAngle / arcSize) % numItems;
        const winner = items[winningIndex];

        setSelectedItem(winner);
        playCorrectSound();
        triggerConfetti();
        if (onChange) onChange({ selectedText: winner, winningIndex });
      }
    };

    animationFrameRef.current = requestAnimationFrame(animateSpin);
  };

  const handleEliminateCurrent = () => {
    if (!selectedItem || items.length <= 2) return;
    const updated = items.filter(it => it !== selectedItem);
    setItems(updated);
    setSelectedItem('');
  };

  return (
    <div className="bg-white p-5 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs mb-6 space-y-5 sm:space-y-6 text-center w-full min-w-0 overflow-hidden">
      {/* CLEAN SINGLE-EMOJI HEADER */}
      <div>
        <div className="flex items-center justify-center gap-2 mb-1.5">
          <span className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-base shadow-2xs">
            🎡
          </span>
          <h4 className="font-extrabold text-slate-900 text-lg sm:text-2xl tracking-tight leading-snug">
            {cleanTitle}
          </h4>
        </div>
        <p className="text-slate-500 text-xs sm:text-sm font-medium max-w-md mx-auto px-2">
          {block.instruction || 'Spin the wheel and answer the selected question!'}
        </p>
      </div>

      {/* RESPONSIVE RETINA WHEEL CANVAS */}
      <div className="relative inline-flex items-center justify-center mx-auto w-full max-w-[320px] sm:max-w-[380px] aspect-square select-none">
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', aspectRatio: '1 / 1' }}
          className="drop-shadow-md rounded-full select-none block"
        ></canvas>
      </div>

      {/* MODERN ACTION BUTTON */}
      <div className="pt-1">
        <button
          type="button"
          onClick={handleSpin}
          disabled={spinning || numItems === 0}
          className="w-full sm:w-auto px-10 py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 active:scale-95 text-white font-extrabold rounded-2xl text-xs sm:text-sm shadow-md transition disabled:opacity-40 cursor-pointer"
        >
          {spinning ? '🌀 Spinning...' : '🎡 SPIN THE WHEEL'}
        </button>
      </div>

      {/* 2026 FROSTED RESULT REVEAL CARD */}
      {selectedItem && (
        <div className="p-5 sm:p-6 bg-gradient-to-br from-indigo-50/90 via-purple-50/70 to-pink-50/50 border-2 border-indigo-400/80 rounded-3xl space-y-3 max-w-xl mx-auto shadow-md animate-fade-in">
          <span className="px-3.5 py-1 bg-indigo-600 text-white text-[10px] font-extrabold rounded-full uppercase tracking-wider inline-block shadow-2xs">
            🎯 Selected Question
          </span>
          <p className="font-extrabold text-slate-900 text-base sm:text-xl leading-relaxed">
            "{selectedItem}"
          </p>
          {block.eliminateMode && items.length > 2 && (
            <button
              type="button"
              onClick={handleEliminateCurrent}
              className="mt-1 px-3.5 py-1.5 bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 font-bold rounded-xl text-xs transition cursor-pointer shadow-2xs"
            >
              ✕ Remove this question from the wheel
            </button>
          )}
        </div>
      )}
    </div>
  );
};
