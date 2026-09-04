import React, { useState } from 'react';

export const BlockFlashcards = ({ block = {} }) => {
  const [flippedMap, setFlippedMap] = useState({});
  const cards = Array.isArray(block.cards) ? block.cards : [];

  const handleCardToggle = (idx) => {
    setFlippedMap(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const speakText = (text, lang = 'en-US') => {
    if ('speechSynthesis' in window && text) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  if (cards.length === 0) return null;

  return (
    <div className="bg-white p-4 sm:p-8 rounded-3xl border border-slate-200/90 shadow-2xs mb-6 space-y-4 w-full min-w-0 overflow-hidden">
      {/* HEADER & INSTRUCTIONS */}
      <div>
        <div className="mb-2">
          <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-extrabold text-[11px] uppercase tracking-wider">
            Vocabulary Cards
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-l-4 border-indigo-600 pl-3">
          <h4 className="font-extrabold text-base sm:text-lg text-slate-900 leading-snug">
            {block.title || '🎴 Key Target Vocabulary'}
          </h4>
          <span className="text-slate-400 text-xs font-medium">
            {cards.length} {cards.length === 1 ? 'card' : 'cards'}
          </span>
        </div>
        <p className="text-slate-500 text-xs mt-1 pl-3.5 leading-relaxed">
          Tap any card to flip between word and translation. Tap 🔊 for native audio.
        </p>
      </div>

      {/* FLASHCARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4 pt-1">
        {cards.map((card, idx) => {
          const isFlipped = Boolean(flippedMap[idx]);
          const frontText = card.front || card.word || 'Word';
          const backText = card.back || card.translation || 'Translation';
          const exampleText = card.example || card.sentence || '';
          
          const targetText = isFlipped ? backText : frontText;
          const words = targetText.split(/\s+/);
          const hasLongWord = words.some(w => w.length > 13);
          const textLength = targetText.length;

          // Adaptive font sizing to prevent overflow on mobile
          const fontSizeClass = (textLength > 24 || hasLongWord)
            ? 'text-sm sm:text-base font-bold' 
            : textLength > 15 
            ? 'text-base sm:text-lg font-bold' 
            : 'text-lg sm:text-xl font-extrabold';

          return (
            <div
              key={idx}
              tabIndex={0}
              role="button"
              aria-label={`Flashcard ${idx + 1}: ${isFlipped ? backText : frontText}`}
              onClick={() => handleCardToggle(idx)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCardToggle(idx);
                }
              }}
              className="min-h-[170px] sm:min-h-[190px] rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-indigo-500/40 shadow-xs hover:shadow-md hover:-translate-y-0.5 border"
              style={{
                backgroundColor: isFlipped ? '#4f46e5' : '#f8fafc',
                borderColor: isFlipped ? '#4338ca' : '#e2e8f0',
                color: isFlipped ? '#ffffff' : '#0f172a'
              }}
            >
              {/* TOP CARD BAR */}
              <div className="w-full flex justify-between items-center text-xs">
                <span className={`font-extrabold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-md ${
                  isFlipped ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-200/70 text-slate-600'
                }`}>
                  {isFlipped ? 'Перевод' : 'Слово'}
                </span>

                <button
                  type="button"
                  title="Прослушать произношение"
                  onClick={(e) => {
                    e.stopPropagation();
                    speakText(frontText, block.lang || 'en-US');
                  }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition cursor-pointer text-sm ${
                    isFlipped 
                      ? 'bg-indigo-700/80 hover:bg-indigo-600 text-white' 
                      : 'bg-white hover:bg-slate-200/80 text-slate-700 shadow-2xs border border-slate-200'
                  }`}
                >
                  🔊
                </button>
              </div>

              {/* MAIN CONTENT (WORD OR TRANSLATION WITH AUTO-BREAK) */}
              <div className="my-auto py-2.5 text-center px-1">
                <p className={`${fontSizeClass} leading-snug tracking-tight break-words hyphens-auto`}>
                  {targetText}
                </p>
              </div>

              {/* CONTEXT EXAMPLE SENTENCE */}
              {exampleText ? (
                <div className={`text-[11px] sm:text-xs leading-relaxed pt-2 border-t ${
                  isFlipped ? 'border-indigo-400/40 text-indigo-100' : 'border-slate-200/70 text-slate-600'
                }`}>
                  <p className="italic font-medium line-clamp-3 break-words">
                    "{exampleText}"
                  </p>
                </div>
              ) : (
                <div className="h-1"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
