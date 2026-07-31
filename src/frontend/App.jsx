import React, { useState, useEffect } from 'react';
import { BlockRenderer } from './components/BlockRenderer.jsx';

export default function App() {
  const [view, setView] = useState('library'); // 'library' | 'lesson' | 'editor'
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [roomId, setRoomId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Editor State
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonLevel, setNewLessonLevel] = useState('A2');
  const [newLessonTopic, setNewLessonTopic] = useState('');
  const [newLessonDesc, setNewLessonDesc] = useState('');
  const [editorBlocks, setEditorBlocks] = useState([]);

  // Load Lessons from D1
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

  // Open a specific lesson
  const openLesson = async (lessonId) => {
    try {
      const res = await fetch(`/api/lessons/${lessonId}`);
      const data = await res.json();
      setActiveLesson(data);
      setUserAnswers({});
      setView('lesson');
      setRoomId('room-' + lessonId);
    } catch (e) {
      alert('Error loading lesson details');
    }
  };

  // Realtime Room Syncing (Polling room state every 3 seconds)
  useEffect(() => {
    if (view !== 'lesson' || !roomId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/rooms/${roomId}/state`);
        const data = await res.json();
        if (data && data.student_answers && Object.keys(data.student_answers).length > 0) {
          setUserAnswers(prev => ({ ...prev, ...data.student_answers }));
        }
      } catch (e) {}
    }, 3000);
    return () => clearInterval(interval);
  }, [view, roomId]);

  // Handle Block Answer Change & Sync to Server
  const handleAnswerChange = async (blockId, answerVal) => {
    const updated = { ...userAnswers, [blockId]: answerVal };
    setUserAnswers(updated);

    if (roomId) {
      setIsSyncing(true);
      try {
        await fetch(`/api/rooms/${roomId}/state`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pageIdx: 0, answers: updated })
        });
      } catch (e) {}
      finally { setIsSyncing(false); }
    }
  };

  // Submit Homework
  const submitHomework = async () => {
    if (!activeLesson) return;
    let score = 0;
    let totalInteractive = 0;

    (activeLesson.blocks || []).forEach(b => {
      if (b.type === 'multiple_choice' || b.type === 'gap_fill' || b.type === 'matching') {
        totalInteractive++;
        const ans = userAnswers[b.id];
        if (b.type === 'multiple_choice' && ans?.selected === b.correct) score++;
        if (b.type === 'gap_fill' && ans?.submitted) score++;
        if (b.type === 'matching' && ans?.matched?.length === b.pairs?.length) score++;
      }
    });

    try {
      const res = await fetch('/api/homework/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: activeLesson.id,
          studentName: studentName || 'Ученик',
          score,
          totalQuestions: totalInteractive,
          answers: userAnswers
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`🎉 Ответы отправлены! Ваш результат: ${score} из ${totalInteractive}`);
      }
    } catch (e) {
      alert('Ошибка при отправке ответов');
    }
  };

  // Save New Custom Lesson in Editor
  const saveCustomLesson = async () => {
    if (!newLessonTitle.trim()) return alert('Введите название урока');
    const lessonData = {
      id: 'lesson-' + Date.now(),
      title: newLessonTitle,
      level: newLessonLevel,
      topic: newLessonTopic,
      description: newLessonDesc,
      blocks: editorBlocks
    };

    try {
      const res = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lessonData)
      });
      if ((await res.json()).success) {
        alert('Урок сохранен!');
        fetchLessons();
        setView('library');
      }
    } catch (e) {
      alert('Ошибка сохранения');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('library')}>
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-sm">L</div>
            <span className="font-bold text-lg text-slate-800">Lesson Engine</span>
          </div>

          <div className="flex items-center gap-3">
            {view === 'library' && (
              <button onClick={() => { setEditorBlocks([]); setView('editor'); }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm shadow transition">
                ✏️ Создать урок
              </button>
            )}
            {view !== 'library' && (
              <button onClick={() => setView('library')} className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-sm transition">
                ← В библиотеку
              </button>
            )}
          </div>
        </div>
      </header>

      {/* VIEW 1: LIBRARY */}
      {view === 'library' && (
        <main className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Интерактивные уроки</h2>
            <span className="text-xs font-semibold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full">
              {lessons.length} {lessons.length === 1 ? 'урок' : 'уроков'} в D1
            </span>
          </div>

          {loading ? (
            <p className="text-slate-400 text-center py-12">Загрузка из Cloudflare D1...</p>
          ) : lessons.length === 0 ? (
            <div className="bg-white p-10 rounded-2xl border text-center shadow-sm">
              <p className="text-slate-500 mb-4">Уроков пока нет.</p>
              <button onClick={() => setView('editor')} className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl shadow">Создать первый урок</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {lessons.map(l => (
                <div key={l.id} onClick={() => openLesson(l.id)} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition cursor-pointer flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full uppercase">{l.level || 'A2'}</span>
                      <span className="text-xs font-medium text-slate-400">{l.topic || 'Общая тема'}</span>
                    </div>
                    <h3 className="font-bold text-xl text-slate-800 mb-2">{l.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed mb-4">{l.description || 'Нажмите, чтобы пройти интерактивный урок.'}</p>
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-indigo-600 font-semibold">
                    <span>Открыть урок →</span>
                    {l.created_at && <span className="text-slate-400 font-normal">{new Date(l.created_at).toLocaleDateString()}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      )}

      {/* VIEW 2: LESSON VIEWER */}
      {view === 'lesson' && activeLesson && (
        <main className="max-w-3xl mx-auto px-4 py-8">
          {/* Sync status & student bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 mb-6 flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>Имя ученика:</span>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Ваше имя"
                className="px-2 py-1 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className={isSyncing ? 'text-amber-600 animate-pulse font-medium' : 'text-emerald-600 font-medium'}>
                {isSyncing ? '🔄 Синхронизация...' : '✓ Синхронизировано'}
              </span>
            </div>
          </div>

          {/* Render Lesson Blocks */}
          <div className="space-y-4">
            {(activeLesson.blocks || []).map((block) => (
              <BlockRenderer
                key={block.id}
                block={block}
                value={userAnswers[block.id]}
                onChange={(val) => handleAnswerChange(block.id, val)}
              />
            ))}
          </div>

          {/* Bottom Action Bar */}
          <div className="mt-8 pt-6 border-t border-slate-200 flex justify-between items-center">
            <button onClick={() => setView('library')} className="px-5 py-2.5 bg-slate-200 text-slate-700 font-medium rounded-xl">
              Завершить
            </button>
            <button onClick={submitHomework} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow">
              Отправить результат 🎉
            </button>
          </div>
        </main>
      )}

      {/* VIEW 3: LESSON EDITOR */}
      {view === 'editor' && (
        <main className="max-w-3xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Конструктор уроков</h2>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 mb-6">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Название урока</label>
              <input type="text" value={newLessonTitle} onChange={e => setNewLessonTitle(e.target.value)} placeholder="например: Present Perfect Practice" className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Уровень</label>
                <select value={newLessonLevel} onChange={e => setNewLessonLevel(e.target.value)} className="w-full p-2.5 border rounded-lg">
                  <option>A1</option><option>A2</option><option>B1</option><option>B2</option><option>C1</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Тема</label>
                <input type="text" value={newLessonTopic} onChange={e => setNewLessonTopic(e.target.value)} placeholder="Travel, Grammar, etc." className="w-full p-2.5 border rounded-lg" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Описание</label>
              <textarea value={newLessonDesc} onChange={e => setNewLessonDesc(e.target.value)} rows="2" placeholder="Краткое описание..." className="w-full p-2.5 border rounded-lg"></textarea>
            </div>
          </div>

          <div className="flex gap-2 mb-6 flex-wrap">
            <button onClick={() => setEditorBlocks([...editorBlocks, { id: 'b-' + Date.now(), type: 'heading', level: 1, text: 'Новый заголовок' }])} className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-xs font-semibold">+ Заголовок</button>
            <button onClick={() => setEditorBlocks([...editorBlocks, { id: 'b-' + Date.now(), type: 'text', text: 'Введите параграф текста...' }])} className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-xs font-semibold">+ Текст</button>
            <button onClick={() => setEditorBlocks([...editorBlocks, { id: 'b-' + Date.now(), type: 'multiple_choice', question: 'Вопрос?', options: ['Вариант A', 'Вариант B'], correct: 0 }])} className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-xs font-semibold">+ Тест (Quiz)</button>
            <button onClick={() => setEditorBlocks([...editorBlocks, { id: 'b-' + Date.now(), type: 'gap_fill', instruction: 'Заполните пропуск:', text: 'Пример [ответ]', answers: ['ответ'] }])} className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-xs font-semibold">+ Вставить пропуск</button>
          </div>

          <div className="space-y-3 mb-6">
            {editorBlocks.map((b, idx) => (
              <div key={b.id} className="p-4 bg-white border rounded-xl flex justify-between items-center text-sm">
                <div><span className="font-bold uppercase text-xs text-indigo-600">[{b.type}]</span> {b.text || b.question || b.title || 'Блок'}</div>
                <button onClick={() => setEditorBlocks(editorBlocks.filter((_, i) => i !== idx))} className="text-red-500 text-xs font-bold">Удалить</button>
              </div>
            ))}
          </div>

          <button onClick={saveCustomLesson} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow">Сохранить урок в D1</button>
        </main>
      )}
    </div>
  );
}
