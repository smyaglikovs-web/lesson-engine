import React from 'react';

export const BlockOpenInput = ({ block, value, onChange }) => {
  const text = value?.text || '';
  const wordCount = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = text.length;

  const rawPrompt = block.prompt || 'Письменное задание:';
  
  // Format numbered questions (1., 2., 3.) cleanly with spacing
  const formattedPrompt = rawPrompt
    .replace(/(\d+\.\s+)/g, '\n$1')
    .replace(/^\n+/, '')
    .trim();

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-2xs mb-6 space-y-4">
      <div className="flex justify-between items-start">
        <h4 className="font-extrabold text-base sm:text-lg text-slate-900 leading-relaxed whitespace-pre-line flex-1">
          {formattedPrompt}
        </h4>
        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-[11px] font-extrabold rounded-full uppercase tracking-wider flex-shrink-0 ml-3 shadow-2xs">
          📝 Writing / Speaking
        </span>
      </div>

      <textarea
        rows="4"
        value={text}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder={block.placeholder || "Введите ваш ответ или свои мысли..."}
        className="w-full p-4 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 text-sm leading-relaxed font-sans transition bg-slate-50/60 focus:bg-white"
      ></textarea>

      <div className="flex justify-between items-center text-xs text-slate-400 font-medium pt-1">
        <span>Слов: <strong className="text-slate-700">{wordCount}</strong> ({charCount} симв.)</span>
        <span className="text-emerald-600 font-bold">{text ? 'Ответ сохранен ✓' : ''}</span>
      </div>
    </div>
  );
};
