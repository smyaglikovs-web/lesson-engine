import React, { useState, useRef, useEffect } from 'react';
import { playCorrectSound, triggerConfetti } from '../utils/sounds.js';

const WHEEL_COLORS = [
  '#00aefa', '#fad800', '#ff7775', '#abeb00',
  '#75f0a6', '#de7aff', '#fb8023', '#eb4cb7',
  '#14b331', '#1797cc', '#e0a500', '#f65c5a'
];

export const BlockSpinningWheel = ({ block, value, onChange }) => {
  const canvasRef = useRef(null);
  const [items, setItems] = useState(
    Array.isArray(block.items) && block.items.length > 0
      ? block.items
      : ['Question 1?', 'Question 2?', 'Question 3?', 'Question 4?', 'Question 5?', 'Question 6?']
  );

  const [spinning, setSpinning] = useState(false);
  const [selectedItem, setSelectedItem] = useState(value?.selectedText || '');
  const rotationAngleRef = useRef(0);
  const animationFrameRef = useRef(null);

  const numItems = items.length;
  const arcSize = (2 * Math.PI) / numItems;

  // Draw the Wheel Canvas
  const drawWheel = (currentAngle) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const center = size / 2;
    const radius = center - 10;

    ctx.clearRect(0, 0, size, size);

    // Draw Slices
    for (let i = 0; i < numItems; i++) {
      const angle = currentAngle + i * arcSize;
      ctx.beginPath();
      ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length];
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, angle, angle + arcSize);
      ctx.lineTo(center, center);
      ctx.fill();
      ctx.stroke();

      // Draw Slice Text
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(angle + arcSize / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px Plus Jakarta Sans, Arial';
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 3;

      const rawLabel = items[i];
      const truncatedLabel = rawLabel.length > 18 ? rawLabel.substring(0, 16) + '...' : rawLabel;
      ctx.fillText(truncatedLabel, radius - 18, 5);
      ctx.restore();
    }

    // Draw Center Circle Cap
    ctx.beginPath();
    ctx.arc(center, center, 28, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.shadowBlur = 6;
    ctx.fill();

    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#4f46e5';
    ctx.fillText('🎯', center, center);

    // Draw Top Pointer Triangle
    ctx.beginPath();
    ctx.moveTo(center - 12, 4);
    ctx.lineTo(center + 12, 4);
    ctx.lineTo(center, 24);
    ctx.closePath();
    ctx.fillStyle = '#dc2626';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  useEffect(() => {
    drawWheel(rotationAngleRef.current);
  }, [items]);

  const handleSpin = () => {
    if (spinning || numItems === 0) return;
    setSpinning(true);
    setSelectedItem('');

    const extraSpins = 5 + Math.random() * 4; // 5 to 9 full spins
    const targetAngle = rotationAngleRef.current + extraSpins * 2 * Math.PI + Math.random() * 2 * Math.PI;
    const duration = 4000;
    const startTime = performance.now();
    const startAngle = rotationAngleRef.current;

    const animateSpin = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Cubic ease-out deceleration physics
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentAngle = startAngle + (targetAngle - startAngle) * easeOut;
      rotationAngleRef.current = currentAngle;

      drawWheel(currentAngle);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animateSpin);
      } else {
        setSpinning(false);
        
        // Calculate winning slice under the top pointer (at 3*PI/2)
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
        <h4 className="font-extrabold text-slate-900 text-lg sm:text-xl">
          {block.title || '🎡 Speaking & Vocabulary Wheel'}
        </h4>
        <p className="text-slate-500 text-xs mt-1">
          {block.instruction || 'Нажмите "Крутить", чтобы выбрать случайный вопрос или тему для обсуждения!'}
        </p>
      </div>

      <div className="relative inline-block mx-auto">
        <canvas
          ref={canvasRef}
          width={380}
          height={380}
          className="max-w-full h-auto drop-shadow-md rounded-full"
        ></canvas>
      </div>

      <div>
        <button
          onClick={handleSpin}
          disabled={spinning}
          className="px-10 py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white font-extrabold rounded-2xl text-sm shadow-md transition disabled:opacity-40 cursor-pointer active:scale-95"
        >
          {spinning ? '🌀 Крутится...' : '🎡 КРУТИТЬ КОЛЕСО'}
        </button>
      </div>

      {selectedItem && (
        <div className="p-5 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-500 rounded-3xl space-y-2.5 max-w-xl mx-auto shadow-md">
          <span className="text-[11px] font-extrabold text-indigo-700 uppercase tracking-wider block">
            🎯 Выбранный вопрос:
          </span>
          <p className="font-extrabold text-slate-900 text-base sm:text-lg leading-snug">
            "{selectedItem}"
          </p>
          {block.eliminateMode && items.length > 2 && (
            <button
              onClick={handleEliminateCurrent}
              className="mt-2 px-3.5 py-1 bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              ✕ Убрать этот вопрос из колеса
            </button>
          )}
        </div>
      )}
    </div>
  );
};
