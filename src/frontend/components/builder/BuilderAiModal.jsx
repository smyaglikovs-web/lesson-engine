import React from 'react';

export const BuilderAiModal = ({ aiModalTarget, selectedTasks, toggleTaskSelection, onExecute, onClose, aiGenerating }) => {
  if (!aiModalTarget) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
        <div className="flex justify-between items-center pb-3 border-b">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <h3 className="font-bold text-slate-900 text-lg">AI Помощник для блока #{aiModalTarget.blockIdx + 1} ({aiModalTarget.block.type})</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
        </div>

        <p className="text-xs text-slate-500">Отметьте, какие именно задания сгенерировать из этого блока:</p>

        <div className="space-y-2.5 text-sm font-medium">
          <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-indigo-50/50 transition">
            <input type="checkbox" checked={selectedTasks.includes('listening')} onChange={() => toggleTaskSelection('listening')} className="w-4 h-4 accent-indigo-600" />
            <span>🎧 Задания на аудирование / Тестовые вопросы</span>
          </label>

          <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-indigo-50/50 transition">
            <input type="checkbox" checked={selectedTasks.includes('flashcards')} onChange={() => toggleTaskSelection('flashcards')} className="w-4 h-4 accent-indigo-600" />
            <span>🎴 Только Флешкарты (Ключевая лексика с переводом)</span>
          </label>

          <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-indigo-50/50 transition">
            <input type="checkbox" checked={selectedTasks.includes('true_false')} onChange={() => toggleTaskSelection('true_false')} className="w-4 h-4 accent-indigo-600" />
            <span>❓ Только Тест True / False (Правда или Ложь)</span>
          </label>

          <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-indigo-50/50 transition">
            <input type="checkbox" checked={selectedTasks.includes('gap_fill')} onChange={() => toggleTaskSelection('gap_fill')} className="w-4 h-4 accent-indigo-600" />
            <span>✏️ Заполнение пропусков (Ввод с клавиатуры)</span>
          </label>

          <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-indigo-50/50 transition">
            <input type="checkbox" checked={selectedTasks.includes('gap_fill_bank')} onChange={() => toggleTaskSelection('gap_fill_bank')} className="w-4 h-4 accent-indigo-600" />
            <span>🧩 Пропуски с Банком Слов (Word Bank)</span>
          </label>

          <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-indigo-50/50 transition">
            <input type="checkbox" checked={selectedTasks.includes('matching')} onChange={() => toggleTaskSelection('matching')} className="w-4 h-4 accent-indigo-600" />
            <span>🔗 Сопоставление пар (Синонимы / Перевод)</span>
          </label>

          <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-indigo-50/50 transition">
            <input type="checkbox" checked={selectedTasks.includes('discussion')} onChange={() => toggleTaskSelection('discussion')} className="w-4 h-4 accent-indigo-600" />
            <span>💬 Разговорные вопросы по теме материала</span>
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2.5 border rounded-xl text-xs font-bold">Отмена</button>
          <button
            onClick={onExecute}
            disabled={selectedTasks.length === 0 || aiGenerating}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl text-xs shadow-md disabled:opacity-40"
          >
            {aiGenerating ? '⌛ AI создаёт...' : `🚀 Сгенерировать (${selectedTasks.length})`}
          </button>
        </div>
      </div>
    </div>
  );
};
