import React, { useMemo } from 'react';
import { playCorrectSound, playWrongSound } from '../utils/sounds.js';

export const BlockReorder = ({ block = {}, value = {}, onChange }) => {
  const targetSentence = block.sentence || '';
  const instruction = block.instruction || 'Put the words in the correct order:';

  const poolWords = useMemo(() => {
    const rawList = block.words && block.words.length > 0 ? block.words : targetSentence.split(' ').filter(Boolean);
    const list = rawList.map((word, idx) => ({ id: `w-${idx}-${word}`, text: word }));
    
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }, [block.id, block.sentence, JSON.stringify(block.words)]);

  const selectedWordObjects = value?.selectedWordObjects || [];
  const submitted = Boolean(value?.submitted);

  const userSentence = selectedWordObjects.map(w => w.text).join(' ');
  const isCorrect = userSentence.trim().toLowerCase() === targetSentence.trim().toLowerCase();

  const handleWordClick = (wordObj) => {
    if (submitted) return;
    const newSelected = [...selectedWordObjects, wordObj];
    onChange({ selectedWordObjects: newSelected, submitted: false });
  };

  const handleRemoveWord = (wordObjId) => {
    if (submitted) return;
    const newSelected = selectedWordObjects.filter(w => w.id !== wordObjId);
    onChange({ selectedWordObjects: newSelected, submitted: false });
  };

  const handleReset = () => {
    if (onChange) onChange({ selectedWordObjects: [], submitted: false });
  };

  const handleSubmit = () => {
    if (selectedWordObjects.length === 0 || !onChange) return;
    if (isCorrect) playCorrectSound();
    else playWrongSound();
    onChange({ selectedWordObjects, submitted: true });
  };

  const usedIds = selectedWordObjects.map(w => w.id);

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs mb-6 space-y-4">
      {/* CATEGORY BADGE & INSTRUCTION */}
      <div>
        <div className="mb-2.5">
          <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-extrabold text-[11px] uppercase tracking-wider">
            Unscramble
          </span>
        </div>
        <h4 className="font-extrabold text-base sm:text-lg text-slate-900 border-l-4 border-indigo-600 pl-3 leading-snug">
          {instruction}
        </h4>
      </div>

      {/* SENTENCE BUILDER DROP ZONE */}
      <div className="min-h-16 p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl flex flex-wrap gap-2 items-center">
        {selectedWordObjects.length === 0 ? (
          <span className="text-slate-400 text-xs font-medium">Tap words below to build the sentence...</span>
        ) : (
          selectedWordObjects.map(wObj => (
            <button
              key={`sel-${wObj.id}`}
              disabled={submitted}
              onClick={() => handleRemoveWord(wObj.id)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-full text-xs shadow-2xs transition cursor-pointer"
            >
              {wObj.text} ✕
            </button>
          ))
        )}
      </div>

      {/* AVAILABLE WORD POOL (PILL CHIPS) */}
      <div className="flex flex-wrap gap-2 pt-1">
        {poolWords.map(wObj => {
          const isUsed = usedIds.includes(wObj.id);
          return (
            <button
              key={`pool-${wObj.id}`}
              disabled={isUsed || submitted}
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
      {!submitted ? (
        <div className="flex gap-2 pt-2">
          <button
            disabled={selectedWordObjects.length === 0}
            onClick={handleSubmit}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-xs shadow-md transition disabled:opacity-40 cursor-pointer"
          >
            Check Answer
          </button>
          {selectedWordObjects.length > 0 && (
            <button
              onClick={handleReset}
              className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-2xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      ) : (
        <div className={`p-4 rounded-2xl text-xs font-bold flex justify-between items-center ${
          isCorrect ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
        }`}>
          <span>
            {isCorrect ? '🎉 Excellent! Sentence ordered correctly.' : `❌ Incorrect. Original: "${targetSentence}"`}
          </span>
          <button
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
