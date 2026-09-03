import React, { useMemo } from 'react';
import { playCorrectSound, playWrongSound } from '../utils/sounds.js';
import { areAnswersEquivalent } from '../../api/homework.js';

export const BlockInlineSelect = ({ block = {}, value = {}, onChange }) => {
  const rawText = block.text || '';
  const lines = useMemo(() => rawText.split('\n').filter(line => line.trim().length > 0), [rawText]);
  const submitted = Boolean(value?.submitted);
  const selections = value?.selections || {};

  const parsedLines = useMemo(() => {
    return lines.map((line, lineIdx) => {
      const cleanedLine = line.replace(/_{2,}\s*\[/g, '[').replace(/-{2,}\s*\[/g, '[');
      const parts = cleanedLine.split(/\[(.*?)\]/);
      const segments = [];

      for (let i = 0; i < parts.length; i++) {
        if (i % 2 === 0) {
          segments.push({ type: 'text', text: parts[i].replace(/_{2,}/g, '').replace(/-{2,}/g, '') });
        } else {
          const rawOptions = parts[i].split('|').map(o => o.trim());
          let correctOption = '';
          const cleanOptions = rawOptions.map(opt => {
            if (opt.endsWith('*')) {
              const clean = opt.slice(0, -1).trim();
              correctOption = clean;
              return clean;
            }
            return opt;
          });

          if (!correctOption && cleanOptions.length > 0) correctOption = cleanOptions[0];

          segments.push({
            type: 'select',
            gapKey: `${lineIdx}_${i}`,
            options: cleanOptions,
            correct: correctOption
          });
        }
      }
      return segments;
    });
  }, [lines]);

  let totalGaps = 0;
  let correctCount = 0;

  parsedLines.forEach(lineSegments => {
    lineSegments.forEach(seg => {
      if (seg.type === 'select') {
        totalGaps++;
        const studentPick = selections[seg.gapKey];
        if (studentPick && areAnswersEquivalent(studentPick, seg.correct)) {
          correctCount++;
        }
      }
    });
  });

  const allFilled = parsedLines
    .flatMap(line => line.filter(seg => seg.type === 'select'))
    .every(seg => Boolean(selections[seg.gapKey]));

  const handleSelectChange = (gapKey, chosenVal) => {
    if (submitted || !onChange) return;
    const updated = { ...selections, [gapKey]: chosenVal };
    onChange({ selections: updated, submitted: false });
  };

  const handleSubmit = () => {
    if (!allFilled || !onChange) return;
    if (correctCount === totalGaps) playCorrectSound();
    else playWrongSound();
    onChange({ selections, submitted: true });
  };

  const handleReset = () => {
    if (onChange) onChange({ selections: {}, submitted: false });
  };

  if (parsedLines.length === 0 || totalGaps === 0) return null;

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs mb-6 space-y-4">
      {/* CATEGORY BADGE & INSTRUCTION */}
      <div>
        <div className="mb-2.5">
          <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-extrabold text-[11px] uppercase tracking-wider">
            Inline Select
          </span>
        </div>
        <h4 className="font-extrabold text-slate-900 text-base border-l-4 border-indigo-600 pl-3 leading-snug">
          {block.instruction || 'Choose the correct word in context:'}
        </h4>
      </div>

      <div className="space-y-4 text-base sm:text-lg leading-relaxed font-medium text-slate-800">
        {parsedLines.map((lineSegments, lIdx) => (
          <div key={lIdx} className="flex flex-wrap items-center gap-1.5 py-1">
            {lineSegments.map((seg, sIdx) => {
              if (seg.type === 'text') {
                return <span key={sIdx} className="text-slate-800">{seg.text}</span>;
              }

              const selectedVal = selections[seg.gapKey] || '';
              const isCorrect = areAnswersEquivalent(selectedVal, seg.correct);

              let borderStyle = 'border-indigo-300 bg-indigo-50/70 text-indigo-900';
              if (submitted) {
                borderStyle = isCorrect 
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold' 
                  : 'border-rose-500 bg-rose-50 text-rose-900 font-bold';
              }

              return (
                <span key={seg.gapKey} className="inline-flex items-center gap-1 mx-1">
                  <select
                    disabled={submitted}
                    value={selectedVal}
                    onChange={e => handleSelectChange(seg.gapKey, e.target.value)}
                    className={`px-3 py-1.5 border-2 rounded-xl text-xs sm:text-sm font-bold outline-none transition cursor-pointer shadow-2xs ${borderStyle}`}
                  >
                    <option value="">-- select --</option>
                    {seg.options.map((opt, oIdx) => (
                      <option key={oIdx} value={opt}>{opt}</option>
                    ))}
                  </select>
                </span>
              );
            })}
          </div>
        ))}
      </div>

      {!submitted ? (
        <div className="flex gap-2 pt-2">
          <button
            disabled={!allFilled}
            onClick={handleSubmit}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-xs shadow-md transition disabled:opacity-40 cursor-pointer"
          >
            Check
          </button>
          {Object.keys(selections).length > 0 && (
            <button 
              onClick={handleReset} 
              className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-2xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      ) : (
        <div className={`p-4 rounded-2xl text-xs font-bold flex justify-between items-center ${correctCount === totalGaps ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>
          <span>
            {correctCount === totalGaps 
              ? '🎉 All selections are correct!' 
              : `Result: ${correctCount} of ${totalGaps} points awarded.`}
          </span>
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
