import React, { useState } from 'react';

export const TeacherAuthModal = ({ onLogin, loginError }) => {
  const [passwordInput, setPasswordInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(passwordInput);
  };

  return (
    <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center space-y-6">
      <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto font-bold text-2xl">🔑</div>
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900">Вход для Учителя</h2>
        <p className="text-slate-500 text-xs mt-1">Введите пароль для доступа к библиотеке и конструктору уроков</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          value={passwordInput}
          onChange={(e) => setPasswordInput(e.target.value)}
          placeholder="Введите пароль..."
          className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-center text-sm font-medium"
        />
        {loginError && <p className="text-xs text-red-600 font-bold">Неверный пароль!</p>}
        <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md transition">
          Войти в кабинет
        </button>
      </form>
    </div>
  );
};
