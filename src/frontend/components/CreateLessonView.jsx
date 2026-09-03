import React, { useState, useEffect, useRef } from 'react';
import { VisualBuilderView } from './VisualBuilderView.jsx';
import { BlockRenderer } from './BlockRenderer.jsx';

const DEFAULT_LESSON = {
  title: "New Interactive Lesson",
  level: "B1",
  topic: "General English",
  description: "Interactive lesson with video, audio, and automated tasks.",
  pages: [
    {
      id: "p1",
      title: "Part 1: Introduction",
      blocks: [
        { id: "b1", type: "heading", level: 1, text: "Welcome to the Lesson" },
        { id: "b2", type: "text", text: "Read the story and complete the tasks below." }
      ]
    }
  ]
};

const EXERCISE_CHIPS = [
  { id: 'multiple_choice', label: 'Multiple Choice' },
  { id: 'gap_fill', label: 'Gap Fill' },
  { id: 'gap_fill_bank', label: 'Drag & Drop' },
  { id: 'matching', label: 'Matching' },
  { id: 'sentence_reorder', label: 'Unscramble' },
  { id: 'inline_select', label: 'Drop Down' },
  { id: 'spinning_wheel', label: 'Speaking Wheel' },
  { id: 'categorization', label: 'Categorization' },
  { id: 'flashcards', label: 'Flashcards' },
  { id: 'open_input', label: 'Writing / Speaking' }
];

export const CreateLessonView = ({ initialLesson, onSaveLesson, onCancel }) => {
  const [mode, setMode] = useState('wizard'); // 'wizard' | 'visual' | 'json'
  const [currentLesson, setCurrentLesson] = useState(initialLesson || DEFAULT_LESSON);
  const [jsonText, setJsonText] = useState(JSON.stringify(initialLesson || DEFAULT_LESSON, null, 2));

  // STEP 1: Inputs & Content
  const [inputs, setInputs] = useState([
    { id: 'in_1', title: 'Input 1', type: 'text', content: '', keywords: [] }
  ]);
  const [activeInputIdx, setActiveInputIdx] = useState(0);
  const [selectedChips, setSelectedChips] = useState(['multiple_choice', 'gap_fill_bank', 'matching', 'sentence_reorder']);
  const [draggedChipIdx, setDraggedChipIdx] = useState(null);
  const textEditorRef = useRef(null);

  // STEP 2: Settings
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonFormat, setLessonFormat] = useState('live'); // 'live' | 'homework'
  const [finalTask, setFinalTask] = useState('speaking'); // 'speaking' | 'writing' | 'none'
  const [cefrLevel, setCefrLevel] = useState('B1');
  const [contextPrompt, setContextPrompt] = useState('');

  // STEP 3: Grammar
  const [addGrammar, setAddGrammar] = useState(false);

  // STEP 4: Structure Stack
  const [structureStack, setStructureStack] = useState([
    { id: 'warmup', label: 'Warm-up', isCore: false },
    { id: 'in_1', label: 'Input 1', isCore: true },
    { id: 'cooldown', label: 'Cool-down', isCore: false }
  ]);

  // Loading & Feedback
  const [generating, setGenerating] = useState(false);
  const [banner, setBanner] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const activeInput = inputs[activeInputIdx] || inputs[0];

  // Live Bold Keyword Counter
  const countBoldKeywords = (html) => {
    if (!html) return [];
    const div = document.createElement('div');
    div.innerHTML = html;
    const bolds = Array.from(div.querySelectorAll('b, strong')).map(el => el.textContent.trim()).filter(Boolean);
    return Array.from(new Set(bolds));
  };

  const handleTextContentChange = () => {
    if (!textEditorRef.current) return;
    const html = textEditorRef.current.innerHTML;
    const keywords = countBoldKeywords(html);
    const updated = [...inputs];
    updated[activeInputIdx] = {
      ...updated[activeInputIdx],
      content: textEditorRef.current.innerText,
      htmlContent: html,
      keywords
    };
    setInputs(updated);
  };

  // Bold Selection Trigger (Touch & Keyboard)
  const handleToggleBold = () => {
    document.execCommand('bold', false, null);
    handleTextContentChange();
  };

  // Add & Manage Inputs (Max 3)
  const handleAddInput = () => {
    if (inputs.length >= 3) return;
    const newId = `in_${inputs.length + 1}`;
    const newTitle = `Input ${inputs.length + 1}`;
    setInputs([...inputs, { id: newId, title: newTitle, type: 'text', content: '', keywords: [] }]);
    setStructureStack(prev => [...prev.slice(0, -1), { id: newId, label: newTitle, isCore: true }, prev[prev.length - 1]]);
    setActiveInputIdx(inputs.length);
  };

  const handleChipToggle = (chipId) => {
    if (selectedChips.includes(chipId)) {
      setSelectedChips(selectedChips.filter(c => c !== chipId));
    } else {
      setSelectedChips([...selectedChips, chipId]);
    }
  };

  // Drag & Reorder Chips
  const handleChipDragStart = (idx) => setDraggedChipIdx(idx);
  const handleChipDrop = (targetIdx) => {
    if (draggedChipIdx === null || draggedChipIdx === targetIdx) return;
    const updated = [...selectedChips];
    const item = updated.splice(draggedChipIdx, 1)[0];
    updated.splice(targetIdx, 0, item);
    setSelectedChips(updated);
    setDraggedChipIdx(null);
  };

  // Structure Stack Reorder
  const handleMoveStack = (idx, dir) => {
    const target = idx + dir;
    if (target < 0 || target >= structureStack.length) return;
    const updated = [...structureStack];
    const temp = updated[idx];
    updated[idx] = updated[target];
    updated[target] = temp;
    setStructureStack(updated);
  };

  const handleRemoveStackItem = (id) => {
    setStructureStack(structureStack.filter(s => s.id !== id));
  };

  // Trigger Chained AI Generation
  const handleGenerateLesson = async () => {
    const rawText = inputs.map(inObj => inObj.content).filter(Boolean).join('\n\n');
    const allKeywords = inputs.flatMap(inObj => inObj.keywords || []);
    const titleToUse = lessonTitle.trim() || `Lesson on ${cefrLevel}`;

    setGenerating(true);
    setBanner('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: rawText,
          level: cefrLevel,
          topic: titleToUse,
          context: contextPrompt,
          format: lessonFormat,
          targetKeywords: allKeywords,
          selectedTasks: selectedChips,
          includeGrammar: addGrammar,
          finalTask
        })
      });

      const data = await res.json();
      if (res.ok && data.success && data.jsonText) {
        const parsed = JSON.parse(data.jsonText);
        setCurrentLesson(parsed);
        setJsonText(data.jsonText);
        setMode('visual');
        setBanner('🎉 Multi-stage lesson generated! You can now refine blocks in the visual builder.');
      } else {
        setErrorMsg(data.error || 'Generation failed. Please try again.');
      }
    } catch (e) {
      setErrorMsg('Error calling AI pipeline.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* MODE TABS */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex gap-2 max-w-xl mx-auto">
        <button
          onClick={() => setMode('wizard')}
          className={`flex-1 py-2 rounded-xl font-bold text-xs transition cursor-pointer ${
            mode === 'wizard' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          ✨ AI Builder Wizard
        </button>
        <button
          onClick={() => setMode('visual')}
          className={`flex-1 py-2 rounded-xl font-bold text-xs transition cursor-pointer ${
            mode === 'visual' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          🧩 Lego Visual Editor
        </button>
        <button
          onClick={() => setMode('json')}
          className={`flex-1 py-2 rounded-xl font-bold text-xs transition cursor-pointer ${
            mode === 'json' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          📋 Raw JSON
        </button>
      </div>

      {banner && (
        <div className="p-4 bg-emerald-600 text-white font-bold text-xs rounded-2xl flex justify-between items-center shadow-md">
          <span>{banner}</span>
          <button onClick={() => setBanner('')} className="text-white text-base cursor-pointer">✕</button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-600 text-white font-bold text-xs rounded-2xl flex justify-between items-center shadow-md">
          <span>⚠️ {errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-white text-base cursor-pointer">✕</button>
        </div>
      )}

      {/* MODE 1: 2-COLUMN AI BUILDER WIZARD */}
      {mode === 'wizard' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          {/* LEFT COLUMN: STEP 1 (INPUTS & EXERCISES) */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="border-b pb-4">
              <div className="flex items-center gap-2.5 mb-1">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-extrabold flex items-center justify-center">1</span>
                <h3 className="text-lg font-extrabold text-slate-900">Lesson Material & Inputs</h3>
              </div>
              <p className="text-xs text-slate-500 pl-8 leading-relaxed">
                Add text, audio, or video inputs (up to 3). Highlight target vocabulary in bold.
              </p>
            </div>

            {/* INPUT TABS */}
            <div className="flex gap-2 border-b border-slate-100 pb-3">
              {inputs.map((inObj, idx) => (
                <button
                  key={inObj.id}
                  onClick={() => setActiveInputIdx(idx)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeInputIdx === idx ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {inObj.title}
                </button>
              ))}
              {inputs.length < 3 && (
                <button
                  onClick={handleAddInput}
                  className="px-3 py-2 border border-dashed border-indigo-300 text-indigo-700 hover:bg-indigo-50 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  + Add Input
                </button>
              )}
            </div>

            {/* INPUT TYPE SELECTOR */}
            <div className="flex gap-2">
              {['text', 'audio', 'video'].map(t => (
                <button
                  key={t}
                  onClick={() => {
                    const updated = [...inputs];
                    updated[activeInputIdx].type = t;
                    setInputs(updated);
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase transition cursor-pointer ${
                    activeInput.type === t ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* RICH TEXT INPUT WITH BOLD HIGHLIGHTER */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 font-medium">Highlight target collocations using <kbd className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono">Cmd+B</kbd> or tap:</span>
                <button
                  type="button"
                  onClick={handleToggleBold}
                  className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold rounded-lg text-xs transition cursor-pointer"
                  title="Make selected text bold"
                >
                  👆 B (Bold)
                </button>
              </div>

              <div
                ref={textEditorRef}
                contentEditable
                onInput={handleTextContentChange}
                className="w-full min-h-[160px] p-4 bg-slate-50 focus:bg-white border border-slate-300 focus:border-indigo-600 rounded-2xl outline-none text-xs sm:text-sm font-sans leading-relaxed text-slate-900 shadow-inner"
                placeholder="Paste story text here. Bold key phrases you want to drill in exercises..."
              ></div>

              <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
                <span>Keywords tagged: <strong className="text-indigo-600">{activeInput.keywords?.length || 0}</strong></span>
                {activeInput.keywords?.length > 0 && (
                  <span className="text-[11px] text-slate-400 truncate max-w-xs">{activeInput.keywords.join(', ')}</span>
                )}
              </div>
            </div>

            {/* DRAGGABLE EXERCISE SEQUENCE CHIPS */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Exercise Sequence (Drag to reorder sequence):
              </span>
              
              <div className="flex flex-wrap gap-2">
                {selectedChips.map((chipId, idx) => {
                  const chipMeta = EXERCISE_CHIPS.find(c => c.id === chipId) || { label: chipId };
                  return (
                    <div
                      key={chipId}
                      draggable
                      onDragStart={() => handleChipDragStart(idx)}
                      onDragOver={e => e.preventDefault()}
                      onDrop={() => handleChipDrop(idx)}
                      onClick={() => handleChipToggle(chipId)}
                      className="px-3.5 py-1.5 rounded-full bg-indigo-600 text-white font-extrabold text-xs shadow-2xs cursor-grab active:cursor-grabbing hover:scale-105 transition flex items-center gap-1.5"
                    >
                      <span>#{idx + 1} {chipMeta.label}</span>
                      <span className="text-[10px] opacity-75">✕</span>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">+ Add more exercises:</span>
                <div className="flex flex-wrap gap-1.5">
                  {EXERCISE_CHIPS.filter(c => !selectedChips.includes(c.id)).map(c => (
                    <button
                      key={c.id}
                      onClick={() => handleChipToggle(c.id)}
                      className="px-3 py-1 rounded-full bg-white border border-slate-300 text-slate-700 text-xs font-medium hover:border-indigo-500 cursor-pointer transition"
                    >
                      + {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT COLUMN: STEPS 2, 3, 4 & GENERATE CTA */}
          <div className="space-y-6">
            
            {/* STEP 2: SETTINGS */}
            <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
              <div className="border-b pb-3 flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-extrabold flex items-center justify-center">2</span>
                <h3 className="text-lg font-extrabold text-slate-900">Lesson Settings</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Lesson Title</label>
                  <input
                    type="text"
                    value={lessonTitle}
                    onChange={e => setLessonTitle(e.target.value)}
                    placeholder="e.g. Present Perfect in Professional Communication"
                    className="w-full p-3 bg-slate-50 border border-slate-300 focus:bg-white rounded-2xl text-xs font-bold text-slate-900 outline-none"
                  />
                </div>

                {/* FORMAT TOGGLE */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Lesson Format</label>
                  <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
                    <button
                      onClick={() => setLessonFormat('live')}
                      className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                        lessonFormat === 'live' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      🟢 Live Lesson
                    </button>
                    <button
                      onClick={() => setLessonFormat('homework')}
                      className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                        lessonFormat === 'homework' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      📚 Homework
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">CEFR Level</label>
                    <select
                      value={cefrLevel}
                      onChange={e => setCefrLevel(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-300 focus:bg-white rounded-2xl text-xs font-bold text-slate-900 outline-none cursor-pointer"
                    >
                      <option>A1</option><option>A2</option><option>B1</option><option>B2</option><option>C1</option><option>C2</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Final Task</label>
                    <select
                      value={finalTask}
                      onChange={e => setFinalTask(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-300 focus:bg-white rounded-2xl text-xs font-bold text-slate-900 outline-none cursor-pointer"
                    >
                      <option value="speaking">Speaking Roulette</option>
                      <option value="writing">Writing Submission</option>
                      <option value="none">No Final Task</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Audience Persona / Context</label>
                  <input
                    type="text"
                    value={contextPrompt}
                    onChange={e => setContextPrompt(e.target.value)}
                    placeholder="e.g. Product Managers at work | ESL"
                    className="w-full p-3 bg-slate-50 border border-slate-300 focus:bg-white rounded-2xl text-xs font-medium text-slate-900 outline-none"
                  />
                </div>
              </div>
            </section>

            {/* STEP 3: OPTIONAL GRAMMAR BLOCK */}
            <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-3">
              <div className="border-b pb-3 flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-extrabold flex items-center justify-center">3</span>
                <h3 className="text-lg font-extrabold text-slate-900">Grammar Focus</h3>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addGrammar}
                  onChange={e => setAddGrammar(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-800">Inject a dedicated Grammar Rule Presentation block</span>
              </label>
            </section>

            {/* STEP 4: STRUCTURE STACK & GENERATE CTA */}
            <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
              <div className="border-b pb-3 flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-extrabold flex items-center justify-center">4</span>
                <h3 className="text-lg font-extrabold text-slate-900">Lesson Structure Stack</h3>
              </div>

              <div className="space-y-2">
                {structureStack.map((item, idx) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col">
                        <button onClick={() => handleMoveStack(idx, -1)} disabled={idx === 0} className="text-[10px] text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer">▲</button>
                        <button onClick={() => handleMoveStack(idx, 1)} disabled={idx === structureStack.length - 1} className="text-[10px] text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer">▼</button>
                      </div>
                      <span className="font-extrabold text-xs text-slate-800">{item.label}</span>
                    </div>
                    {!item.isCore && (
                      <button onClick={() => handleRemoveStackItem(item.id)} className="text-xs text-rose-500 hover:text-rose-700 cursor-pointer font-bold">Remove</button>
                    )}
                  </div>
                ))}
              </div>

              <button
                disabled={generating}
                onClick={handleGenerateLesson}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white font-extrabold rounded-2xl text-sm transition shadow-lg disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{generating ? '⌛ Synthesizing 3-Stage Pipeline...' : '✨ Generate Full Lesson (20–30s)'}</span>
              </button>
            </section>
          </div>
        </div>
      )}

      {/* MODE 2: LEGO VISUAL EDITOR */}
      {mode === 'visual' && (
        <VisualBuilderView
          initialLesson={currentLesson}
          onSaveLesson={onSaveLesson}
          onChangeLesson={l => { setCurrentLesson(l); setJsonText(JSON.stringify(l, null, 2)); }}
          onCancel={onCancel}
        />
      )}

      {/* MODE 3: RAW JSON EDITOR */}
      {mode === 'json' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border">
            <h2 className="text-xl font-bold text-slate-900">Direct JSON Editor</h2>
            <button
              onClick={() => onSaveLesson(JSON.parse(jsonText))}
              className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs cursor-pointer"
            >
              Save to Database
            </button>
          </div>
          <textarea
            rows="24"
            value={jsonText}
            onChange={e => {
              setJsonText(e.target.value);
              try {
                setCurrentLesson(JSON.parse(e.target.value));
              } catch (err) {}
            }}
            className="w-full p-4 font-mono text-xs bg-slate-900 text-emerald-400 rounded-2xl outline-none shadow-inner"
          ></textarea>
        </div>
      )}
    </div>
  );
};
