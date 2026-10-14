import React from 'react';

export const StudentHeader = ({ user, onLogout, onOpenDictionary }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-16 flex justify-between items-center">
        {/* LOGO */}
        <div className="flex items-center gap-2.5 select-none">
          <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-extrabold shadow-sm">
            S
          </div>
          <div>
            <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight block leading-tight">
              Кабинет Ученика
            </span>
            <span className="text-[10px] text-slate-400 font-bold block">
              {user?.name ? user.name : 'Личный профиль'}
            </span>
          </div>
        </div>

        {/* RIGHT CONTROLS */}
        <div className="flex items-center gap-2">
          {onOpenDictionary && (
            <button
              type="button"
              onClick={onOpenDictionary}
              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <span>⭐</span>
              <span className="hidden sm:inline">Мой словарь</span>
            </button>
          )}

          <button
            type="button"
            onClick={onLogout}
            className="px-3.5 py-2 border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Выйти
          </button>
        </div>
      </div>
    </header>
  );
};
