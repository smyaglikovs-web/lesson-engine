import React, { useState, useEffect } from 'react';
import { BlockRenderer } from './components/BlockRenderer.jsx';
import { AIPromptsView } from './components/AIPromptsView.jsx';
import { CreateLessonView } from './components/CreateLessonView.jsx';
import { SubmissionsModal } from './components/SubmissionsModal.jsx';

export default function App() {
  const [view, setView] = useState('library'); 
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState(null);
  
  // Realtime Room State
  const [roomId, setRoomId] = useState('');
  const [isTeacher, setIsTeacher] = useState(true);
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [isStudentOnline, setIsStudentOnline] = useState(false);
  const [isLessonCompleted, setIsLessonCompleted] = useState(false);
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
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    const roleParam = params.get('role');

    if (roomParam) {
      const teacher = roleParam === 'teacher';
      setIsTeacher(teacher);
      setRoomId(roomParam);
      openLesson(roomParam, false, teacher);
    } else {
      fetchLessons();
    }
  }, []);

  const openLesson = async (lessonId, navigate = true, teacherRole = true) => {
    try {
      const res = await fetch(`/api/lessons/${lessonId}`);
      const data = await res.json();
      setActiveLesson(data);
      setRoomId(lessonId);
      setCurrentPageIdx(0);
      setUserAnswers({});
      setIsLessonCompleted(false);
      setView('room');
      if (navigate) {
        window.history.pushState({}, '', `/?room=${lessonId}&role=teacher`);
        setIsTeacher(true);
      } else {
        setIsTeacher(teacherRole);
      }
    } catch (e) {
      alert('Ошибка загрузки урока');
    }
  };

  // Realtime Room Sync
  useEffect(() => {
    if (view !== 'room' || !roomId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/rooms/${roomId}/state`);
        const data = await res.json();
        
        setIsStudentOnline(data.isOnline || false);

        if (!isTeacher && typeof data.page_idx === 'number') {
          setCurrentPageIdx(data.page_idx);
        }

        if (data.student_answers) {
          setUserAnswers(prev => {
            const serverStr = JSON.stringify(data.student_answers);
            const prevStr = JSON.stringify(prev);
            return serverStr !== prevStr ? data.student_answers : prev;
          });
        }
      } catch (e) {}
    }, 1500);

    return () => clearInterval(interval);
  }, [view, roomId, isTeacher]);

  const syncRoomState = async (pageIdx, answers) => {
    if (!roomId) return;
    try {
      await fetch(`/api/rooms/${roomId}/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageIdx, answers })
      });
    } catch (e) {}
  };

  const handlePageChange = (newIdx) => {
    setCurrentPageIdx(newIdx);
    if (isTeacher) syncRoomState(newIdx, userAnswers);
  };

  const handleAnswerChange = (blockId, newVal) => {
    const updated = { ...userAnswers, [blockId]: newVal };
    setUserAnswers(updated);
    syncRoomState(currentPageIdx, updated);
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

  const handleDeleteLesson = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Вы уверены, что хотите удалить этот урок из базы данных?')) return;
    try {
      const res = await fetch('/api/lessons/' + id, { method: 'DELETE' });
      if ((await res.json()).success) {
        fetchLessons();
      }
    } catch (err) {
      alert('Ошибка удаления');
    }
  };

  const handleFinishLesson = () => {
    if (isTeacher) {
      window.history.pushState({}, '', '/');
      setView('library');
    } else {
      setIsLessonCompleted(true);
    }
  };

  const activePage = activeLesson?.pages?.[currentPageIdx] || { blocks: activeLesson?.blocks || [] };
  const totalPages = activeLesson?.pages?.length || 1;

  const copyStudentLink = () => {
    const link = `${window.location.origin}/?room=${roomId}&role=student`;
    navigator.clipboard.writeText(link);
    alert('🔗 Ссылка для УЧЕНИКА скопирована в буфер обмена!');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Top Navbar - Hidden for Students */}
      {isTeacher && (
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
            </nav>
          </div>
        </header>
      )}

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* LIBRARY VIEW */}
        {view === 'library' && isTeacher && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Облачная библиотека уроков</h2>
                <p className="text-slate-500 text-sm">Интерактивные уроки с поддержкой флешкарт, сопоставления и реалтайм-синхронизации</p>
              </div>
              <button onClick={() => setView('create')} className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 shadow-sm">+ Создать урок (JSON)</button>
            </div>

            {loading ? (
              <p className="text-center py-12 text-slate-400">Загрузка из D1...</p>
            ) : lessons.length === 0 ? (
              <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border">Пока нет уроков. Нажмите "+ Создать урок"!</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {lessons.map(l => (
                  <div key={l.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-semibold text-xs rounded-full uppercase">{l.level || 'A2-B1'}</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setViewSubmissionsLesson(l)} className="px-2.5 py-1 text-xs bg-indigo-50 text-indigo-700 font-semibold rounded-lg hover:bg-indigo-100">📊 Ответы ДЗ</button>
                          {/* Restored Delete Button */}
                          <button
                            onClick={(e) => handleDeleteLesson(l.id, e)}
                            className="p-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-bold transition"
                            title="Удалить урок"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">{l.title}</h3>
                      <p className="text-slate-600 text-sm mb-6 line-clamp-2">{l.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                      <button onClick={() => openLesson(l.id)} className="py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition">Провести урок</button>
                      <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/?homework=${l.id}`); alert('🔗 Ссылка скопирована!'); }} className="py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition">Ссылка на ДЗ 🏠</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CREATE VIEW */}
        {view === 'create' && isTeacher && <CreateLessonView onSaveLesson={handleSaveLesson} onCancel={() => setView('library')} />}

        {/* PROMPTS VIEW */}
        {view === 'prompts' && isTeacher && <AIPromptsView />}

        {/* REALTIME ROOM / STUDENT VIEW */}
        {view === 'room' && activeLesson && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* CHEERFUL COMPLETION BANNER FOR STUDENT */}
            {isLessonCompleted ? (
              <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center shadow-xl space-y-4 my-12 animate-fade-in">
                <div className="text-6xl animate-bounce">🎉</div>
                <h2 className="text-3xl font-extrabold text-slate-900">Поздравляем! Урок пройдён!</h2>
                <p className="text-slate-600 max-w-md mx-auto text-base">
                  Вы отлично поработали и успешно прошли все задания уроков. Отличная работа!
                </p>
                <div className="pt-4">
                  <div className="inline-block px-6 py-3 bg-emerald-100 text-emerald-800 font-bold rounded-2xl text-sm">
                    ✓ Все материалы пройдены
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Live Room Bar */}
                <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 shadow-lg">
                  <div className="flex items-center gap-3">
                    <span className={isStudentOnline ? 'w-3 h-3 rounded-full bg-emerald-500 animate-pulse' : 'w-3 h-3 rounded-full bg-slate-500'}></span>
                    <div>
                      <h4 className="font-semibold text-sm">{isTeacher ? '👨‍🏫 Режим Учителя' : '🧑‍🎓 Интерактивный урок'}: {activeLesson.title}</h4>
                      <p className="text-xs text-slate-400">{isTeacher ? (isStudentOnline ? '🟢 Ученик в комнате' : '⚪ Ожидание подключения ученика...') : 'Режим прохождения'}</p>
                    </div>
                  </div>

                  {isTeacher && (
                    <button onClick={copyStudentLink} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-xs font-medium rounded-xl shadow-sm">
                      Скопировать ссылку для ученика 🔗
                    </button>
                  )}
                </div>

                {/* Page Progress Indicator */}
                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-sm font-bold text-slate-700">Страница {currentPageIdx + 1} из {totalPages}: {activePage.title || 'Раздел'}</span>
                  {isTeacher && <button onClick={() => { window.history.pushState({}, '', '/'); setView('library'); }} className="text-xs text-indigo-600 font-bold hover:underline">← Выйти</button>}
                </div>

                {/* Active Page Blocks */}
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                  {(activePage.blocks || []).map((b, idx) => {
                    const uniqueBlockId = b.id || `p${currentPageIdx}-b${idx}`;
                    return (
                      <BlockRenderer
                        key={uniqueBlockId}
                        block={{ ...b, id: uniqueBlockId }}
                        value={userAnswers[uniqueBlockId]}
                        onChange={(val) => handleAnswerChange(uniqueBlockId, val)}
                        isTeacher={isTeacher}
                      />
                    );
                  })}
                </div>

                {/* Page Controls */}
                <div className="flex justify-between items-center">
                  <button disabled={currentPageIdx === 0} onClick={() => handlePageChange(currentPageIdx - 1)} className="px-6 py-2.5 border rounded-xl disabled:opacity-30 hover:bg-slate-100">← Назад</button>
                  {currentPageIdx < totalPages - 1 ? (
                    <button onClick={() => handlePageChange(currentPageIdx + 1)} className="px-8 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700">Далее →</button>
                  ) : (
                    <button onClick={handleFinishLesson} className="px-8 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700">
                      Завершить урок 🎉
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {viewSubmissionsLesson && <SubmissionsModal lesson={viewSubmissionsLesson} onClose={() => setViewSubmissionsLesson(null)} />}
      </main>
    </div>
  );
}
