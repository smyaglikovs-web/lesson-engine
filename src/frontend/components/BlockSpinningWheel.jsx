import React, { useState, useEffect, useRef } from 'react';
import { playCorrectSound, triggerConfetti } from '../utils/sounds.js';

// DEEP STUDIO PALETTE (HIGH-CONTRAST & CRISP)
const PALETTE = [
  '#4338ca', // Deep Indigo
  '#059669', // Emerald
  '#7c3aed', // Royal Violet
  '#d97706', // Amber Gold
  '#e11d48', // Velvet Rose
  '#0d9488', // Deep Teal
  '#2563eb', // Slate Blue
  '#9333ea'  // Plum
];

// Synthesized Realistic Mechanical Click
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
  const [items, setItems] = useState(
    Array.isArray(block.items) && block.items.length > 0
      ? block.items
      : [
          'What is an example of inversion in real life?',
          'Have you ever had a memorable travel experience?',
          'What is the most challenging thing in English for you?',
          'Describe a situation where appearances were deceiving.',
          'What would you change about modern fashion trends?',
          'If you could travel anywhere tomorrow, where would you go?'
        ]
  );

  const [spinning, setSpinning] = useState(false);
  const [rotationDeg, setRotationDeg] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(value?.winningIndex ?? null);
  const [selectedItem, setSelectedItem] = useState(value?.selectedText || '');
  const tickIntervalRef = useRef(null);

  // Sync state if block.items updates in editor
  useEffect(() => {
    if (Array.isArray(block.items) && block.items.length > 0) {
      setItems(block.items);
    }
  }, [JSON.stringify(block.items)]);

  const numItems = items.length;
  const arcSize = (2 * Math.PI) / numItems;
  const sliceDeg = 360 / numItems;
  const radius = 184;

  // 🎡 SPIN PHYSICS HANDLER
  const handleSpin = () => {
    if (spinning || numItems === 0) return;
    setSpinning(true);
    setSelectedItem('');
    setSelectedIndex(null);

    // 5 to 9 full spins + random target slice
    const extraSpins = 5 + Math.floor(Math.random() * 4);
    const targetSlice = Math.floor(Math.random() * numItems);
    
    // Calculate final angle pointing at the top needle (270 degrees)
    const targetAngle = (extraSpins * 360) + (270 - (targetSlice * sliceDeg) - (sliceDeg / 2));
    const finalRotation = rotationDeg + targetAngle;
    setRotationDeg(finalRotation);

    // Sound Ticking Loop
    let tickCount = 0;
    const maxTicks = 24;
    const tickInterval = setInterval(() => {
      playWheelTick();
      tickCount++;
      if (tickCount >= maxTicks) {
        clearInterval(tickInterval);
      }
    }, 180);
    tickIntervalRef.current = tickInterval;

    // Reveal Result after 4.5s transition
    setTimeout(() => {
      clearInterval(tickIntervalRef.current);
      setSpinning(false);

      // Winning slice directly under top needle (270 degrees)
      const normalizedDeg = (270 - (finalRotation % 360) + 360) % 360;
      const winningIdx = Math.floor(normalizedDeg / sliceDeg) % numItems;
      const winner = items[winningIdx];

      setSelectedIndex(winningIdx);
      setSelectedItem(winner);
      playCorrectSound();
      triggerConfetti();
      if (onChange) onChange({ selectedText: winner, winningIndex: winningIdx });
    }, 4500);
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
      
      {/* HEADER */}
      <div>
        <div className="flex items-center justify-center gap-2.5 mb-1.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
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

      {/* 🎡 PURE VECTOR SVG WHEEL */}
      <div className="relative inline-block mx-auto p-2">
        
        {/* Outer Shadow Wrapper */}
        <div className="relative w-[340px] h-[340px] sm:w-[380px] sm:h-[380px] mx-auto drop-shadow-xl select-none">
          
          {/* Rotating SVG Vector Surface */}
          <svg
            viewBox="0 0 400 400"
            className="w-full h-full"
            style={{
              transform: `rotate(${rotationDeg}deg)`,
              transformOrigin: '200px 200px',
              transition: spinning ? 'transform 4.5s cubic-bezier(0.12, 0.9, 0.18, 1)' : 'none'
            }}
          >
            {/* Outer Bezel Rim */}
            <circle cx="200" cy="200" r="196" fill="#ffffff" stroke="#e2e8f0" strokeWidth="6" />

            {/* Slices */}
            {items.map((_, i) => {
              const theta1 = i * arcSize;
              const theta2 = (i + 1) * arcSize;
              const x1 = 200 + radius * Math.cos(theta1);
              const y1 = 200 + radius * Math.sin(theta1);
              const x2 = 200 + radius * Math.cos(theta2);
              const y2 = 200 + radius * Math.sin(theta2);

              const thetaMid = (theta1 + theta2) / 2;
              const textR = 135;
              const tx = 200 + textR * Math.cos(thetaMid);
              const ty = 200 + textR * Math.sin(thetaMid);
              const rotDeg = (thetaMid * 180) / Math.PI + 90;

              return (
                <g key={i}>
                  {/* Slice Path */}
                  <path
                    d={`M 200 200 L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`}
                    fill={PALETTE[i % PALETTE.length]}
                    stroke="#ffffff"
                    strokeWidth="2.5"
                  />
                  {/* Crisp Number */}
                  <text
                    x={tx}
                    y={ty}
                    transform={`rotate(${rotDeg}, ${tx}, ${ty})`}
                    fill="#ffffff"
                    fontSize="22"
                    fontWeight="800"
                    fontFamily="Plus Jakarta Sans, sans-serif"
                    textAnchor="middle"
                    dominantBaseline="central"
                    style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.35))' }}
                  >
                    {i + 1}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* 3D Top Needle Pointer (Stationary Overlay) */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-20 pointer-events-none drop-shadow-md">
            <svg width="28" height="36" viewBox="0 0 28 36" fill="none">
              <path d="M 2 4 L 26 4 L 14 32 Z" fill="#f43f5e" stroke="#ffffff" strokeWidth="2.5" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Center Hub Button (Interactive Click-to-Spin) */}
          <button
            onClick={handleSpin}
            disabled={spinning}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-20 h-20 bg-white rounded-full border-4 border-slate-100 shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition cursor-pointer disabled:pointer-events-none"
            title="Нажмите чтобы крутить"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white font-extrabold text-xs tracking-wider shadow-inner">
              {spinning ? '🌀' : 'SPIN'}
            </div>
          </button>

        </div>
      </div>

      {/* SPIN BUTTON */}
      <div>
        <button
          onClick={handleSpin}
          disabled={spinning}
          className="px-12 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold rounded-2xl text-sm sm:text-base shadow-md hover:shadow-indigo-500/20 transition disabled:opacity-40 cursor-pointer"
        >
          {spinning ? '🌀 Колесо вращается...' : '🎡 КРУТИТЬ КОЛЕСО'}
        </button>
      </div>

      {/* 🎯 SPOTLIGHT REVEAL CARD */}
      {selectedItem && (
        <div className="p-6 bg-slate-900 text-white rounded-3xl space-y-3 max-w-xl mx-auto shadow-2xl border border-slate-800 animate-fade-in text-center">
          <span className="px-3.5 py-1 bg-indigo-500 text-white text-[11px] font-extrabold rounded-full uppercase tracking-wider inline-block">
            🎯 ВОПРОС #{selectedIndex !== null ? selectedIndex + 1 : '1'}
          </span>
          <p className="font-extrabold text-white text-lg sm:text-xl leading-relaxed font-sans">
            "{selectedItem}"
          </p>
          {block.eliminateMode && items.length > 2 && (
            <button
              onClick={handleEliminateCurrent}
              className="mt-2 px-3.5 py-1.5 bg-slate-800 hover:bg-rose-950 hover:text-rose-400 border border-slate-700 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              ✕ Убрать этот вопрос из колеса
            </button>
          )}
        </div>
      )}
    </div>
  );
};
