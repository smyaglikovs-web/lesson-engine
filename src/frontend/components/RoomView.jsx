import React, { useState, useEffect, useRef } from 'react';
import { BlockRenderer } from './BlockRenderer.jsx';
import { triggerConfetti, playVictorySound, playCorrectSound } from '../utils/sounds.js';

// Minimalist Classroom Stage Stopwatch & Countdown Timer
const ClassroomTimer = () => {
  const [secondsLeft, setSecondsLeft] = useState(120);
  const [isActive, setIsActive] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isActive && secondsLeft > 0) {
      timerRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsActive(false);
            playVictorySound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isActive, secondsLeft]);

  const setPreset = (sec) => {
    setIsActive(false);
    setSecondsLeft(sec);
  };

  const formatTime = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-2xl rounded-3xl p-3 transition-all duration-300">
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 rounded-2xl text-xs font-extrabold cursor-pointer transition shadow-2xs"
        >
          <span>⏱️ Таймер</span>
          <span className={`px-2 py-0.5 rounded-lg font-mono ${secondsLeft === 0 ? 'bg-rose-600 text-white animate-pulse' : 'bg-white text-indigo-700'}`}>
            {formatTime(secondsLeft)}
          </span>
        </button>
      ) : (
        <div className="space-y-3 w-56 p-1">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
              ⏱️ Таймер этапа
            </span>
            <button onClick={() => setIsExpanded(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xs p-1">
              ✕
            </button>
          </div>

          <div className={`text-center py-2 font-mono text-3xl font-extrabold rounded-2xl ${secondsLeft === 0 ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-slate-50 text-slate-900'}`}>
            {formatTime(secondsLeft)}
          </div>

          <div className="flex gap-1.5 justify-center">
            <button onClick={() => setPreset(60)} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-xl">1m</button>
            <button onClick={() => setPreset(120)} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-xl">2m</button>
            <button onClick={() => setPreset(180)} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-xl">3m</button>
            <button onClick={() => setPreset(300)} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-xl">5m</button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIsActive(!isActive)}
              className={`flex-1 py-2 text-xs font-extrabold text-white rounded-xl shadow-xs transition ${isActive ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              {isActive ? '⏸ Пауза' : '▶ Старт'}
            </button>
            <button
              onClick={() => { setIsActive(false); setSecondsLeft(120); }}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
            >
              🔄
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const RoomView = ({ activeLesson, roomId, isTeacher, onExitRoom }) => {
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const currentPageIdxRef = useRef(currentPageIdx);
  currentPageIdxRef.current = currentPageIdx;

  const [userAnswers, setUserAnswers] = useState({});
  const [isStudentOnline, setIsStudentOnline] = useState(false);
  const [isLessonCompleted, setIsLessonCompleted] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [hasStartedHomework, setHasStartedHomework] = useState(false);

  const normalizedPages = React.useMemo(() => {
    if (!activeLesson) return [{ id: 'p1', title: 'Part 1', blocks: [] }];

    let rawPages = activeLesson.pages;

    if (Array.isArray(rawPages) && rawPages.length > 0) {
      if (rawPages[0] && rawPages[0].type && !Array.isArray(rawPages[0].blocks)) {
        return [{ id: 'p1', title: activeLesson.topic || activeLesson.title || 'Part 1', blocks: rawPages }];
      }

      return rawPages.map((p, idx) => ({
        id: p.id || `p${idx + 1}`,
        title: p.title || `Part ${idx + 1}`,
        blocks: Array.isArray(p.blocks) ? p.blocks : (Array.isArray(p.items) ? p.items : [])
      }));
    }

    if (Array.isArray(activeLesson.blocks) && activeLesson.blocks.length > 0) {
      return [{ id: 'p1', title: activeLesson.topic || activeLesson.title || 'Part 1', blocks: activeLesson.blocks }];
    }

    return [{ id: 'p1', title: 'Part 1', blocks: [] }];
  }, [activeLesson]);

  const totalPages = normalizedPages.length;
  const safePageIdx = Math.min(currentPageIdx, totalPages - 1);
  const activePage = normalizedPages[safePageIdx] || { blocks: [] };
  const pageBlocks = activePage.blocks || [];
  const progressPct = Math.round(((safePageIdx + 1) / totalPages) * 100);

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
    } catch (e) {}
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/rooms/${roomId}/state`);
        const data = await res.json();
        
        setIsStudentOnline(data.isOnline || false);

        if (!isTeacher && typeof data.page_idx === 'number' && data.page_idx !== currentPageIdxRef.current) {
          setCurrentPageIdx(data.page_idx);
        }

        const serverAnswers = data.student_answers;
        if (serverAnswers && Object.keys(serverAnswers).length > 0) {
          setUserAnswers(prev => {
            const merged = { ...prev };
            Object.keys(serverAnswers).forEach(bId => {
              const localAns = prev[bId];
              const srvAns = serverAnswers[bId];
              if (localAns && localAns.submitted && !srvAns?.submitted) {
                merged[bId] = localAns;
              } else {
                merged[bId] = srvAns;
              }
            });
            return merged;
          });
        }
      } catch (e) {}
    }, 1500);

    return () => clearInterval(interval);
  }, [roomId, isTeacher]);

  const syncRoomState = async (pageIdx, answers) => {
    if (!roomId || !isTeacher) return;
    try {
      await fetch(`/api/rooms/${roomId}/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageIdx, answers })
      });
    } catch (e) {}
  };

  const handlePageChange = (newIdx) => {
    const safeIdx = Math.max(0, Math.min(newIdx, totalPages - 1));
    setCurrentPageIdx(safeIdx);
    if (isTeacher) syncRoomState(safeIdx, userAnswers);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAnswerChange = (blockId, newVal) => {
    setUserAnswers(prev => {
      let updated;
      if (newVal === null || newVal === undefined) {
        updated = { ...prev };
        delete updated[blockId];
      } else {
        updated = { ...prev, [blockId]: newVal };
      }

      try {
        localStorage.setItem(`student_answers_${roomId}`, JSON.stringify(updated));
      } catch (e) {}

      if (isTeacher) syncRoomState(safePageIdx, updated);
      return updated;
    });
  };

  const handleStartHomework = () => {
    if (!studentName.trim()) return;
    setHasStartedHomework(true);
    try {
      localStorage.setItem(`student_name_${roomId}`, studentName.trim());
    } catch (e) {}
  };

  const handleResetWholeLesson = async () => {
    if (!confirm('Вы уверены, что хотите сбросить ВСЕ ответы и начать сначала?')) return;
    setUserAnswers({});
    setCurrentPageIdx(0);
    setIsLessonCompleted(false);
    try {
      localStorage.removeItem(`student_answers_${roomId}`);
    } catch (e) {}
    if (isTeacher) await syncRoomState(0, {});
  };

  const submitHomework = async () => {
    const finalStudentName = studentName.trim() || prompt('Введите ваше имя:') || 'Анонимный ученик';

    let score = 0;
    let total = 0;

    normalizedPages.forEach(p => {
      p.blocks?.forEach(b => {
        const studentAns = userAnswers[b.id];

        if (b.type === 'multiple_choice') {
          total++;
          if (studentAns && studentAns.selected !== undefined && Number(studentAns.selected) === Number(b.correct)) score++;
        } else if (b.type === 'gap_fill') {
          total++;
          const rawText = b.text || '';
          const lines = rawText.split('\n').filter(line => line.trim().length > 0);
          let allGapsCorrect = true;
          let foundGaps = 0;

          lines.forEach((line, lineIdx) => {
            const parts = line.split(/\[(.*?)\]/);
            for (let i = 1; i < parts.length; i += 2) {
              foundGaps++;
              const key = `${lineIdx}_${i}`;
              const expectedAns = parts[i].trim().toLowerCase();
              const studentVal = (studentAns?.userAnswers?.[key] || '').trim().toLowerCase();
              if (studentVal !== expectedAns) allGapsCorrect = false;
            }
          });

          if (foundGaps > 0) {
            if (allGapsCorrect) score++;
          } else if (b.answers?.some(a => a.trim().toLowerCase() === String(studentAns?.userAnswer || '').trim().toLowerCase())) {
            score++;
          }
        } else if (b.type === 'gap_fill_bank') {
          total++;
          const placedSlots = studentAns?.placedSlots || {};
          const rawParts = (b.text || '').split(/\[(.*?)\]/);
          const correctAns = rawParts.filter((_, idx) => idx % 2 === 1);
          let allCorrect = correctAns.length > 0;
          correctAns.forEach((ans, idx) => {
            if (placedSlots[idx]?.text?.trim().toLowerCase() !== ans.trim().toLowerCase()) {
              allCorrect = false;
            }
          });
          if (allCorrect && correctAns.length > 0) score++;
        } else if (b.type === 'inline_select') {
          total++;
          if (studentAns?.submitted) score++;
        } else if (b.type === 'matching') {
          total++;
          const matched = studentAns?.matched || [];
          if (matched.length === (b.pairs?.length || 0)) score++;
        } else if (b.type === 'sentence_reorder') {
          total++;
          const userSentence = (studentAns?.selectedWordObjects || []).map(w => w.text).join(' ');
          if (userSentence.trim().toLowerCase() === (b.sentence || '').trim().toLowerCase()) score++;
        } else if (b.type === 'categorization') {
          total++;
          const placements = studentAns?.placements || {};
          let allCorrect = (b.items || []).length > 0;
          (b.items || []).forEach(it => {
            if (placements[it.id] !== it.categoryIndex) allCorrect = false;
          });
          if (allCorrect) score++;
        }
      });
    });

    try {
      const targetLessonId = activeLesson?.id || roomId;
      const res = await fetch('/api/homework/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: targetLessonId,
          studentName: finalStudentName,
          score,
          totalQuestions: total > 0 ? total : 1,
          answers: userAnswers
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        playVictorySound();
        triggerConfetti();
        setIsLessonCompleted(true);
        try {
          localStorage.removeItem(`student_answers_${roomId}`);
        } catch (e) {}
      } else {
        alert('Ошибка при сохранении: ' + (data.error || 'Проверьте соединение'));
      }
    } catch (e) {
      alert('Ошибка отправки: ' + e.message);
    }
  };

  const handleFinishLesson = () => {
    if (isTeacher) {
      onExitRoom();
    } else {
      submitHomework();
    }
  };

  const copyStudentLink = () => {
    const link = `${window.location.origin}/?room=${roomId}&role=student`;
    navigator.clipboard.writeText(link);
    alert('🔗 Ссылка для УЧЕНИКА скопирована в буфер обмена!');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 relative">
      <ClassroomTimer />

      {!isTeacher && !hasStartedHomework && (
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl text-center space-y-4 my-8">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto text-3xl font-extrabold">🏠</div>
          <h3 className="text-2xl font-extrabold text-slate-900">{activeLesson.title}</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">Введите ваше имя и фамилию для начала выполнения интерактивного урока:</p>
          <input
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="Имя и Фамилия..."
            className="w-full max-w-sm px-4 py-3.5 bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-600 rounded-2xl text-center text-sm font-bold text-slate-800 outline-none transition"
          />
          <div>
            <button
              disabled={!studentName.trim()}
              onClick={handleStartHomework}
              className="px-8 py-3.5 bg-indigo-600 text-white font-extrabold rounded-2xl disabled:opacity-40 hover:bg-indigo-700 shadow-md transition cursor-pointer text-sm"
            >
              Начать выполнение ➔
            </button>
          </div>
        </div>
      )}

      {(isTeacher || hasStartedHomework) && (
        <>
          {isLessonCompleted ? (
            <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center shadow-xl space-y-4 my-12">
              <div className="text-6xl animate-bounce">🎉</div>
              <h2 className="text-3xl font-extrabold text-slate-900">Поздравляем! Задание сдано!</h2>
              <p className="text-slate-600 max-w-md mx-auto text-base font-medium">
                Вы отлично поработали. Ваши результаты сохранены и переданы преподавателю!
              </p>
              <div className="pt-4 flex justify-center gap-3">
                <button
                  onClick={handleResetWholeLesson}
                  className="px-6 py-3 bg-indigo-600 text-white font-extrabold rounded-2xl text-sm hover:bg-indigo-700 shadow-md transition cursor-pointer"
                >
                  🔄 Пройти заново
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* TOP BAR */}
              <div className="bg-slate-900 text-white p-4 rounded-3xl flex flex-col sm:flex-row justify-between items-center gap-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <span className={isStudentOnline ? 'w-3 h-3 rounded-full bg-emerald-500 animate-pulse' : 'w-3 h-3 rounded-full bg-slate-500'}></span>
                  <div>
                    <h4 className="font-bold text-sm leading-snug">{isTeacher ? '👨‍🏫 Режим Учителя' : `🧑‍🎓 Ученик: ${studentName}`}: {activeLesson.title}</h4>
                    <p className="text-xs text-slate-400">{isTeacher ? (isStudentOnline ? '🟢 Ученик подключен' : '⚪ Ожидание подключения...') : 'Интерактивный класс'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={handleResetWholeLesson}
                    className="px-3.5 py-2 bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-extrabold rounded-xl transition shadow-xs cursor-pointer"
                    title="Очистить все ответы и вернуться на 1-ю страницу"
                  >
                    🔄 Сбросить
                  </button>

                  {isTeacher && (
                    <button onClick={copyStudentLink} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-xs font-extrabold rounded-xl shadow-xs cursor-pointer transition">
                      Скопировать ссылку 🔗
                    </button>
                  )}
                </div>
              </div>

              {/* PROGRESS BAR */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
                <div className="flex justify-between items-center text-xs font-extrabold text-slate-700">
                  <span>Страница {safePageIdx + 1} из {totalPages}: <strong className="text-indigo-600">{activePage.title || 'Раздел'}</strong></span>
                  <span>{progressPct}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${progressPct}%` }}></div>
                </div>
              </div>

              {/* ACTIVE PAGE BLOCKS */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-2xs space-y-6">
                {pageBlocks.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 font-semibold space-y-2">
                    <span className="text-3xl block">📄</span>
                    <p>На этой странице пока нет блоков с упражнениями.</p>
                  </div>
                ) : (
                  pageBlocks.map((b, idx) => {
                    const uniqueBlockId = b.id || `p${safePageIdx}-b${idx}`;
                    return (
                      <BlockRenderer
                        key={uniqueBlockId}
                        block={{ ...b, id: uniqueBlockId }}
                        value={userAnswers[uniqueBlockId]}
                        onChange={(val) => handleAnswerChange(uniqueBlockId, val)}
                        isTeacher={isTeacher}
                      />
                    );
                  })
                )}
              </div>

              {/* PAGE NAVIGATION CONTROLS */}
              <div className="flex justify-between items-center pt-2">
                <button
                  disabled={safePageIdx === 0}
                  onClick={() => handlePageChange(safePageIdx - 1)}
                  className="px-6 py-3 border border-slate-200 text-slate-700 font-extrabold rounded-2xl disabled:opacity-30 hover:bg-slate-100 text-sm transition cursor-pointer"
                >
                  ← Назад
                </button>

                {safePageIdx < totalPages - 1 ? (
                  <button
                    onClick={() => handlePageChange(safePageIdx + 1)}
                    className="px-8 py-3 bg-indigo-600 text-white font-extrabold rounded-2xl hover:bg-indigo-700 text-sm shadow-md transition cursor-pointer"
                  >
                    Далее →
                  </button>
                ) : (
                  <button
                    onClick={isTeacher ? handleFinishLesson : submitHomework}
                    className="px-8 py-3 bg-emerald-600 text-white font-extrabold rounded-2xl hover:bg-emerald-700 text-sm shadow-md transition cursor-pointer"
                  >
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
