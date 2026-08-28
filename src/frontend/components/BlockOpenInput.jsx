import React from 'react';

export const BlockOpenInput = ({ block, value, onChange }) => {
  const text = value?.text || '';
  const wordCount = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = text.length;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6 space-y-3">
      <div className="flex justify-between items-start">
        <h4 className="font-bold text-base sm:text-lg text-slate-800 leading-snug">
          {block.prompt || 'Письменное задание:'}
        </h4>
        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[11px] font-extrabold rounded-full uppercase tracking-wider">
          📝 Writing
        </span>
      </div>

      <textarea
        rows="4"
        value={text}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder={block.placeholder || "Введите ваш ответ или свои примеры..."}
        className="w-full p-4 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 text-sm leading-relaxed font-sans transition bg-slate-50/50 focus:bg-white"
      ></textarea>

      <div className="flex justify-between items-center text-xs text-slate-400 font-medium">
        <span>Слов: <strong className="text-slate-600">{wordCount}</strong> ({charCount} симв.)</span>
        <span className="text-emerald-600 font-bold">{text ? 'Ответ сохранен ✓' : ''}</span>
      </div>
    </div>
  );
};
