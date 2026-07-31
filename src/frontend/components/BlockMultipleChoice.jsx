import React from 'react';

export const BlockMultipleChoice = ({ block, value, onChange }) => {
  const selected = value?.selected !== undefined && value?.selected !== null ? Number(value.selected) : null;
  const submitted = value?.submitted ?? false;
  const isCorrect = selected !== null && Number(selected) === Number(block.correct);

  const handleSelect = (idx) => {
    if (submitted) return;
    onChange({ selected: Number(idx), submitted: false });
  };

  const handleSubmit = () => {
    if (selected === null) return;
    onChange({ selected: Number(selected), submitted: true });
  };

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
      <h4 className="font-semibold text-base sm:text-lg text-slate-800 mb-4 leading-snug">{block.question}</h4>
      <div className="space-y-2.5 mb-4">
        {block.options?.map((option, idx) => {
          const isSelected = selected !== null && Number(selected) === Number(idx);
          const isTargetCorrect = Number(idx) === Number(block.correct);

          let btnStyle = "w-full text-left p-4 rounded-xl border font-medium transition text-sm flex items-center justify-between touch-manipulation ";
          if (submitted) {
            if (isTargetCorrect) btnStyle += "bg-green-50 border-green-500 text-green-900 font-bold";
            else if (isSelected) btnStyle += "bg-red-50 border-red-500 text-red-900 font-bold";
            else btnStyle += "border-slate-200 opacity-50";
          } else {
            btnStyle += isSelected ? "border-indigo-600 bg-indigo-50/80 text-indigo-900 font-bold shadow-xs ring-2 ring-indigo-500/20" : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700";
          }

          return (
            <button
              key={`${block.id || 'mc'}-opt-${idx}`}
              disabled={submitted}
              onClick={() => handleSelect(idx)}
              className={btnStyle}
            >
              <span>{option}</span>
              {isSelected && !submitted && <span className="text-indigo-600 font-bold">✓</span>}
            </button>
          );
        })}
      </div>

      {!submitted ? (
        <button
          disabled={selected === null}
          onClick={handleSubmit}
          className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl disabled:opacity-40 hover:bg-indigo-700 transition active:scale-98"
        >
          Ответить
        </button>
      ) : (
        <div className={isCorrect ? 'mt-4 p-4 rounded-xl text-sm bg-green-100 text-green-800 font-medium' : 'mt-4 p-4 rounded-xl text-sm bg-red-100 text-red-800'}>
          <p className="font-bold mb-1">{isCorrect ? 'Правильно! 🎉' : 'Неверно ❌'}</p>
          {block.explanation && <p className="text-xs mt-1 leading-relaxed">{block.explanation}</p>}
        </div>
      )}
    </div>
  );
};
