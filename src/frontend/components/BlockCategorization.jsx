import React, { useState } from 'react';

export const BlockCategorization = ({ block, value, onChange }) => {
  const categories = block.categories || ['Category 1', 'Category 2'];
  const items = block.items || []; // Array of { id, text, categoryIndex }

  const placements = value?.placements || {}; // { itemId: categoryIndex }
  const [selectedItemId, setSelectedItemId] = useState(null);

  const handleAssignCategory = (catIdx) => {
    if (!selectedItemId) return;
    const updated = { ...placements, [selectedItemId]: catIdx };
    onChange({ placements: updated });
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
      <p className="text-slate-500 text-xs mb-4">Выберите слово из списка, затем нажмите на нужную категорию.</p>

      {/* Words Pool */}
      <div className="flex flex-wrap gap-2 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
        {items.map(it => {
          const isAssigned = placements[it.id] !== undefined;
          const isSelected = selectedItemId === it.id;
          return (
            <button
              key={it.id}
              onClick={() => setSelectedItemId(isSelected ? null : it.id)}
              className={`px-3 py-1.5 border rounded-lg text-sm font-semibold transition ${isAssigned ? 'opacity-40 border-slate-200 bg-slate-100 text-slate-500' : isSelected ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white border-slate-300 hover:border-indigo-400 text-slate-800'}`}
            >
              {it.text} {isAssigned && '✓'}
            </button>
          );
        })}
      </div>

      {/* Category Buckets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {categories.map((catName, catIdx) => (
          <div
            key={catIdx}
            onClick={() => handleAssignCategory(catIdx)}
            className={`p-5 rounded-2xl border-2 transition min-h-36 flex flex-col justify-between cursor-pointer ${selectedItemId ? 'border-indigo-400 bg-indigo-50/50 hover:bg-indigo-50' : 'border-slate-200 bg-slate-50/50'}`}
          >
            <div className="font-bold text-slate-800 text-base mb-3 flex justify-between items-center">
              <span>📂 {catName}</span>
              {selectedItemId && <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full font-normal">Нажмите чтобы поместить сюда</span>}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {items.filter(it => placements[it.id] === catIdx).map(it => (
                <span key={it.id} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 shadow-2xs">
                  {it.text}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {isComplete && (
        <div className={correctCount === items.length ? 'p-3 bg-green-100 text-green-800 rounded-lg text-sm font-bold text-center' : 'p-3 bg-indigo-100 text-indigo-800 rounded-lg text-sm text-center'}>
          Правильно распределено: {correctCount} из {items.length} 🎉
        </div>
      )}
    </div>
  );
};
