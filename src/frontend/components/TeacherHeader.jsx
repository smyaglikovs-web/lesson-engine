import React from 'react';

export const TeacherHeader = ({ view, setView, onLogout }) => (
  <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
    <div className="max-w-6xl mx-auto px-4 h-16 flex justify-between items-center">
      <div 
        className="flex items-center gap-3 cursor-pointer" 
        onClick={() => { window.history.pushState({}, '', '/'); setView('library'); }}
      >
        <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-extrabold shadow-sm">
          L
        </div>
        <span className="font-extrabold text-lg text-slate-900 tracking-tight">Lesson Engine</span>
      </div>

      <nav className="flex items-center gap-1 text-xs sm:text-sm font-bold">
        <button 
          onClick={() => { window.history.pushState({}, '', '/'); setView('library'); }} 
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${
            view === 'library' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Библиотека
        </button>

        <button 
          onClick={() => setView('students')} 
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${
            view === 'students' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Ученики
        </button>

        <button 
          onClick={() => setView('vocab')} 
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${
            view === 'vocab' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-indigo-600 hover:bg-indigo-50'
          }`}
        >
          🎴 Vocab Trainer
        </button>

        <button 
          onClick={() => setView('create')} 
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${
            view === 'create' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          + Создать урок
        </button>

        <button 
          onClick={() => setView('prompts')} 
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${
            view === 'prompts' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          💡 AI Промпты
        </button>

        <button 
          onClick={onLogout} 
          className="px-3 py-1.5 text-xs text-slate-400 hover:text-rose-600 font-bold ml-2 cursor-pointer transition"
        >
          Выход
        </button>
      </nav>
    </div>
  </header>
);
