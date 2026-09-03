import React, { useState, useMemo, useEffect } from 'react';
import { playCorrectSound, playWrongSound } from '../utils/sounds.js';

export const BlockReorder = ({ block = {}, value = {}, onChange }) => {
  const instruction = block.instruction || 'Put the words in order to form correct sentences:';

  // Normalize to multi-sentence array
  const sentences = useMemo(() => {
    if (Array.isArray(block.sentences) && block.sentences.length > 0) {
      return block.sentences.map(s => String(s).trim()).filter(Boolean);
    }
    if (block.sentence && typeof block.sentence === 'string') {
      return [block.sentence.trim()];
    }
    return ['Consistent daily practice builds conversational fluency.'];
  }, [block.id, block.sentence, JSON.stringify(block.sentences)]);

  const totalSentences = sentences.length;
  const [activeIdx, setActiveIdx] = useState(0);

  // Store completed sentences state map: { [idx]: { selectedWordObjects, isCorrect, submitted } }
  const answersMap = value?.sentenceAnswers || {};
  const isAllSubmitted = Boolean(value?.submitted);

  const currentSentence = sentences[activeIdx] || sentences[0] || '';
  const currentAnswerState = answersMap[activeIdx] || { selectedWordObjects: [], isCorrect: false, submitted: false };
  const currentSelected = currentAnswerState.selectedWordObjects || [];
  const currentIsSubmitted = Boolean(currentAnswerState.submitted);

  // Shuffle word pool for active sentence
  const poolWords = useMemo(() => {
    const rawWords = currentSentence.split(/\s+/).filter(Boolean);
    const list = rawWords.map((w, i) => ({ id: `w-${activeIdx}-${i}-${w}`, text: w }));
    
    // Fisher-Yates shuffle
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }, [activeIdx, currentSentence]);

  const usedWordIds = currentSelected.map(w => w.id);

  const handleWordClick = (wordObj) => {
    if (currentIsSubmitted || isAllSubmitted || !onChange) return;
    const updatedSelected = [...currentSelected, wordObj];
    const updatedAnswers = {
      ...answersMap,
      [activeIdx]: {
        selectedWordObjects: updatedSelected,
        isCorrect: false,
        submitted: false
      }
    };
    onChange({ sentenceAnswers: updatedAnswers, submitted: false });
  };

  const handleRemoveWord = (wordObjId) => {
    if (currentIsSubmitted || isAllSubmitted || !onChange) return;
    const updatedSelected = currentSelected.filter(w => w.id !== wordObjId);
    const updatedAnswers = {
      ...answersMap,
      [activeIdx]: {
        selectedWordObjects: updatedSelected,
        isCorrect: false,
        submitted: false
      }
    };
    onChange({ sentenceAnswers: updatedAnswers, submitted: false });
  };

  const normalizeForCheck = (str = '') => {
    return str
      .toLowerCase()
      .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'«»]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const handleCheckCurrentSentence = () => {
    if (currentSelected.length === 0 || !onChange) return;

    const userText = currentSelected.map(w => w.text).join(' ');
    const isCorrect = normalizeForCheck(userText) === normalizeForCheck(currentSentence);

    if (isCorrect) playCorrectSound();
    else playWrongSound();

    const updatedAnswers = {
      ...answersMap,
      [activeIdx]: {
        selectedWordObjects: currentSelected,
        isCorrect,
        submitted: true
      }
    };

    // Calculate total score
    let earned = 0;
    sentences.forEach((_, idx) => {
      if (updatedAnswers[idx]?.isCorrect) earned++;
    });

    const allDone = Object.keys(updatedAnswers).length === totalSentences && 
      Object.values(updatedAnswers).every(a => a.submitted);

    onChange({
      sentenceAnswers: updatedAnswers,
      score: earned,
      maxScore: totalSentences,
      submitted: allDone
    });
  };

  const handleResetCurrent = () => {
    if (!onChange) return;
    const updatedAnswers = { ...answersMap };
    delete updatedAnswers[activeIdx];
    onChange({ sentenceAnswers: updatedAnswers, submitted: false });
  };

  const handleResetAll = () => {
    if (!onChange) return;
    setActiveIdx(0);
    onChange({ sentenceAnswers: {}, score: 0, maxScore: totalSentences, submitted: false });
  };

  let totalScore = 0;
  sentences.forEach((_, idx) => {
    if (answersMap[idx]?.isCorrect) totalScore++;
  });

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs mb-6 space-y-5">
      {/* HEADER & STEPPER BADGES */}
      <div>
        <div className="flex justify-between items-center mb-2.5">
          <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-extrabold text-[11px] uppercase tracking-wider">
            Sentence Unscramble
          </span>
          {totalSentences > 1 && (
            <span className="text-xs font-extrabold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              Sentence {activeIdx + 1} of {totalSentences}
            </span>
          )}
        </div>
        <h4 className="font-extrabold text-base sm:text-lg text-slate-900 border-l-4 border-indigo-600 pl-3 leading-snug">
          {instruction}
        </h4>
      </div>

      {/* MULTI-SENTENCE STEPPER PILLS */}
      {totalSentences > 1 && (
        <div className="flex gap-2 items-center overflow-x-auto pb-1">
          {sentences.map((_, idx) => {
            const state = answersMap[idx];
            const isCurrent = activeIdx === idx;
            
            let pillClass = "w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center transition cursor-pointer border ";
            if (state?.submitted) {
              pillClass += state.isCorrect 
                ? "bg-emerald-100 border-emerald-400 text-emerald-900 font-extrabold" 
                : "bg-rose-100 border-rose-400 text-rose-900 font-extrabold";
            } else if (isCurrent) {
              pillClass += "bg-indigo-600 border-indigo-600 text-white shadow-xs scale-105";
            } else {
              pillClass += "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100";
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveIdx(idx)}
                className={pillClass}
              >
                {state?.submitted ? (state.isCorrect ? '✓' : '✕') : idx + 1}
              </button>
            );
          })}
        </div>
      )}

      {/* DROP / PLACEMENT ZONE */}
      <div className="min-h-20 p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl flex flex-wrap gap-2 items-center">
        {currentSelected.length === 0 ? (
          <span className="text-slate-400 text-xs font-medium pl-1">
            Tap words below to assemble the sentence in the correct order...
          </span>
        ) : (
          currentSelected.map(wObj => (
            <button
              key={`sel-${wObj.id}`}
              type="button"
              disabled={currentIsSubmitted}
              onClick={() => handleRemoveWord(wObj.id)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-full text-xs shadow-2xs transition cursor-pointer flex items-center gap-1.5"
            >
              <span>{wObj.text}</span>
              {!currentIsSubmitted && <span className="text-[10px] opacity-75">✕</span>}
            </button>
          ))
        )}
      </div>

      {/* AVAILABLE WORD POOL */}
      <div className="flex flex-wrap gap-2 pt-1 min-h-12 items-center">
        {poolWords.map(wObj => {
          const isUsed = usedWordIds.includes(wObj.id);
          return (
            <button
              key={`pool-${wObj.id}`}
              type="button"
              disabled={isUsed || currentIsSubmitted}
              onClick={() => handleWordClick(wObj)}
              className={`px-4 py-2 rounded-full border text-xs font-bold transition select-none ${
                isUsed 
                  ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed' 
                  : 'bg-white text-slate-800 border-slate-300 hover:border-indigo-500 shadow-2xs hover:scale-105 cursor-pointer'
              }`}
            >
              {wObj.text}
            </button>
          );
        })}
      </div>

      {/* CONTROLS & FEEDBACK */}
      {!currentIsSubmitted ? (
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            disabled={currentSelected.length === 0}
            onClick={handleCheckCurrentSentence}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-xs shadow-md transition disabled:opacity-40 cursor-pointer"
          >
            Check Sentence
          </button>
          {currentSelected.length > 0 && (
            <button
              type="button"
              onClick={handleResetCurrent}
              className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-2xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3 pt-2">
          <div className={`p-4 rounded-2xl text-xs font-bold flex justify-between items-center ${
            currentAnswerState.isCorrect ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
          }`}>
            <span>
              {currentAnswerState.isCorrect 
                ? '🎉 Perfect! Sentence ordered correctly.' 
                : `❌ Incorrect. Target: "${currentSentence}"`}
            </span>
            <button
              type="button"
              onClick={handleResetCurrent}
              className="px-3 py-1 bg-white/80 hover:bg-white text-slate-800 rounded-xl text-xs font-bold cursor-pointer"
            >
              Retry 🔄
            </button>
          </div>

          {/* NEXT SENTENCE NAVIGATION */}
          <div className="flex justify-between items-center pt-1">
            <span className="text-xs font-bold text-slate-500">
              Score: <strong className="text-indigo-600">{totalScore}</strong> of {totalSentences} correct
            </span>
            {activeIdx < totalSentences - 1 ? (
              <button
                type="button"
                onClick={() => setActiveIdx(prev => prev + 1)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Next Sentence ➔
              </button>
            ) : (
              <button
                type="button"
                onClick={handleResetAll}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Restart All 🔄
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
