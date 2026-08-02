import React from 'react';

export const BuilderAiModal = ({ aiModalTarget, selectedTasks, toggleTaskSelection, onExecute, onClose, aiGenerating }) => {
  if (!aiModalTarget) return null;

  const taskCount = selectedTasks.length;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✨</span>
            <h3 className="font-extrabold text-slate-900 text-lg">
              AI Assistant for Block #{aiModalTarget.blockIdx + 1} ({aiModalTarget.block.type.replace(/_/g, ' ')})
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1 cursor-pointer">✕</button>
        </div>

        <p className="text-xs text-slate-500 font-medium">Select the specific exercise types you want AI to generate from this content:</p>

        <div className="space-y-2.5 text-sm font-semibold">
          <label className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 cursor-pointer hover:bg-indigo-50/50 hover:border-indigo-300 transition">
            <input type="checkbox" checked={selectedTasks.includes('listening')} onChange={() => toggleTaskSelection('listening')} className="w-4 h-4 accent-indigo-600 rounded" />
            <span>🎧 Listening / Comprehension Questions</span>
          </label>

          <label className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 cursor-pointer hover:bg-indigo-50/50 hover:border-indigo-300 transition">
            <input type="checkbox" checked={selectedTasks.includes('flashcards')} onChange={() => toggleTaskSelection('flashcards')} className="w-4 h-4 accent-indigo-600 rounded" />
            <span>🎴 Vocabulary Flashcards (With translations & examples)</span>
          </label>

          <label className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 cursor-pointer hover:bg-indigo-50/50 hover:border-indigo-300 transition">
            <input type="checkbox" checked={selectedTasks.includes('true_false')} onChange={() => toggleTaskSelection('true_false')} className="w-4 h-4 accent-indigo-600 rounded" />
            <span>❓ True / False Quiz Questions</span>
          </label>

          <label className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 cursor-pointer hover:bg-indigo-50/50 hover:border-indigo-300 transition">
            <input type="checkbox" checked={selectedTasks.includes('gap_fill')} onChange={() => toggleTaskSelection('gap_fill')} className="w-4 h-4 accent-indigo-600 rounded" />
            <span>✏️ Gap-Fill Exercise (Keyboard input)</span>
          </label>

          <label className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 cursor-pointer hover:bg-indigo-50/50 hover:border-indigo-300 transition">
            <input type="checkbox" checked={selectedTasks.includes('gap_fill_bank')} onChange={() => toggleTaskSelection('gap_fill_bank')} className="w-4 h-4 accent-indigo-600 rounded" />
            <span>🧩 Gap-Fill with Word Bank</span>
          </label>

          <label className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 cursor-pointer hover:bg-indigo-50/50 hover:border-indigo-300 transition">
            <input type="checkbox" checked={selectedTasks.includes('matching')} onChange={() => toggleTaskSelection('matching')} className="w-4 h-4 accent-indigo-600 rounded" />
            <span>🔗 Pair Matching (Synonyms / Vocabulary)</span>
          </label>

          <label className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 cursor-pointer hover:bg-indigo-50/50 hover:border-indigo-300 transition">
            <input type="checkbox" checked={selectedTasks.includes('discussion')} onChange={() => toggleTaskSelection('discussion')} className="w-4 h-4 accent-indigo-600 rounded" />
            <span>💬 Speaking & Discussion Questions</span>
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-5 py-2.5 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer">
            Cancel
          </button>
          <button
            onClick={onExecute}
            disabled={taskCount === 0 || aiGenerating}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-extrabold rounded-2xl text-xs shadow-md disabled:opacity-40 cursor-pointer transition"
          >
            {aiGenerating ? '⌛ AI is Generating...' : `🚀 Generate (${taskCount} Task${taskCount > 1 ? 's' : ''})`}
          </button>
        </div>
      </div>
    </div>
  );
};
