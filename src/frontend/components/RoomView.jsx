import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BlockRenderer } from './BlockRenderer.jsx';
import { triggerConfetti, playVictorySound } from '../utils/sounds.js';

export const RoomView = ({ activeLesson, roomId, isTeacher, onExitRoom }) => {
  // Navigation Indices
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [broadcastSlideIdx, setBroadcastSlideIdx] = useState(0);
  const currentSlideIdxRef = useRef(currentSlideIdx);
  currentSlideIdxRef.current = currentSlideIdx;

  // Student Identity & Progress
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [hasStarted, setHasStarted] = useState(isTeacher);
  const [userAnswers, setUserAnswers] = useState({});
  const [isCompleted, setIsCompleted] = useState(false);

  // Classroom State Telemetry
  const [participants, setParticipants] = useState({});
  const [onlineCount, setOnlineCount] = useState(0);
  const [liveResponses, setLiveResponses] = useState([]);
  const [notepadText, setNotepadText] = useState('');
  const [showNotepad, setShowNotepad] = useState(false);
  const [xpAward, setXpAward] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Determine Homework mode vs Live Room mode
  const isHomeworkMode = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return !isTeacher && (params.has('homework') || params.has('trainer'));
  }, [isTeacher]);

  // Normalize Lesson into atomic slides/pages
  const slides = useMemo(() => {
    if (!activeLesson) return [{ id: 's1', title: 'Introduction', blocks: [] }];
    const rawPages = activeLesson.pages;

    if (Array.isArray(rawPages) && rawPages.length > 0) {
      if (rawPages[0] && rawPages[0].type && !Array.isArray(rawPages[0].blocks)) {
        return [{ id: 's1', title: activeLesson.topic || 'Part 1', blocks: rawPages }];
      }
      return rawPages.map((p, idx) => ({
        id: p.id || `s${idx + 1}`,
        title: p.title || `Part ${idx + 1}`,
        blocks: Array.isArray(p.blocks) ? p.blocks : (Array.isArray(p.items) ? p.items : [])
      }));
    }

    if (Array.isArray(activeLesson.blocks) && activeLesson.blocks.length > 0) {
      return [{ id: 's1', title: activeLesson.topic || 'Part 1', blocks: activeLesson.blocks }];
    }

    return [{ id: 's1', title: 'Part 1', blocks: [] }];
  }, [activeLesson]);

  const totalSlides = slides.length;
  const safeSlideIdx = Math.max(0, Math.min(currentSlideIdx, totalSlides - 1));
  const activeSlide = slides[safeSlideIdx] || { blocks: [] };
  const isSyncNeeded = isTeacher && currentSlideIdx !== broadcastSlideIdx;

  // Initialize Student Session Storage
  useEffect(() => {
    let sId = localStorage.getItem('ls_student_id');
    if (!sId) {
      sId = 'stu_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      localStorage.setItem('ls_student_id', sId);
    }
    setStudentId(sId);

    const savedName = localStorage.getItem(`ls_name_${roomId}`);
    if (savedName) {
      setStudentName(savedName);
      setHasStarted(true);
    }

    const savedAnswers = localStorage.getItem(`ls_ans_${roomId}`);
    if (savedAnswers) {
      try {
        setUserAnswers(JSON.parse(savedAnswers));
      } catch (e) {}
    }
  }, [roomId]);

  // Student Presence Heartbeat
  useEffect(() => {
    if (isTeacher || !roomId || !studentId || !hasStarted) return;

    const pingHeartbeat = () => {
      fetch(`/api/rooms/${roomId}/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, studentName: studentName || 'Student' })
      }).catch(() => {});
    };

    pingHeartbeat();
    const interval = setInterval(pingHeartbeat, 4000);
    return () => clearInterval(interval);
  }, [roomId, studentId, studentName, isTeacher, hasStarted]);

  // Telemetry Polling (Room state & live responses)
  useEffect(() => {
    if (!roomId || isHomeworkMode) return;

    const fetchState = async () => {
      try {
        const res = await fetch(`/api/rooms/${roomId}/state`);
        if (!res.ok) return;
        const data = await res.json();

        setOnlineCount(data.onlineCount || 0);
        setParticipants(data.participants || {});
        setBroadcastSlideIdx(data.broadcastPage ?? 0);
        if (data.notepad !== undefined) setNotepadText(data.notepad);

        // Synchronize student's view when teacher broadcasts
        if (!isTeacher && !isHomeworkMode && typeof data.broadcastPage === 'number') {
          if (data.broadcastPage !== currentSlideIdxRef.current) {
            setCurrentSlideIdx(data.broadcastPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }

        // Aggregate live responses stream for teacher cockpit
        if (isTeacher && data.participants) {
          const stream = [];
          Object.values(data.participants).forEach(p => {
            Object.entries(p.answers || {}).forEach(([bId, ans]) => {
              stream.push({
                student: p.name,
                blockId: bId,
                submitted: ans?.submitted,
                timestamp: p.lastSeen
              });
            });
          });
          setLiveResponses(stream.reverse().slice(0, 8));
        }
      } catch (e) {}
    };

    fetchState();
    const interval = setInterval(fetchState, 1600);
    return () => clearInterval(interval);
  }, [roomId, isTeacher, isHomeworkMode]);

  // Broadcast Slide Position to All Students
  const handleBringEveryoneHere = async (targetIdx = safeSlideIdx) => {
    if (!isTeacher || !roomId) return;
    setBroadcastSlideIdx(targetIdx);
    try {
      await fetch(`/api/rooms/${roomId}/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          broadcastPage: targetIdx,
          teacherPage: targetIdx,
          notepad: notepadText
        })
      });
    } catch (e) {}
  };

  // Student Answers Handler
  const handleAnswerChange = (blockId, newVal) => {
    setUserAnswers(prev => {
      const updated = newVal === null || newVal === undefined 
        ? { ...prev } 
        : { ...prev, [blockId]: newVal };
      if (newVal === null || newVal === undefined) delete updated[blockId];

      try {
        localStorage.setItem(`ls_ans_${roomId}`, JSON.stringify(updated));
      } catch (e) {}

      // Push answer to room session
      if (!isTeacher && roomId && studentId) {
        fetch(`/api/rooms/${roomId}/answer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId, blockId, answer: newVal })
        }).catch(() => {});
      }

      return updated;
    });
  };

  const handleStartSession = () => {
    if (!studentName.trim()) return;
    setHasStarted(true);
    localStorage.setItem(`ls_name_${roomId}`, studentName.trim());
  };

  const handleCopyStudentLink = () => {
    const url = `${window.location.origin}/?room=${roomId}&role=student`;
    navigator.clipboard.writeText(url);
    alert('🔗 Ссылка для учеников скопирована!');
  };

  const handleSaveNotepad = async () => {
    if (!isTeacher || !roomId) return;
    try {
      await fetch(`/api/rooms/${roomId}/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notepad: notepadText })
      });
    } catch (e) {}
  };

  const handleResetRoom = async () => {
    if (!confirm('Сбросить ответы и вернуть урок к 1-му слайду?')) return;
    setUserAnswers({});
    setCurrentSlideIdx(0);
    setBroadcastSlideIdx(0);
    setIsCompleted(false);
    localStorage.removeItem(`ls_ans_${roomId}`);
    if (isTeacher) {
      await fetch(`/api/rooms/${roomId}/reset`, { method: 'POST' }).catch(() => {});
    }
  };

  const handleFinish = async () => {
    if (isTeacher) {
      onExitRoom();
      return;
    }

    // Homework final submission
    try {
      const res = await fetch('/api/homework/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: activeLesson?.id || roomId,
          studentName: studentName || 'Student',
          answers: userAnswers
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        playVictorySound();
        triggerConfetti();
        setIsCompleted(true);
        localStorage.removeItem(`ls_ans_${roomId}`);
      }
    } catch (e) {
      alert('Ошибка при отправке работы');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans -m-4 sm:-m-8">
      {/* ONBOARDING MODAL FOR STUDENT */}
      {!hasStarted && !isTeacher && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl max-w-md w-full text-center space-y-5 shadow-2xl border border-slate-100">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
              👋
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-slate-900">{activeLesson.title}</h3>
              <p className="text-slate-500 text-xs mt-1">Введите ваше имя для входа в класс:</p>
            </div>
            <input
              type="text"
              value={studentName}
              onChange={e => setStudentName(e.target.value)}
              placeholder="Ваше имя..."
              className="w-full px-4 py-3 border border-slate-300 rounded-2xl text-center font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              disabled={!studentName.trim()}
              onClick={handleStartSession}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-sm transition shadow-md disabled:opacity-40 cursor-pointer"
            >
              Войти в урок ➔
            </button>
          </div>
        </div>
      )}

      {/* COMPLETED CELEBRATION */}
      {isCompleted ? (
        <div className="max-w-lg mx-auto my-auto p-10 bg-white rounded-3xl border text-center shadow-xl space-y-4">
          <div className="text-6xl animate-bounce">🎉</div>
          <h2 className="text-3xl font-extrabold text-slate-900">Урок завершён!</h2>
          <p className="text-slate-600 text-sm font-medium">Ваши ответы сохранены и отправлены преподавателю.</p>
          <button
            onClick={() => { setIsCompleted(false); setCurrentSlideIdx(0); }}
            className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl text-xs hover:bg-indigo-700 transition cursor-pointer"
          >
            🔄 Пройти заново
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col md:flex-row min-h-screen">
          
          {/* LEFT SIDEBAR: TEACHER COCKPIT & SLIDE JUMP-LIST */}
          {isTeacher && (
            <aside className={`w-full md:w-72 bg-white border-r border-slate-200 p-5 flex flex-col justify-between shrink-0 space-y-6 ${sidebarOpen ? 'block' : 'hidden md:block'}`}>
              <div className="space-y-5">
                {/* BROADCAST CONTROL */}
                <button
                  onClick={() => handleBringEveryoneHere(safeSlideIdx)}
                  className={`w-full py-3 px-4 rounded-2xl font-extrabold text-xs transition flex items-center justify-center gap-2 shadow-sm cursor-pointer ${
                    isSyncNeeded 
                      ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse' 
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                  title="Синхронизировать всех учеников на текущий слайд"
                >
                  <span>🚀</span>
                  <span>{isSyncNeeded ? `Привести всех на Слайд #${safeSlideIdx + 1}` : 'Все на этом слайде ✓'}</span>
                </button>

                {/* SLIDES JUMP LIST */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <span>Слайды ({totalSlides})</span>
                    <span>Слайд {safeSlideIdx + 1}</span>
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                    {slides.map((s, idx) => {
                      const isTeacherViewing = safeSlideIdx === idx;
                      const isBroadcast = broadcastSlideIdx === idx;

                      let btnStyle = "w-full text-left p-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ";
                      if (isTeacherViewing) {
                        btnStyle += "bg-indigo-50 border border-indigo-200 text-indigo-900 shadow-2xs";
                      } else {
                        btnStyle += "bg-slate-50 border border-transparent text-slate-600 hover:bg-slate-100";
                      }

                      return (
                        <button
                          key={s.id || idx}
                          onClick={() => setCurrentSlideIdx(idx)}
                          className={btnStyle}
                        >
                          <span className="truncate max-w-[170px]">#{idx + 1} {s.title}</span>
                          {isBroadcast && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Ученики видят этот слайд"></span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* CONNECTED ROSTER */}
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <span>Ученики в классе ({onlineCount})</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  </div>

                  <button
                    onClick={handleCopyStudentLink}
                    className="w-full py-2 px-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 text-indigo-700 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    🔗 Скопировать ссылку
                  </button>

                  <div className="max-h-28 overflow-y-auto space-y-1">
                    {Object.keys(participants).length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">Ожидание подключения...</p>
                    ) : (
                      Object.values(participants).map(p => (
                        <div key={p.id} className="flex items-center justify-between text-xs py-1 px-2 bg-slate-50 rounded-lg">
                          <span className="font-bold text-slate-700">{p.name}</span>
                          <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${p.isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'}`}>
                            {p.isOnline ? 'Онлайн' : 'Офлайн'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* LIVE RESPONSES FEED */}
                {liveResponses.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Ответы в реальном времени</span>
                    <div className="space-y-1 max-h-24 overflow-y-auto text-[11px]">
                      {liveResponses.map((r, i) => (
                        <div key={i} className="bg-indigo-50/50 p-1.5 rounded-lg border border-indigo-100 text-slate-700">
                          <strong>{r.student}</strong> ответил на задание
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ACTION FOOTER */}
              <div className="pt-4 border-t border-slate-100 flex gap-2">
                <button
                  onClick={() => setShowNotepad(!showNotepad)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  📝 Блокнот
                </button>
                <button
                  onClick={handleResetRoom}
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold cursor-pointer"
                  title="Сбросить все ответы"
                >
                  🔄
                </button>
              </div>
            </aside>
          )}

          {/* MAIN WORKSPACE CANVAS */}
          <main className="flex-1 flex flex-col justify-between p-4 sm:p-8 max-w-4xl mx-auto w-full">
            <div className="space-y-6">
              
              {/* TOP STATUS BAR */}
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 leading-snug">{activeLesson.title}</h2>
                  <p className="text-xs text-slate-400 font-medium">
                    {isTeacher ? '👨‍🏫 Режим преподавателя' : `🧑‍🎓 Ученик: ${studentName || 'Гость'}`} &bull; Слайд {safeSlideIdx + 1} из {totalSlides}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={onExitRoom}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    ✕ Выйти
                  </button>
                </div>
              </div>

              {/* TEACHER LIVE SCRATCHPAD / NOTEPAD */}
              {isTeacher && showNotepad && (
                <div className="bg-amber-50/90 border border-amber-200 p-4 rounded-2xl space-y-2 shadow-xs animate-fade-in">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold text-amber-950 uppercase tracking-wider">📝 Доска заметок и разбора ошибок (Live Scratchpad)</span>
                    <button onClick={handleSaveNotepad} className="px-3 py-1 bg-amber-600 text-white rounded-lg text-xs font-bold cursor-pointer">Сохранить</button>
                  </div>
                  <textarea
                    rows="3"
                    value={notepadText}
                    onChange={e => setNotepadText(e.target.value)}
                    placeholder="Записывайте сюда новые фразы, исправления ошибок ученика..."
                    className="w-full p-2.5 bg-white border border-amber-300 rounded-xl text-xs font-mono text-slate-800 outline-none"
                  ></textarea>
                </div>
              )}

              {/* ACTIVE SLIDE BLOCKS */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 min-h-[400px]">
                {activeSlide.blocks.length === 0 ? (
                  <div className="text-center py-20 text-slate-400">
                    <span className="text-4xl block mb-2">📄</span>
                    <p className="font-bold">На этом слайде пока нет заданий.</p>
                  </div>
                ) : (
                  activeSlide.blocks.map((b, idx) => {
                    const blockId = b.id || `s${safeSlideIdx}-b${idx}`;
                    return (
                      <BlockRenderer
                        key={blockId}
                        block={{ ...b, id: blockId }}
                        value={userAnswers[blockId]}
                        onChange={val => handleAnswerChange(blockId, val)}
                        isTeacher={isTeacher}
                      />
                    );
                  })
                )}
              </div>

              {/* IN-LESSON GAMIFICATION (TEACHER AWARD XP WIDGET) */}
              {isTeacher && (
                <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⭐</span>
                    <span className="text-xs font-bold text-indigo-950">Наградить баллами XP за ответ на этом слайде:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setXpAward(Math.max(0, xpAward - 1))} className="w-8 h-8 bg-white border rounded-lg font-bold cursor-pointer">-</button>
                    <span className="font-extrabold text-sm px-2 text-indigo-700">{xpAward} XP</span>
                    <button onClick={() => setXpAward(xpAward + 1)} className="w-8 h-8 bg-white border rounded-lg font-bold cursor-pointer">+</button>
                  </div>
                </div>
              )}
            </div>

            {/* BOTTOM SLIDE NAVIGATION CONTROLS */}
            <div className="flex justify-between items-center pt-6">
              <button
                disabled={safeSlideIdx === 0}
                onClick={() => {
                  const prev = Math.max(0, safeSlideIdx - 1);
                  setCurrentSlideIdx(prev);
                  if (isTeacher) handleBringEveryoneHere(prev);
                }}
                className="px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold rounded-2xl text-xs transition disabled:opacity-30 cursor-pointer shadow-2xs"
              >
                ← Назад
              </button>

              {safeSlideIdx < totalSlides - 1 ? (
                <button
                  onClick={() => {
                    const next = Math.min(totalSlides - 1, safeSlideIdx + 1);
                    setCurrentSlideIdx(next);
                    if (isTeacher) handleBringEveryoneHere(next);
                  }}
                  className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-xs transition shadow-md cursor-pointer"
                >
                  Далее →
                </button>
              ) : (
                <button
                  onClick={handleFinish}
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl text-xs transition shadow-md cursor-pointer"
                >
                  {isTeacher ? 'Завершить урок 🎉' : 'Сдать работу 🎉'}
                </button>
              )}
            </div>
          </main>
        </div>
      )}
    </div>
  );
};
