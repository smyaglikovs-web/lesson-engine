import React, { useState, useRef, useEffect } from 'react';
import { playCorrectSound, triggerConfetti } from '../utils/sounds.js';

const MODERN_WHEEL_PALETTE = [
  '#4f46e5', // Royal Indigo
  '#10b981', // Emerald Mint
  '#8b5cf6', // Electric Violet
  '#0284c7', // Sky Blue
  '#f43f5e', // Coral Rose
  '#f59e0b', // Warm Amber
  '#0d9488', // Deep Teal
  '#ea580c', // Sunset Orange
  '#ec4899', // Berry Pink
  '#2563eb'  // Ocean Blue
];

const playWheelTick = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(480, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.025);
    
    gain.gain.setValueAtTime(0.09, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.025);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.03);
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

  // Sync state if block items change
  useEffect(() => {
    if (Array.isArray(block.items) && block.items.length > 0) {
      setItems(block.items);
    }
  }, [JSON.stringify(block.items)]);

  const numItems = items.length;
  const arcSize = (2 * Math.PI) / numItems;

  const wrapTextToLines = (text, maxCharsPerLine = 15) => {
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

  const drawWheel = (currentAngle) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const center = size / 2;
    const outerRadius = center - 16;
    const hubRadius = 36;

    ctx.clearRect(0, 0, size, size);

    // Outer Rim
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, outerRadius + 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(15, 23, 42, 0.12)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 6;
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
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();

      // Text Labels
      const midAngle = angle + arcSize / 2;
      const normalizedMid = (midAngle % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
      const isLeftHalf = normalizedMid > Math.PI / 2 && normalizedMid < (3 * Math.PI) / 2;

      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(midAngle);

      const rawLabel = items[i];
      const maxChars = numItems > 8 ? 12 : 16;
      const textLines = wrapTextToLines(rawLabel, maxChars);
      const fontSize = numItems > 8 ? 11 : 13;
      
      ctx.font = `800 ${fontSize}px "Plus Jakarta Sans", -apple-system, sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
      ctx.shadowBlur = 3;

      const lineHeight = fontSize + 4;
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

    // Center Hub
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, hubRadius, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 10;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(center, center, hubRadius - 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#4f46e5';
    ctx.fill();

    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('✨', center, center);
    ctx.restore();

    // Needle Pointer
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(center - 13, 6);
    ctx.lineTo(center + 13, 6);
    ctx.lineTo(center, 28);
    ctx.closePath();
    ctx.fillStyle = '#f43f5e';
    ctx.shadowColor = 'rgba(15, 23, 42, 0.25)';
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

    const extraSpins = 6 + Math.random() * 4;
    const targetAngle = rotationAngleRef.current + extraSpins * 2 * Math.PI + Math.random() * 2 * Math.PI;
    const duration = 4600;
    const startTime = performance.now();
    const startAngle = rotationAngleRef.current;

    const animateSpin = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
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
        <div className="p-6 bg-indigo-50/90 border-2 border-indigo-500 rounded-3xl space-y-3 max-w-xl mx-auto shadow-md animate-fade-in">
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
