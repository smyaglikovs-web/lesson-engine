import React, { useState } from 'react';

export const TeacherHeader = ({ view, setView, onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavigate = (targetView) => {
    window.history.pushState({}, '', '/');
    setView(targetView);
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex justify-between items-center">
        {/* LOGO & APP TITLE */}
        <div 
          className="flex items-center gap-2.5 cursor-pointer select-none" 
          onClick={() => handleNavigate('library')}
        >
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-extrabold shadow-sm">
            L
          </div>
          <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">Lesson Engine</span>
        </div>

        {/* DESKTOP NAVIGATION (HIDDEN ON MOBILE) */}
        <nav className="hidden md:flex items-center gap-1 text-xs sm:text-sm font-bold">
          <button 
            type="button"
            onClick={() => handleNavigate('library')} 
            className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${
              view === 'library' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Библиотека
          </button>

          <button 
            type="button"
            onClick={() => handleNavigate('students')} 
            className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${
              view === 'students' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Ученики
          </button>

          <button 
            type="button"
            onClick={() => handleNavigate('vocab')} 
            className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${
              view === 'vocab' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-indigo-600 hover:bg-indigo-50'
            }`}
          >
            🎴 Vocab Trainer
          </button>

          <button 
            type="button"
            onClick={() => handleNavigate('create')} 
            className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${
              view === 'create' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            + Создать урок
          </button>

          <button 
            type="button"
            onClick={() => handleNavigate('prompts')} 
            className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${
              view === 'prompts' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            💡 AI Промпты
          </button>

          <button 
            type="button"
            onClick={onLogout} 
            className="px-3 py-1.5 text-xs text-slate-400 hover:text-rose-600 font-bold ml-2 cursor-pointer transition"
          >
            Выход
          </button>
        </nav>

        {/* MOBILE HAMBURGER TOGGLE BUTTON (SHOWN ONLY ON PHONES) */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold flex items-center justify-center text-lg transition cursor-pointer"
          aria-label="Открыть меню навигации"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* MOBILE DROPDOWN ACCORDION */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1.5 shadow-lg">
          <button
            type="button"
            onClick={() => handleNavigate('library')}
            className={`w-full text-left px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-between cursor-pointer ${
              view === 'library' ? 'bg-indigo-50 text-indigo-700 font-extrabold' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>📚 Библиотека уроков</span>
            {view === 'library' && <span>✓</span>}
          </button>

          <button
            type="button"
            onClick={() => handleNavigate('students')}
            className={`w-full text-left px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-between cursor-pointer ${
              view === 'students' ? 'bg-indigo-50 text-indigo-700 font-extrabold' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>🧑‍🎓 Ученики и Прогресс</span>
            {view === 'students' && <span>✓</span>}
          </button>

          <button
            type="button"
            onClick={() => handleNavigate('vocab')}
            className={`w-full text-left px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-between cursor-pointer ${
              view === 'vocab' ? 'bg-indigo-600 text-white font-extrabold shadow-xs' : 'text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50'
            }`}
          >
            <span>🎴 Vocab Trainer</span>
            {view === 'vocab' && <span>✓</span>}
          </button>

          <button
            type="button"
            onClick={() => handleNavigate('create')}
            className={`w-full text-left px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-between cursor-pointer ${
              view === 'create' ? 'bg-indigo-50 text-indigo-700 font-extrabold' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>✨ Создать новый урок</span>
            {view === 'create' && <span>✓</span>}
          </button>

          <button
            type="button"
            onClick={() => handleNavigate('prompts')}
            className={`w-full text-left px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-between cursor-pointer ${
              view === 'prompts' ? 'bg-indigo-50 text-indigo-700 font-extrabold' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>💡 AI Промпты для учителей</span>
            {view === 'prompts' && <span>✓</span>}
          </button>

          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => { onLogout(); setMobileMenuOpen(false); }}
              className="w-full text-left px-4 py-2.5 rounded-xl font-bold text-xs text-rose-600 hover:bg-rose-50 transition cursor-pointer"
            >
              🚪 Выйти из кабинета
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
