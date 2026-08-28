import React from 'react';
import { playCorrectSound, playWrongSound } from '../utils/sounds.js';

export const BlockReorder = ({ block, value, onChange }) => {
  const targetSentence = block.sentence || '';
  
  const poolWords = React.useMemo(() => {
    const rawList = block.words && block.words.length > 0 ? block.words : targetSentence.split(' ');
    const list = rawList.map((word, idx) => ({ id: `word-${idx}-${word}`, text: word }));
    
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }, [block.id, block.sentence, JSON.stringify(block.words)]);

  const selectedWordObjects = value?.selectedWordObjects || [];
  const submitted = value?.submitted || false;

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
    onChange({ selectedWordObjects: [], submitted: false });
  };

  const handleSubmit = () => {
    if (selectedWordObjects.length === 0) return;
    if (isCorrect) {
      playCorrectSound();
    } else {
      playWrongSound();
    }
    onChange({ selectedWordObjects, submitted: true });
  };

  const usedIds = selectedWordObjects.map(w => w.id);

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-2xs mb-6 space-y-4">
      <h4 className="font-extrabold text-base sm:text-lg text-slate-800 leading-snug">
        {block.instruction || '🧩 Составьте предложение из слов:'}
      </h4>

      {/* Selected Sentence Box */}
      <div className="min-h-16 p-4 bg-indigo-50/40 border-2 border-dashed border-indigo-200 rounded-2xl flex flex-wrap gap-2 items-center">
        {selectedWordObjects.length === 0 ? (
          <span className="text-slate-400 text-xs italic">Нажимайте на слова ниже, чтобы собрать предложение...</span>
        ) : (
          selectedWordObjects.map((wObj) => (
            <button
              key={`sel-${wObj.id}`}
              disabled={submitted}
              onClick={() => handleRemoveWord(wObj.id)}
              className="px-3.5 py-1.5 bg-indigo-600 text-white font-extrabold rounded-xl text-xs shadow-xs hover:bg-indigo-700 transition cursor-pointer"
            >
              {wObj.text} ✕
            </button>
          ))
        )}
      </div>

      {/* Available Words Pool */}
      <div className="flex flex-wrap gap-2 pt-1">
        {poolWords.map((wObj) => {
          const isUsed = usedIds.includes(wObj.id);

          return (
            <button
              key={`pool-${wObj.id}`}
              disabled={isUsed || submitted}
              onClick={() => handleWordClick(wObj)}
              className={`px-3.5 py-2 border rounded-xl text-xs font-bold transition cursor-pointer ${
                isUsed 
                  ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed' 
                  : 'bg-white text-slate-800 border-slate-200 hover:border-indigo-400 shadow-2xs hover:scale-105'
              }`}
            >
              {wObj.text}
            </button>
          );
        })}
      </div>

      {/* Action Buttons & Feedback */}
      {!submitted ? (
        <div className="flex gap-2 pt-2">
          <button
            disabled={selectedWordObjects.length === 0}
            onClick={handleSubmit}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-xs shadow-md transition disabled:opacity-40 cursor-pointer"
          >
            Проверить
          </button>
          {selectedWordObjects.length > 0 && (
            <button
              onClick={handleReset}
              className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-2xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
            >
              Сбросить
            </button>
          )}
        </div>
      ) : (
        <div className={`p-4 rounded-2xl text-xs font-bold flex justify-between items-center ${isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
          <span>
            {isCorrect ? '🎉 Отлично! Предложение составлено абсолютно верно!' : `❌ Неверно. Правильный вариант: "${targetSentence}"`}
          </span>
          <button
            onClick={handleReset}
            className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 cursor-pointer"
          >
            Попробовать снова 🔄
          </button>
        </div>
      )}
    </div>
  );
};
