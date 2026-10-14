import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { BlockRenderer } from './BlockRenderer.jsx';
import { triggerConfetti, playVictorySound, playReactionSound } from '../utils/sounds.js';
import { FloatingWhiteboard } from './FloatingWhiteboard.jsx';

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

  // UNIFIED LIVE ROOM ANSWERS (SHARED CO-OP STATE FOR TEACHER & STUDENT)
  const [roomAnswers, setRoomAnswers] = useState({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState(null);

  // Classroom State Telemetry
  const [participants, setParticipants] = useState({});
  const [onlineCount, setOnlineCount] = useState(0);
  const [liveResponses, setLiveResponses] = useState([]);
  const [notepadText, setNotepadText] = useState('');
  const [showNotepad, setShowNotepad] = useState(false);
  const [xpAward, setXpAward] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Live Teacher Feedback & Floating Reactions
  const [floatingReactions, setFloatingReactions] = useState([]);
  const lastReactionIdRef = useRef(0);

  // Synchronized Floating Whiteboard
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const lastSeenPublishedAtRef = useRef(0);
  const lastResetEpochRef = useRef(0);

  const [whiteboardState, setWhiteboardState] = useState({
    isOpen: false,
    activeNoteIdx: 0,
    notes: [
      { drawing: '', text: '', mode: 'draw' },
      { drawing: '', text: '', mode: 'draw' },
      { drawing: '', text: '', mode: 'draw' }
    ],
    publishedAt: 0
  });

  const debounceTimersRef = useRef({});

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('teacher_jwt') || localStorage.getItem('auth_jwt');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }, []);

  const isHomeworkMode = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return !isTeacher && (params.has('homework') || params.has('trainer'));
  }, [isTeacher]);

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

  useEffect(() => {
    let sId = localStorage.getItem('ls_student_id');
    if (!sId) {
      sId = 'stu_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      localStorage.setItem('ls_student_id', sId);
    }
    setStudentId(sId);

    const savedName = localStorage.getItem(`ls_name_${roomId}`) || localStorage.getItem('ls_student_name');
    if (savedName) {
      setStudentName(savedName);
      setHasStarted(true);
    }

    const savedAnswers = localStorage.getItem(`ls_ans_${roomId}`);
    if (savedAnswers) {
      try {
        setRoomAnswers(JSON.parse(savedAnswers));
      } catch (e) {}
    }
  }, [roomId]);

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

  // LIVE CO-OP TELEMETRY POLLING (1 SECOND INTERVAL FOR SNAPPY CO-OP)
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

        // SYNC SHARED ROOM ANSWERS (Teacher & Student see identical matches, choices, and mistakes!)
        if (data.sharedAnswers && Object.keys(data.sharedAnswers).length > 0) {
          setRoomAnswers(prev => ({
            ...prev,
            ...data.sharedAnswers
          }));
        }

        // Synchronized reset wipe
        if (!isTeacher && data.resetEpoch) {
          if (lastResetEpochRef.current === 0) {
            lastResetEpochRef.current = data.resetEpoch;
          } else if (data.resetEpoch > lastResetEpochRef.current) {
            lastResetEpochRef.current = data.resetEpoch;
            setRoomAnswers({});
            setIsCompleted(false);
            setCurrentSlideIdx(0);
            localStorage.removeItem(`ls_ans_${roomId}`);
          }
        }

        // Whiteboard auto-sync
        if (data.whiteboard) {
          setWhiteboardState(data.whiteboard);
          if (!isTeacher && data.whiteboard.publishedAt) {
            if (data.whiteboard.publishedAt > lastSeenPublishedAtRef.current) {
              lastSeenPublishedAtRef.current = data.whiteboard.publishedAt;
              setShowWhiteboard(true);
            }
          }
        }

        // Reaction bubbles
        if (data.reaction && data.reaction.id && data.reaction.id !== lastReactionIdRef.current) {
          lastReactionIdRef.current = data.reaction.id;
          const emoji = data.reaction.emoji;
          if (emoji) {
            playReactionSound(emoji);
            const newParticles = Array.from({ length: 5 }).map((_, i) => ({
              id: `${data.reaction.id}-${i}-${Math.random()}`,
              emoji: emoji,
              left: 50 + (Math.random() * 26 - 13),
              delay: i * 0.12,
              scale: 0.85 + Math.random() * 0.4
            }));
            setFloatingReactions(prev => [...prev, ...newParticles]);
            setTimeout(() => {
              setFloatingReactions(prev => prev.filter(p => !p.id.startsWith(String(data.reaction.id))));
            }, 3200);
          }
        }

        // Teacher page broadcast
        if (!isTeacher && !isHomeworkMode && typeof data.broadcastPage === 'number') {
          if (data.broadcastPage !== currentSlideIdxRef.current) {
            setCurrentSlideIdx(data.broadcastPage);
            setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 150);
          }
        }

        // Teacher responses telemetry
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
    const interval = setInterval(fetchState, 1000);
    return () => clearInterval(interval);
  }, [roomId, isTeacher, isHomeworkMode]);

  // LIVE FAST SYNC TO D1
  const syncAnswerToServer = useCallback((blockId, answerVal) => {
    if (!roomId) return;

    if (debounceTimersRef.current[blockId]) {
      clearTimeout(debounceTimersRef.current[blockId]);
    }

    debounceTimersRef.current[blockId] = setTimeout(() => {
      fetch(`/api/rooms/${roomId}/answer`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          studentId: isTeacher ? 'teacher' : studentId,
          blockId,
          answer: answerVal
        })
      }).catch(() => {});
    }, 180);
  }, [roomId, studentId, isTeacher, getAuthHeaders]);

  // UNIFIED ANSWER HANDLER (WORKS FOR TEACHER AND STUDENT IDENTICALLY)
  const handleAnswerChange = (blockId, newVal) => {
    setRoomAnswers(prev => {
      const updated = newVal === null || newVal === undefined 
        ? { ...prev } 
        : { ...prev, [blockId]: newVal };
      if (newVal === null || newVal === undefined) delete updated[blockId];
      try {
        localStorage.setItem(`ls_ans_${roomId}`, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    syncAnswerToServer(blockId, newVal);
  };

  const handleBringEveryoneHere = async (targetIdx = safeSlideIdx) => {
    if (!isTeacher || !roomId) return;
    setBroadcastSlideIdx(targetIdx);
    try {
      await fetch(`/api/rooms/${roomId}/broadcast`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          broadcastPage: targetIdx,
          teacherPage: targetIdx,
          notepad: notepadText
        })
      });
    } catch (e) {}
  };

  const handleSendReaction = async (emoji) => {
    if (!isTeacher || !roomId) return;
    playReactionSound(emoji);

    const reactionPayload = {
      emoji,
      id: Date.now(),
      timestamp: Date.now()
    };

    const newParticles = Array.from({ length: 4 }).map((_, i) => ({
      id: `${reactionPayload.id}-${i}-${Math.random()}`,
      emoji: emoji,
      left: 50 + (Math.random() * 20 - 10),
      delay: i * 0.12,
      scale: 0.9 + Math.random() * 0.3
    }));
    setFloatingReactions(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      setFloatingReactions(prev => prev.filter(p => !p.id.startsWith(String(reactionPayload.id))));
    }, 3200);

    try {
      await fetch(`/api/rooms/${roomId}/broadcast`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reaction: reactionPayload })
      });
    } catch (e) {}
  };

  const handleUpdateWhiteboard = async (updated) => {
    setWhiteboardState(updated);
    if (!isTeacher || !roomId) return;
    try {
      await fetch(`/api/rooms/${roomId}/broadcast`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ whiteboard: updated })
      });
    } catch (e) {}
  };

  const handleStartSession = () => {
    if (!studentName.trim()) return;
    setHasStarted(true);
    localStorage.setItem(`ls_name_${roomId}`, studentName.trim());
    localStorage.setItem('ls_student_name', studentName.trim());
  };

  const handleCopyStudentLink = () => {
    const url = `${window.location.origin}/?room=${roomId}&role=student`;
    navigator.clipboard.writeText(url);
    alert('🔗 Ссылка для учеников скопирована в буфер обмена!');
  };

  const handleSaveNotepad = async () => {
    if (!isTeacher || !roomId) return;
    try {
      await fetch(`/api/rooms/${roomId}/broadcast`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ notepad: notepadText })
      });
    } catch (e) {}
  };

  const handleResetRoom = async () => {
    if (!confirm('Сбросить все ответы и вернуть урок к 1-му слайду для всех участников?')) return;
    setRoomAnswers({});
    setCurrentSlideIdx(0);
    setBroadcastSlideIdx(0);
    setIsCompleted(false);
    setFinalScore(null);
    localStorage.removeItem(`ls_ans_${roomId}`);
    if (isTeacher) {
      await fetch(`/api/rooms/${roomId}/reset`, { 
        method: 'POST',
        headers: getAuthHeaders()
      }).catch(() => {});
    }
  };

  const handleFinish = async () => {
    if (isTeacher) {
      onExitRoom();
      return;
    }

    if (!confirm('Вы уверены, что хотите сдать работу?')) return;

    try {
      const res = await fetch('/api/homework/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: activeLesson?.id || roomId,
          studentName: studentName || 'Student',
          answers: roomAnswers
        })
      });
      const data = await res.json();
      if (res.ok) {
        playVictorySound();
        triggerConfetti();
        if (data.score !== undefined) {
          setFinalScore(data);
        }
        setIsCompleted(true);
        localStorage.removeItem(`ls_ans_${roomId}`);
      }
    } catch (e) {
      alert('Ошибка при отправке работы');
    }
  };

  const renderSidebarContent = () => (
    <>
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => handleBringEveryoneHere(safeSlideIdx)}
          className={`w-full py-3 px-4 rounded-2xl font-extrabold text-xs transition flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
            isSyncNeeded 
              ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse' 
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
          title="Синхронизировать всех учеников на текущий слайд"
        >
          <span>🚀</span>
          <span>{isSyncNeeded ? `Всех на Слайд #${safeSlideIdx + 1}` : 'Все на этом слайде ✓'}</span>
        </button>

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
                  type="button"
                  onClick={() => {
                    setCurrentSlideIdx(idx);
                    setSidebarOpen(false);
                  }}
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

        <div className="space-y-2.5 pt-2 border-t border-slate-100">
          <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            <span>Ученики ({onlineCount})</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>

          <button
            type="button"
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
                  <span className="font-bold text-slate-700 truncate max-w-[120px]">{p.name}</span>
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${p.isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'}`}>
                    {p.isOnline ? 'Онлайн' : 'Офлайн'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex gap-2">
        <button
          type="button"
          onClick={() => { setShowNotepad(!showNotepad); setSidebarOpen(false); }}
          className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
        >
          📝 Заметки
        </button>
        <button
          type="button"
          onClick={handleResetRoom}
          className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold cursor-pointer"
          title="Сбросить все ответы"
        >
          🔄
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans w-full max-w-full overflow-x-hidden relative">
      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0) scale(0.6); opacity: 0; }
          15% { opacity: 1; transform: translateY(-40px) scale(1.15); }
          80% { opacity: 0.9; }
          100% { transform: translateY(-380px) scale(1.3); opacity: 0; }
        }
      `}</style>

      {floatingReactions.map(p => (
        <div
          key={p.id}
          style={{
            left: `${p.left}%`,
            animation: 'floatUp 2.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
            animationDelay: `${p.delay}s`,
            transform: `scale(${p.scale})`
          }}
          className="fixed bottom-16 pointer-events-none z-50 text-4xl sm:text-5xl select-none drop-shadow-md"
        >
          {p.emoji}
        </div>
      ))}

      {showWhiteboard && (
        <FloatingWhiteboard
          isTeacher={isTeacher}
          whiteboardState={whiteboardState}
          onUpdate={handleUpdateWhiteboard}
          onClose={() => setShowWhiteboard(false)}
        />
      )}

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
              type="button"
              disabled={!studentName.trim()}
              onClick={handleStartSession}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-sm transition shadow-md disabled:opacity-40 cursor-pointer"
            >
              Войти в урок ➔
            </button>
          </div>
        </div>
      )}

      {isTeacher && sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" 
            onClick={() => setSidebarOpen(false)} 
          />
          <aside className="relative w-4/5 max-w-xs bg-white h-full p-5 flex flex-col justify-between shadow-2xl overflow-y-auto space-y-6 z-10">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="font-extrabold text-sm text-slate-900">👨‍🏫 Панель Учителя</span>
              <button 
                type="button" 
                onClick={() => setSidebarOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>
            {renderSidebarContent()}
          </aside>
        </div>
      )}

      {isCompleted ? (
        <div className="max-w-lg mx-auto my-auto p-10 bg-white rounded-3xl border text-center shadow-xl space-y-4 m-4">
          <div className="text-6xl animate-bounce">🎉</div>
          <h2 className="text-3xl font-extrabold text-slate-900">Отличная работа!</h2>
          <p className="text-slate-600 text-sm font-medium">Ваши ответы сохранены и отправлены преподавателю.</p>
          
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl my-4 text-center">
            <p className="text-emerald-800 font-bold text-sm">Выполнено заданий: {Object.keys(roomAnswers).length}</p>
            {finalScore?.score !== undefined && (
              <p className="text-2xl font-extrabold text-emerald-600 mt-2">
                Балл: {finalScore.score} / {finalScore.total_questions || '-'}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              type="button"
              onClick={() => { setIsCompleted(false); setCurrentSlideIdx(0); }}
              className="px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-2xl text-xs hover:bg-slate-200 transition cursor-pointer"
            >
              🔄 Просмотреть урок
            </button>
            <button
              type="button"
              onClick={onExitRoom}
              className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl text-xs hover:bg-indigo-700 transition cursor-pointer"
            >
              🏠 На главную
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col md:flex-row min-h-screen w-full min-w-0">
          {isTeacher && (
            <aside className="hidden md:flex w-72 bg-white border-r border-slate-200 p-5 flex-col justify-between shrink-0 space-y-6">
              {renderSidebarContent()}
            </aside>
          )}

          <main className="flex-1 flex flex-col justify-between p-3 sm:p-6 md:p-8 max-w-4xl mx-auto w-full min-w-0 pb-20 sm:pb-24">
            <div className="space-y-4 sm:space-y-6 min-w-0">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {isTeacher && (
                      <button
                        type="button"
                        onClick={() => setSidebarOpen(true)}
                        className="md:hidden px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs rounded-xl flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <span>☰</span>
                      </button>
                    )}
                    <h2 className="text-base sm:text-xl font-extrabold text-slate-900 leading-snug truncate">
                      {activeLesson.title}
                    </h2>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-400 font-medium truncate mt-0.5">
                    {isTeacher ? '👨‍🏫 Преподаватель (Синхронизация активна 🟢)' : `🧑‍🎓 ${studentName || 'Гость'}`} &bull; Слайд {safeSlideIdx + 1} из {totalSlides}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={handleFinish}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl cursor-pointer shadow-md transition"
                  >
                    {isTeacher ? '🏁 Завершить' : '🏁 Сдать работу'}
                  </button>
                  <button
                    type="button"
                    onClick={onExitRoom}
                    className="px-3 sm:px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition"
                  >
                    ✕ Выйти
                  </button>
                </div>
              </div>

              {isTeacher && showNotepad && (
                <div className="bg-amber-50/90 border border-amber-200 p-4 rounded-2xl space-y-2 shadow-xs animate-fade-in">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold text-amber-950 uppercase tracking-wider">📝 Доска заметок</span>
                    <button type="button" onClick={handleSaveNotepad} className="px-3 py-1 bg-amber-600 text-white rounded-lg text-xs font-bold cursor-pointer">Сохранить</button>
                  </div>
                  <textarea
                    rows="3"
                    value={notepadText}
                    onChange={e => setNotepadText(e.target.value)}
                    placeholder="Записывайте новые фразы, исправления ошибок..."
                    className="w-full p-2.5 bg-white border border-amber-300 rounded-xl text-xs font-mono text-slate-800 outline-none"
                  ></textarea>
                </div>
              )}

              {/* SHARED COLLABORATIVE CANVAS: ALL BLOCKS USE UNIFIED roomAnswers */}
              <div className="bg-white p-4 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 min-h-[350px] w-full min-w-0 overflow-x-hidden">
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
                        value={roomAnswers[blockId]}
                        onChange={val => handleAnswerChange(blockId, val)}
                        isTeacher={isTeacher}
                      />
                    );
                  })
                )}
              </div>

              {isTeacher && (
                <div className="bg-indigo-50/70 p-3.5 sm:p-4 rounded-2xl border border-indigo-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⭐</span>
                    <span className="text-xs font-bold text-indigo-950">Наградить баллами XP:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setXpAward(Math.max(0, xpAward - 1))} className="w-7 h-7 bg-white border rounded-lg font-bold cursor-pointer">-</button>
                    <span className="font-extrabold text-sm px-1.5 text-indigo-700">{xpAward} XP</span>
                    <button type="button" onClick={() => setXpAward(xpAward + 1)} className="w-7 h-7 bg-white border rounded-lg font-bold cursor-pointer">+</button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-6 pb-2">
              <button
                type="button"
                disabled={safeSlideIdx === 0}
                onClick={() => {
                  const prev = Math.max(0, safeSlideIdx - 1);
                  setCurrentSlideIdx(prev);
                  if (isTeacher) handleBringEveryoneHere(prev);
                }}
                className="px-5 sm:px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold rounded-2xl text-xs transition disabled:opacity-30 cursor-pointer shadow-2xs"
              >
                ← Назад
              </button>

              <button
                type="button"
                disabled={safeSlideIdx === totalSlides - 1}
                onClick={() => {
                  const next = Math.min(totalSlides - 1, safeSlideIdx + 1);
                  setCurrentSlideIdx(next);
                  if (isTeacher) handleBringEveryoneHere(next);
                }}
                className="px-6 sm:px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-xs transition disabled:opacity-30 shadow-md cursor-pointer"
              >
                Далее →
              </button>
            </div>
          </main>
        </div>
      )}

      {isTeacher && hasStarted && (
        <div className="fixed bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200/90 shadow-2xl flex items-center gap-1.5 select-none animate-fade-in">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-1.5 hidden sm:inline">
            Реакция:
          </span>

          <button
            type="button"
            onClick={() => handleSendReaction('👍')}
            className="w-9 h-9 rounded-full bg-slate-50 hover:bg-indigo-50 hover:scale-115 active:scale-95 transition text-lg flex items-center justify-center cursor-pointer shadow-2xs border border-slate-200/70"
          >
            👍
          </button>
          <button
            type="button"
            onClick={() => handleSendReaction('❤️')}
            className="w-9 h-9 rounded-full bg-slate-50 hover:bg-rose-50 hover:scale-115 active:scale-95 transition text-lg flex items-center justify-center cursor-pointer shadow-2xs border border-slate-200/70"
          >
            ❤️
          </button>
          <button
            type="button"
            onClick={() => handleSendReaction('❓')}
            className="w-9 h-9 rounded-full bg-slate-50 hover:bg-amber-50 hover:scale-115 active:scale-95 transition text-lg flex items-center justify-center cursor-pointer shadow-2xs border border-slate-200/70"
          >
            ❓
          </button>
          <button
            type="button"
            onClick={() => handleSendReaction('❌')}
            className="w-9 h-9 rounded-full bg-slate-50 hover:bg-rose-50 hover:scale-115 active:scale-95 transition text-lg flex items-center justify-center cursor-pointer shadow-2xs border border-slate-200/70"
          >
            ❌
          </button>

          <div className="w-px h-5 bg-slate-200 mx-1" />

          <button
            type="button"
            onClick={() => setShowWhiteboard(!showWhiteboard)}
            className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
              showWhiteboard
                ? 'bg-amber-400 text-amber-950 shadow-xs border border-amber-300'
                : 'bg-slate-100 hover:bg-amber-100 text-slate-700'
            }`}
          >
            <span>📌</span>
            <span className="hidden sm:inline">Доска</span>
          </button>
        </div>
      )}
    </div>
  );
};
