import React, { useState, useRef, useEffect } from 'react';
import { playCorrectSound, triggerConfetti } from '../utils/sounds.js';

// DEEP STUDIO PALETTE (RICH, MODERN & HIGH-CONTRAST)
const DEEP_STUDIO_PALETTE = [
  '#4338ca', // Deep Indigo
  '#0f766e', // Teal Slate
  '#6d28d9', // Royal Violet
  '#d97706', // Warm Amber Gold
  '#be123c', // Velvet Rose
  '#0284c7', // Ocean Blue
  '#047857', // Forest Emerald
  '#b91c1c', // Crimson Red
  '#7e22ce', // Deep Purple
  '#0e7490'  // Dark Cyan
];

// Synthesized Mechanical Wheel Ticking Sound
const playWheelTick = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.02);
    
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.025);
  } catch(e) {}
};

export const BlockSpinningWheel = ({ block, value, onChange }) => {
  const canvasRef = useRef(null);
  const [items, setItems] = useState(
    Array.isArray(block.items) && block.items.length > 0
      ? block.items
      : [
          'What is an example of inversion in real life?',
          'Have you ever had a memorable travel experience?',
          'What is the most challenging thing in English?',
          'Describe a situation where appearances were deceiving.',
          'What would you change about modern fashion trends?',
          'If you could travel anywhere tomorrow, where would you go?'
        ]
  );

  const [spinning, setSpinning] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(value?.winningIndex ?? null);
  const [selectedItem, setSelectedItem] = useState(value?.selectedText || '');
  const rotationAngleRef = useRef(0);
  const lastTickIndexRef = useRef(-1);
  const animationFrameRef = useRef(null);

  const numItems = items.length;
  const arcSize = (2 * Math.PI) / numItems;

  // 🎨 CANVAS RENDERER (NUMBERED SLICES + METALLIC HUB & NEEDLE)
  const drawWheel = (currentAngle) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const center = size / 2;
    const outerRadius = center - 16;
    const hubRadius = 38;

    ctx.clearRect(0, 0, size, size);

    // 1. SLEEK OUTER RIM (SUBTLE AMBIENT SHADOW)
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, outerRadius + 6, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(15, 23, 42, 0.14)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 6;
    ctx.fill();
    ctx.restore();

    // 2. SLICES WITH CRISP 3PX WHITE BORDERS & NUMBERED LABELS
    for (let i = 0; i < numItems; i++) {
      const angle = currentAngle + i * arcSize;
      const sliceColor = DEEP_STUDIO_PALETTE[i % DEEP_STUDIO_PALETTE.length];

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, outerRadius, angle, angle + arcSize);
      ctx.lineTo(center, center);
      ctx.fillStyle = sliceColor;
      ctx.fill();

      // Clean White Slices Divider
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();

      // 3. DRAW BOLD NUMBER (#1, #2, #3...) ON EACH SLICE
      const midAngle = angle + arcSize / 2;

      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(midAngle);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 18px "Plus Jakarta Sans", sans-serif';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 4;

      // Draw Number
      ctx.fillText(`${i + 1}`, outerRadius - 24, 0);
      ctx.restore();
    }

    // 4. METALLIC CENTER HUB (WHITE + INDIGO BUTTON)
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, hubRadius, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 3;
    ctx.fill();

    // Inner Button
    ctx.beginPath();
    ctx.arc(center, center, hubRadius - 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#4f46e5';
    ctx.fill();

    ctx.font = '800 13px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('SPIN', center, center);
    ctx.restore();

    // 5. SLEEK 3D TOP NEEDLE (TEARDROP POINTER)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(center - 13, 6);
    ctx.lineTo(center + 13, 6);
    ctx.lineTo(center, 32);
    ctx.closePath();
    ctx.fillStyle = '#f43f5e';
    ctx.shadowColor = 'rgba(15, 23, 42, 0.3)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
  };

  useEffect(() => {
    drawWheel(rotationAngleRef.current);
  }, [items]);

  const handleSpin = () => {
    if (spinning || numItems === 0) return;
    setSpinning(true);
    setSelectedItem('');
    setSelectedIndex(null);

    const extraSpins = 6 + Math.random() * 4;
    const targetAngle = rotationAngleRef.current + extraSpins * 2 * Math.PI + Math.random() * 2 * Math.PI;
    const duration = 4600;
    const startTime = performance.now();
    const startAngle = rotationAngleRef.current;

    const animateSpin = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Smooth 4th-order ease-out physics
      const easeOut = 1 - Math.pow(1 - progress, 4);
      const currentAngle = startAngle + (targetAngle - startAngle) * easeOut;
      rotationAngleRef.current = currentAngle;

      drawWheel(currentAngle);

      // Play ticking sound when passing slices
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
        
        // Calculate winning slice directly under top pointer (at 1.5 * PI)
        const normalizedAngle = (2 * Math.PI - (currentAngle % (2 * Math.PI)) + 1.5 * Math.PI) % (2 * Math.PI);
        const winningIndex = Math.floor(normalizedAngle / arcSize) % numItems;
        const winner = items[winningIndex];

        setSelectedIndex(winningIndex);
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
    setSelectedIndex(null);
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-2xs mb-6 space-y-6 text-center">
      <div>
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-2xl animate-pulse">🎡</span>
          <h4 className="font-extrabold text-slate-900 text-xl sm:text-2xl tracking-tight">
            {block.title || 'Speaking & Discussion Roulette'}
          </h4>
        </div>
        <p className="text-slate-500 text-xs sm:text-sm font-medium max-w-md mx-auto">
          {block.instruction || 'Вращайте колесо и ответьте на выбранный вопрос!'}
        </p>
      </div>

      <div className="relative inline-block mx-auto p-2">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="max-w-full h-auto drop-shadow-md rounded-full"
        ></canvas>
      </div>

      <div>
        <button
          onClick={handleSpin}
          disabled={spinning}
          className="px-12 py-4 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold rounded-2xl text-sm sm:text-base shadow-lg hover:shadow-indigo-500/25 transition disabled:opacity-40 cursor-pointer"
        >
          {spinning ? '🌀 Колесо вращается...' : '🎡 КРУТИТЬ КОЛЕСО'}
        </button>
      </div>

      {selectedItem && (
        <div className="p-6 bg-slate-50 border-2 border-indigo-500 rounded-3xl space-y-3 max-w-xl mx-auto shadow-md animate-fade-in">
          <span className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-extrabold rounded-full uppercase tracking-wider inline-block shadow-2xs">
            🎯 ВОПРОС #{selectedIndex !== null ? selectedIndex + 1 : '1'}
          </span>
          <p className="font-extrabold text-slate-900 text-lg sm:text-xl leading-relaxed">
            "{selectedItem}"
          </p>
          {block.eliminateMode && items.length > 2 && (
            <button
              onClick={handleEliminateCurrent}
              className="mt-2 px-4 py-1.5 bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 font-bold rounded-xl text-xs transition cursor-pointer shadow-2xs"
            >
              ✕ Убрать этот вопрос из колеса
            </button>
          )}
        </div>
      )}
    </div>
  );
};
