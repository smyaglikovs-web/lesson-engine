import React, { useState, useEffect } from 'react';
import { BlockRenderer } from './components/BlockRenderer.jsx';
import { AIPromptsView } from './components/AIPromptsView.jsx';
import { CreateLessonView } from './components/CreateLessonView.jsx';
import { SubmissionsModal } from './components/SubmissionsModal.jsx';

export default function App() {
  const [view, setView] = useState('library'); // 'library' | 'create' | 'prompts' | 'room'
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState(null);
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [viewSubmissionsLesson, setViewSubmissionsLesson] = useState(null);

  const fetchLessons = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/lessons');
      const data = await res.json();
      if (Array.isArray(data)) setLessons(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLessons();
  }, []);

  const openLesson = async (lessonId) => {
    try {
      const res = await fetch(`/api/lessons/${lessonId}`);
      const data = await res.json();
      setActiveLesson(data);
      setCurrentPageIdx(0);
      setUserAnswers({});
      setView('room');
    } catch (e) {
      alert('Ошибка при загрузке урока');
    }
  };

  const handleSaveLesson = async (newLesson) => {
    try {
      const res = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLesson)
      });
      if ((await res.json()).success) {
        alert('🎉 Урок сохранен в D1!');
        fetchLessons();
        setView('library');
      }
    } catch (e) {
      alert('Ошибка сохранения');
    }
  };

  const handleDeleteLesson = async (id) => {
    if (!confirm('Удалить этот урок?')) return;
    await fetch('/api/lessons/' + id, { method: 'DELETE' });
    fetchLessons();
  };

  const handleCopyHomeworkLink = (id) => {
    const link = window.location.origin + '/?homework=' + id;
    navigator.clipboard.writeText(link);
    alert('🔗 Ссылка на ДЗ скопирована в буфер обмена!');
  };

  const activePage = activeLesson?.pages?.[currentPageIdx] || { blocks: activeLesson?.blocks || [] };
  const totalPages = activeLesson?.pages?.length || 1;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('library')}>
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-sm">L</div>
            <span className="font-bold text-lg text-slate-800">Lesson Engine</span>
          </div>

          <nav className="flex items-center gap-1">
            <button onClick={() => setView('library')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${view === 'library' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}>Библиотека</button>
            <button onClick={() => setView('create')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${view === 'create' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}>+ Создать урок</button>
            <button onClick={() => setView('prompts')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${view === 'prompts' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}>💡 AI Промпты</button>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* LIBRARY VIEW */}
        {view === 'library' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Облачная библиотека уроков</h2>
                <p className="text-slate-500 text-sm">Уроки с поддержкой мультистраничности, видео и заданий</p>
              </div>
              <button onClick={() => setView('create')} className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 shadow-sm">+ Создать урок (JSON)</button>
            </div>

            {loading ? (
              <p className="text-center py-12 text-slate-400">Загрузка из Cloudflare D1...</p>
            ) : lessons.length === 0 ? (
              <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border">Пока нет уроков. Нажмите "+ Создать урок"!</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {lessons.map(l => (
                  <div key={l.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-semibold text-xs rounded-full uppercase">{l.level || 'A2-B1'}</span>
                        <div className="flex gap-2">
                          <button onClick={() => setViewSubmissionsLesson(l)} className="px-2.5 py-1 text-xs bg-indigo-50 text-indigo-700 font-semibold rounded-lg hover:bg-indigo-100">📊 Ответы ДЗ</button>
                          <button onClick={() => handleDeleteLesson(l.id)} className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100">🗑️</button>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">{l.title}</h3>
                      <p className="text-slate-600 text-sm mb-6 line-clamp-2">{l.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                      <button onClick={() => openLesson(l.id)} className="py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition">Провести урок</button>
                      <button onClick={() => handleCopyHomeworkLink(l.id)} className="py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition">Ссылка на ДЗ 🏠</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CREATE VIEW */}
        {view === 'create' && <CreateLessonView onSaveLesson={handleSaveLesson} onCancel={() => setView('library')} />}

        {/* PROMPTS VIEW */}
        {view === 'prompts' && <AIPromptsView />}

        {/* ROOM / LESSON VIEW */}
        {view === 'room' && activeLesson && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-sm font-bold text-slate-700">Страница {currentPageIdx + 1} из {totalPages}</span>
              <button onClick={() => setView('library')} className="text-xs text-indigo-600 font-bold hover:underline">← В библиотеку</button>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <h3 className="font-bold text-xs uppercase text-slate-400 border-b pb-2">{activePage.title || 'Раздел урока'}</h3>
              {(activePage.blocks || []).map(b => (
                <BlockRenderer
                  key={b.id}
                  block={b}
                  value={userAnswers[b.id]}
                  onChange={(val) => setUserAnswers({ ...userAnswers, [b.id]: val })}
                />
              ))}
            </div>

            <div className="flex justify-between items-center">
              <button disabled={currentPageIdx === 0} onClick={() => setCurrentPageIdx(currentPageIdx - 1)} className="px-6 py-2.5 border rounded-xl disabled:opacity-30">← Назад</button>
              {currentPageIdx < totalPages - 1 ? (
                <button onClick={() => setCurrentPageIdx(currentPageIdx + 1)} className="px-8 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700">Далее →</button>
              ) : (
                <button onClick={() => { alert('🎉 Урок успешно завершен!'); setView('library'); }} className="px-8 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700">Завершить 🎉</button>
              )}
            </div>
          </div>
        )}

        {/* SUBMISSIONS MODAL */}
        {viewSubmissionsLesson && <SubmissionsModal lesson={viewSubmissionsLesson} onClose={() => setViewSubmissionsLesson(null)} />}
      </main>
    </div>
  );
}
