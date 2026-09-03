import React from 'react';
import { playCorrectSound, playWrongSound } from '../utils/sounds.js';

export const BlockMultipleChoice = ({ block = {}, value = {}, onChange }) => {
  const selected = value?.selected !== undefined && value?.selected !== null ? Number(value.selected) : null;
  const submitted = value?.submitted ?? false;
  const isCorrect = selected !== null && Number(selected) === Number(block.correct);

  const handleSelect = (idx) => {
    if (submitted) return;
    onChange({ selected: Number(idx), submitted: false });
  };

  const handleSubmit = () => {
    if (selected === null) return;
    const correct = Number(selected) === Number(block.correct);
    if (correct) playCorrectSound();
    else playWrongSound();
    onChange({ selected: Number(selected), submitted: true });
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs mb-6 space-y-4">
      {/* CATEGORY BADGE & QUESTION */}
      <div>
        <div className="mb-2.5">
          <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-extrabold text-[11px] uppercase tracking-wider">
            Multiple Choice
          </span>
        </div>
        <h4 className="font-extrabold text-base sm:text-lg text-slate-900 border-l-4 border-indigo-600 pl-3 leading-snug">
          {block.question}
        </h4>
      </div>

      <div className="space-y-2.5 mb-4">
        {block.options?.map((option, idx) => {
          const isSelected = selected !== null && Number(selected) === Number(idx);
          const isTargetCorrect = Number(idx) === Number(block.correct);

          let optionText = typeof option === 'object' && option !== null
            ? (option.text || option.statement || option.option || JSON.stringify(option))
            : String(option);

          let btnStyle = "w-full text-left p-4 rounded-2xl border font-bold transition text-sm flex items-center justify-between cursor-pointer ";
          if (submitted) {
            if (isTargetCorrect) btnStyle += "bg-emerald-50 border-emerald-500 text-emerald-900 font-extrabold";
            else if (isSelected) btnStyle += "bg-rose-50 border-rose-500 text-rose-900 font-extrabold";
            else btnStyle += "border-slate-200 opacity-40";
          } else {
            btnStyle += isSelected 
              ? "border-indigo-600 bg-indigo-50 text-indigo-900 shadow-2xs ring-2 ring-indigo-500/20" 
              : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700";
          }

          return (
            <button
              key={`${block.id || 'mc'}-opt-${idx}`}
              disabled={submitted}
              onClick={() => handleSelect(idx)}
              className={btnStyle}
            >
              <span>{optionText}</span>
              {isSelected && !submitted && <span className="text-indigo-600 font-bold">✓</span>}
            </button>
          );
        })}
      </div>

      {!submitted ? (
        <button
          disabled={selected === null}
          onClick={handleSubmit}
          className="px-6 py-2.5 bg-indigo-600 text-white font-extrabold rounded-2xl disabled:opacity-40 hover:bg-indigo-700 transition text-xs shadow-md cursor-pointer"
        >
          Check Answer
        </button>
      ) : (
        <div className={`p-4 rounded-2xl text-xs font-bold ${isCorrect ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'}`}>
          <p className="font-extrabold mb-1">{isCorrect ? 'Correct! 🎉' : 'Incorrect ❌'}</p>
          {block.explanation && <p className="text-xs font-normal leading-relaxed">{block.explanation}</p>}
        </div>
      )}
    </div>
  );
};
