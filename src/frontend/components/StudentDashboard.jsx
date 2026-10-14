import React, { useState, useEffect } from 'react';
import { DictionaryView } from './DictionaryView.jsx';

export const StudentDashboard = ({ onOpenLesson, onLaunchVocabTrainer, onLogout }) => {
  const [tab, setTab] = useState('history'); // 'history' | 'dictionary' | 'lessons'
  const [history, setHistory] = useState([]);
  const [availableLessons, setAvailableLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState('');

  useEffect(() => {
    const sName = localStorage.getItem('ls_student_name') || 'Ученик';
    setStudentName(sName);

    const loadData = async () => {
      setLoading(true);
      try {
        const [histRes, lessonsRes] = await Promise.all([
          fetch(`/api/student/history?studentName=${encodeURIComponent(sName)}`),
          fetch('/api/lessons')
        ]);
        if (histRes.ok) {
          const histData = await histRes.json();
          setHistory(Array.isArray(histData) ? histData : []);
        }
        if (lessonsRes.ok) {
          const lessonsData = await lessonsRes.json();
          setAvailableLessons(Array.isArray(lessonsData) ? lessonsData : []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full min-w-0">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-wider bg-white/20 px-3 py-1 rounded-full">
            Кабинет Ученика
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-2">
            Привет, {studentName}! 👋
          </h1>
          <p className="text-indigo-100 text-xs sm:text-sm mt-1">
            Отслеживайте прогресс, повторяйте пройденные темы и тренируйте сохранённые слова.
          </p>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition cursor-pointer backdrop-blur-xs"
        >
          Сменить профиль ➔
        </button>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex gap-2 p-1.5 bg-white border border-slate-200 rounded-2xl shadow-xs max-w-md">
        <button
          type="button"
          onClick={() => setTab('history')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-1.5 ${
            tab === 'history' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span>📊</span>
          <span>Мои задания ({history.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('dictionary')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-1.5 ${
            tab === 'dictionary' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span>⭐</span>
          <span>Мой словарь</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('lessons')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-1.5 ${
            tab === 'lessons' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span>📚</span>
          <span>Все уроки</span>
        </button>
      </div>

      {/* TAB 1: HOMEWORK HISTORY */}
      {tab === 'history' && (
        <div className="space-y-4">
          <h3 className="text-lg font-extrabold text-slate-900">Сданные домашние работы</h3>
          {loading ? (
            <div className="text-center py-12 text-slate-400 font-bold">Загрузка истории...</div>
          ) : history.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <span className="text-4xl block">📝</span>
              <p className="font-extrabold text-slate-700">У вас пока нет сданных заданий</p>
              <p className="text-slate-400 text-xs">
                Когда вы сдадите домашнее задание или пройдете урок, ваши оценки и баллы появятся здесь.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {history.map((hw) => {
                const total = hw.total_questions || 1;
                const pct = Math.round((hw.score / total) * 100);
                return (
                  <div key={hw.id} className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md">
                          {hw.lesson_level || 'B1'}
                        </span>
                        <h4 className="font-extrabold text-slate-900 text-base mt-1.5">
                          {hw.lesson_title || 'Учебный урок'}
                        </h4>
                        <p className="text-slate-400 text-[11px] mt-0.5">
                          {new Date(hw.created_at).toLocaleDateString()}
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
                      Открыть урок заново ➔
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PERSONAL DICTIONARY */}
      {tab === 'dictionary' && (
        <DictionaryView onLaunchTrainer={onLaunchVocabTrainer} />
      )}

      {/* TAB 3: BROWSE ALL LESSONS */}
      {tab === 'lessons' && (
        <div className="space-y-4">
          <h3 className="text-lg font-extrabold text-slate-900">Доступные уроки для практики</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {availableLessons.map((l) => (
              <div key={l.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-[10px] font-extrabold uppercase bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full">
                    {l.level || 'B1'}
                  </span>
                  <h4 className="font-extrabold text-slate-900 text-base mt-2">{l.title}</h4>
                  <p className="text-slate-500 text-xs mt-1 line-clamp-2">{l.description}</p>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenLesson(l.id)}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs transition cursor-pointer"
                >
                  Пройти урок ➔
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
