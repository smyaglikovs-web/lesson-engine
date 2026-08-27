import React, { useState, useRef, useEffect } from 'react';
import { playCorrectSound, triggerConfetti } from '../utils/sounds.js';

// VIBRANT PREMIUM PALETTE (SKYENG & WORDWALL STYLE)
const WHEEL_PALETTE = [
  { fill: '#7c3aed', text: '#ffffff' }, // Electric Violet
  { fill: '#0284c7', text: '#ffffff' }, // Sky Blue
  { fill: '#f43f5e', text: '#ffffff' }, // Coral Pink
  { fill: '#f59e0b', text: '#271907' }, // Warm Amber
  { fill: '#10b981', text: '#ffffff' }, // Emerald Mint
  { fill: '#4f46e5', text: '#ffffff' }, // Royal Indigo
  { fill: '#ea580c', text: '#ffffff' }, // Sunset Orange
  { fill: '#ec4899', text: '#ffffff' }, // Hot Pink
  { fill: '#0d9488', text: '#ffffff' }, // Deep Teal
  { fill: '#8b5cf6', text: '#ffffff' }  // Purple
];

// Synthesized Realistic Wheel Ticking Click
const playWheelTick = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(420, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.03);
    
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.035);
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
  const [selectedItem, setSelectedItem] = useState(value?.selectedText || '');
  const rotationAngleRef = useRef(0);
  const lastTickIndexRef = useRef(-1);
  const animationFrameRef = useRef(null);

  const numItems = items.length;
  const arcSize = (2 * Math.PI) / numItems;

  // SMART WORD WRAPPING ALGORITHM FOR SLICES
  const wrapTextToLines = (text, maxCharsPerLine = 16) => {
    const words = text.split(' ');
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
    return lines.slice(0, 3); // Max 3 clean lines per slice
  };

  // HIGH-END 3D CANVAS WHEEL RENDERER
  const drawWheel = (currentAngle) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const center = size / 2;
    const outerRadius = center - 14;
    const innerRadius = 38;

    ctx.clearRect(0, 0, size, size);

    // 1. OUTER METALLIC BEZEL (SHADOW & GLOW)
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, outerRadius + 6, 0, 2 * Math.PI);
    const bezelGrad = ctx.createLinearGradient(0, 0, size, size);
    bezelGrad.addColorStop(0, '#334155');
    bezelGrad.addColorStop(0.5, '#64748b');
    bezelGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = bezelGrad;
    ctx.shadowColor = 'rgba(15, 23, 42, 0.35)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 6;
    ctx.fill();
    ctx.restore();

    // 2. DRAW SLICES WITH VIBRANT CURATED PALETTE
    for (let i = 0; i < numItems; i++) {
      const angle = currentAngle + i * arcSize;
      const colorScheme = WHEEL_PALETTE[i % WHEEL_PALETTE.length];

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, outerRadius, angle, angle + arcSize);
      ctx.lineTo(center, center);
      ctx.fillStyle = colorScheme.fill;
      ctx.fill();

      // Slice Divider Stroke
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Slice Inner Radial Depth Highlight
      const depthGrad = ctx.createRadialGradient(center, center, innerRadius, center, center, outerRadius);
      depthGrad.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
      depthGrad.addColorStop(0.7, 'transparent');
      depthGrad.addColorStop(1, 'rgba(0, 0, 0, 0.18)');
      ctx.fillStyle = depthGrad;
      ctx.fill();
      ctx.restore();

      // 3. SMART RADIUS TEXT RENDERING (MULTI-LINE)
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(angle + arcSize / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = colorScheme.text;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = 4;

      const rawLabel = items[i];
      const maxChars = numItems > 8 ? 13 : 18;
      const textLines = wrapTextToLines(rawLabel, maxChars);
      const fontSize = numItems > 8 ? 11 : 13;
      ctx.font = `bold ${fontSize}px "Plus Jakarta Sans", Arial, sans-serif`;

      const lineHeight = fontSize + 3;
      const totalTextHeight = (textLines.length - 1) * lineHeight;
      const textRadiusOffset = outerRadius - 16;

      textLines.forEach((lineText, lineIdx) => {
        const yOffset = (lineIdx * lineHeight) - (totalTextHeight / 2);
        ctx.fillText(lineText, textRadiusOffset, yOffset);
      });

      ctx.restore();
    }

    // 4. CHROME CENTER HUB CAP
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, innerRadius, 0, 2 * Math.PI);
    const centerGrad = ctx.createRadialGradient(center - 6, center - 6, 4, center, center, innerRadius);
    centerGrad.addColorStop(0, '#ffffff');
    centerGrad.addColorStop(0.4, '#e2e8f0');
    centerGrad.addColorStop(0.8, '#94a3b8');
    centerGrad.addColorStop(1, '#64748b');
    ctx.fillStyle = centerGrad;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 8;
    ctx.fill();

    // Center Gold Accent Ring
    ctx.beginPath();
    ctx.arc(center, center, innerRadius - 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#4f46e5';
    ctx.fill();

    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('✨', center, center);
    ctx.restore();

    // 5. 3D TOP POINTER WITH SHADOW
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(center - 14, 4);
    ctx.lineTo(center + 14, 4);
    ctx.lineTo(center, 30);
    ctx.closePath();
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;
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

      // Play authentic mechanical ticking sound when passing slices
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
      <div>
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-2xl animate-pulse">🎡</span>
          <h4 className="font-extrabold text-slate-900 text-xl sm:text-2xl tracking-tight">
            {block.title || 'Speaking & Discussion Roulette'}
          </h4>
        </div>
        <p className="text-slate-500 text-xs sm:text-sm font-medium max-w-md mx-auto">
          {block.instruction || 'Вращайте колесо и обсудите выпавший вопрос!'}
        </p>
      </div>

      <div className="relative inline-block mx-auto p-2">
        <canvas
          ref={canvasRef}
          width={420}
          height={420}
          className="max-w-full h-auto drop-shadow-xl rounded-full"
        ></canvas>
      </div>

      <div>
        <button
          onClick={handleSpin}
          disabled={spinning}
          className="px-12 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white font-extrabold rounded-2xl text-sm sm:text-base shadow-lg hover:shadow-indigo-500/25 transition active:scale-95 disabled:opacity-40 cursor-pointer"
        >
          {spinning ? '🌀 Колесо вращается...' : '🎡 КРУТИТЬ КОЛЕСО'}
        </button>
      </div>

      {selectedItem && (
        <div className="p-6 bg-gradient-to-br from-indigo-50/90 via-purple-50/80 to-pink-50/90 border-2 border-indigo-500 rounded-3xl space-y-3 max-w-xl mx-auto shadow-lg animate-fade-in">
          <span className="px-3.5 py-1 bg-indigo-600 text-white text-[11px] font-extrabold rounded-full uppercase tracking-wider inline-block shadow-2xs">
            🎯 Выбранный вопрос
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
