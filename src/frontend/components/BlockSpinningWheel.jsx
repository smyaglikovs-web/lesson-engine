import React, { useState, useRef, useEffect } from 'react';
import { playCorrectSound, triggerConfetti } from '../utils/sounds.js';

// DEEP STUDIO PALETTE (RICH, MODERN & HIGH-CONTRAST)
const STUDIO_PALETTE = [
  '#4338ca', // Deep Indigo
  '#059669', // Emerald
  '#7c3aed', // Royal Violet
  '#d97706', // Amber Gold
  '#e11d48', // Velvet Rose
  '#0d9488', // Deep Teal
  '#2563eb', // Slate Blue
  '#9333ea'  // Plum
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
    osc.frequency.setValueAtTime(540, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.02);
    
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
          'What is the most challenging thing in English for you?',
          'Describe a situation where appearances were deceiving.',
          'What would you change about modern trends?',
          'If you could travel anywhere tomorrow, where would you go?'
        ]
  );

  const [spinning, setSpinning] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(value?.winningIndex ?? null);
  const [selectedItem, setSelectedItem] = useState(value?.selectedText || '');
  const rotationAngleRef = useRef(0);
  const lastTickIndexRef = useRef(-1);
  const animationFrameRef = useRef(null);

  // Sync state if block.items updates
  useEffect(() => {
    if (Array.isArray(block.items) && block.items.length > 0) {
      setItems(block.items);
    }
  }, [JSON.stringify(block.items)]);

  const numItems = items.length;
  const arcSize = (2 * Math.PI) / numItems;

  // 🎨 RETINA-AWARE CANVAS WHEEL RENDERER
  const drawWheel = (currentAngle) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // High-DPI Retina Scaling
    const dpr = window.devicePixelRatio || 1;
    const size = 380;
    
    if (canvas.width !== size * dpr || canvas.height !== size * dpr) {
      canvas.width = size * dpr;
      canvas.height = size * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    const center = size / 2;
    const outerRadius = center - 18;
    const hubRadius = 38;

    // 1. SLEEK OUTER RIM BEZEL (METALLIC SLATE GRADIENT)
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, outerRadius + 6, 0, 2 * Math.PI);
    const bezelGrad = ctx.createLinearGradient(0, 0, size, size);
    bezelGrad.addColorStop(0, '#475569');
    bezelGrad.addColorStop(0.5, '#64748b');
    bezelGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = bezelGrad;
    ctx.shadowColor = 'rgba(15, 23, 42, 0.25)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 5;
    ctx.fill();
    ctx.restore();

    // 2. SLICES WITH CRISP 2.5PX WHITE BORDERS & BOLD NUMBERS
    for (let i = 0; i < numItems; i++) {
      const angle = currentAngle + i * arcSize;
      const sliceColor = STUDIO_PALETTE[i % STUDIO_PALETTE.length];

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, outerRadius, angle, angle + arcSize);
      ctx.lineTo(center, center);
      ctx.fillStyle = sliceColor;
      ctx.fill();

      // Clean White Slices Divider
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();

      // 3. DRAW BOLD CLEAN NUMBER (#1, #2, #3...) ON EACH SLICE
      const midAngle = angle + arcSize / 2;

      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(midAngle);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 20px "Plus Jakarta Sans", sans-serif';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
      ctx.shadowBlur = 3;

      ctx.fillText(`${i + 1}`, outerRadius - 22, 0);
      ctx.restore();
    }

    // 4. METALLIC CENTER HUB (WHITE + INDIGO 'SPIN' BUTTON)
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, hubRadius, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 3;
    ctx.fill();

    // Inner Button
    ctx.beginPath();
    ctx.arc(center, center, hubRadius - 7, 0, 2 * Math.PI);
    const innerHubGrad = ctx.createLinearGradient(center - 20, center - 20, center + 20, center + 20);
    innerHubGrad.addColorStop(0, '#4f46e5');
    innerHubGrad.addColorStop(1, '#3730a3');
    ctx.fillStyle = innerHubGrad;
    ctx.fill();

    ctx.font = '800 12px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('SPIN', center, center);
    ctx.restore();

    // 5. 3D TOP NEEDLE (TEARDROP POINTER)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(center - 13, 6);
    ctx.lineTo(center + 13, 6);
    ctx.lineTo(center, 30);
    ctx.closePath();
    ctx.fillStyle = '#f43f5e';
    ctx.shadowColor = 'rgba(15, 23, 42, 0.35)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 3;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();

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

    const extraSpins = 6 + Math.random() * 4; // 6 to 10 full fast spins
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
        <div className="flex items-center justify-center gap-2.5 mb-1.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="m4.93 4.93 4.24 4.24" />
              <path d="m14.83 9.17 4.24-4.24" />
              <path d="m14.83 14.83 4.24 4.24" />
              <path d="m9.17 14.83-4.24 4.24" />
              <circle cx="12" cy="12" r="2" />
            </svg>
          </div>
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
          style={{ width: '380px', height: '380px' }}
          className="max-w-full h-auto drop-shadow-xl rounded-full"
        ></canvas>
      </div>

      <div>
        <button
          onClick={handleSpin}
          disabled={spinning}
          className="px-12 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold rounded-2xl text-sm sm:text-base shadow-md hover:shadow-indigo-500/20 transition disabled:opacity-40 cursor-pointer"
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
