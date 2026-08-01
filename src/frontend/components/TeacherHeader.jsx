import React from 'react';

export const TeacherHeader = ({ view, setView, onLogout }) => (
  <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
    <div className="max-w-6xl mx-auto px-4 h-16 flex justify-between items-center">
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => { window.history.pushState({}, '', '/'); setView('library'); }}>
        <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-sm">L</div>
        <span className="font-bold text-lg text-slate-800">Lesson Engine</span>
      </div>

      <nav className="flex items-center gap-1">
        <button onClick={() => { window.history.pushState({}, '', '/'); setView('library'); }} className={`px-4 py-2 rounded-lg text-sm font-medium ${view === 'library' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600'}`}>Библиотека</button>
        <button onClick={() => setView('create')} className={`px-4 py-2 rounded-lg text-sm font-medium ${view === 'create' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600'}`}>+ Создать урок</button>
        <button onClick={() => setView('prompts')} className={`px-4 py-2 rounded-lg text-sm font-medium ${view === 'prompts' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600'}`}>💡 AI Промпты</button>
        <button onClick={onLogout} className="px-3 py-1.5 text-xs text-slate-400 hover:text-red-600 font-bold ml-2">Выход</button>
      </nav>
    </div>
  </header>
);
