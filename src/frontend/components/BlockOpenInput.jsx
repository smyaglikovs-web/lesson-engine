import React from 'react';

export const BlockOpenInput = ({ block, value, onChange }) => {
  const text = value?.text || '';
  const wordCount = text.trim() ? text.trim().split(' ').filter(Boolean).length : 0;

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
      <h4 className="font-semibold text-lg text-slate-800 mb-2">{block.prompt}</h4>
      <textarea
        rows="4"
        value={text}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder={block.placeholder || "Введите ответ..."}
        className="w-full p-4 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 mb-2 text-slate-700 text-sm"
      ></textarea>
      <div className="flex justify-between items-center text-xs text-slate-400">
        <span>Количество слов: {wordCount}</span>
        <span className="text-emerald-600 font-medium">{text ? 'Ответ сохранен ✓' : ''}</span>
      </div>
    </div>
  );
};
