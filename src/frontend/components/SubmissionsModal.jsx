import React, { useState, useEffect } from 'react';

const RenderSubmissionBlock = ({ blockId, block, answer }) => {
  if (!answer) {
    return (
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-400 text-xs italic">
        Не отвечено (Блок #{blockId})
      </div>
    );
  }

  // 1. OPEN INPUT (Written Response)
  if (block?.type === 'open_input' || answer.text !== undefined) {
    const studentText = answer.text || 'Нет ответа';
    const wordCount = studentText.trim() ? studentText.trim().split(' ').filter(Boolean).length : 0;
    return (
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
        <div className="flex justify-between items-start">
          <span className="text-[11px] font-extrabold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider">📝 Письменный ответ</span>
          <span className="text-xs text-slate-400 font-semibold">Слов: {wordCount}</span>
        </div>
        <h5 className="font-bold text-slate-800 text-sm leading-snug">{block?.prompt || (`Задание #${blockId}`)}</h5>
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm whitespace-pre-wrap leading-relaxed font-sans">
          {studentText}
        </div>
      </div>
    );
  }

  // 2. MULTIPLE CHOICE
  if (block?.type === 'multiple_choice' || answer.selected !== undefined) {
    const selectedIdx = answer.selected !== undefined ? Number(answer.selected) : null;
    const isCorrect = block ? (selectedIdx === Number(block.correct)) : false;
    const studentOption = (block && selectedIdx !== null) ? (block.options?.[selectedIdx] || (`Вариант #${selectedIdx}`)) : 'Не отвечено';
    const correctOption = block ? block.options?.[block.correct] : null;

    return (
      <div className={`p-4 border rounded-2xl space-y-2 ${isCorrect ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'}`}>
        <div className="flex justify-between items-center">
          <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Тестовый вопрос ({blockId})</span>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
            {isCorrect ? 'Верно ✅' : 'Ошибка ❌'}
          </span>
        </div>
        {block && <h5 className="font-bold text-slate-800 text-sm">{block.question}</h5>}
        <div className="text-xs space-y-1 font-medium">
          <p><strong className="text-slate-500">Ответ ученика:</strong> <span className={isCorrect ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>{studentOption}</span></p>
          {!isCorrect && correctOption && <p><strong className="text-slate-500">Правильный ответ:</strong> <span className="text-emerald-700 font-bold">{correctOption}</span></p>}
        </div>
      </div>
    );
  }

  // 3. GAP FILL (Direct Keyboard Input)
  if (block?.type === 'gap_fill' || answer.userAnswer !== undefined) {
    const userAnswer = answer.userAnswer || '';
    const isCorrect = block ? block.answers?.some(a => a.trim().toLowerCase() === userAnswer.trim().toLowerCase()) : false;

    return (
      <div className={`p-4 border rounded-2xl space-y-2 ${isCorrect ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'}`}>
        <div className="flex justify-between items-center">
          <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Пропуск ({blockId})</span>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
            {isCorrect ? 'Верно ✅' : 'Ошибка ❌'}
          </span>
        </div>
        {block?.text && <p className="text-xs text-slate-700 font-semibold">{block.text}</p>}
        <div className="text-xs space-y-1 font-medium">
          <p><strong className="text-slate-500">Ответ ученика:</strong> <span className={isCorrect ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>{userAnswer || '(пусто)'}</span></p>
          {!isCorrect && block?.answers && <p><strong className="text-slate-500">Правильный ответ:</strong> <span className="text-emerald-700 font-bold">{block.answers?.join(' / ')}</span></p>}
        </div>
      </div>
    );
  }

  // 4. GAP FILL WITH WORD BANK
  if (block?.type === 'gap_fill_bank' || answer.placedSlots !== undefined) {
    const placedSlots = answer.placedSlots || {};
    return (
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
        <span className="text-[11px] font-extrabold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider">🧩 Заполнение пропусков из Банка Слов</span>
        <h5 className="font-bold text-slate-800 text-sm">{block?.instruction || 'Вставленные слова:'}</h5>
        <div className="flex flex-wrap gap-2 text-xs pt-1">
          {Object.entries(placedSlots).map(([slotIdx, wordObj]) => (
            <span key={slotIdx} className="px-3 py-1 bg-white border border-slate-200 rounded-lg font-bold text-indigo-800">
              Пропуск #{Number(slotIdx) + 1}: {wordObj?.text || '—'}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // 5. MATCHING PAIRS
  if (block?.type === 'matching' || answer.matched !== undefined) {
    const matched = answer.matched || [];
    return (
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
        <span className="text-[11px] font-extrabold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider">🔗 Соединенные пары</span>
        <h5 className="font-bold text-slate-800 text-sm">{block?.instruction || 'Пары:'}</h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {matched.map((m, idx) => (
            <div key={idx} className="p-2.5 bg-white border rounded-xl flex justify-between items-center font-medium">
              <span className="text-slate-700">{m.left}</span>
              <span className="text-slate-400">➔</span>
              <span className="text-indigo-700 font-bold">{m.right}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // FALLBACK FOR OTHER TYPES
  return (
    <div className="p-4 bg-slate-50 border rounded-2xl">
      <p className="text-xs font-extrabold text-slate-400 mb-1 uppercase">Задание #{blockId}</p>
      <pre className="text-xs font-mono text-slate-800 whitespace-pre-wrap">{JSON.stringify(answer, null, 2)}</pre>
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
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-100 space-y-6">
        <div className="flex justify-between items-start pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Результаты ДЗ: {fullLesson.title || lesson.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Сданные домашние работы учеников</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer">✕</button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 font-medium">Загрузка ответов...</div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-semibold bg-slate-50/50 rounded-2xl border border-slate-200/80 p-8">
            <span className="text-3xl block mb-2">📋</span>
            Пока никто из учеников не сдал это домашнее задание.
          </div>
        ) : selectedSub ? (
          <div className="space-y-4">
            <button onClick={() => setSelectedSub(null)} className="text-xs text-indigo-600 font-extrabold hover:underline cursor-pointer flex items-center gap-1">
              ← Назад к списку учеников
            </button>

            <div className="bg-indigo-50/80 p-4 rounded-2xl border border-indigo-100 flex justify-between items-center">
              <div>
                <h4 className="font-extrabold text-slate-900 text-lg">{selectedSub.student_name}</h4>
                <p className="text-xs text-slate-500">Сдано: {new Date(selectedSub.created_at).toLocaleString()}</p>
              </div>
              <span className="px-3.5 py-1.5 bg-indigo-600 text-white font-extrabold text-xs rounded-full shadow-2xs">
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
              <div key={sub.id} className="p-4 border border-slate-200/80 rounded-2xl flex justify-between items-center hover:bg-slate-50/80 transition">
                <div>
                  <h4 className="font-extrabold text-slate-800 text-base">{sub.student_name}</h4>
                  <p className="text-xs text-slate-400">{new Date(sub.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-xs rounded-full">
                    {sub.score} / {sub.total_questions}
                  </span>
                  <button onClick={() => setSelectedSub(sub)} className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs rounded-xl transition cursor-pointer">
                    Подробнее ➔
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
