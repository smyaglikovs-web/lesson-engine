import React, { useState, useEffect } from 'react';
import { DictionaryView } from './DictionaryView.jsx';

export const StudentDashboard = ({ onOpenLesson, onJoinRoom, onLaunchVocabTrainer, onLogout }) => {
  const [tab, setTab] = useState('dashboard'); // 'dashboard' | 'history' | 'dictionary'
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState('');

  useEffect(() => {
    const sName = localStorage.getItem('ls_student_name') || 'Ученик';
    setStudentName(sName);

    const loadData = async () => {
      setLoading(true);
      try {
        const histRes = await fetch(`/api/student/history?studentName=${encodeURIComponent(sName)}`);
        if (histRes.ok) {
          const histData = await histRes.json();
          setHistory(Array.isArray(histData) ? histData : []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleJoinByCode = (e) => {
    e.preventDefault();
    if (!roomCodeInput.trim()) return;

    let cleanId = roomCodeInput.trim();
    if (cleanId.includes('room=')) {
      try {
        const urlObj = new URL(cleanId.startsWith('http') ? cleanId : `https://${cleanId}`);
        cleanId = urlObj.searchParams.get('room') || cleanId;
      } catch (err) {}
    }

    if (onJoinRoom) {
      onJoinRoom(cleanId);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full min-w-0">
      
      {/* 1. TOP ROOM JOIN BAR & GREETING */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* WELCOME BANNER */}
        <div className="md:col-span-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-6 sm:p-7 text-white shadow-lg flex flex-col justify-between space-y-4">
          <div>
            <span className="text-[10px] uppercase font-extrabold tracking-wider bg-white/20 px-3 py-1 rounded-full">
              Личный кабинет
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-2">
              С возвращением, {studentName}! 👋
            </h1>
            <p className="text-indigo-100 text-xs sm:text-sm mt-1">
              Здесь хранятся ваши выполненные задания, оценки учителя и персональный словарь слов.
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setTab('dictionary')}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <span>⭐</span>
              <span>Мой словарь</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('history')}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <span>📊</span>
              <span>Мои задания ({history.length})</span>
            </button>
          </div>
        </div>

        {/* JOIN LIVE CLASSROOM CARD */}
        <div className="bg-white p-6 rounded-3xl border-2 border-indigo-200/90 shadow-sm flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
              <h3 className="font-extrabold text-slate-900 text-sm">
                Войти в онлайн-класс
              </h3>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              Учитель начал урок? Вставьте код комнаты или ссылку сюда:
            </p>
          </div>

          <form onSubmit={handleJoinByCode} className="space-y-2">
            <input
              type="text"
              value={roomCodeInput}
              onChange={e => setRoomCodeInput(e.target.value)}
              placeholder="Код или ссылка комнаты..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-600 rounded-xl text-xs font-bold text-slate-900 outline-none transition"
            />
            <button
              type="submit"
              disabled={!roomCodeInput.trim()}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-xs transition disabled:opacity-40 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>🚀</span>
              <span>Присоединиться к уроку</span>
            </button>
          </form>
        </div>
      </div>

      {/* 2. NAVIGATION TABS */}
      <div className="flex gap-2 p-1.5 bg-white border border-slate-200 rounded-2xl shadow-xs max-w-sm">
        <button
          type="button"
          onClick={() => setTab('dashboard')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-1.5 ${
            tab === 'dashboard' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span>🏠</span>
          <span>Главная</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('history')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-1.5 ${
            tab === 'history' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span>📊</span>
          <span>Задания ({history.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('dictionary')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-1.5 ${
            tab === 'dictionary' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span>⭐</span>
          <span>Словарь</span>
        </button>
      </div>

      {/* TAB: DASHBOARD HOME */}
      {tab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Сдано домашних заданий</span>
              <p className="text-3xl font-extrabold text-indigo-600">{history.length}</p>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Средний балл за работы</span>
              <p className="text-3xl font-extrabold text-emerald-600">
                {history.length > 0
                  ? Math.round(history.reduce((acc, h) => acc + ((h.score / (h.total_questions || 1)) * 100), 0) / history.length)
                  : 0}%
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-extrabold text-slate-900">Недавние задания</h3>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={() => setTab('history')}
                  className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                >
                  Все работы ➔
                </button>
              )}
            </div>

            {loading ? (
              <div className="text-center py-8 text-slate-400 font-bold text-xs">Загрузка...</div>
            ) : history.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center text-xs text-slate-400 font-medium space-y-1">
                <span className="text-2xl block mb-1">📝</span>
                <p className="font-bold text-slate-700">У вас пока нет сданных заданий</p>
                <p>Выполните домашнее задание или пройдите урок с учителем, и результаты появятся здесь.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {history.slice(0, 4).map((hw) => {
                  const total = hw.total_questions || 1;
                  const pct = Math.round((hw.score / total) * 100);
                  return (
                    <div key={hw.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex justify-between items-center gap-3">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md">
                          {hw.lesson_level || 'B1'}
                        </span>
                        <h4 className="font-extrabold text-slate-900 text-sm mt-1">{hw.lesson_title || 'Урок'}</h4>
                        <p className="text-slate-400 text-[11px] mt-0.5">{new Date(hw.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold shrink-0 ${
                        pct >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {hw.score} / {total} ({pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: COMPLETED LESSONS & HOMEWORK */}
      {tab === 'history' && (
        <div className="space-y-4">
          <h3 className="text-lg font-extrabold text-slate-900">Ваши сданные работы и пройденные уроки</h3>
          {history.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-xs text-slate-400">
              У вас пока нет выполненных заданий.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {history.map((hw) => {
                const total = hw.total_questions || 1;
                const pct = Math.round((hw.score / total) * 100);
                return (
                  <div key={hw.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md">
                          {hw.lesson_level || 'B1'}
                        </span>
                        <h4 className="font-extrabold text-slate-900 text-base mt-1.5">
                          {hw.lesson_title || 'Урок'}
                        </h4>
                        <p className="text-slate-400 text-[11px] mt-0.5">
                          Сдано: {new Date(hw.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-extrabold shrink-0 ${
                        pct >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {hw.score} / {total} pts ({pct}%)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenLesson(hw.lesson_id)}
                      className="w-full py-2.5 bg-slate-50 hover:bg-indigo-50 text-indigo-700 font-bold rounded-xl text-xs transition cursor-pointer"
                    >
                      Открыть урок и повторить материалы ➔
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB: PERSONAL DICTIONARY */}
      {tab === 'dictionary' && (
        <DictionaryView onLaunchTrainer={onLaunchVocabTrainer} />
      )}
    </div>
  );
};
