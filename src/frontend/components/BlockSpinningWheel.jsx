import React, { useState, useRef, useEffect, useCallback } from 'react';
import { playCorrectSound, triggerConfetti } from '../utils/sounds.js';

const MODERN_WHEEL_PALETTE = [
  '#4f46e5', // Royal Indigo
  '#06b6d4', // Cyan
  '#8b5cf6', // Electric Purple
  '#10b981', // Emerald Mint
  '#f43f5e', // Rose Coral
  '#f59e0b', // Warm Amber
  '#0ea5e9', // Sky Blue
  '#ec4899', // Berry Pink
  '#0d9488', // Deep Teal
  '#6366f1'  // Bright Indigo
];

// Singleton AudioContext to prevent browser AudioContext limit crashes
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
    osc.frequency.setValueAtTime(540, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.025);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.03);
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
      'What was the most interesting concept today?',
      'If you could travel anywhere tomorrow, where would you go?',
      'Summarize the core lesson idea in two sentences.',
      'What advice would you give regarding this topic?'
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

  const wrapTextToLines = (text, maxCharsPerLine = 14) => {
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
    return lines.slice(0, 3);
  };

  const drawWheel = useCallback((currentAngle) => {
    const canvas = canvasRef.current;
    if (!canvas || numItems === 0) return;
    const ctx = canvas.getContext('2d');
    
    // High-DPI compensation
    const dpr = window.devicePixelRatio || 1;
    const displaySize = 380;
    
    if (canvas.width !== displaySize * dpr || canvas.height !== displaySize * dpr) {
      canvas.width = displaySize * dpr;
      canvas.height = displaySize * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, displaySize, displaySize);

    const center = displaySize / 2;
    const outerRadius = center - 14;
    const hubRadius = 34;

    // Outer rim drop shadow
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, outerRadius + 4, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(15, 23, 42, 0.14)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
    ctx.fill();
    ctx.restore();

    // Slices
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

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();

      // Text labels
      const midAngle = angle + arcSize / 2;
      const normalizedMid = (midAngle % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
      const isLeftHalf = normalizedMid > Math.PI / 2 && normalizedMid < (3 * Math.PI) / 2;

      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(midAngle);

      const rawLabel = items[i];
      const maxChars = numItems > 8 ? 11 : 15;
      const textLines = wrapTextToLines(rawLabel, maxChars);
      const fontSize = numItems > 8 ? 10 : 12;

      ctx.font = `800 ${fontSize}px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 3;

      const lineHeight = fontSize + 3;
      const totalHeight = (textLines.length - 1) * lineHeight;

      if (isLeftHalf) {
        ctx.rotate(Math.PI);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const startX = -outerRadius + 16;

        textLines.forEach((line, lineIdx) => {
          const yPos = (lineIdx * lineHeight) - (totalHeight / 2);
          ctx.fillText(line, startX, yPos);
        });
      } else {
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        const startX = outerRadius - 16;

        textLines.forEach((line, lineIdx) => {
          const yPos = (lineIdx * lineHeight) - (totalHeight / 2);
          ctx.fillText(line, startX, yPos);
        });
      }

      ctx.restore();
    }

    // Center Hub with glossy styling
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, hubRadius, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 8;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(center, center, hubRadius - 6, 0, 2 * Math.PI);
    ctx.fillStyle = '#4f46e5';
    ctx.fill();

    ctx.font = 'bold 15px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('✨', center, center);
    ctx.restore();

    // Top indicator needle
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(center - 12, 4);
    ctx.lineTo(center + 12, 4);
    ctx.lineTo(center, 26);
    ctx.closePath();
    ctx.fillStyle = '#f43f5e';
    ctx.shadowColor = 'rgba(15, 23, 42, 0.3)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
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
    const duration = 4400;
    const startTime = performance.now();
    const startAngle = rotationAngleRef.current;

    const animateSpin = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Smooth cubic-bezier deceleration
      const easeOut = 1 - Math.pow(1 - progress, 4);
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
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-2xs mb-6 space-y-6 text-center">
      {/* HEADER */}
      <div>
        <div className="flex items-center justify-center gap-2 mb-1.5">
          <span className="text-2xl animate-pulse">🎡</span>
          <h4 className="font-extrabold text-slate-900 text-xl sm:text-2xl tracking-tight">
            {block.title || 'Speaking & Discussion Roulette'}
          </h4>
        </div>
        <p className="text-slate-500 text-xs sm:text-sm font-medium max-w-md mx-auto">
          {block.instruction || 'Spin the wheel and answer the selected question!'}
        </p>
      </div>

      {/* CANVAS CONTAINER */}
      <div className="relative inline-block mx-auto max-w-full">
        <canvas
          ref={canvasRef}
          style={{ width: '380px', height: '380px', maxWidth: '100%' }}
          className="drop-shadow-md rounded-full select-none"
        ></canvas>
      </div>

      {/* SPIN BUTTON */}
      <div>
        <button
          type="button"
          onClick={handleSpin}
          disabled={spinning || numItems === 0}
          className="px-10 py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 active:scale-95 text-white font-extrabold rounded-2xl text-sm shadow-md transition disabled:opacity-40 cursor-pointer"
        >
          {spinning ? '🌀 Spinning...' : '🎡 SPIN THE WHEEL'}
        </button>
      </div>

      {/* SELECTED RESULT CARD */}
      {selectedItem && (
        <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-500 rounded-3xl space-y-3 max-w-xl mx-auto shadow-md">
          <span className="px-3.5 py-1 bg-indigo-600 text-white text-[10px] font-extrabold rounded-full uppercase tracking-wider inline-block shadow-2xs">
            🎯 Selected Question
          </span>
          <p className="font-extrabold text-slate-900 text-lg sm:text-xl leading-relaxed">
            "{selectedItem}"
          </p>
          {block.eliminateMode && items.length > 2 && (
            <button
              type="button"
              onClick={handleEliminateCurrent}
              className="mt-2 px-4 py-1.5 bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 font-bold rounded-xl text-xs transition cursor-pointer shadow-2xs"
            >
              ✕ Remove this question from the wheel
            </button>
          )}
        </div>
      )}
    </div>
  );
};
