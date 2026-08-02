import React, { useState, useEffect } from 'react';
import { VisualBuilderView } from './VisualBuilderView.jsx';
import { BlockRenderer } from './BlockRenderer.jsx';

const DEFAULT_NEW_JSON = {
  "title": "B1 Grammar & Video Lesson: Present Continuous",
  "level": "B1",
  "topic": "Грамматика и Видео",
  "description": "Урок с поддержкой видео YouTube, аудио, упражнений и домашнего задания.",
  "pages": [
    {
      "id": "p1",
      "title": "Часть 1: Видео и Правило",
      "blocks": [
        { "id": "b1", "type": "heading", "level": 1, "text": "Present Continuous in English" },
        { "id": "b2", "type": "video", "title": "Посмотрите видео:", "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
        { "id": "b3", "type": "grammar_card", "title": "Правило", "formula": "Subject + am/is/are + Verb-ing", "explanation": "Действия в момент речи или планы.", "examples": ["I am working today."] }
      ]
    }
  ]
};

const cleanAndParseJson = (val) => {
  if (!val) return null;
  var tb = String.fromCharCode(96, 96, 96);
  var clean = val.split(tb + 'json').join('').split(tb).join('').trim();
  try {
    return JSON.parse(clean);
  } catch (err) {
    var escSlash = String.fromCharCode(92);
    var fixed = '';
    var inString = false;
    for (var i = 0; i < clean.length; i++) {
      var c = clean.charAt(i);
      var code = clean.charCodeAt(i);
      if (c === '"' && (i === 0 || clean.charAt(i - 1) !== escSlash)) {
        inString = !inString;
        fixed += c;
      } else if (inString && (code === 10 || code === 13)) {
        fixed += escSlash + 'n';
      } else {
        fixed += c;
      }
    }
    return JSON.parse(fixed);
  }
};

// AUTO-MAP LOOSE AI BLOCK TYPES INTO EXACT ENGINE TYPES
function sanitizeLessonStructure(lessonObj) {
  if (!lessonObj || typeof lessonObj !== 'object') return DEFAULT_NEW_JSON;

  let pages = Array.isArray(lessonObj.pages) ? lessonObj.pages : [];
  if (pages.length === 0) {
    if (Array.isArray(lessonObj.blocks)) {
      pages = [{ id: 'p1', title: 'Part 1: Lesson Content', blocks: lessonObj.blocks }];
    } else {
      pages = [{ id: 'p1', title: 'Part 1: Lesson Content', blocks: [] }];
    }
  }

  const sanitizedPages = pages.map((p, pIdx) => {
    const rawBlocks = Array.isArray(p.blocks) ? p.blocks : [];
    const sanitizedBlocks = rawBlocks.map((b, bIdx) => {
      if (!b || typeof b !== 'object') {
        return { id: `b-${pIdx}-${bIdx}`, type: 'heading', level: 2, text: 'Section' };
      }
      
      const blockId = b.id || `b-${pIdx}-${bIdx}-${Date.now()}`;
      let blockType = (b.type || 'text').toLowerCase().trim();

      // Normalize loose AI type names into exact engine types
      if (blockType === 'header' || blockType === 'title') blockType = 'heading';
      if (blockType === 'paragraph' || blockType === 'reading' || blockType === 'article') blockType = 'text';
      if (blockType === 'quiz' || blockType === 'question' || blockType === 'true_false') blockType = 'multiple_choice';
      if (blockType === 'vocab' || blockType === 'words') blockType = 'flashcards';
      if (blockType === 'prompt' || blockType === 'speaking' || blockType === 'discussion') blockType = 'open_input';
      if (blockType === 'rule' || blockType === 'grammar') blockType = 'grammar_card';

      if (blockType === 'heading') {
        return { ...b, id: blockId, type: 'heading', level: b.level || 2, text: b.text || b.title || b.content || 'Section' };
      }
      if (blockType === 'text') {
        return { ...b, id: blockId, type: 'text', text: b.text || b.content || b.story || b.value || '' };
      }
      if (blockType === 'multiple_choice') {
        return {
          ...b,
          id: blockId,
          type: 'multiple_choice',
          question: b.question || b.prompt || 'Question?',
          options: Array.isArray(b.options) && b.options.length > 0 ? b.options : ['Option A', 'Option B'],
          correct: typeof b.correct === 'number' ? b.correct : 0,
          explanation: b.explanation || ''
        };
      }
      if (blockType === 'matching') {
        return {
          ...b,
          id: blockId,
          type: 'matching',
          instruction: b.instruction || 'Match pairs:',
          pairs: Array.isArray(b.pairs) && b.pairs.length > 0 ? b.pairs : [{ left: 'Word', right: 'Match' }]
        };
      }
      if (blockType === 'flashcards') {
        return {
          ...b,
          id: blockId,
          type: 'flashcards',
          title: b.title || 'Vocabulary',
          cards: Array.isArray(b.cards) && b.cards.length > 0 ? b.cards : [{ front: 'Word', back: 'Translation' }]
        };
      }
      if (blockType === 'grammar_card') {
        return {
          ...b,
          id: blockId,
          type: 'grammar_card',
          title: b.title || 'Grammar Rule',
          formula: b.formula || '',
          explanation: b.explanation || '',
          examples: Array.isArray(b.examples) ? b.examples : ['Example sentence']
        };
      }
      if (blockType === 'gap_fill_bank') {
        return {
          ...b,
          id: blockId,
          type: 'gap_fill_bank',
          instruction: b.instruction || 'Fill the gaps:',
          text: b.text || 'Text with [answers] in brackets.',
          distractors: Array.isArray(b.distractors) ? b.distractors : []
        };
      }
      if (blockType === 'gap_fill') {
        return {
          ...b,
          id: blockId,
          type: 'gap_fill',
          instruction: b.instruction || 'Fill the gap:',
          text: b.text || 'Sentence with [answer] in brackets.',
          answers: Array.isArray(b.answers) ? b.answers : ['answer']
        };
      }
      if (blockType === 'open_input') {
        return {
          ...b,
          id: blockId,
          type: 'open_input',
          prompt: b.prompt || b.question || 'Discussion Question?'
        };
      }

      return { ...b, id: blockId, type: 'text', text: b.text || b.content || JSON.stringify(b) };
    });

    return {
      ...p,
      id: p.id || `p${pIdx + 1}`,
      title: p.title || `Part ${pIdx + 1}`,
      blocks: sanitizedBlocks
    };
  });

  return {
    ...lessonObj,
    title: lessonObj.title || 'Interactive English Lesson',
    level: lessonObj.level || 'B1',
    topic: lessonObj.topic || 'General',
    description: lessonObj.description || '',
    pages: sanitizedPages
  };
}

export const CreateLessonView = ({ initialLesson, onSaveLesson, onCancel }) => {
  const [createMode, setCreateMode] = useState('visual');
  const [currentLesson, setCurrentLesson] = useState(initialLesson ? sanitizeLessonStructure(initialLesson) : null);
  const [successBanner, setSuccessBanner] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (initialLesson) {
      const sanitized = sanitizeLessonStructure(initialLesson);
      setCurrentLesson(sanitized);
      setJsonText(JSON.stringify(sanitized, null, 2));
    }
  }, [initialLesson]);

  // JSON Mode State
  const [jsonText, setJsonText] = useState(JSON.stringify(initialLesson || DEFAULT_NEW_JSON, null, 2));
  const [parsedLesson, setParsedLesson] = useState(initialLesson || DEFAULT_NEW_JSON);
  const [jsonError, setJsonError] = useState(null);
  const [savingJson, setSavingJson] = useState(false);

  // Full AI Mode State
  const [aiText, setAiText] = useState('');
  const [aiLevel, setAiLevel] = useState('B1');
  const [aiTopic, setAiTopic] = useState('');
  const [generating, setGenerating] = useState(false);

  const handleJsonChange = (val) => {
    setJsonText(val);
    try {
      var parsed = cleanAndParseJson(val);
      setParsedLesson(parsed);
      setCurrentLesson(parsed);
      setJsonError(null);
    } catch (err) {
      setJsonError(err.message);
    }
  };

  const handleSaveJsonLesson = async () => {
    if (jsonError || !parsedLesson) return;
    setSavingJson(true);
    const newLesson = { ...parsedLesson, id: parsedLesson.id || 'lesson-' + Date.now() };
    await onSaveLesson(newLesson);
    setSavingJson(false);
  };

  const handleGenerateFullAiLesson = async () => {
    if (!aiText.trim() && !aiTopic.trim()) {
      setErrorMessage('Please enter a topic or paste reading text/materials.');
      return;
    }
    setGenerating(true);
    setSuccessBanner('');
    setErrorMessage('');

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: aiText,
          level: aiLevel,
          topic: aiTopic || 'General English Practice'
        })
      });
      const data = await res.json();

      if (data.success && data.jsonText) {
        let generatedLessonObj = cleanAndParseJson(data.jsonText);
        const sanitizedObj = sanitizeLessonStructure(generatedLessonObj);

        setCurrentLesson(sanitizedObj);
        setJsonText(JSON.stringify(sanitizedObj, null, 2));
        setCreateMode('visual'); // OPEN IMMEDIATELY IN VISUAL LEGO BUILDER!
        setSuccessBanner('🎉 Lesson generated by AI! You can now edit, tweak, and drag-and-drop blocks.');
      } else {
        setErrorMessage(data.error || 'AI generation failed. Please try again.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Error calling AI service.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* SUCCESS BANNER */}
      {successBanner && (
        <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-lg flex justify-between items-center font-bold text-sm">
          <span>{successBanner}</span>
          <button onClick={() => setSuccessBanner('')} className="text-white font-extrabold text-base hover:opacity-80 p-1 cursor-pointer">✕</button>
        </div>
      )}

      {/* ERROR BANNER */}
      {errorMessage && (
        <div className="bg-rose-600 text-white p-4 rounded-2xl shadow-lg flex justify-between items-center font-bold text-sm">
          <span>⚠️ {errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="text-white font-extrabold text-base hover:opacity-80 p-1 cursor-pointer">✕</button>
        </div>
      )}

      {/* MODE SWITCHER TABS */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex gap-2 max-w-2xl mx-auto">
        <button
          onClick={() => setCreateMode('visual')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer ${createMode === 'visual' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          🧩 Visual Lego Builder
        </button>
        <button
          onClick={() => setCreateMode('ai')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer ${createMode === 'ai' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          🤖 Full AI Generator
        </button>
        <button
          onClick={() => setCreateMode('json')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer ${createMode === 'json' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          📋 JSON Editor
        </button>
      </div>

      {/* MODE 1: VISUAL LEGO BUILDER */}
      {createMode === 'visual' && (
        <VisualBuilderView initialLesson={currentLesson} onSaveLesson={onSaveLesson} onCancel={onCancel} />
      )}

      {/* MODE 2: FULL AI GENERATOR FROM TEXT/PDF */}
      {createMode === 'ai' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-3xl mx-auto space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-2xl font-bold text-slate-900">🤖 Полная автогенерация урока из текста / PDF</h2>
            <p className="text-slate-500 text-xs mt-1">Вставьте текст статьи или тему, и Cloudflare Workers AI (Llama 3.1 70B) сгенерирует весь урок и откроет его в Lego Конструкторе</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Уровень языковой подготовки</label>
              <select value={aiLevel} onChange={e => setAiLevel(e.target.value)} className="w-full p-3 border rounded-xl font-bold cursor-pointer">
                <option>A1</option><option>A2</option><option>B1</option><option>B2</option><option>C1</option><option>C2</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Тема урока</label>
              <input type="text" value={aiTopic} onChange={e => setAiTopic(e.target.value)} placeholder="например: Ordering Food in Restaurant" className="w-full p-3 border rounded-xl" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Текст или материалы из PDF / статьи</label>
            <textarea
              rows="10"
              value={aiText}
              onChange={e => setAiText(e.target.value)}
              placeholder="Вставьте скопированный текст из PDF, учебника или статьи..."
              className="w-full p-4 border rounded-xl text-sm font-sans outline-none focus:ring-2 focus:ring-indigo-500"
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onCancel} className="px-5 py-3 border rounded-xl font-medium text-sm cursor-pointer">Отмена</button>
            <button
              onClick={handleGenerateFullAiLesson}
              disabled={generating || (!aiText.trim() && !aiTopic.trim())}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-md disabled:opacity-50 text-sm cursor-pointer"
            >
              {generating ? '⌛ AI создаёт полный урок...' : '🚀 Сгенерировать урок'}
            </button>
          </div>
        </div>
      )}

      {/* MODE 3: MANUAL JSON EDITOR */}
      {createMode === 'json' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border">
            <h2 className="text-xl font-bold text-slate-900">📋 Прямое редактирование JSON</h2>
            <div className="flex gap-2">
              <button onClick={onCancel} className="px-4 py-2 border rounded-xl text-sm cursor-pointer">Отмена</button>
              <button onClick={handleSaveJsonLesson} disabled={!!jsonError || savingJson} className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-xl disabled:opacity-50 text-sm cursor-pointer">
                {savingJson ? 'Сохранение...' : 'Сохранить в D1'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              {jsonError && <div className="p-3 mb-3 bg-red-50 text-red-700 rounded-lg text-xs font-mono">{jsonError}</div>}
              <textarea
                rows="24"
                value={jsonText}
                onChange={(e) => handleJsonChange(e.target.value)}
                className="w-full p-4 font-mono text-xs bg-slate-900 text-emerald-400 rounded-xl outline-none shadow-inner"
              ></textarea>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-h-[700px] overflow-y-auto">
              <h1 className="text-2xl font-bold text-slate-900 mb-1">{parsedLesson?.title || 'Без названия'}</h1>
              <p className="text-slate-500 text-sm mb-6">{parsedLesson?.description}</p>
              {parsedLesson?.pages?.map(p => (
                <div key={p.id} className="space-y-4 mb-6 border-b border-slate-100 pb-4">
                  <h3 className="font-bold text-slate-400 text-xs uppercase">{p.title}</h3>
                  {p.blocks?.map(b => (
                    <BlockRenderer key={b.id} block={b} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
