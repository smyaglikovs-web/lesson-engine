import React from 'react';

export const BlockMultipleChoice = ({ block, value, onChange }) => {
  const selected = value?.selected ?? null;
  const submitted = value?.submitted ?? false;
  const isCorrect = selected === block.correct;

  const handleSelect = (idx) => {
    if (submitted) return;
    onChange({ selected: idx, submitted: false });
  };

  const handleSubmit = () => {
    if (selected === null) return;
    onChange({ selected, submitted: true });
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
      <h4 className="font-semibold text-lg text-slate-800 mb-4">{block.question}</h4>
      <div className="space-y-2 mb-4">
        {block.options?.map((option, idx) => {
          let btnStyle = "w-full text-left p-3.5 rounded-xl border text-slate-700 font-medium transition text-sm ";
          if (submitted) {
            if (idx === block.correct) btnStyle += "bg-green-50 border-green-500 text-green-900 font-bold";
            else if (idx === selected) btnStyle += "bg-red-50 border-red-500 text-red-900";
            else btnStyle += "border-slate-200 opacity-50";
          } else {
            btnStyle += idx === selected ? "border-indigo-600 bg-indigo-50 text-indigo-900 font-bold shadow-xs" : "border-slate-200 hover:bg-slate-50";
          }
          return (
            <button
              key={`${block.id || 'mc'}-opt-${idx}`}
              disabled={submitted}
              onClick={() => handleSelect(idx)}
              className={btnStyle}
            >
              {option}
            </button>
          );
        })}
      </div>
      {!submitted ? (
        <button
          disabled={selected === null}
          onClick={handleSubmit}
          className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl disabled:opacity-50 hover:bg-indigo-700 transition"
        >
          Ответить
        </button>
      ) : (
        <div className={isCorrect ? 'mt-4 p-4 rounded-xl text-sm bg-green-100 text-green-800 font-medium' : 'mt-4 p-4 rounded-xl text-sm bg-red-100 text-red-800'}>
          <p className="font-bold mb-1">{isCorrect ? 'Правильно! 🎉' : 'Неверно ❌'}</p>
          {block.explanation && <p className="text-xs mt-1">{block.explanation}</p>}
        </div>
      )}
    </div>
  );
};
