import React, { useState, useMemo } from 'react';
import { playCorrectSound, playWrongSound } from '../utils/sounds.js';

const shuffleArray = (arr) => {
  const res = [...arr];
  for (let i = res.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [res[i], res[j]] = [res[j], res[i]];
  }
  return res;
};

export const BlockMatching = ({ block = {}, value = {}, onChange }) => {
  const matched = value?.matched || [];
  const mistakes = value?.mistakes || 0;
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [wrongPair, setWrongPair] = useState(false);

  const pairs = block.pairs || [];

  const rightItems = useMemo(() => {
    return shuffleArray(pairs.map((p, idx) => ({ id: `r-${idx}`, text: p.right, origIndex: idx })));
  }, [block.id, JSON.stringify(pairs)]);

  const handleLeftClick = (leftText) => {
    if (matched.some(m => m.left === leftText)) return;
    setSelectedLeft(leftText);
    setWrongPair(false);
  };

  const handleRightClick = (rightText) => {
    if (!selectedLeft || matched.some(m => m.right === rightText)) return;
    const correctPair = pairs.find(p => p.left === selectedLeft && p.right === rightText);

    if (correctPair) {
      playCorrectSound();
      const newMatched = [...matched, { left: selectedLeft, right: rightText }];
      if (onChange) onChange({ matched: newMatched, mistakes });
      setSelectedLeft(null);
    } else {
      playWrongSound();
      setWrongPair(true);
      const newMistakes = mistakes + 1;
      if (onChange) onChange({ matched, mistakes: newMistakes });
      setTimeout(() => setWrongPair(false), 700);
    }
  };

  const isCompleted = matched.length === pairs.length && pairs.length > 0;

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs mb-6 space-y-4">
      {/* CATEGORY BADGE & INSTRUCTION */}
      <div>
        <div className="mb-2.5">
          <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-extrabold text-[11px] uppercase tracking-wider">
            Matching
          </span>
        </div>
        <div className="flex justify-between items-center">
          <h4 className="font-extrabold text-base sm:text-lg text-slate-900 border-l-4 border-indigo-600 pl-3 leading-snug">
            {block.instruction || 'Match the pairs:'}
          </h4>
          {mistakes > 0 && (
            <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 font-bold text-xs rounded-full border border-rose-200">
              Mistakes: {mistakes}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          {pairs.map((p, idx) => {
            const isMatched = matched.some(m => m.left === p.left);
            const isSelected = selectedLeft === p.left;
            let style = "w-full p-3.5 text-left rounded-2xl border font-bold transition text-xs sm:text-sm flex items-center justify-between cursor-pointer ";
            if (isMatched) style += "bg-emerald-50 border-emerald-500 text-emerald-900 opacity-60";
            else if (isSelected) style += "bg-indigo-50 border-indigo-600 text-indigo-900 shadow-xs ring-2 ring-indigo-500/20";
            else style += "bg-slate-50 border-slate-200 hover:border-indigo-400 text-slate-800 hover:bg-white";

            return (
              <button 
                key={`left-${idx}`} 
                disabled={isMatched} 
                onClick={() => handleLeftClick(p.left)} 
                className={style}
              >
                <span>{p.left}</span>
                {isMatched && <span className="text-emerald-600 font-extrabold">✓</span>}
              </button>
            );
          })}
        </div>

        <div className="space-y-2">
          {rightItems.map((rightObj, idx) => {
            const isMatched = matched.some(m => m.right === rightObj.text);
            let style = "w-full p-3.5 text-left rounded-2xl border font-bold transition text-xs sm:text-sm flex items-center justify-between cursor-pointer ";
            if (isMatched) style += "bg-emerald-50 border-emerald-500 text-emerald-900 opacity-60";
            else if (wrongPair && selectedLeft) style += "bg-rose-50 border-rose-300 text-rose-900 animate-bounce";
            else style += "bg-slate-50 border-slate-200 hover:border-indigo-400 text-slate-800 hover:bg-white";

            return (
              <button 
                key={`right-${idx}`} 
                disabled={isMatched} 
                onClick={() => handleRightClick(rightObj.text)} 
                className={style}
              >
                <span>{rightObj.text}</span>
                {isMatched && <span className="text-emerald-600 font-extrabold">✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {isCompleted && (
        <div className="p-4 bg-emerald-100 text-emerald-900 rounded-2xl text-xs font-bold text-center flex justify-between items-center px-4">
          <span>All pairs matched correctly! 🎉</span>
          <span className="text-xs font-normal">Score: {pairs.length} / {pairs.length} points</span>
        </div>
      )}
    </div>
  );
};
