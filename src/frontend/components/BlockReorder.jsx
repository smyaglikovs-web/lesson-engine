import React, { useState } from 'react';

export const BlockReorder = ({ block, value, onChange }) => {
  const targetSentence = block.sentence || '';
  const initialWords = React.useMemo(() => {
    return (block.words || targetSentence.split(' ')).sort(() => Math.random() - 0.5);
  }, [block.id]);

  const selectedWords = value?.selectedWords || [];
  const submitted = value?.submitted || false;

  const userSentence = selectedWords.join(' ');
  const isCorrect = userSentence.trim().toLowerCase() === targetSentence.trim().toLowerCase();

  const handleWordClick = (word, idx) => {
    if (submitted) return;
    const newSelected = [...selectedWords, word];
    onChange({ selectedWords: newSelected, submitted: false });
  };

  const handleRemoveWord = (idx) => {
    if (submitted) return;
    const newSelected = selectedWords.filter((_, i) => i !== idx);
    onChange({ selectedWords: newSelected, submitted: false });
  };

  const handleReset = () => {
    onChange({ selectedWords: [], submitted: false });
  };

  const handleSubmit = () => {
    if (selectedWords.length === 0) return;
    onChange({ selectedWords, submitted: true });
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
      <h4 className="font-semibold text-lg text-slate-800 mb-2">{block.instruction || '🧩 Составьте предложение из слов:'}</h4>

      {/* Selected Sentence Box */}
      <div className="min-h-16 p-4 bg-slate-50 border-2 border-dashed border-indigo-200 rounded-xl flex flex-wrap gap-2 items-center mb-4">
        {selectedWords.length === 0 ? (
          <span className="text-slate-400 text-sm italic">Нажимайте на слова ниже, чтобы собрать предложение...</span>
        ) : (
          selectedWords.map((word, idx) => (
            <button
              key={`sel-${idx}`}
              disabled={submitted}
              onClick={() => handleRemoveWord(idx)}
              className="px-3 py-1.5 bg-indigo-600 text-white font-semibold rounded-lg text-sm shadow-xs hover:bg-indigo-700 transition"
            >
              {word} ✕
            </button>
          ))
        )}
      </div>

      {/* Available Words Pool */}
      <div className="flex flex-wrap gap-2 mb-4">
        {initialWords.map((word, idx) => {
          const usedCount = selectedWords.filter(w => w === word).length;
          const totalInInitial = initialWords.filter(w => w === word).length;
          const isUsed = usedCount >= totalInInitial;

          return (
            <button
              key={`pool-${idx}`}
              disabled={isUsed || submitted}
              onClick={() => handleWordClick(word, idx)}
              className={`px-3 py-1.5 border rounded-lg text-sm font-medium transition ${isUsed ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed' : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-500 shadow-2xs'}`}
            >
              {word}
            </button>
          );
        })}
      </div>

      {/* Action Buttons & Feedback */}
      {!submitted ? (
        <div className="flex gap-2">
          <button disabled={selectedWords.length === 0} onClick={handleSubmit} className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg disabled:opacity-50">Проверить</button>
          <button onClick={handleReset} className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-sm">Сбросить</button>
        </div>
      ) : (
        <div className={isCorrect ? 'p-3 bg-green-100 text-green-800 rounded-lg text-sm font-bold' : 'p-3 bg-red-100 text-red-800 rounded-lg text-sm'}>
          {isCorrect ? '🎉 Отлично! Предложение составлено верно.' : `❌ Неверно. Правильный вариант: "${targetSentence}"`}
        </div>
      )}
    </div>
  );
};
