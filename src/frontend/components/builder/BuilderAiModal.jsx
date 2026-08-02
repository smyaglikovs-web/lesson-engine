import React, { useState } from 'react';

export const BuilderAiModal = ({
  aiModalTarget,
  availableSourceBlocks = [],
  selectedSourceId,
  setSelectedSourceId,
  selectedTasks,
  toggleTaskSelection,
  matchingType,
  setMatchingType,
  flashcardType,
  setFlashcardType,
  onExecute,
  onClose,
  aiGenerating
}) => {
  if (!aiModalTarget) return null;

  const blockType = aiModalTarget.block?.type;
  const isTextBlock = blockType === 'text';
  const isGrammarBlock = blockType === 'grammar_card';
  const isMatchingBlock = blockType === 'matching';
  const isFlashcardBlock = blockType === 'flashcards';
  const isHeavyAnchor = isTextBlock || isGrammarBlock || blockType === 'video' || blockType === 'audio';

  const taskCount = selectedTasks.length;

  const handleFillSingleBlock = () => {
    toggleTaskSelection('fill_this_block');
    onExecute();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        
        {/* HEADER */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✨</span>
            <h3 className="font-extrabold text-slate-900 text-lg">
              AI Assistant for Block #{aiModalTarget.blockIdx + 1} ({blockType.replace(/_/g, ' ')})
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1 cursor-pointer">✕</button>
        </div>

        {/* SOURCE BLOCK SELECTOR FOR LIGHTWEIGHT TASK BLOCKS */}
        {!isHeavyAnchor && availableSourceBlocks.length > 0 && (
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              📌 Select Source Context for AI Generation:
            </label>
            <select
              value={selectedSourceId || ''}
              onChange={(e) => setSelectedSourceId(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="">-- Use Whole Lesson Reading Passage --</option>
              {availableSourceBlocks.map((sb, i) => (
                <option key={sb.id || i} value={sb.id}>
                  {sb.type === 'grammar_card' ? `📘 Grammar Rule: ${sb.title || 'Rule'}` : `📄 Text: ${sb.text?.substring(0, 35) || 'Passage'}...`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* SPECIALIZED MATCHING PAIR OPTIONS */}
        {isMatchingBlock && (
          <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 space-y-2">
            <label className="block text-xs font-extrabold text-indigo-900 uppercase tracking-wider">
              🔗 Select Pair Matching Style:
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setMatchingType('russian')}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${matchingType === 'russian' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
              >
                🇷🇺 Word ➔ Russian
              </button>
              <button
                type="button"
                onClick={() => setMatchingType('synonym')}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${matchingType === 'synonym' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
              >
                🔤 Word ➔ Synonym
              </button>
              <button
                type="button"
                onClick={() => setMatchingType('antonym')}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${matchingType === 'antonym' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
              >
                ↔️ Word ➔ Antonym
              </button>
              <button
                type="button"
                onClick={() => setMatchingType('collocation')}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${matchingType === 'collocation' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
              >
                🔗 Collocation Split
              </button>
            </div>
          </div>
        )}

        {/* SPECIALIZED FLASHCARD BACK OPTIONS */}
        {isFlashcardBlock && (
          <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 space-y-2">
            <label className="block text-xs font-extrabold text-indigo-900 uppercase tracking-wider">
              🎴 Select Flashcard Back Style:
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setFlashcardType('russian')}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${flashcardType === 'russian' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
              >
                🇷🇺 Russian Translation
              </button>
              <button
                type="button"
                onClick={() => setFlashcardType('definition')}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${flashcardType === 'definition' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
              >
                📖 English Definition
              </button>
            </div>
          </div>
        )}

        {/* 1-CLICK DIRECT BLOCK FILL BUTTON FOR LIGHTWEIGHT BLOCKS */}
        {!isHeavyAnchor && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-2xl border border-indigo-100 space-y-2">
            <p className="text-xs font-bold text-indigo-900">🪄 Populate THIS empty block from chosen source context?</p>
            <button
              onClick={handleFillSingleBlock}
              disabled={aiGenerating}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs shadow-xs transition cursor-pointer"
            >
              {aiGenerating ? '⌛ Filling block...' : `✨ Auto-Fill THIS ${blockType.toUpperCase()} Block`}
            </button>
          </div>
        )}

        {/* TEXT REFINEMENT TOOLS FOR TEXT BLOCKS */}
        {isTextBlock && (
          <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
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

        {/* MULTI-TASK CHECKLIST FOR HEAVY ANCHORS (TEXT / VIDEO / AUDIO / GRAMMAR CARD) */}
        {isHeavyAnchor && (
          <div className="space-y-2.5">
            <p className="text-xs text-slate-500 font-medium">Select 1 or more practice tasks to generate based on this anchor content:</p>

            <div className="space-y-2 text-sm font-semibold">
              {isGrammarBlock ? (
                <>
                  <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80 cursor-pointer hover:bg-indigo-50/50 transition">
                    <input type="checkbox" checked={selectedTasks.includes('grammar_transform')} onChange={() => toggleTaskSelection('grammar_transform')} className="w-4 h-4 accent-indigo-600 rounded" />
                    <span>✏️ Grammar Sentence Transformations</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80 cursor-pointer hover:bg-indigo-50/50 transition">
                    <input type="checkbox" checked={selectedTasks.includes('grammar_quiz')} onChange={() => toggleTaskSelection('grammar_quiz')} className="w-4 h-4 accent-indigo-600 rounded" />
                    <span>❓ Grammar Multiple Choice Drill</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80 cursor-pointer hover:bg-indigo-50/50 transition">
                    <input type="checkbox" checked={selectedTasks.includes('discussion')} onChange={() => toggleTaskSelection('discussion')} className="w-4 h-4 accent-indigo-600 rounded" />
                    <span>💬 Speaking Questions Using This Grammar</span>
                  </label>
                </>
              ) : (
                <>
                  <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80 cursor-pointer hover:bg-indigo-50/50 transition">
                    <input type="checkbox" checked={selectedTasks.includes('listening')} onChange={() => toggleTaskSelection('listening')} className="w-4 h-4 accent-indigo-600 rounded" />
                    <span>🎧 Comprehension Questions</span>
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
                </>
              )}
            </div>
          </div>
        )}

        {/* ACTION BUTTONS */}
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
