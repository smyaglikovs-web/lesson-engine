import React from 'react';

export const BlockReorder = ({ block, value, onChange }) => {
  const targetSentence = block.sentence || '';
  
  // Create word pool with unique IDs to handle duplicate words
  const poolWords = React.useMemo(() => {
    const rawList = block.words && block.words.length > 0 ? block.words : targetSentence.split(' ');
    const list = rawList.map((word, idx) => ({ id: `word-${idx}-${word}`, text: word }));
    
    // Fisher-Yates shuffle algorithm
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }, [block.id, block.sentence, JSON.stringify(block.words)]);

  const selectedWordObjects = value?.selectedWordObjects || [];
  const submitted = value?.submitted || false;

  const userSentence = selectedWordObjects.map(w => w.text).join(' ');
  const isCorrect = userSentence.trim().toLowerCase() === targetSentence.trim().toLowerCase();

  const handleWordClick = (wordObj) => {
    if (submitted) return;
    const newSelected = [...selectedWordObjects, wordObj];
    onChange({ selectedWordObjects: newSelected, submitted: false });
  };

  const handleRemoveWord = (wordObjId) => {
    if (submitted) return;
    const newSelected = selectedWordObjects.filter(w => w.id !== wordObjId);
    onChange({ selectedWordObjects: newSelected, submitted: false });
  };

  const handleReset = () => {
    onChange({ selectedWordObjects: [], submitted: false });
  };

  const handleSubmit = () => {
    if (selectedWordObjects.length === 0) return;
    onChange({ selectedWordObjects, submitted: true });
  };

  const usedIds = selectedWordObjects.map(w => w.id);

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
      <h4 className="font-semibold text-lg text-slate-800 mb-2">{block.instruction || '🧩 Составьте предложение из слов:'}</h4>

      {/* Selected Sentence Box */}
      <div className="min-h-16 p-4 bg-slate-50 border-2 border-dashed border-indigo-200 rounded-xl flex flex-wrap gap-2 items-center mb-4">
        {selectedWordObjects.length === 0 ? (
          <span className="text-slate-400 text-sm italic">Нажимайте на слова ниже, чтобы собрать предложение...</span>
        ) : (
          selectedWordObjects.map((wObj) => (
            <button
              key={`sel-${wObj.id}`}
              disabled={submitted}
              onClick={() => handleRemoveWord(wObj.id)}
              className="px-3 py-1.5 bg-indigo-600 text-white font-semibold rounded-lg text-sm shadow-xs hover:bg-indigo-700 transition cursor-pointer"
            >
              {wObj.text} ✕
            </button>
          ))
        )}
      </div>

      {/* Available Words Pool */}
      <div className="flex flex-wrap gap-2 mb-4">
        {poolWords.map((wObj) => {
          const isUsed = usedIds.includes(wObj.id);

          return (
            <button
              key={`pool-${wObj.id}`}
              disabled={isUsed || submitted}
              onClick={() => handleWordClick(wObj)}
              className={`px-3 py-1.5 border rounded-lg text-sm font-medium transition cursor-pointer ${
                isUsed 
                  ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed' 
                  : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-500 shadow-2xs'
              }`}
            >
              {wObj.text}
            </button>
          );
        })}
      </div>

      {/* Action Buttons & Feedback */}
      {!submitted ? (
        <div className="flex gap-2">
          <button disabled={selectedWordObjects.length === 0} onClick={handleSubmit} className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg disabled:opacity-50 cursor-pointer">Проверить</button>
          <button onClick={handleReset} className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-sm cursor-pointer">Сбросить</button>
        </div>
      ) : (
        <div className={isCorrect ? 'p-3 bg-green-100 text-green-800 rounded-lg text-sm font-bold' : 'p-3 bg-red-100 text-red-800 rounded-lg text-sm'}>
          {isCorrect ? '🎉 Отлично! Предложение составлено верно.' : `❌ Неверно. Правильный вариант: "${targetSentence}"`}
        </div>
      )}
    </div>
  );
};
