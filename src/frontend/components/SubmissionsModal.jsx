import React, { useState, useEffect } from 'react';

const RenderSubmissionBlock = ({ blockId, block, answer }) => {
  if (block?.type === 'open_input' || (answer && answer.text !== undefined)) {
    const studentText = answer?.text || 'Нет ответа';
    const wordCount = studentText.trim() ? studentText.trim().split(' ').filter(Boolean).length : 0;
    return (
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
        <div className="flex justify-between items-start">
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase">📝 Письменный ответ (Open Input)</span>
          <span className="text-xs text-slate-400 font-medium">Слов: {wordCount}</span>
        </div>
        <h5 className="font-bold text-slate-800 text-sm">{block?.prompt || ('Задание #' + blockId)}</h5>
        <div className="p-3 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm whitespace-pre-wrap">{studentText}</div>
      </div>
    );
  }

  if (block?.type === 'multiple_choice' || (answer && answer.selected !== undefined)) {
    const selectedIdx = answer?.selected ?? null;
    const isCorrect = block ? (selectedIdx === block.correct) : false;
    const studentOption = (block && selectedIdx !== null) ? (block.options?.[selectedIdx] || ('Вариант #' + selectedIdx)) : 'Не отвечено';

    return (
      <div className={"p-4 border rounded-xl space-y-2 " + (isCorrect ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200')}>
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-slate-600 uppercase">Тестовый вопрос ({blockId})</span>
          <span className={"text-xs font-bold px-2.5 py-1 rounded-full " + (isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800')}>
            {isCorrect ? 'Верно ✅' : 'Ошибка ❌'}
          </span>
        </div>
        {block && <h5 className="font-bold text-slate-800 text-sm">{block.question}</h5>}
        <p className="text-sm"><strong className="text-slate-500">Ответ ученика:</strong> <span className={isCorrect ? 'text-emerald-700 font-medium' : 'text-rose-700 font-medium'}>{studentOption}</span></p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-50 border rounded-xl">
      <pre className="text-sm font-mono text-slate-800 whitespace-pre-wrap">{JSON.stringify(answer, null, 2)}</pre>
    </div>
  );
};

export const SubmissionsModal = ({ lesson, onClose }) => {
  const [submissions, setSubmissions] = useState([]);
  const [fullLesson, setFullLesson] = useState(lesson);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState(null);

  useEffect(() => {
    fetch('/api/homework/' + lesson.id)
      .then(res => res.json())
      .then(data => { setSubmissions(data); setLoading(false); })
      .catch(() => setLoading(false));

    fetch('/api/lessons/' + lesson.id)
      .then(res => res.json())
      .then(data => { if (data) setFullLesson(data); })
      .catch(() => {});
  }, [lesson.id]);

  const blockMap = {};
  fullLesson?.pages?.forEach(page => {
    page.blocks?.forEach(b => { blockMap[b.id] = b; });
  });

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-start mb-6 pb-4 border-b">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Результаты ДЗ: {fullLesson.title || lesson.title}</h3>
            <p className="text-xs text-slate-500">Сданные домашние работы учеников</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-400">Загрузка ответов...</div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-8 text-slate-400">Пока никто из учеников не сдал это домашнее задание.</div>
        ) : selectedSub ? (
          <div>
            <button onClick={() => setSelectedSub(null)} className="text-xs text-indigo-600 font-semibold mb-4 hover:underline">← Назад к списку учеников</button>
            <div className="bg-indigo-50/70 p-4 rounded-xl mb-6 border border-indigo-100 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-slate-900 text-lg">{selectedSub.student_name}</h4>
                <p className="text-xs text-slate-500">Сдано: {new Date(selectedSub.created_at).toLocaleString()}</p>
              </div>
              <span className="px-3 py-1 bg-indigo-600 text-white font-bold text-xs rounded-full">
                Балл: {selectedSub.score} / {selectedSub.total_questions}
              </span>
            </div>

            <div className="space-y-4">
              {Object.entries(JSON.parse(selectedSub.answers || "{}")).map(([blockId, val], idx) => (
                <RenderSubmissionBlock key={idx} blockId={blockId} block={blockMap[blockId]} answer={val} />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map(sub => (
              <div key={sub.id} className="p-4 border rounded-xl flex justify-between items-center hover:bg-slate-50 transition">
                <div>
                  <h4 className="font-bold text-slate-800">{sub.student_name}</h4>
                  <p className="text-xs text-slate-400">{new Date(sub.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 bg-green-100 text-green-800 font-bold text-xs rounded-full">
                    {sub.score} / {sub.total_questions}
                  </span>
                  <button onClick={() => setSelectedSub(sub)} className="text-xs text-indigo-600 font-semibold hover:underline">Подробнее ➔</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
