import React, { useMemo } from 'react';
import { playCorrectSound, playWrongSound } from '../utils/sounds.js';

export const BlockInlineSelect = ({ block = {}, value = {}, onChange }) => {
  const rawText = block.text || '';
  const lines = useMemo(() => rawText.split('\n').filter(line => line.trim().length > 0), [rawText]);
  const submitted = Boolean(value?.submitted);
  const selections = value?.selections || {};

  // Clean lines: strip duplicate dashes/underscores generated before brackets
  const parsedLines = useMemo(() => {
    return lines.map((line, lineIdx) => {
      // Clean residual dashes/underscores like "----- [choice]"
      const cleanedLine = line.replace(/_{2,}\s*\[/g, '[').replace(/-{2,}\s*\[/g, '[');
      const parts = cleanedLine.split(/\[(.*?)\]/);
      const segments = [];

      for (let i = 0; i < parts.length; i++) {
        if (i % 2 === 0) {
          const textPart = parts[i].replace(/_{2,}/g, '').replace(/-{2,}/g, '');
          segments.push({ type: 'text', text: textPart });
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

          if (!correctOption && cleanOptions.length > 0) {
            correctOption = cleanOptions[0];
          }

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
        if (studentPick && studentPick.trim().toLowerCase() === seg.correct.trim().toLowerCase()) {
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
    if (correctCount === totalGaps) {
      playCorrectSound();
    } else {
      playWrongSound();
    }
    onChange({ selections, submitted: true });
  };

  const handleReset = () => {
    if (onChange) {
      onChange({ selections: {}, submitted: false });
    }
  };

  if (parsedLines.length === 0 || totalGaps === 0) {
    return null;
  }

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-2xs mb-6 space-y-4">
      {block.instruction && (
        <h4 className="font-extrabold text-slate-800 text-base leading-snug">
          {block.instruction}
        </h4>
      )}

      <div className="space-y-4 text-base sm:text-lg leading-relaxed font-medium text-slate-800">
        {parsedLines.map((lineSegments, lIdx) => (
          <div key={lIdx} className="flex flex-wrap items-center gap-1.5 py-1">
            {lineSegments.map((seg, sIdx) => {
              if (seg.type === 'text') {
                return <span key={sIdx} className="text-slate-800">{seg.text}</span>;
              }

              const selectedVal = selections[seg.gapKey] || '';
              const isCorrect = selectedVal.trim().toLowerCase() === seg.correct.trim().toLowerCase();

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
                    onChange={(e) => handleSelectChange(seg.gapKey, e.target.value)}
                    className={`px-3 py-1.5 border-2 rounded-xl text-xs sm:text-sm font-bold outline-none transition cursor-pointer shadow-2xs ${borderStyle}`}
                  >
                    <option value="">-- выберите --</option>
                    {seg.options.map((opt, oIdx) => (
                      <option key={oIdx} value={opt}>{opt}</option>
                    ))}
                  </select>

                  {submitted && (
                    <span
                      className={`w-2 h-4 rounded-full ${isCorrect ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      title={isCorrect ? 'Верно' : `Правильно: ${seg.correct}`}
                    ></span>
                  )}
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
            Проверить
          </button>
          {Object.keys(selections).length > 0 && (
            <button 
              onClick={handleReset} 
              className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-2xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
            >
              Сбросить
            </button>
          )}
        </div>
      ) : (
        <div className={`p-4 rounded-2xl text-xs font-bold flex justify-between items-center ${correctCount === totalGaps ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
          <span>
            {correctCount === totalGaps 
              ? '🎉 Отлично! Все варианты выбраны верно!' 
              : `❌ Результат: ${correctCount} из ${totalGaps} верно.`}
          </span>
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
