import React, { useState } from 'react';

export const TeacherAuthModal = ({ initialRole = 'teacher', onLogin, onAuthSuccess, loginError, onCancel }) => {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register' | 'legacy_password'
  const [role, setRole] = useState(initialRole || 'teacher');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Пожалуйста, заполните email и пароль');
      return;
    }

    if (authMode === 'register' && !name.trim()) {
      setErrorMsg('Пожалуйста, введите ваше имя');
      return;
    }

    setLoading(true);
    const endpoint = authMode === 'register' ? '/api/auth/register' : '/api/auth/login';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
          name: name.trim(),
          role: role
        })
      });

      const data = await res.json();
      if (res.ok && data.success && data.token) {
        localStorage.setItem('auth_jwt', data.token);
        
        if (data.user.role === 'teacher' || data.user.isMaster) {
          localStorage.setItem('teacher_jwt', data.token);
        } else {
          localStorage.setItem('ls_student_name', data.user.name);
          localStorage.setItem('ls_student_id', data.user.id);
          localStorage.removeItem('teacher_jwt');
        }

        if (onAuthSuccess) {
          onAuthSuccess(data.user);
        } else if (onLogin) {
          onLogin(password.trim());
        }
      } else {
        setErrorMsg(data.error || 'Ошибка входа');
      }
    } catch (err) {
      setErrorMsg('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  const handleLegacySubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    await onLogin(password.trim());
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto my-12 bg-white p-7 sm:p-9 rounded-3xl border border-slate-200 shadow-xl space-y-6">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto text-2xl font-extrabold shadow-2xs">
          {authMode === 'legacy_password' ? '🔑' : role === 'teacher' ? '👨‍🏫' : '🧑‍🎓'}
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {authMode === 'legacy_password' 
            ? 'Вход по паролю школы' 
            : authMode === 'register' 
            ? 'Создать аккаунт' 
            : 'Вход в систему'}
        </h2>
        <p className="text-slate-500 text-xs">
          {authMode === 'legacy_password'
            ? 'Введите мастер-пароль преподавателя для быстрого доступа.'
            : 'Войдите со своим email и паролем для доступа к платформе.'}
        </p>
      </div>

      {authMode !== 'legacy_password' ? (
        <form onSubmit={handleAccountSubmit} className="space-y-4">
          {/* TABS: LOGIN OR REGISTER */}
          <div className="flex p-1 bg-slate-100 rounded-2xl text-xs font-extrabold">
            <button
              type="button"
              onClick={() => { setAuthMode('login'); setErrorMsg(''); }}
              className={`flex-1 py-2 rounded-xl transition cursor-pointer ${
                authMode === 'login' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Вход
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('register'); setErrorMsg(''); }}
              className={`flex-1 py-2 rounded-xl transition cursor-pointer ${
                authMode === 'register' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Регистрация
            </button>
          </div>

          {/* ROLE SELECTOR: CHOOSE TEACHER OR STUDENT */}
          <div className="grid grid-cols-2 gap-2 text-xs font-extrabold">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                role === 'student' ? 'bg-indigo-50 border-indigo-600 text-indigo-900 shadow-2xs' : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              🧑‍🎓 Я ученик
            </button>
            <button
              type="button"
              onClick={() => setRole('teacher')}
              className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                role === 'teacher' ? 'bg-indigo-50 border-indigo-600 text-indigo-900 shadow-2xs' : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              👨‍🏫 Я преподаватель
            </button>
          </div>

          {authMode === 'register' && (
            <div className="space-y-1">
              <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                Ваше Имя
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="например: Анна Смирнова"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-600 rounded-2xl text-xs font-bold text-slate-900 outline-none"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-600 rounded-2xl text-xs font-bold text-slate-900 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              Пароль
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-600 rounded-2xl text-xs font-bold text-slate-900 outline-none pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {(errorMsg || loginError) && (
            <p className="text-xs text-rose-600 font-bold">⚠️ {errorMsg || 'Ошибка авторизации'}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-xs shadow-md transition disabled:opacity-40 cursor-pointer"
          >
            {loading ? 'Обработка...' : authMode === 'register' ? 'Зарегистрироваться ➔' : 'Войти ➔'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleLegacySubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              Мастер-пароль преподавателя
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-600 rounded-2xl text-xs font-bold text-slate-900 outline-none"
            />
            {loginError && (
              <p className="text-xs text-rose-600 font-bold pt-1">⚠️ Неверный пароль</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-xs shadow-md transition cursor-pointer"
          >
            {loading ? 'Проверка...' : 'Войти по паролю ➔'}
          </button>
        </form>
      )}

      {/* QUICK SWITCH & CANCEL */}
      <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            ← На главную
          </button>
        )}

        {authMode === 'legacy_password' ? (
          <button
            type="button"
            onClick={() => { setAuthMode('login'); setErrorMsg(''); }}
            className="font-bold text-indigo-600 hover:underline cursor-pointer ml-auto"
          >
            Войти по Email и паролю
          </button>
        ) : (
          <button
            type="button"
            onClick={() => { setAuthMode('legacy_password'); setErrorMsg(''); }}
            className="font-bold text-slate-400 hover:text-slate-600 cursor-pointer ml-auto"
          >
            🔑 Пароль школы
          </button>
        )}
      </div>
    </div>
  );
};
