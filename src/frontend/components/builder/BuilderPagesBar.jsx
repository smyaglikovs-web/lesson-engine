import React from 'react';

export const BuilderPagesBar = ({ pages, activePageIndex, setActivePageIndex, onAddPage, onDeletePage, onUpdatePageTitle }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 overflow-x-auto pb-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
      <span className="text-xs font-bold text-slate-400 uppercase px-2">Страницы:</span>
      {pages.map((p, idx) => (
        <div key={p.id} className="flex items-center gap-1">
          <button
            onClick={() => setActivePageIndex(idx)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex-shrink-0 ${activePageIndex === idx ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-50 border text-slate-700 hover:bg-slate-100'}`}
          >
            {p.title || `Страница ${idx + 1}`}
          </button>
          {pages.length > 1 && activePageIndex === idx && (
            <button onClick={() => onDeletePage(idx)} className="p-1 text-slate-400 hover:text-red-600 text-xs font-bold" title="Удалить страницу">✕</button>
          )}
        </div>
      ))}
      <button onClick={onAddPage} className="px-3.5 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition">+ Добавить страницу</button>
    </div>

    <div className="flex items-center gap-3 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
      <span className="text-xs font-bold text-indigo-700 uppercase">Название текущей страницы:</span>
      <input
        type="text"
        value={pages[activePageIndex]?.title || ''}
        onChange={(e) => onUpdatePageTitle(e.target.value)}
        className="p-1.5 border rounded-lg text-xs font-bold text-slate-800 bg-white flex-1 outline-none focus:ring-2 focus:ring-indigo-500"
        placeholder="например: Часть 1: Чтение и Теория..."
      />
    </div>
  </div>
);
