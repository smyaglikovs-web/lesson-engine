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

export const BlockGapFillBank = ({ block = {}, value = {}, onChange }) => {
  const text = block.text || '';
  const instruction = block.instruction || 'Fill the gaps using the correct words from the bank:';
  const distractors = Array.isArray(block.distractors) ? block.distractors : [];

  // Parse text while strictly filtering out any dashed or placeholder tokens
  const { segments, correctAnswers } = useMemo(() => {
    if (!text) return { segments: [], correctAnswers: [] };
    
    const parts = text.split(/\[(.*?)\]/);
    const segs = [];
    const ans = [];

    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        segs.push(parts[i]);
      } else {
        const word = parts[i].trim();
        // Ignore pure dashes, underscores, or spaces
        if (word && !/^[-_.\s]+$/.test(word)) {
          ans.push(word);
        } else {
          segs[segs.length - 1] = (segs[segs.length - 1] || '') + ' ' + word;
        }
      }
    }
    return { segments: segs, correctAnswers: ans };
  }, [text]);

  const wordBank = useMemo(() => {
    const cleanDistractors = distractors
      .map(d => String(d).trim())
      .filter(d => Boolean(d) && !/^[-_.\s]+$/.test(d));

    const allWords = [...correctAnswers, ...cleanDistractors];
    return shuffleArray(allWords.map((w, idx) => ({ id: `w-${idx}-${w}`, text: w })));
  }, [correctAnswers, JSON.stringify(distractors)]);

  const placedSlots = value?.placedSlots || {};
  const submitted = Boolean(value?.submitted);
  const [draggedWord, setDraggedWord] = useState(null);

  const usedWordIds = Object.values(placedSlots).map(w => w?.id).filter(Boolean);

  const handlePlaceWordInSlot = (gapIdx, wordObj) => {
    if (submitted || !wordObj || !onChange) return;
    const updated = { ...placedSlots };
    Object.keys(updated).forEach(sIdx => {
      if (updated[sIdx]?.id === wordObj.id) delete updated[sIdx];
    });
    updated[gapIdx] = wordObj;
    onChange({ placedSlots: updated, submitted: false });
  };

  const handleRemoveFromSlot = (gapIdx) => {
    if (submitted || !onChange) return;
    const updated = { ...placedSlots };
    delete updated[gapIdx];
    onChange({ placedSlots: updated, submitted: false });
  };

  const handleBankWordClick = (wordObj) => {
    if (submitted) return;
    for (let i = 0; i < correctAnswers.length; i++) {
      if (!placedSlots[i]) {
        handlePlaceWordInSlot(i, wordObj);
        break;
      }
    }
  };

  const handleSubmit = () => {
    if (!onChange) return;
    let correctCount = 0;
    correctAnswers.forEach((ans, idx) => {
      const userPlaced = (placedSlots[idx]?.text || '').trim().toLowerCase();
      const validOptions = ans.split('|').map(a => a.trim().toLowerCase());
      if (validOptions.includes(userPlaced)) {
        correctCount++;
      }
    });

    if (correctCount === correctAnswers.length && correctAnswers.length > 0) {
      playCorrectSound();
    } else {
      playWrongSound();
    }
    onChange({ placedSlots, submitted: true });
  };

  const handleReset = () => {
    if (onChange) onChange({ placedSlots: {}, submitted: false });
  };

  let correctCount = 0;
  correctAnswers.forEach((ans, idx) => {
    const userPlaced = (placedSlots[idx]?.text || '').trim().toLowerCase();
    const validOptions = ans.split('|').map(a => a.trim().toLowerCase());
    if (validOptions.includes(userPlaced)) correctCount++;
  });

  const isAllSlotsFilled = correctAnswers.length > 0 && Object.keys(placedSlots).length === correctAnswers.length;

  if (correctAnswers.length === 0) return null;

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs mb-6 space-y-4">
      {/* CATEGORY BADGE & INSTRUCTION */}
      <div>
        <div className="mb-2.5">
          <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-extrabold text-[11px] uppercase tracking-wider">
            Drag & Drop (Word Bank)
          </span>
        </div>
        <h4 className="font-extrabold text-base sm:text-lg text-slate-900 border-l-4 border-indigo-600 pl-3 leading-snug">
          {instruction}
        </h4>
      </div>

      {/* WORD BANK CONTAINER */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
          Word Bank (Tap or drag words into the gaps)
        </span>
        <div className="flex flex-wrap gap-2 items-center min-h-12">
          {wordBank.map(w => {
            const isUsed = usedWordIds.includes(w.id);
            return (
              <button
                key={w.id}
                type="button"
                disabled={isUsed || submitted}
                onClick={() => handleBankWordClick(w)}
                draggable={!isUsed && !submitted}
                onDragStart={() => setDraggedWord(w)}
                className={`px-4 py-2 rounded-full border text-xs font-bold transition select-none ${
                  isUsed
                    ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
                    : 'bg-white border-slate-300 text-slate-800 hover:border-indigo-500 shadow-2xs hover:scale-105 cursor-grab active:cursor-grabbing'
                }`}
              >
                {w.text}
              </button>
            );
          })}
        </div>
      </div>

      {/* SENTENCE WITH GAP TARGETS */}
      <div className="p-5 bg-slate-50/70 rounded-2xl border border-slate-200 text-base sm:text-lg leading-relaxed font-medium text-slate-800">
        {segments.map((seg, idx) => {
          const gapIdx = idx;
          const hasGap = idx < correctAnswers.length;
          const placedWord = placedSlots[gapIdx];
          const expectedAnswers = (correctAnswers[gapIdx] || '').split('|').map(a => a.trim().toLowerCase());
          const isSlotCorrect = placedWord && expectedAnswers.includes(placedWord.text.trim().toLowerCase());

          return (
            <React.Fragment key={idx}>
              <span>{seg}</span>
              {hasGap && (
                <span
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    if (draggedWord) {
                      handlePlaceWordInSlot(gapIdx, draggedWord);
                      setDraggedWord(null);
                    }
                  }}
                  onClick={() => placedWord && handleRemoveFromSlot(gapIdx)}
                  className={`inline-flex items-center justify-center min-w-24 px-3.5 py-1 mx-1.5 rounded-full text-xs sm:text-sm font-bold border-2 transition cursor-pointer ${
                    submitted
                      ? isSlotCorrect
                        ? 'bg-emerald-100 border-emerald-500 text-emerald-900 font-extrabold'
                        : 'bg-rose-100 border-rose-500 text-rose-900 font-extrabold'
                      : placedWord
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                      : 'bg-white border-dashed border-slate-300 text-slate-400 hover:border-indigo-400'
                  }`}
                >
                  {placedWord ? (
                    <span>{placedWord.text} {submitted ? (isSlotCorrect ? '✓' : '❌') : '✕'}</span>
                  ) : (
                    <span className="font-extrabold text-slate-400">?</span>
                  )}
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* CONTROLS & PARTIAL SCORE FEEDBACK */}
      {!submitted ? (
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            disabled={!isAllSlotsFilled}
            onClick={handleSubmit}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-xs transition disabled:opacity-40 cursor-pointer shadow-md"
          >
            Check Answers
          </button>
          {Object.keys(placedSlots).length > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-2xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      ) : (
        <div className={`p-4 rounded-2xl text-xs font-bold flex justify-between items-center ${
          correctCount === correctAnswers.length ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
        }`}>
          <span>
            {correctCount === correctAnswers.length
              ? '🎉 Perfect! All gaps completed correctly.'
              : `Result: ${correctCount} of ${correctAnswers.length} correct.`}
          </span>
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 cursor-pointer"
          >
            Try Again 🔄
          </button>
        </div>
      )}
    </div>
  );
};
