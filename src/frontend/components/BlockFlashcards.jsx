import React, { useState } from 'react';

export const BlockFlashcards = ({ block }) => {
  const [flippedIndex, setFlippedIndex] = useState(null);
  const cards = block.cards || [];

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = block.lang || 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
      <h4 className="font-semibold text-lg text-slate-800 mb-2">{block.title || '🎴 Vocabulary Flashcards'}</h4>
      <p className="text-slate-500 text-xs mb-4">Нажмите на карточку, чтобы перевернуть. Нажмите 🔊 для произношения.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((card, idx) => {
          const isFlipped = flippedIndex === idx;
          return (
            <div
              key={idx}
              onClick={() => setFlippedIndex(isFlipped ? null : idx)}
              className="h-40 cursor-pointer perspective-1000 relative group"
            >
              <div className={`w-full h-full rounded-2xl border transition-all duration-300 p-5 flex flex-col justify-between items-center text-center shadow-xs ${isFlipped ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-indigo-300'}`}>
                <div className="w-full flex justify-between items-center text-xs opacity-70">
                  <span>{isFlipped ? 'Перевод' : 'Слово'}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); speakText(card.front); }}
                    className="p-1 rounded-full hover:bg-slate-200/50 text-base"
                    title="Прослушать произношение"
                  >
                    🔊
                  </button>
                </div>

                <div className="my-auto font-bold text-xl leading-tight">
                  {isFlipped ? card.back : card.front}
                </div>

                {card.example && (
                  <div className="text-xs italic opacity-80 line-clamp-1">
                    "{card.example}"
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
