import React, { useState, useEffect } from 'react';

export const SubmissionsModal = ({ lesson, onClose }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState(null);
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
  }, [lesson.id]);

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

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 max-h-[88vh] overflow-y-auto shadow-2xl border border-slate-100 space-y-6">
        <div className="flex justify-between items-start pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Результаты ДЗ: {lesson.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Автоматическая оценка и AI-разбор открытых ответов</p>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 font-medium">Загрузка данных из базы...</div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-semibold bg-slate-50 rounded-2xl border border-slate-200 p-8 space-y-2">
            <span className="text-3xl block mb-2">📋</span>
            <p>Пока никто из учеников не сдал это задание.</p>
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

            <div className="bg-indigo-50/80 p-5 rounded-2xl border border-indigo-100 flex justify-between items-center">
              <div>
                <h4 className="font-extrabold text-slate-900 text-lg">{selectedSub.student_name}</h4>
                <p className="text-xs text-slate-500">{new Date(selectedSub.created_at).toLocaleString()}</p>
              </div>
              <span className="px-3.5 py-1.5 bg-indigo-600 text-white font-extrabold text-xs rounded-full shadow-2xs">
                Балл: {selectedSub.score} / {selectedSub.total_questions} pts ({Math.round((selectedSub.score / (selectedSub.total_questions || 1)) * 100)}%)
              </span>
            </div>

            {/* BLOCK SUBMISSIONS BREAKDOWN */}
            <div className="space-y-4">
              {Object.entries(JSON.parse(selectedSub.answers || "{}")?.userAnswers || JSON.parse(selectedSub.answers || "{}")).map(([blockId, val], idx) => {
                const isOpenInput = typeof val === 'object' && val?.text !== undefined;
                const aiEval = aiEvaluations[blockId];

                if (isOpenInput) {
                  return (
                    <div key={idx} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-[11px] font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
                          📝 Письменный / Устный ответ
                        </span>
                        <button
                          type="button"
                          disabled={evaluatingBlockId === blockId}
                          onClick={() => handleEvaluateOpenInput(blockId, 'Personal reflection', val.text)}
                          className="px-3 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-extrabold rounded-xl text-xs shadow-xs hover:opacity-95 transition cursor-pointer disabled:opacity-40"
                        >
                          {evaluatingBlockId === blockId ? '⌛ AI оценивает...' : '✨ AI Экспертная оценка'}
                        </button>
                      </div>

                      <div className="p-3.5 bg-white border rounded-xl text-slate-900 text-xs font-medium leading-relaxed whitespace-pre-wrap">
                        "{val.text || 'Ответ отсутствует'}"
                      </div>

                      {/* AI EVALUATION CARD */}
                      {aiEval && (
                        <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-2.5 animate-fade-in">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-extrabold text-purple-950 uppercase tracking-wider">
                              ⭐ AI Оценка: {aiEval.rubricScore} / {aiEval.maxRubric} ({aiEval.cefrEstimate})
                            </span>
                          </div>
                          <p className="text-xs text-purple-900 font-medium leading-relaxed">{aiEval.feedback}</p>
                          {aiEval.corrections?.length > 0 && (
                            <div className="space-y-1 pt-1">
                              <span className="text-[10px] font-bold text-rose-700 uppercase">Исправления грамматики:</span>
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

                return (
                  <div key={idx} className="p-3.5 bg-slate-50 border rounded-2xl text-xs space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Задание #{blockId}</span>
                    <pre className="text-slate-800 font-mono text-[11px] whitespace-pre-wrap">{JSON.stringify(val, null, 2)}</pre>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map(sub => {
              const pct = Math.round((sub.score / (sub.total_questions || 1)) * 100);
              return (
                <div key={sub.id} className="p-4 border border-slate-200 rounded-2xl flex justify-between items-center hover:bg-slate-50 transition">
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-base">{sub.student_name}</h4>
                    <p className="text-xs text-slate-400">{new Date(sub.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 font-extrabold text-xs rounded-full ${
                      pct >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {sub.score} / {sub.total_questions} pts ({pct}%)
                    </span>
                    <button 
                      type="button"
                      onClick={() => setSelectedSub(sub)} 
                      className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs rounded-xl transition cursor-pointer"
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
