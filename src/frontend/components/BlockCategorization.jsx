import React, { useState } from 'react';

export const BlockCategorization = ({ block = {}, value = {}, onChange }) => {
  const categories = block.categories || ['Category 1', 'Category 2'];
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

  if (items.length === 0) return null;

  const isComplete = Object.keys(placements).length === items.length;
  let correctCount = 0;
  items.forEach(it => {
    if (placements[it.id] === it.categoryIndex) correctCount++;
  });

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs mb-6 space-y-4">
      {/* CATEGORY BADGE & INSTRUCTION */}
      <div>
        <div className="mb-2.5">
          <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-extrabold text-[11px] uppercase tracking-wider">
            Categorization
          </span>
        </div>
        <h4 className="font-extrabold text-base sm:text-lg text-slate-900 border-l-4 border-indigo-600 pl-3 leading-snug">
          {block.instruction || 'Sort the words into the correct boxes:'}
        </h4>
      </div>

      {/* WORDS POOL */}
      <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-200 min-h-14 items-center">
        {items.filter(it => placements[it.id] === undefined).length === 0 ? (
          <span className="text-slate-400 text-xs italic">All words placed into categories!</span>
        ) : (
          items.map(it => {
            if (placements[it.id] !== undefined) return null;
            const isSelected = selectedItemId === it.id;
            return (
              <button
                key={it.id}
                disabled={submitted}
                onClick={() => setSelectedItemId(isSelected ? null : it.id)}
                className={`px-4 py-2 rounded-full border text-xs font-bold transition cursor-pointer ${
                  isSelected ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' : 'bg-white border-slate-300 hover:border-indigo-400 text-slate-800'
                }`}
              >
                {it.text}
              </button>
            );
          })
        )}
      </div>

      {/* CATEGORY BUCKETS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
        {categories.map((catName, catIdx) => (
          <div
            key={catIdx}
            onClick={() => handleAssignCategory(catIdx)}
            className={`p-5 rounded-2xl border-2 transition min-h-36 flex flex-col justify-between ${
              selectedItemId && !submitted ? 'border-indigo-400 bg-indigo-50/50 hover:bg-indigo-50 cursor-pointer' : 'border-slate-200 bg-slate-50/50'
            }`}
          >
            <div className="font-bold text-slate-800 text-xs sm:text-sm mb-3 flex justify-between items-center">
              <span>📂 {catName}</span>
              {selectedItemId && !submitted && (
                <span className="text-[10px] bg-indigo-600 text-white px-2.5 py-0.5 rounded-full font-bold">Place here</span>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {items.filter(it => placements[it.id] === catIdx).map(it => {
                const isItemCorrect = it.categoryIndex === catIdx;
                let tagStyle = "px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 transition ";
                if (submitted) {
                  tagStyle += isItemCorrect ? "bg-emerald-100 border-emerald-400 text-emerald-900" : "bg-rose-100 border-rose-400 text-rose-900";
                } else {
                  tagStyle += "bg-white border-slate-300 text-slate-800 hover:border-rose-300 cursor-pointer";
                }

                return (
                  <span
                    key={it.id}
                    onClick={e => { e.stopPropagation(); handleRemoveFromCategory(it.id); }}
                    className={tagStyle}
                  >
                    {it.text} {submitted ? (isItemCorrect ? '✓' : '❌') : '✕'}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* CONTROLS */}
      {!submitted ? (
        <div className="flex gap-2 pt-1">
          <button 
            disabled={!isComplete} 
            onClick={handleSubmit} 
            className="px-6 py-2.5 bg-indigo-600 text-white font-extrabold rounded-2xl disabled:opacity-40 hover:bg-indigo-700 transition cursor-pointer text-xs shadow-md"
          >
            Check
          </button>
          <button 
            onClick={handleReset} 
            className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-2xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
          >
            Reset
          </button>
        </div>
      ) : (
        <div className="flex justify-between items-center p-4 bg-slate-100 rounded-2xl text-xs font-bold text-slate-800">
          <span>Result: <strong className="text-indigo-600">{correctCount} of {items.length} points awarded</strong></span>
          <button 
            onClick={handleReset} 
            className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 cursor-pointer"
          >
            Try Again 🔄
          </button>
        </div>
      )}
    </div>
  );
};
