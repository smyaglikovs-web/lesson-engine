import React, { useMemo } from 'react';
import { playCorrectSound, playWrongSound } from '../utils/sounds.js';

export const BlockInlineSelect = ({ block, value, onChange }) => {
  const rawText = block.text || '';
  const lines = rawText.split('\n').filter(line => line.trim().length > 0);
  const submitted = value?.submitted || false;
  const selections = value?.selections || {}; // { lineIdx_gapIdx: selectedText }

  // Parse lines and extract choices. Format: "Sentence with [option1* | option2] text."
  const parsedLines = useMemo(() => {
    return lines.map((line, lineIdx) => {
      const parts = line.split(/\[(.*?)\]/);
      const segments = [];

      for (let i = 0; i < parts.length; i++) {
        if (i % 2 === 0) {
          segments.push({ type: 'text', text: parts[i] });
        } else {
          // Inside brackets
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

          // If no asterisk was provided, default first option as correct
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
  }, [rawText]);

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

  const allFilled = totalGaps > 0 && Object.keys(selections).length >= totalGaps;

  const handleSelectChange = (gapKey, chosenVal) => {
    if (submitted) return;
    const updated = { ...selections, [gapKey]: chosenVal };
    onChange({ selections: updated, submitted: false });
  };

  const handleSubmit = () => {
    if (!allFilled) return;
    if (correctCount === totalGaps) {
      playCorrectSound();
    } else {
      playWrongSound();
    }
    onChange({ selections, submitted: true });
  };

  const handleReset = () => {
    onChange({ selections: {}, submitted: false });
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-2xs mb-6 space-y-4">
      {block.instruction && (
        <h4 className="font-extrabold text-slate-800 text-base leading-snug">
          {block.instruction}
        </h4>
      )}

      <div className="space-y-3.5 text-base sm:text-lg leading-relaxed font-medium text-slate-800">
        {parsedLines.map((lineSegments, lIdx) => (
          <div key={lIdx} className="flex flex-wrap items-center gap-2 py-1">
            {lineSegments.map((seg, sIdx) => {
              if (seg.type === 'text') {
                return <span key={sIdx} className="text-slate-800">{seg.text}</span>;
              }

              const selectedVal = selections[seg.gapKey] || '';
              const isCorrect = selectedVal.trim().toLowerCase() === seg.correct.trim().toLowerCase();

              let borderStyle = 'border-indigo-300 bg-indigo-50/50 text-indigo-900';
              if (submitted) {
                borderStyle = isCorrect ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold' : 'border-rose-500 bg-rose-50 text-rose-900 font-bold';
              }

              return (
                <div key={seg.gapKey} className="inline-flex items-center gap-1.5 relative my-0.5">
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
                </div>
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
            <button onClick={handleReset} className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-2xl text-xs font-bold hover:bg-slate-50 cursor-pointer">
              Сбросить
            </button>
          )}
        </div>
      ) : (
        <div className={`p-4 rounded-2xl text-xs font-bold flex justify-between items-center ${correctCount === totalGaps ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
          <span>
            {correctCount === totalGaps ? '🎉 Отлично! Все варианты выбраны верно!' : `❌ Результат: ${correctCount} из ${totalGaps} верно.`}
          </span>
          <button onClick={handleReset} className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 cursor-pointer">
            Попробовать снова 🔄
          </button>
        </div>
      )}
    </div>
  );
};
