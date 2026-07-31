import React, { useState, useEffect } from 'react';
import { BlockRenderer } from './components/BlockRenderer.jsx';
import { AIPromptsView } from './components/AIPromptsView.jsx';
import { CreateLessonView } from './components/CreateLessonView.jsx';
import { SubmissionsModal } from './components/SubmissionsModal.jsx';

// Default Teacher Password (You can change this)
const TEACHER_PASSWORD = 'teacher123';

export default function App() {
  const [view, setView] = useState('library'); 
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState(null);
  
  // Authentication & Role
  const [isTeacher, setIsTeacher] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);

  // Realtime Room State
  const [roomId, setRoomId] = useState('');
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [isStudentOnline, setIsStudentOnline] = useState(false);
  const [isLessonCompleted, setIsLessonCompleted] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [hasStartedHomework, setHasStartedHomework] = useState(false);
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
    // Check if Teacher is already authenticated in session
    const authSaved = sessionStorage.getItem('teacher_auth') === 'true';
    if (authSaved) setIsAuthenticated(true);

    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    const roleParam = params.get('role');
    const hwParam = params.get('homework');

    // CASE 1: Student Homework Link (?homework=...)
    if (hwParam) {
      setIsTeacher(false);
      setRoomId(hwParam);
      openLesson(hwParam, false, false);
      return;
    }

    // CASE 2: Live Room Link (?room=...)
    if (roomParam) {
      const teacher = roleParam === 'teacher' && authSaved;
      setIsTeacher(teacher);
      setRoomId(roomParam);
      openLesson(roomParam, false, teacher);
      return;
    }

    // CASE 3: Teacher Main Page
    setIsTeacher(true);
    if (authSaved) {
      fetchLessons();
    }
  }, []);

  const handleTeacherLogin = (e) => {
    e.preventDefault();
    if (passwordInput === TEACHER_PASSWORD) {
      sessionStorage.setItem('teacher_auth', 'true');
      setIsAuthenticated(true);
      setIsTeacher(true);
      setLoginError(false);
      fetchLessons();
    } else {
      setLoginError(true);
    }
  };

  const handleTeacherLogout = () => {
    sessionStorage.removeItem('teacher_auth');
    setIsAuthenticated(false);
    setPasswordInput('');
  };

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

        if (data.student_answers && Object.keys(data.student_answers).length > 0) {
          setUserAnswers(prev => {
            const serverStr = JSON.stringify(data.student_answers);
            const prevStr = JSON.stringify(prev);
            return serverStr !== prevStr ? { ...prev, ...data.student_answers } : prev;
          });
        }
      } catch (e) {}
    }, 2000);

    return () => clearInterval(interval);
  }, [view, roomId]);

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
    syncRoomState(newIdx, userAnswers);
  };

  const handleAnswerChange = (blockId, newVal) => {
    const updated = { ...userAnswers, [blockId]: newVal };
    setUserAnswers(updated);
    syncRoomState(currentPageIdx, updated);
  };

  const submitHomework = async () => {
    if (!activeLesson || !studentName.trim()) return alert('Введите ваше имя');
    let score = 0;
    let totalInteractive = 0;

    (activeLesson.pages || []).forEach(page => {
      (page.blocks || []).forEach(b => {
        if (b.type === 'multiple_choice' || b.type === 'gap_fill' || b.type === 'matching') {
          totalInteractive++;
          const ans = userAnswers[b.id];
          if (b.type === 'multiple_choice' && Number(ans?.selected) === Number(b.correct)) score++;
          if (b.type === 'gap_fill' && ans?.submitted) score++;
          if (b.type === 'matching' && ans?.matched?.length === b.pairs?.length) score++;
        }
      });
    });

    try {
      await fetch('/api/homework/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: activeLesson.id,
          studentName,
          score,
          totalQuestions: totalInteractive,
          answers: userAnswers
        })
      });
      setIsLessonCompleted(true);
    } catch (e) {
      alert('Ошибка отправки домашнего задания');
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
      {/* Top Navbar - Only visible for Authenticated Teachers */}
      {isTeacher && isAuthenticated && (
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
              <button onClick={handleTeacherLogout} className="px-3 py-1.5 text-xs text-slate-400 hover:text-red-600 font-bold ml-2">Выход</button>
            </nav>
          </div>
        </header>
      )}

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* TEACHER LOGIN SCREEN (If accessing main page without auth) */}
        {isTeacher && !isAuthenticated && view !== 'room' && (
          <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center space-y-6">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto font-bold text-2xl">🔑</div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">Вход для Учителя</h2>
              <p className="text-slate-500 text-xs mt-1">Введите пароль для доступа к библиотеке и конструктору уроков</p>
            </div>

            <form onSubmit={handleTeacherLogin} className="space-y-4">
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
        )}

        {/* LIBRARY (TEACHER ONLY) */}
        {view === 'library' && isTeacher && isAuthenticated && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Облачная библиотека уроков</h2>
                <p className="text-slate-500 text-sm">Управление интерактивными уроками и результатами учеников</p>
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
                      <button onClick={() => openLesson(l.id)} className="py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition font-bold">Провести урок</button>
                      <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/?homework=${l.id}`); alert('🔗 Ссылка скопирована!'); }} className="py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition">Ссылка на ДЗ 🏠</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CREATE (TEACHER ONLY) */}
        {view === 'create' && isTeacher && isAuthenticated && <CreateLessonView onSaveLesson={handleSaveLesson} onCancel={() => setView('library')} />}

        {/* PROMPTS (TEACHER ONLY) */}
        {view === 'prompts' && isTeacher && isAuthenticated && <AIPromptsView />}

        {/* ROOM / STUDENT HOMEWORK VIEW */}
        {view === 'room' && activeLesson && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* STUDENT NAME PROMPT FOR HOMEWORK */}
            {!isTeacher && !hasStartedHomework && (
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center space-y-4 my-8">
                <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">🏠</div>
                <h3 className="text-2xl font-extrabold text-slate-900">{activeLesson.title}</h3>
                <p className="text-slate-500 text-sm">Введите ваше имя и фамилию для начала выполнения интерактивного урока:</p>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Имя и Фамилия..."
                  className="w-full max-w-sm px-4 py-3 border border-slate-200 rounded-xl text-center text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div>
                  <button
                    disabled={!studentName.trim()}
                    onClick={() => setHasStartedHomework(true)}
                    className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl disabled:opacity-40 hover:bg-indigo-700 shadow-md transition"
                  >
                    Начать выполнение
                  </button>
                </div>
              </div>
            )}

            {(isTeacher || hasStartedHomework) && (
              <>
                {/* CHEERFUL COMPLETION BANNER FOR STUDENT */}
                {isLessonCompleted ? (
                  <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center shadow-xl space-y-4 my-12">
                    <div className="text-6xl animate-bounce">🎉</div>
                    <h2 className="text-3xl font-extrabold text-slate-900">Поздравляем! Урок пройдён!</h2>
                    <p className="text-slate-600 max-w-md mx-auto text-base">
                      Вы отлично поработали и успешно прошли все задания. Ваши результаты сохранены!
                    </p>
                    <div className="pt-4">
                      <div className="inline-block px-6 py-3 bg-emerald-100 text-emerald-800 font-bold rounded-2xl text-sm">
                        ✓ Все материалы выполнены
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
                          <h4 className="font-semibold text-sm">{isTeacher ? '👨‍🏫 Режим Учителя' : `🧑‍🎓 Ученик: ${studentName}`}: {activeLesson.title}</h4>
                          <p className="text-xs text-slate-400">{isTeacher ? (isStudentOnline ? '🟢 Ученик в комнате' : '⚪ Ожидание подключения ученика...') : 'Интерактивный урок'}</p>
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
                    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
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
                    <div className="flex justify-between items-center pt-2">
                      <button disabled={currentPageIdx === 0} onClick={() => handlePageChange(currentPageIdx - 1)} className="px-6 py-3 border rounded-xl font-bold disabled:opacity-30 hover:bg-slate-100 text-sm">← Назад</button>
                      {currentPageIdx < totalPages - 1 ? (
                        <button onClick={() => handlePageChange(currentPageIdx + 1)} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 text-sm shadow-sm">Далее →</button>
                      ) : (
                        <button onClick={isTeacher ? handleFinishLesson : submitHomework} className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 text-sm shadow-md">
                          {isTeacher ? 'Завершить урок 🎉' : 'Сдать ДЗ 🎉'}
                        </button>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {viewSubmissionsLesson && isTeacher && isAuthenticated && <SubmissionsModal lesson={viewSubmissionsLesson} onClose={() => setViewSubmissionsLesson(null)} />}
      </main>
    </div>
  );
}
