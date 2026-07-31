import React from 'react';

export const BlockGapFill = ({ block, value, onChange }) => {
  const userAnswer = value?.userAnswer || '';
  const submitted = value?.submitted || false;
  const isCorrect = block.answers?.some(ans => ans.trim().toLowerCase() === userAnswer.trim().toLowerCase());

  const handleSubmit = () => { if (!userAnswer.trim()) return; onChange({ userAnswer, submitted: true }); };

  const parts = block.text ? block.text.split('[') : ['', ''];
  const firstPart = parts[0] || '';
  const secondPart = parts[1] ? parts[1].split(']')[1] || '' : '';

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
      {block.instruction && <p className="text-slate-600 mb-3">{block.instruction}</p>}
      <div className="flex flex-wrap items-center gap-2 text-lg mb-4">
        <span>{firstPart}</span>
        <input
          type="text"
          value={userAnswer}
          disabled={submitted}
          onChange={(e) => onChange({ userAnswer: e.target.value, submitted: false })}
          className={submitted ? (isCorrect ? 'border-b-2 outline-none px-2 py-1 text-center font-medium border-green-500 bg-green-50 text-green-900' : 'border-b-2 outline-none px-2 py-1 text-center font-medium border-red-500 bg-red-50 text-red-900') : 'border-b-2 outline-none px-2 py-1 text-center font-medium border-indigo-500'}
          placeholder="введите ответ"
        />
        <span>{secondPart}</span>
      </div>
      {!submitted ? (
        <button disabled={!userAnswer.trim()} onClick={handleSubmit} className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg disabled:opacity-50">Проверить</button>
      ) : (
        <div className={isCorrect ? 'mt-2 p-3 rounded-lg text-sm bg-green-100 text-green-800' : 'mt-2 p-3 rounded-lg text-sm bg-red-100 text-red-800'}>
          {isCorrect ? 'Отлично!' : ('Правильный ответ: ' + (block.answers?.join(' или ') || ''))}
        </div>
      )}
    </div>
  );
};
