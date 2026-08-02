import React from 'react';

export const BuilderAiModal = ({ aiModalTarget, selectedTasks, toggleTaskSelection, onExecute, onClose, aiGenerating }) => {
  if (!aiModalTarget) return null;

  const isTextBlock = aiModalTarget.block?.type === 'text';
  const taskCount = selectedTasks.length;

  const handleFillSingleBlock = () => {
    toggleTaskSelection('fill_this_block');
    onExecute();
  };

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

        {/* 1-CLICK DIRECT BLOCK FILL BUTTON */}
        {!isTextBlock && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-2xl border border-indigo-100 space-y-2">
            <p className="text-xs font-bold text-indigo-900">🪄 Want AI to populate THIS empty block directly from your lesson text?</p>
            <button
              onClick={handleFillSingleBlock}
              disabled={aiGenerating}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs shadow-xs transition cursor-pointer"
            >
              {aiGenerating ? '⌛ Filling block...' : `✨ Auto-Fill THIS ${aiModalTarget.block.type.toUpperCase()} Block`}
            </button>
          </div>
        )}

        {/* TEXT REFINEMENT TOOLS FOR TEXT BLOCKS */}
        {isTextBlock && (
          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <p className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">📜 Text Refinement Tools:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { toggleTaskSelection('expand_text'); onExecute(); }}
                disabled={aiGenerating}
                className="p-2.5 bg-white border border-slate-200 hover:border-indigo-400 rounded-xl text-xs font-bold text-slate-800 transition cursor-pointer text-left"
              >
                📖 Expand Text (~400 words)
              </button>
              <button
                onClick={() => { toggleTaskSelection('shorten_text'); onExecute(); }}
                disabled={aiGenerating}
                className="p-2.5 bg-white border border-slate-200 hover:border-indigo-400 rounded-xl text-xs font-bold text-slate-800 transition cursor-pointer text-left"
              >
                ✂️ Shorten Text (~150 words)
              </button>
            </div>
          </div>
        )}

        <p className="text-xs text-slate-500 font-medium pt-1">Or select new exercise blocks to insert below this block:</p>

        <div className="space-y-2 text-sm font-semibold">
          <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80 cursor-pointer hover:bg-indigo-50/50 transition">
            <input type="checkbox" checked={selectedTasks.includes('listening')} onChange={() => toggleTaskSelection('listening')} className="w-4 h-4 accent-indigo-600 rounded" />
            <span>🎧 Listening / Comprehension Questions</span>
          </label>

          <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80 cursor-pointer hover:bg-indigo-50/50 transition">
            <input type="checkbox" checked={selectedTasks.includes('flashcards')} onChange={() => toggleTaskSelection('flashcards')} className="w-4 h-4 accent-indigo-600 rounded" />
            <span>🎴 Vocabulary Flashcards</span>
          </label>

          <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80 cursor-pointer hover:bg-indigo-50/50 transition">
            <input type="checkbox" checked={selectedTasks.includes('true_false')} onChange={() => toggleTaskSelection('true_false')} className="w-4 h-4 accent-indigo-600 rounded" />
            <span>❓ True / False Questions</span>
          </label>

          <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80 cursor-pointer hover:bg-indigo-50/50 transition">
            <input type="checkbox" checked={selectedTasks.includes('gap_fill')} onChange={() => toggleTaskSelection('gap_fill')} className="w-4 h-4 accent-indigo-600 rounded" />
            <span>✏️ Gap-Fill Exercises</span>
          </label>

          <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80 cursor-pointer hover:bg-indigo-50/50 transition">
            <input type="checkbox" checked={selectedTasks.includes('matching')} onChange={() => toggleTaskSelection('matching')} className="w-4 h-4 accent-indigo-600 rounded" />
            <span>🔗 Pair Matching</span>
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
            {aiGenerating ? '⌛ Generating...' : `🚀 Insert (${taskCount} Tasks)`}
          </button>
        </div>
      </div>
    </div>
  );
};
