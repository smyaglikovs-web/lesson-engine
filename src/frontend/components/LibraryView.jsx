import React from 'react';

export const LibraryView = ({ lessons, loading, onOpenLesson, onCreateNew, onDeleteLesson, onViewSubmissions }) => (
  <div>
    <div className="flex justify-between items-center mb-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Облачная библиотека уроков</h2>
        <p className="text-slate-500 text-sm">Управление интерактивными уроками и результатами учеников</p>
      </div>
      <button onClick={onCreateNew} className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 shadow-sm">+ Создать урок (JSON)</button>
    </div>

    {loading ? (
      <p className="text-center py-12 text-slate-400">Загрузка из D1...</p>
    ) : lessons.length === 0 ? (
      <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border">Пока нет уроков. Нажмите "+ Создать урок"!</div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {lessons.map(l => (
          <div key={l.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-semibold text-xs rounded-full uppercase">{l.level || 'A2-B1'}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => onViewSubmissions(l)} className="px-2.5 py-1 text-xs bg-indigo-50 text-indigo-700 font-semibold rounded-lg hover:bg-indigo-100">📊 Ответы ДЗ</button>
                  <button
                    onClick={(e) => onDeleteLesson(l.id, e)}
                    className="p-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-bold transition"
                    title="Удалить урок"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{l.title}</h3>
              <p className="text-slate-600 text-sm mb-6 line-clamp-2">{l.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
              <button onClick={() => onOpenLesson(l.id)} className="py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition font-bold">Провести урок</button>
              <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/?homework=${l.id}`); alert('🔗 Ссылка скопирована!'); }} className="py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition">Ссылка на ДЗ 🏠</button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);
