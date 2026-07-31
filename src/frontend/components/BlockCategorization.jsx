import React, { useState } from 'react';

export const BlockCategorization = ({ block, value, onChange }) => {
  const categories = block.categories || ['Категория 1', 'Категория 2'];
  const items = block.items || [];

  const placements = value?.placements || {}; // { itemId: categoryIndex }
  const submitted = value?.submitted || false;
  const [selectedItemId, setSelectedItemId] = useState(null);

  const handleAssignCategory = (catIdx) => {
    if (submitted || !selectedItemId) return;
    const updated = { ...placements, [selectedItemId]: catIdx };
    onChange({ placements: updated, submitted: false });
    setSelectedItemId(null);
  };

  const handleRemoveFromCategory = (itemId) => {
    if (submitted) return;
    const updated = { ...placements };
    delete updated[itemId];
    onChange({ placements: updated, submitted: false });
  };

  const handleSubmit = () => {
    onChange({ placements, submitted: true });
  };

  const handleReset = () => {
    onChange({ placements: {}, submitted: false });
    setSelectedItemId(null);
  };

  const isComplete = Object.keys(placements).length === items.length;
  let correctCount = 0;
  items.forEach(it => {
    if (placements[it.id] === it.categoryIndex) correctCount++;
  });

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
      <h4 className="font-semibold text-lg text-slate-800 mb-2">{block.instruction || '📦 Распределите слова по категориям:'}</h4>
      <p className="text-slate-500 text-xs mb-4">Выберите слово из списка, затем нажмите на нужную категорию. Нажмите на слово в коробке, чтобы убрать его.</p>

      {/* Available Words Pool */}
      <div className="flex flex-wrap gap-2 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200 min-h-16 items-center">
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
                className={`px-3 py-1.5 border rounded-lg text-sm font-medium transition ${isSelected ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' : 'bg-white border-slate-300 hover:border-indigo-400 text-slate-800'}`}
              >
                {it.text}
              </button>
            );
          })
        )}
      </div>

      {/* Category Buckets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {categories.map((catName, catIdx) => (
          <div
            key={catIdx}
            onClick={() => handleAssignCategory(catIdx)}
            className={`p-5 rounded-2xl border-2 transition min-h-40 flex flex-col justify-between ${selectedItemId && !submitted ? 'border-indigo-400 bg-indigo-50/50 hover:bg-indigo-50 cursor-pointer' : 'border-slate-200 bg-slate-50/50'}`}
          >
            <div className="font-bold text-slate-800 text-sm mb-3 flex justify-between items-center">
              <span>📂 {catName}</span>
              {selectedItemId && !submitted && <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full font-normal">Поместить сюда</span>}
            </div>

            {/* Words placed inside this bucket */}
            <div className="flex flex-wrap gap-2">
              {items.filter(it => placements[it.id] === catIdx).map(it => {
                const isItemCorrect = it.categoryIndex === catIdx;
                let tagStyle = "px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition ";
                if (submitted) {
                  tagStyle += isItemCorrect ? "bg-green-100 border-green-400 text-green-900" : "bg-red-100 border-red-400 text-red-900";
                } else {
                  tagStyle += "bg-white border-slate-300 text-slate-800 hover:border-red-300 cursor-pointer";
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

      {/* Control Buttons & Score */}
      {!submitted ? (
        <div className="flex gap-2">
          <button disabled={!isComplete} onClick={handleSubmit} className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl disabled:opacity-50 hover:bg-indigo-700 transition">
            Проверить
          </button>
          <button onClick={handleReset} className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50">
            Сбросить
          </button>
        </div>
      ) : (
        <div className="flex justify-between items-center p-4 bg-slate-100 rounded-xl">
          <div className="text-sm font-bold text-slate-800">
            Правильно распределено: <span className={correctCount === items.length ? 'text-green-600' : 'text-amber-600'}>{correctCount} из {items.length}</span>
          </div>
          <button onClick={handleReset} className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700">
            Попробовать снова 🔄
          </button>
        </div>
      )}
    </div>
  );
};
