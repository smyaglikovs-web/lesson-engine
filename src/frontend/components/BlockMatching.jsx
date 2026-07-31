import React, { useState, useMemo } = 'react';

const shuffleArray = (arr) => {
  const res = [...arr];
  for (let i = res.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [res[i], res[j]] = [res[j], res[i]];
  }
  return res;
};

export const BlockMatching = ({ block, value, onChange }) => {
  const matched = value?.matched || [];
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [wrongPair, setWrongPair] = useState(false);

  const rightItems = useMemo(() => {
    return shuffleArray((block.pairs || []).map(p => p.right));
  }, [block.id]);

  const handleLeftClick = (leftText) => { if (matched.some(m => m.left === leftText)) return; setSelectedLeft(leftText); setWrongPair(false); };
  const handleRightClick = (rightText) => {
    if (!selectedLeft || matched.some(m => m.right === rightText)) return;
    const correctPair = block.pairs.find(p => p.left === selectedLeft && p.right === rightText);
    if (correctPair) {
      const newMatched = [...matched, { left: selectedLeft, right: rightText }];
      onChange({ matched: newMatched });
      setSelectedLeft(null);
    } else {
      setWrongPair(true);
      setTimeout(() => setWrongPair(false), 1000);
    }
  };

  const isCompleted = matched.length === (block.pairs?.length || 0);
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
      <h4 className="font-semibold text-lg text-slate-800 mb-4">{block.instruction || 'Соедините пары:'}</h4>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          {block.pairs?.map((p, idx) => {
            const isMatched = matched.some(m => m.left === p.left);
            const isSelected = selectedLeft === p.left;
            let style = "w-full p-3 text-left rounded-lg border font-medium transition text-sm ";
            if (isMatched) style += "bg-green-50 border-green-500 text-green-800 opacity-60";
            else if (isSelected) style += "bg-indigo-50 border-indigo-600 text-indigo-900 shadow-sm";
            else style += "bg-slate-50 border-slate-200 hover:border-indigo-400 text-slate-700";
            return <button key={`${block.id}-left-${idx}`} disabled={isMatched} onClick={() => handleLeftClick(p.left)} className={style}>{p.left} {isMatched && '✓'}</button>;
          })}
        </div>
        <div className="space-y-2">
          {rightItems.map((rightText, idx) => {
            const isMatched = matched.some(m => m.right === rightText);
            let style = "w-full p-3 text-left rounded-lg border font-medium transition text-sm ";
            if (isMatched) style += "bg-green-50 border-green-500 text-green-800 opacity-60";
            else if (wrongPair && selectedLeft) style += "bg-red-50 border-red-300 text-slate-700";
            else style += "bg-slate-50 border-slate-200 hover:border-indigo-400 text-slate-700";
            return <button key={`${block.id}-right-${idx}`} disabled={isMatched} onClick={() => handleRightClick(rightText)} className={style}>{rightText} {isMatched && '✓'}</button>;
          })}
        </div>
      </div>
      {isCompleted && <div className="p-3 bg-green-100 text-green-800 rounded-lg text-sm font-bold text-center">Все пары соединены верно 🎉</div>}
    </div>
  );
};
