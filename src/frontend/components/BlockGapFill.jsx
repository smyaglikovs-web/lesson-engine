import React from 'react';

export const BlockGapFill = ({ block, value, onChange }) => {
  const rawText = block.text || '';
  const lines = rawText.split('\n').filter(line => line.trim().length > 0);
  const submitted = value?.submitted || false;

  const userAnswers = value?.userAnswers || {};

  const handleInputChange = (key, val) => {
    if (submitted) return;
    const updated = { ...userAnswers, [key]: val };
    onChange({ userAnswers: updated, userAnswer: Object.values(updated).join(', '), submitted: false });
  };

  const handleSubmit = () => {
    onChange({ userAnswers, userAnswer: Object.values(userAnswers).join(', '), submitted: true });
  };

  let totalGaps = 0;
  let correctGaps = 0;

  lines.forEach((line, lineIdx) => {
    const parts = line.split(/\[(.*?)\]/);
    for (let i = 1; i < parts.length; i += 2) {
      totalGaps++;
      const key = `${lineIdx}_${i}`;
      const expectedAns = parts[i].trim().toLowerCase();
      const studentAns = (userAnswers[key] || '').trim().toLowerCase();
      if (studentAns === expectedAns) {
        correctGaps++;
      }
    }
  });

  const isAllCorrect = totalGaps > 0 && correctGaps === totalGaps;

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-2xs mb-6 space-y-4">
      {block.instruction && <h5 className="font-extrabold text-slate-800 text-sm leading-snug">{block.instruction}</h5>}

      <div className="space-y-3 font-medium text-slate-800 text-base leading-relaxed">
        {lines.map((line, lineIdx) => {
          const parts = line.split(/\[(.*?)\]/);
          if (parts.length < 3) {
            return <p key={lineIdx} className="text-slate-700">{line}</p>;
          }

          return (
            <div key={lineIdx} className="flex flex-wrap items-center gap-2 py-1 leading-loose">
              {parts.map((segment, segIdx) => {
                // Odd segments are gaps inside brackets
                if (segIdx % 2 === 1) {
                  const key = `${lineIdx}_${segIdx}`;
                  const expectedAns = segment;
                  const studentAns = userAnswers[key] || '';
                  const lineIsCorrect = studentAns.trim().toLowerCase() === expectedAns.trim().toLowerCase();

                  return (
                    <input
                      key={key}
                      type="text"
                      value={studentAns}
                      disabled={submitted}
                      onChange={(e) => handleInputChange(key, e.target.value)}
                      placeholder="введите ответ"
                      className={`border-b-2 outline-none px-3 py-1 font-bold text-center transition min-w-28 text-sm ${
                        submitted
                          ? (lineIsCorrect ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-extrabold' : 'border-rose-500 bg-rose-50 text-rose-900 font-extrabold')
                          : 'border-indigo-500 bg-indigo-50/30 focus:bg-white focus:border-indigo-600 text-slate-900'
                      }`}
                    />
                  );
                }
                return <span key={segIdx}>{segment}</span>;
              })}
            </div>
          );
        })}
      </div>

      {!submitted ? (
        <button
          onClick={handleSubmit}
          className="px-6 py-2.5 bg-indigo-600 text-white font-extrabold rounded-2xl hover:bg-indigo-700 transition shadow-xs text-xs cursor-pointer"
        >
          Проверить
        </button>
      ) : (
        <div className={`p-4 rounded-2xl text-xs font-bold ${isAllCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
          {isAllCorrect ? '🎉 Отлично! Все пропуски заполнены верно.' : `❌ Ошибка (${correctGaps} из ${totalGaps} верно). Проверьте правильные ответы.`}
        </div>
      )}
    </div>
  );
};
