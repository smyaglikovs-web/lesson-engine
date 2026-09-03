import React, { useState } from 'react';

export const TeacherAuthModal = ({ onLogin, loginError }) => {
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!passwordInput.trim()) return;
    setLoading(true);
    await onLogin(passwordInput);
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto my-16 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl space-y-6">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto text-2xl font-extrabold shadow-2xs">
          🔑
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Кабинет Преподавателя</h2>
        <p className="text-slate-500 text-xs leading-relaxed">
          Введите пароль для доступа к библиотеке, управлению учениками и AI конструктору уроков.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
            Пароль доступа
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={passwordInput}
              onChange={e => setPasswordInput(e.target.value)}
              placeholder="••••••••••••"
              autoComplete="current-password"
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-600 rounded-2xl text-sm font-medium text-slate-900 outline-none transition pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer"
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
          {loginError && (
            <p className="text-xs text-rose-600 font-bold pt-1">⚠️ Неверный пароль. Попробуйте ещё раз.</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !passwordInput.trim()}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-sm shadow-md transition disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
        >
          {loading ? 'Проверка...' : 'Войти в кабинет ➔'}
        </button>
      </form>
    </div>
  );
};
