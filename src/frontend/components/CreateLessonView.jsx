import React, { useState, useEffect, useRef } from 'react';
import { VisualBuilderView } from './VisualBuilderView.jsx';

const DEFAULT_LESSON = {
  title: "New Interactive Lesson",
  level: "B1",
  topic: "General English",
  description: "Interactive lesson created with Lesson Engine.",
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
  // Mode selection: 'topic_ai' (Fast 1-click) | 'wizard' (Advanced 4-step) | 'visual' (Lego) | 'json' (Code)
  const [mode, setMode] = useState('topic_ai');
  const [currentLesson, setCurrentLesson] = useState(initialLesson || DEFAULT_LESSON);
  const [jsonText, setJsonText] = useState(JSON.stringify(initialLesson || DEFAULT_LESSON, null, 2));

  // 1-CLICK TOPIC GENERATOR STATE
  const [topicInput, setTopicInput] = useState('');
  const [topicLevel, setTopicLevel] = useState('B1');
  const [optionalSourceText, setOptionalSourceText] = useState('');
  const [topicFormat, setTopicFormat] = useState('live');

  // ADVANCED WIZARD STATE
  const [inputs, setInputs] = useState([
    { id: 'in_1', title: 'Input 1', type: 'text', content: '', keywords: [] }
  ]);
  const [activeInputIdx, setActiveInputIdx] = useState(0);
  const [selectedChips, setSelectedChips] = useState(['multiple_choice', 'gap_fill_bank', 'matching', 'sentence_reorder']);
  const [draggedChipIdx, setDraggedChipIdx] = useState(null);
  const textEditorRef = useRef(null);

  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonFormat, setLessonFormat] = useState('live');
  const [finalTask, setFinalTask] = useState('speaking');
  const [cefrLevel, setCefrLevel] = useState('B1');
  const [contextPrompt, setContextPrompt] = useState('');
  const [addGrammar, setAddGrammar] = useState(false);

  const [structureStack, setStructureStack] = useState([
    { id: 'warmup', label: 'Warm-up', isCore: false },
    { id: 'in_1', label: 'Input 1', isCore: true },
    { id: 'cooldown', label: 'Cool-down', isCore: false }
  ]);

  // Loading & Feedback
  const [generating, setGenerating] = useState(false);
  const [banner, setBanner] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // --------------------------------------------------------------------------
  // 1. FAST 1-CLICK TOPIC GENERATION HANDLER
  // --------------------------------------------------------------------------
  const handleGenerateFromTopic = async () => {
    if (!topicInput.trim()) {
      setErrorMsg('Пожалуйста, введите тему урока (например: Job Interview или Ordering Food).');
      return;
    }

    setGenerating(true);
    setBanner('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicInput.trim(),
          level: topicLevel,
          text: optionalSourceText.trim(),
          format: topicFormat,
          selectedTasks: ['multiple_choice', 'gap_fill_bank', 'matching', 'sentence_reorder'],
          includeGrammar: true,
          finalTask: 'speaking'
        })
      });

      const data = await res.json();
      if (res.ok && data.success && data.jsonText) {
        const parsed = JSON.parse(data.jsonText);
        setCurrentLesson(parsed);
        setJsonText(data.jsonText);
        setMode('visual');
        setBanner(`🎉 Урок на тему "${topicInput.trim()}" успешно сгенерирован AI!`);
      } else {
        setErrorMsg(data.error || 'Ошибка генерации. Попробуйте ещё раз.');
      }
    } catch (e) {
      setErrorMsg('Ошибка соединения с AI сервисом.');
    } finally {
      setGenerating(false);
    }
  };

  // --------------------------------------------------------------------------
  // 2. ADVANCED WIZARD HELPERS
  // --------------------------------------------------------------------------
  const activeInput = inputs[activeInputIdx] || inputs[0];

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

  const handleToggleBold = () => {
    document.execCommand('bold', false, null);
    handleTextContentChange();
  };

  const handleAddInput = () => {
    if (inputs.length >= 3) return;
    const newId = `in_${inputs.length + 1}`;
    const newTitle = `Input ${inputs.length + 1}`;
    setInputs([...inputs, { id: newId, title: newTitle, type: 'text', content: '', keywords: [] }]);
    setStructureStack(prev => [...prev.slice(0, -1), { id: newId, label: newTitle, isCore: true }, prev[prev.length - 1]]);
    setActiveInputIdx(inputs.length);
  };

  const handleChipToggle = (chipId) => {
    setSelectedChips(prev => prev.includes(chipId) ? prev.filter(c => c !== chipId) : [...prev, chipId]);
  };

  const handleChipDragStart = (idx) => setDraggedChipIdx(idx);
  const handleChipDrop = (targetIdx) => {
    if (draggedChipIdx === null || draggedChipIdx === targetIdx) return;
    const updated = [...selectedChips];
    const item = updated.splice(draggedChipIdx, 1)[0];
    updated.splice(targetIdx, 0, item);
    setSelectedChips(updated);
    setDraggedChipIdx(null);
  };

  const handleMoveStack = (idx, dir) => {
    const target = idx + dir;
    if (target < 0 || target >= structureStack.length) return;
    const updated = [...structureStack];
    const temp = updated[idx];
    updated[idx] = updated[target];
    updated[target] = temp;
    setStructureStack(updated);
  };

  const handleGenerateFromWizard = async () => {
    const rawText = inputs.map(inObj => inObj.content).filter(Boolean).join('\n\n');
    const allKeywords = inputs.flatMap(inObj => inObj.keywords || []);
    const titleToUse = lessonTitle.trim() || `Lesson (${cefrLevel})`;

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
        setBanner('🎉 Урок успешно сгенерирован по структуре визарда!');
      } else {
        setErrorMsg(data.error || 'Ошибка генерации.');
      }
    } catch (e) {
      setErrorMsg('Ошибка соединения с AI.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* MODE TABS */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-2 max-w-2xl mx-auto">
        <button
          onClick={() => setMode('topic_ai')}
          className={`flex-1 min-w-32 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
            mode === 'topic_ai' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          ⚡ Быстрая AI тема
        </button>
        <button
          onClick={() => setMode('wizard')}
          className={`flex-1 min-w-32 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
            mode === 'wizard' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          🪄 4-Шаговый Визард
        </button>
        <button
          onClick={() => setMode('visual')}
          className={`flex-1 min-w-32 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
            mode === 'visual' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          🧩 Lego Конструктор
        </button>
        <button
          onClick={() => setMode('json')}
          className={`flex-1 min-w-32 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
            mode === 'json' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          📋 JSON
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

      {/* -------------------------------------------------------------------- */}
      {/* 1. FAST 1-CLICK AI GENERATOR BY TOPIC                                */}
      {/* -------------------------------------------------------------------- */}
      {mode === 'topic_ai' && (
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-sm max-w-2xl mx-auto space-y-6">
          <div className="border-b pb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">⚡</span>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Генерация урока по теме за 20 секунд</h2>
            </div>
            <p className="text-slate-500 text-xs">
              Просто введите тему — AI создаст историю, словарный запас, вопросы для обсуждения и 4 интерактивных задания.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                Тема урока (Topic) *
              </label>
              <input
                type="text"
                value={topicInput}
                onChange={e => setTopicInput(e.target.value)}
                placeholder="например: Job Interview Preparation или Traveling in Italy"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-600 rounded-2xl text-sm font-bold text-slate-900 outline-none transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  Уровень CEFR
                </label>
                <select
                  value={topicLevel}
                  onChange={e => setTopicLevel(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-600 rounded-2xl text-xs font-bold text-slate-900 outline-none cursor-pointer"
                >
                  <option>A1</option><option>A2</option><option>B1</option><option>B2</option><option>C1</option><option>C2</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  Формат
                </label>
                <select
                  value={topicFormat}
                  onChange={e => setTopicFormat(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-600 rounded-2xl text-xs font-bold text-slate-900 outline-none cursor-pointer"
                >
                  <option value="live">🟢 Урок с учителем (Live)</option>
                  <option value="homework">📚 Домашнее задание (ДЗ)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                Дополнительный текст или заметки (Необязательно)
              </label>
              <textarea
                rows="4"
                value={optionalSourceText}
                onChange={e => setOptionalSourceText(e.target.value)}
                placeholder="Если есть конкретный текст, скопируйте его сюда. Если поля пустое, AI напишет свою историю..."
                className="w-full p-4 bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-600 rounded-2xl text-xs font-sans text-slate-800 outline-none leading-relaxed"
              ></textarea>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button onClick={onCancel} className="px-5 py-3 border rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer">
              Отмена
            </button>
            <button
              disabled={generating || !topicInput.trim()}
              onClick={handleGenerateFromTopic}
              className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white font-extrabold rounded-2xl text-xs shadow-md transition disabled:opacity-40 cursor-pointer flex items-center gap-2"
            >
              <span>{generating ? '⌛ AI создаёт полный урок...' : '🚀 Сгенерировать урок'}</span>
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 2. ADVANCED 4-STEP WIZARD (MULTI-INPUT & DRAGGABLE CHIPS)            */}
      {/* -------------------------------------------------------------------- */}
      {mode === 'wizard' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* LEFT COLUMN: STEP 1 */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="border-b pb-4">
              <div className="flex items-center gap-2.5 mb-1">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-extrabold flex items-center justify-center">1</span>
                <h3 className="text-lg font-extrabold text-slate-900">Материалы урока (Inputs)</h3>
              </div>
              <p className="text-xs text-slate-500 pl-8 leading-relaxed">
                Добавьте инпуты и выделите ключевые слова жирным (<kbd className="bg-slate-100 px-1 rounded text-indigo-600 font-mono">Cmd+B</kbd>).
              </p>
            </div>

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

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Выделите слова в тексте:</span>
                <button
                  type="button"
                  onClick={handleToggleBold}
                  className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold rounded-lg text-xs transition cursor-pointer"
                >
                  👆 B (Жирный)
                </button>
              </div>

              <div
                ref={textEditorRef}
                contentEditable
                onInput={handleTextContentChange}
                className="w-full min-h-[160px] p-4 bg-slate-50 focus:bg-white border border-slate-300 focus:border-indigo-600 rounded-2xl outline-none text-xs sm:text-sm font-sans leading-relaxed text-slate-900"
                placeholder="Вставьте текст и выделите ключевые слова жирным..."
              ></div>

              <div className="text-xs text-slate-500 pt-1">
                Распознано слов: <strong className="text-indigo-600">{activeInput.keywords?.length || 0}</strong>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Типы упражнений:
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

              <div className="pt-2 border-t border-slate-200 flex flex-wrap gap-1.5">
                {EXERCISE_CHIPS.filter(c => !selectedChips.includes(c.id)).map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleChipToggle(c.id)}
                    className="px-3 py-1 rounded-full bg-white border border-slate-300 text-slate-700 text-xs font-medium hover:border-indigo-500 cursor-pointer"
                  >
                    + {c.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* RIGHT COLUMN: STEPS 2, 3, 4 */}
          <div className="space-y-6">
            <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
              <div className="border-b pb-3 flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-extrabold flex items-center justify-center">2</span>
                <h3 className="text-lg font-extrabold text-slate-900">Настройки урока</h3>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={lessonTitle}
                  onChange={e => setLessonTitle(e.target.value)}
                  placeholder="Название урока..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 focus:bg-white rounded-2xl text-xs font-bold text-slate-900 outline-none"
                />

                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={cefrLevel}
                    onChange={e => setCefrLevel(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 outline-none"
                  >
                    <option>A1</option><option>A2</option><option>B1</option><option>B2</option><option>C1</option><option>C2</option>
                  </select>

                  <select
                    value={finalTask}
                    onChange={e => setFinalTask(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 outline-none"
                  >
                    <option value="speaking">Speaking Roulette</option>
                    <option value="writing">Writing Submission</option>
                    <option value="none">Без финального задания</option>
                  </select>
                </div>

                <input
                  type="text"
                  value={contextPrompt}
                  onChange={e => setContextPrompt(e.target.value)}
                  placeholder="Контекст/аудитория (напр. Product Managers at work)"
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-medium text-slate-900 outline-none"
                />
              </div>
            </section>

            <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-3">
              <div className="border-b pb-3 flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-extrabold flex items-center justify-center">3</span>
                <h3 className="text-lg font-extrabold text-slate-900">Грамматика</h3>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addGrammar}
                  onChange={e => setAddGrammar(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-800">Добавить блок правила грамматики</span>
              </label>
            </section>

            <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
              <div className="border-b pb-3 flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-extrabold flex items-center justify-center">4</span>
                <h3 className="text-lg font-extrabold text-slate-900">Структура</h3>
              </div>

              <div className="space-y-2">
                {structureStack.map((item, idx) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-bold">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleMoveStack(idx, -1)} disabled={idx === 0} className="text-slate-400 disabled:opacity-20 cursor-pointer">▲</button>
                      <button onClick={() => handleMoveStack(idx, 1)} disabled={idx === structureStack.length - 1} className="text-slate-400 disabled:opacity-20 cursor-pointer">▼</button>
                      <span>{item.label}</span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                disabled={generating}
                onClick={handleGenerateFromWizard}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white font-extrabold rounded-2xl text-sm shadow-lg disabled:opacity-40 cursor-pointer"
              >
                {generating ? '⌛ Генерация по шагам...' : '✨ Сгенерировать урок'}
              </button>
            </section>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 3. LEGO VISUAL BUILDER CANVAS                                        */}
      {/* -------------------------------------------------------------------- */}
      {mode === 'visual' && (
        <VisualBuilderView
          initialLesson={currentLesson}
          onSaveLesson={onSaveLesson}
          onChangeLesson={l => { setCurrentLesson(l); setJsonText(JSON.stringify(l, null, 2)); }}
          onCancel={onCancel}
        />
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 4. DIRECT RAW JSON EDITOR                                            */}
      {/* -------------------------------------------------------------------- */}
      {mode === 'json' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border">
            <h2 className="text-xl font-bold text-slate-900">Прямое редактирование JSON</h2>
            <button
              onClick={() => onSaveLesson(JSON.parse(jsonText))}
              className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs cursor-pointer"
            >
              Сохранить в D1
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
