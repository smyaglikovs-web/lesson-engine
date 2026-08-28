import React, { useState } from 'react';

export const BlockCategorization = ({ block = {}, value = {}, onChange }) => {
  const categories = block.categories || ['Категория 1', 'Категория 2'];
  const items = Array.isArray(block.items) ? block.items : [];

  const placements = value?.placements || {};
  const submitted = Boolean(value?.submitted);
  const [selectedItemId, setSelectedItemId] = useState(null);

  const handleAssignCategory = (catIdx) => {
    if (submitted || !selectedItemId || !onChange) return;
    const updated = { ...placements, [selectedItemId]: catIdx };
    onChange({ placements: updated, submitted: false });
    setSelectedItemId(null);
  };

  const handleRemoveFromCategory = (itemId) => {
    if (submitted || !onChange) return;
    const updated = { ...placements };
    delete updated[itemId];
    onChange({ placements: updated, submitted: false });
  };

  const handleSubmit = () => {
    if (onChange) onChange({ placements, submitted: true });
  };

  const handleReset = () => {
    if (onChange) onChange({ placements: {}, submitted: false });
    setSelectedItemId(null);
  };

  if (items.length === 0) {
    return null;
  }

  const isComplete = Object.keys(placements).length === items.length;
  let correctCount = 0;
  items.forEach(it => {
    if (placements[it.id] === it.categoryIndex) correctCount++;
  });

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-2xs mb-6 space-y-4">
      <h4 className="font-extrabold text-base sm:text-lg text-slate-800 mb-1">
        {block.instruction || '📦 Распределите слова по категориям:'}
      </h4>
      <p className="text-slate-500 text-xs mb-3">Выберите слово из списка, затем нажмите на нужную категорию. Нажмите на слово в коробке, чтобы убрать его.</p>

      {/* Available Words Pool */}
      <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-200 min-h-14 items-center">
        {items.filter(it => placements[it.id] === undefined).length === 0 ? (
          <span className="text-slate-400 text-xs italic">Все слова распределены по категориям!</span>
        ) : (
          items.map(it => {
            const isAssigned = placements[it.id] !== undefined;
            if (isAssigned) return null;
            const isSelected = selectedItemId === it.id;
            return (
              <button
                key={it.id}
                disabled={submitted}
                onClick={() => setSelectedItemId(isSelected ? null : it.id)}
                className={`px-3.5 py-2 border rounded-xl text-xs font-bold transition cursor-pointer ${isSelected ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' : 'bg-white border-slate-300 hover:border-indigo-400 text-slate-800'}`}
              >
                {it.text}
              </button>
            );
          })
        )}
      </div>

      {/* Category Buckets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
        {categories.map((catName, catIdx) => (
          <div
            key={catIdx}
            onClick={() => handleAssignCategory(catIdx)}
            className={`p-5 rounded-2xl border-2 transition min-h-36 flex flex-col justify-between ${selectedItemId && !submitted ? 'border-indigo-400 bg-indigo-50/50 hover:bg-indigo-50 cursor-pointer' : 'border-slate-200 bg-slate-50/50'}`}
          >
            <div className="font-bold text-slate-800 text-xs sm:text-sm mb-3 flex justify-between items-center">
              <span>📂 {catName}</span>
              {selectedItemId && !submitted && <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-bold">Поместить сюда</span>}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {items.filter(it => placements[it.id] === catIdx).map(it => {
                const isItemCorrect = it.categoryIndex === catIdx;
                let tagStyle = "px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition ";
                if (submitted) {
                  tagStyle += isItemCorrect ? "bg-emerald-100 border-emerald-400 text-emerald-900" : "bg-rose-100 border-rose-400 text-rose-900";
                } else {
                  tagStyle += "bg-white border-slate-300 text-slate-800 hover:border-rose-300 cursor-pointer";
                }

                return (
                  <span
                    key={it.id}
                    onClick={(e) => { e.stopPropagation(); handleRemoveFromCategory(it.id); }}
                    className={tagStyle}
                    title={submitted ? (isItemCorrect ? "Правильная категория" : "Неверная категория") : "Нажмите чтобы убрать"}
                  >
                    {it.text} {submitted ? (isItemCorrect ? '✓' : '❌') : '✕'}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Controls & Feedback */}
      {!submitted ? (
        <div className="flex gap-2 pt-1">
          <button 
            disabled={!isComplete} 
            onClick={handleSubmit} 
            className="px-6 py-2.5 bg-indigo-600 text-white font-extrabold rounded-2xl disabled:opacity-40 hover:bg-indigo-700 transition cursor-pointer text-xs shadow-md"
          >
            Проверить
          </button>
          <button 
            onClick={handleReset} 
            className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-2xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
          >
            Сбросить
          </button>
        </div>
      ) : (
        <div className="flex justify-between items-center p-3.5 bg-slate-100 rounded-2xl">
          <div className="text-xs font-bold text-slate-800">
            Результат: <span className={correctCount === items.length ? 'text-emerald-600 font-extrabold' : 'text-amber-600 font-extrabold'}>{correctCount} из {items.length} верно</span>
          </div>
          <button 
            onClick={handleReset} 
            className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 cursor-pointer"
          >
            Попробовать снова 🔄
          </button>
        </div>
      )}
    </div>
  );
};
