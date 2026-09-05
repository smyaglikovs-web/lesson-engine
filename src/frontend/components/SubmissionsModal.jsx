import React, { useState, useEffect } from 'react';

export const SubmissionsModal = ({ lesson, onClose }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState(null);
  const [fullLesson, setFullLesson] = useState(null);
  const [aiEvaluations, setAiEvaluations] = useState({});
  const [evaluatingBlockId, setEvaluatingBlockId] = useState(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('teacher_jwt');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  const fetchSubmissions = () => {
    setLoading(true);
    fetch('/api/homework/' + lesson.id, { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => { 
        setSubmissions(Array.isArray(data) ? data : []); 
        setLoading(false); 
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchSubmissions();

    // Fetch full lesson to map block IDs to real question titles and choices
    fetch(`/api/lessons/${lesson.id}`)
      .then(res => res.json())
      .then(data => setFullLesson(data))
      .catch(() => {});
  }, [lesson.id]);

  // Index blocks across all lesson pages by ID for instant lookup
  const blockMap = React.useMemo(() => {
    const map = {};
    if (!fullLesson) return map;
    (fullLesson.pages || []).forEach(p => {
      (p.blocks || []).forEach(b => {
        if (b && b.id) map[b.id] = b;
      });
    });
    return map;
  }, [fullLesson]);

  const handleEvaluateOpenInput = async (blockId, prompt, studentText) => {
    setEvaluatingBlockId(blockId);
    try {
      const res = await fetch('/api/homework/evaluate-open-input', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          prompt: prompt || 'Answer the open question:',
          studentText: studentText || '',
          level: lesson.level || 'B1'
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        alert('Ошибка AI оценки: ' + (data.error || 'Попробуйте позже'));
        return;
      }
      setAiEvaluations(prev => ({ ...prev, [blockId]: data }));
    } catch (e) {
      alert('Ошибка соединения при оценке ответа');
    } finally {
      setEvaluatingBlockId(null);
    }
  };

  // Helper to render human-readable review cards for each task
  const renderAnswerCard = (blockId, val, idx, breakdown = {}) => {
    const block = blockMap[blockId] || {};
    const blockBreakdown = breakdown[blockId];
    const isOpenInput = (typeof val === 'object' && val?.text !== undefined) || block.type === 'open_input';
    const isMultipleChoice = (typeof val === 'object' && val?.selected !== undefined) || block.type === 'multiple_choice';

    // 1. OPEN INPUT (WRITING / ESSAY)
    if (isOpenInput) {
      const studentText = typeof val === 'object' ? (val.text || '') : String(val);
      const promptText = block.prompt || 'Письменное задание:';
      const aiEval = aiEvaluations[blockId];

      return (
        <div key={idx} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 shadow-2xs">
          <div className="flex justify-between items-start gap-2">
            <div>
              <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                📝 Письменный ответ
              </span>
              <h5 className="font-extrabold text-slate-800 text-sm mt-1 leading-snug">{promptText}</h5>
            </div>
            <button
              type="button"
              disabled={evaluatingBlockId === blockId}
              onClick={() => handleEvaluateOpenInput(blockId, promptText, studentText)}
              className="px-3 py-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-extrabold rounded-xl text-xs shadow-xs hover:opacity-95 transition cursor-pointer disabled:opacity-40 shrink-0"
            >
              {evaluatingBlockId === blockId ? '⌛ AI оценивает...' : '✨ AI Экспертная оценка'}
            </button>
          </div>

          <div className="p-3.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs font-medium leading-relaxed whitespace-pre-wrap">
            "{studentText || 'Ответ отсутствует'}"
          </div>

          {aiEval && (
            <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-2.5 animate-fade-in">
              <div className="flex justify-between items-center">
                <span className="text-xs font-extrabold text-purple-950 uppercase tracking-wider">
                  ⭐ Оценка: {aiEval.rubricScore} / {aiEval.maxRubric} ({aiEval.cefrEstimate})
                </span>
              </div>
              <p className="text-xs text-purple-900 font-medium leading-relaxed">{aiEval.feedback}</p>
              {aiEval.corrections?.length > 0 && (
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Исправления:</span>
                  {aiEval.corrections.map((corr, ci) => (
                    <p key={ci} className="text-xs text-slate-800 font-mono">&bull; {corr}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    // 2. MULTIPLE CHOICE QUESTION
    if (isMultipleChoice) {
      const selectedIdx = Number(val?.selected);
      const rawOptions = block.options || ['Option A', 'Option B'];
      const options = rawOptions.map(opt => typeof opt === 'object' && opt !== null ? (opt.text || opt.option || JSON.stringify(opt)) : String(opt));
      
      const studentChosenText = options[selectedIdx] || `Вариант #${selectedIdx + 1}`;
      const correctIdx = typeof block.correct === 'number' ? block.correct : 0;
      const correctText = options[correctIdx] || `Вариант #${correctIdx + 1}`;

      const isCorrect = blockBreakdown ? Boolean(blockBreakdown.isFullyCorrect) : (selectedIdx === correctIdx);

      return (
        <div key={idx} className="p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-2xs">
          <div className="flex justify-between items-start gap-2">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                Вопрос #{idx + 1} &bull; Multiple Choice
              </span>
              <h5 className="font-extrabold text-slate-900 text-sm leading-snug">
                {block.question || 'Выберите правильный ответ:'}
              </h5>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold shrink-0 ${
              isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {isCorrect ? '✓ Верно (+1 pt)' : '❌ Неверно (0/1 pt)'}
            </span>
          </div>

          <div className="space-y-1.5 pt-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-bold">Ответ ученика:</span>
              <span className={`font-extrabold px-2 py-0.5 rounded-md ${
                isCorrect ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-rose-50 text-rose-900 border border-rose-200'
              }`}>
                {studentChosenText}
              </span>
            </div>

            {!isCorrect && (
              <div className="flex items-center gap-2 pt-0.5">
                <span className="text-slate-500 font-bold">Правильный ответ:</span>
                <span className="font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  {correctText}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }

    // 3. GAP FILL / WORD BANK / MATCHING / OTHER TASKS
    const isFullyCorrect = blockBreakdown ? Boolean(blockBreakdown.isFullyCorrect) : false;
    const earnedPts = blockBreakdown ? blockBreakdown.earned : 0;
    const maxPts = blockBreakdown ? blockBreakdown.max : 1;

    let summaryText = '';
    if (val?.userAnswers) {
      summaryText = Object.values(val.userAnswers).join(', ');
    } else if (val?.placedSlots) {
      summaryText = Object.values(val.placedSlots).map(s => s?.text).filter(Boolean).join(', ');
    } else if (val?.matched) {
      summaryText = val.matched.map(m => `${m.left} ➔ ${m.right}`).join('; ');
    } else if (val?.sentenceAnswers) {
      summaryText = Object.values(val.sentenceAnswers).map(s => s?.selectedWordObjects?.map(w => w.text).join(' ')).filter(Boolean).join(' | ');
    } else if (typeof val === 'string') {
      summaryText = val;
    } else {
      summaryText = JSON.stringify(val);
    }

    return (
      <div key={idx} className="p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl space-y-2.5 shadow-2xs">
        <div className="flex justify-between items-start gap-2">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              Задание #{idx + 1} &bull; {block.type?.replace(/_/g, ' ') || 'Практика'}
            </span>
            <h5 className="font-extrabold text-slate-900 text-sm leading-snug">
              {block.instruction || block.title || 'Интерактивное упражнение'}
            </h5>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold shrink-0 ${
            isFullyCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
          }`}>
            {earnedPts} / {maxPts} pts
          </span>
        </div>

        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800">
          <span className="text-slate-400 font-bold block mb-1 text-[10px] uppercase tracking-wider">Ответы ученика:</span>
          <p className="font-semibold text-slate-900">{summaryText || 'Пусто'}</p>
        </div>
      </div>
    );
  };

  // Extract parsed submission data safely
  let parsedAnswers = {};
  let breakdownData = {};
  if (selectedSub) {
    try {
      const raw = typeof selectedSub.answers === 'string' ? JSON.parse(selectedSub.answers) : selectedSub.answers;
      if (raw?.userAnswers) {
        parsedAnswers = raw.userAnswers;
        breakdownData = raw.breakdown || {};
      } else {
        parsedAnswers = raw || {};
      }
    } catch (e) {}
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-8 max-h-[88vh] overflow-y-auto shadow-2xl border border-slate-100 space-y-5">
        
        {/* MODAL HEADER */}
        <div className="flex justify-between items-start pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
              Результаты ДЗ: {lesson.title}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Автоматическая проверка тестов и AI-разбор ответов
            </p>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 text-sm font-bold flex items-center justify-center cursor-pointer transition"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 font-medium">Загрузка данных из базы...</div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-semibold bg-slate-50 rounded-2xl border border-slate-200 p-8 space-y-2">
            <span className="text-3xl block mb-2">📋</span>
            <p>Пока никто из учеников не сдал это домашнее задание.</p>
          </div>
        ) : selectedSub ? (
          <div className="space-y-4">
            <button 
              type="button"
              onClick={() => setSelectedSub(null)} 
              className="text-xs text-indigo-600 font-extrabold hover:underline cursor-pointer flex items-center gap-1"
            >
              ← Назад к списку учеников
            </button>

            {/* STUDENT SUMMARY BANNER */}
            <div className="bg-indigo-50/80 p-4 sm:p-5 rounded-2xl border border-indigo-100 flex justify-between items-center gap-3">
              <div>
                <h4 className="font-extrabold text-slate-900 text-base sm:text-lg">{selectedSub.student_name}</h4>
                <p className="text-xs text-slate-500">{new Date(selectedSub.created_at).toLocaleString()}</p>
              </div>
              <span className="px-3.5 py-1.5 bg-indigo-600 text-white font-extrabold text-xs sm:text-sm rounded-full shadow-2xs shrink-0">
                Балл: {selectedSub.score} / {selectedSub.total_questions} pts ({Math.round((selectedSub.score / (selectedSub.total_questions || 1)) * 100)}%)
              </span>
            </div>

            {/* HUMAN-READABLE REVIEW CARDS */}
            <div className="space-y-3.5">
              {Object.entries(parsedAnswers).map(([blockId, val], idx) => 
                renderAnswerCard(blockId, val, idx, breakdownData)
              )}
            </div>
          </div>
        ) : (
          /* SUBMISSIONS DIRECTORY LIST */
          <div className="space-y-2.5">
            {submissions.map(sub => {
              const pct = Math.round((sub.score / (sub.total_questions || 1)) * 100);
              return (
                <div key={sub.id} className="p-4 border border-slate-200 rounded-2xl flex justify-between items-center hover:bg-slate-50 transition gap-2">
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm sm:text-base">{sub.student_name}</h4>
                    <p className="text-xs text-slate-400">{new Date(sub.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`px-2.5 sm:px-3 py-1 font-extrabold text-xs rounded-full ${
                      pct >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {sub.score} / {sub.total_questions} pts ({pct}%)
                    </span>
                    <button 
                      type="button"
                      onClick={() => setSelectedSub(sub)} 
                      className="px-3 sm:px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs rounded-xl transition cursor-pointer"
                    >
                      Просмотр ➔
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
