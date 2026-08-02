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

export const BlockGapFillBank = ({ block, value, onChange }) => {
  const text = block.text || '';
  const instruction = block.instruction || '🧩 Заполните пропуски словами из банка:';
  const distractors = block.distractors || [];

  const { segments, correctAnswers } = useMemo(() => {
    const parts = text.split(/\[(.*?)\]/);
    const segs = [];
    const ans = [];
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        segs.push(parts[i]);
      } else {
        ans.push(parts[i]);
      }
    }
    return { segments: segs, correctAnswers: ans };
  }, [text]);

  const wordBank = useMemo(() => {
    const allWords = [...correctAnswers, ...distractors];
    return shuffleArray(allWords.map((w, idx) => ({ id: `w-${idx}`, text: w })));
  }, [text, JSON.stringify(distractors)]);

  const placedSlots = value?.placedSlots || {}; // { gapIdx: { id, text } }
  const submitted = value?.submitted || false;
  const [draggedWord, setDraggedWord] = useState(null);

  const usedWordIds = Object.values(placedSlots).map(w => w?.id).filter(Boolean);

  const handlePlaceWordInSlot = (gapIdx, wordObj) => {
    if (submitted || !wordObj) return;

    const updated = { ...placedSlots };
    
    // Clear word from previous slot if it was already placed elsewhere
    Object.keys(updated).forEach(sIdx => {
      if (updated[sIdx]?.id === wordObj.id) {
        delete updated[sIdx];
      }
    });

    updated[gapIdx] = wordObj;
    onChange({ placedSlots: updated, submitted: false });
  };

  const handleRemoveFromSlot = (gapIdx) => {
    if (submitted) return;
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
    let correctCount = 0;
    correctAnswers.forEach((ans, idx) => {
      if (placedSlots[idx]?.text?.trim().toLowerCase() === ans.trim().toLowerCase()) {
        correctCount++;
      }
    });

    if (correctCount === correctAnswers.length) {
      playCorrectSound();
    } else {
      playWrongSound();
    }
    onChange({ placedSlots, submitted: true });
  };

  const handleReset = () => {
    onChange({ placedSlots: {}, submitted: false });
  };

  const isAllSlotsFilled = Object.keys(placedSlots).length === correctAnswers.length;

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
      <h4 className="font-semibold text-lg text-slate-800 mb-2">{instruction}</h4>
      <p className="text-slate-500 text-xs mb-4">Нажмите на слово в банке, чтобы вставить в пропуск. Нажмите на слово в пропуске, чтобы убрать.</p>

      {/* Word Bank Pool */}
      <div className="flex flex-wrap gap-2 p-4 bg-slate-50 border border-slate-200 rounded-xl mb-6 items-center min-h-16">
        {wordBank.map(w => {
          const isUsed = usedWordIds.includes(w.id);
          return (
            <button
              key={w.id}
              disabled={isUsed || submitted}
              onClick={() => handleBankWordClick(w)}
              draggable={!isUsed && !submitted}
              onDragStart={() => setDraggedWord(w)}
              className={`px-3 py-1.5 rounded-lg border font-bold text-xs transition ${
                isUsed 
                  ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed' 
                  : 'bg-white border-slate-300 text-indigo-700 hover:border-indigo-500 shadow-2xs hover:scale-105 cursor-pointer'
              }`}
            >
              {w.text}
            </button>
          );
        })}
      </div>

      {/* Sentence with Gap Slots */}
      <div className="flex flex-wrap items-center gap-2 text-base sm:text-lg leading-relaxed mb-6 font-medium text-slate-800 bg-indigo-50/30 p-4 rounded-xl border border-indigo-100">
        {segments.map((seg, idx) => {
          const gapIdx = idx;
          const hasGap = idx < correctAnswers.length;
          const placedWord = placedSlots[gapIdx];
          const isSlotCorrect = placedWord?.text?.trim().toLowerCase() === correctAnswers[gapIdx]?.trim().toLowerCase();

          return (
            <React.Fragment key={idx}>
              <span>{seg}</span>
              {hasGap && (
                <span
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedWord) {
                      handlePlaceWordInSlot(gapIdx, draggedWord);
                      setDraggedWord(null);
                    }
                  }}
                  onClick={() => placedWord && handleRemoveFromSlot(gapIdx)}
                  className={`inline-flex items-center justify-center min-w-28 px-3 py-1 border-2 rounded-xl text-center font-bold text-sm transition cursor-pointer ${
                    submitted
                      ? (isSlotCorrect ? 'bg-green-100 border-green-500 text-green-900' : 'bg-red-100 border-red-500 text-red-900')
                      : (placedWord ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' : 'bg-white border-dashed border-indigo-300 text-slate-400')
                  }`}
                >
                  {placedWord ? (
                    <span>{placedWord.text} {submitted ? (isSlotCorrect ? '✓' : '❌') : '✕'}</span>
                  ) : (
                    <span className="text-xs font-normal">пропуск</span>
                  )}
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {!submitted ? (
        <div className="flex gap-2">
          <button disabled={!isAllSlotsFilled} onClick={handleSubmit} className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl disabled:opacity-40 hover:bg-indigo-700 transition cursor-pointer">
            Проверить
          </button>
          <button onClick={handleReset} className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 cursor-pointer">
            Сбросить
          </button>
        </div>
      ) : (
        <div className="flex justify-between items-center p-3 bg-slate-100 rounded-xl">
          <span className="text-xs font-bold text-slate-700">Задание завершено!</span>
          <button onClick={handleReset} className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 cursor-pointer">
            Попробовать снова 🔄
          </button>
        </div>
      )}
    </div>
  );
};
