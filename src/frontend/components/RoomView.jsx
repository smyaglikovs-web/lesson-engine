import React, { useState, useEffect, useRef } from 'react';
import { BlockRenderer } from './BlockRenderer.jsx';
import { triggerConfetti, playVictorySound } from '../utils/sounds.js';

export const RoomView = ({ activeLesson, roomId, isTeacher, onExitRoom }) => {
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const currentPageIdxRef = useRef(currentPageIdx);
  currentPageIdxRef.current = currentPageIdx;

  const [userAnswers, setUserAnswers] = useState({});
  const [isStudentOnline, setIsStudentOnline] = useState(false);
  const [isLessonCompleted, setIsLessonCompleted] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [hasStartedHomework, setHasStartedHomework] = useState(false);

  // AUTO-RESUME: Restore answers & student name from localStorage on refresh
  useEffect(() => {
    if (!roomId) return;
    try {
      const savedName = localStorage.getItem(`student_name_${roomId}`);
      if (savedName) {
        setStudentName(savedName);
        setHasStartedHomework(true);
      }
      const savedAnswers = localStorage.getItem(`student_answers_${roomId}`);
      if (savedAnswers) {
        setUserAnswers(JSON.parse(savedAnswers));
      }
    } catch(e) {}
  }, [roomId]);

  // REALTIME POLLING: Page changes & answer sync
  useEffect(() => {
    if (!roomId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/rooms/${roomId}/state`);
        const data = await res.json();
        
        setIsStudentOnline(data.isOnline || false);

        if (typeof data.page_idx === 'number' && data.page_idx !== currentPageIdxRef.current) {
          setCurrentPageIdx(data.page_idx);
        }

        const serverAnswers = data.student_answers || {};
        setUserAnswers(prev => {
          const serverStr = JSON.stringify(serverAnswers);
          const prevStr = JSON.stringify(prev);
          return serverStr !== prevStr ? serverAnswers : prev;
        });
      } catch (e) {}
    }, 1200);

    return () => clearInterval(interval);
  }, [roomId]);

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
    let updated;
    if (newVal === null || newVal === undefined) {
      updated = { ...userAnswers };
      delete updated[blockId];
    } else {
      updated = { ...userAnswers, [blockId]: newVal };
    }
    setUserAnswers(updated);
    syncRoomState(currentPageIdx, updated);

    // Save to LocalStorage instantly
    try {
      localStorage.setItem(`student_answers_${roomId}`, JSON.stringify(updated));
    } catch(e) {}
  };

  const handleStartHomework = () => {
    if (!studentName.trim()) return;
    setHasStartedHomework(true);
    try {
      localStorage.setItem(`student_name_${roomId}`, studentName.trim());
    } catch(e) {}
  };

  const handleResetWholeLesson = async () => {
    if (!confirm('Вы уверены, что хотите сбросить ВСЕ ответы и начать урок сначала с 1-й страницы?')) return;
    setUserAnswers({});
    setCurrentPageIdx(0);
    setIsLessonCompleted(false);
    try {
      localStorage.removeItem(`student_answers_${roomId}`);
    } catch(e) {}
    await syncRoomState(0, {});
  };

  const submitHomework = async () => {
    if (!activeLesson || !studentName.trim()) return alert('Введите ваше имя');

    try {
      await fetch('/api/homework/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: activeLesson.id,
          studentName,
          answers: userAnswers
        })
      });

      playVictorySound();
      triggerConfetti();
      setIsLessonCompleted(true);
      try {
        localStorage.removeItem(`student_answers_${roomId}`);
      } catch(e) {}
    } catch (e) {
      alert('Ошибка отправки домашнего задания');
    }
  };

  const handleFinishLesson = () => {
    if (isTeacher) {
      onExitRoom();
    } else {
      playVictorySound();
      triggerConfetti();
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
    <div className="max-w-3xl mx-auto space-y-6">
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
              onClick={handleStartHomework}
              className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl disabled:opacity-40 hover:bg-indigo-700 shadow-md transition"
            >
              Начать выполнение
            </button>
          </div>
        </div>
      )}

      {(isTeacher || hasStartedHomework) && (
        <>
          {isLessonCompleted ? (
            <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center shadow-xl space-y-4 my-12">
              <div className="text-6xl animate-bounce">🎉</div>
              <h2 className="text-3xl font-extrabold text-slate-900">Поздравляем! Урок пройдён!</h2>
              <p className="text-slate-600 max-w-md mx-auto text-base">
                Вы отлично поработали и успешно прошли все задания. Ваши результаты сохранены!
              </p>
              <div className="pt-4 flex justify-center gap-3">
                <button onClick={handleResetWholeLesson} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl text-sm hover:bg-indigo-700 shadow-md transition">
                  🔄 Сбросить весь урок заново
                </button>
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

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetWholeLesson}
                    className="px-3.5 py-2 bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition shadow-sm"
                    title="Очистить все ответы и вернуться на 1-ю страницу"
                  >
                    🔄 Сбросить весь урок
                  </button>

                  {isTeacher && (
                    <button onClick={copyStudentLink} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-xs font-medium rounded-xl shadow-sm">
                      Скопировать ссылку 🔗
                    </button>
                  )}
                </div>
              </div>

              {/* Page Progress Indicator */}
              <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-sm font-bold text-slate-700">Страница {currentPageIdx + 1} из {totalPages}: {activePage.title || 'Раздел'}</span>
                {isTeacher && <button onClick={onExitRoom} className="text-xs text-indigo-600 font-bold hover:underline">← Выйти</button>}
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
  );
};
