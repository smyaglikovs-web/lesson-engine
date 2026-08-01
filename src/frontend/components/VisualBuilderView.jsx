import React, { useState } from 'react';
import { BlockRenderer } from './BlockRenderer.jsx';

export const VisualBuilderView = ({ onSaveLesson, onCancel }) => {
  const [title, setTitle] = useState('New Interactive Lesson');
  const [level, setLevel] = useState('B1');
  const [topic, setTopic] = useState('General');
  const [description, setDescription] = useState('Visual lesson built with Lego blocks & AI');

  const [pages, setPages] = useState([
    {
      id: 'p1',
      title: 'Part 1: Lesson Materials',
      blocks: [
        { id: 'b1', type: 'heading', level: 1, text: 'Welcome to the Lesson' },
        { id: 'b2', type: 'text', text: 'Paste or type your lesson text here. Then click ✨ AI to generate flashcards, quizzes, or gap-fill exercises directly from this text!' }
      ]
    }
  ]);

  const [activePageIndex, setActivePageIndex] = useState(0);
  const [aiGeneratingBlockId, setAiGeneratingBlockId] = useState(null);
  const [saving, setSaving] = useState(false);

  const activePage = pages[activePageIndex] || pages[0];

  // ADD NEW BLOCKS MANUALLY
  const handleAddBlock = (type) => {
    let newBlock = { id: 'b-' + Date.now(), type };

    if (type === 'heading') newBlock = { ...newBlock, level: 2, text: 'New Heading' };
    else if (type === 'text') newBlock = { ...newBlock, text: 'Enter text content here...' };
    else if (type === 'video') newBlock = { ...newBlock, title: 'Watch Video:', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' };
    else if (type === 'image') newBlock = { ...newBlock, caption: 'Visual image', url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d' };
    else if (type === 'grammar_card') newBlock = { ...newBlock, title: 'Grammar Rule', formula: 'Subject + Verb', explanation: 'Rule explanation...', examples: ['Example sentence'] };
    else if (type === 'flashcards') newBlock = { ...newBlock, title: 'Target Vocabulary', cards: [{ front: 'Word', back: 'Перевод', example: 'Example' }] };
    else if (type === 'multiple_choice') newBlock = { ...newBlock, question: 'Question?', options: ['Option A', 'Option B', 'Option C'], correct: 0, explanation: 'Explanation' };
    else if (type === 'gap_fill') newBlock = { ...newBlock, instruction: 'Fill the gap:', text: 'She [is working] today.', answers: ['is working'] };
    else if (type === 'matching') newBlock = { ...newBlock, instruction: 'Match the pairs:', pairs: [{ left: 'Word', right: 'Match' }] };
    else if (type === 'open_input') newBlock = { ...newBlock, prompt: 'Discussion Question?', placeholder: 'Type your response...' };

    const updatedPages = [...pages];
    updatedPages[activePageIndex].blocks.push(newBlock);
    setPages(updatedPages);
  };

  // BLOCK ACTIONS: Move, Duplicate, Delete
  const handleMoveBlock = (blockIdx, direction) => {
    const targetIdx = blockIdx + direction;
    if (targetIdx < 0 || targetIdx >= activePage.blocks.length) return;
    const updatedPages = [...pages];
    const blocks = updatedPages[activePageIndex].blocks;
    const [moved] = blocks.splice(blockIdx, 1);
    blocks.splice(targetIdx, 0, moved);
    setPages(updatedPages);
  };

  const handleDuplicateBlock = (blockIdx) => {
    const updatedPages = [...pages];
    const original = updatedPages[activePageIndex].blocks[blockIdx];
    const clone = { ...JSON.parse(JSON.stringify(original)), id: 'b-' + Date.now() };
    updatedPages[activePageIndex].blocks.splice(blockIdx + 1, 0, clone);
    setPages(updatedPages);
  };

  const handleDeleteBlock = (blockIdx) => {
    if (!confirm('Удалить этот блок?')) return;
    const updatedPages = [...pages];
    updatedPages[activePageIndex].blocks.splice(blockIdx, 1);
    setPages(updatedPages);
  };

  // BLOCK-LEVEL EMBEDDED AI TRANSFORMATION
  const handleAiTransformBlock = async (sourceBlock, blockIdx, action) => {
    setAiGeneratingBlockId(sourceBlock.id);
    try {
      const res = await fetch('/api/ai/transform-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, sourceBlock, level })
      });
      const data = await res.json();

      if (data.success && data.newBlock) {
        const updatedPages = [...pages];
        const blocks = updatedPages[activePageIndex].blocks;

        // If AI returned a group of blocks (e.g., 4 multiple choice questions), insert all
        if (data.newBlock.type?.endsWith('_group') && Array.isArray(data.newBlock.blocks)) {
          const formattedBlocks = data.newBlock.blocks.map((b, i) => ({ ...b, id: `ai-b-${Date.now()}-${i}` }));
          blocks.splice(blockIdx + 1, 0, ...formattedBlocks);
        } else {
          const formattedBlock = { ...data.newBlock, id: 'ai-b-' + Date.now() };
          blocks.splice(blockIdx + 1, 0, formattedBlock);
        }

        setPages(updatedPages);
      } else {
        alert('AI error: ' + (data.error || 'Could not generate block'));
      }
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setAiGeneratingBlockId(null);
    }
  };

  const handleAddPage = () => {
    const newPage = {
      id: 'p-' + Date.now(),
      title: `Part ${pages.length + 1}: New Section`,
      blocks: []
    };
    setPages([...pages, newPage]);
    setActivePageIndex(pages.length);
  };

  const handleSave = async () => {
    setSaving(true);
    const lessonData = {
      id: 'lesson-' + Date.now(),
      title,
      level,
      topic,
      description,
      pages
    };
    await onSaveLesson(lessonData);
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-2 w-full max-w-xl">
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="text-2xl font-extrabold text-slate-900 w-full outline-none border-b border-transparent focus:border-indigo-500"
            placeholder="Название урока..."
          />
          <div className="flex gap-3 text-xs">
            <select value={level} onChange={e => setLevel(e.target.value)} className="p-1.5 border rounded-lg font-bold">
              <option>A1</option><option>A2</option><option>B1</option><option>B2</option><option>C1</option><option>C2</option>
            </select>
            <input type="text" value={topic} onChange={e => setTopic(e.target.value)} className="p-1.5 border rounded-lg w-40" placeholder="Тема..." />
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={onCancel} className="px-4 py-2.5 border rounded-xl hover:bg-slate-50 text-sm font-medium">Отмена</button>
          <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 text-sm shadow-md">
            {saving ? 'Сохранение...' : 'Сохранить урок 🎉'}
          </button>
        </div>
      </div>

      {/* Pages Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {pages.map((p, idx) => (
          <button
            key={p.id}
            onClick={() => setActivePageIndex(idx)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex-shrink-0 ${activePageIndex === idx ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white border text-slate-600 hover:bg-slate-50'}`}
          >
            {p.title || `Страница ${idx + 1}`}
          </button>
        ))}
        <button onClick={handleAddPage} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold">+ Добавить страницу</button>
      </div>

      {/* Main Builder Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Toolbar (Lego Tools) */}
        <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 h-fit sticky top-20">
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">🛠️ Палитра блоков</h3>
          
          <div className="space-y-1.5 text-xs font-semibold">
            <p className="text-slate-400 text-[10px] uppercase font-bold pt-1">Материалы</p>
            <button onClick={() => handleAddBlock('heading')} className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50 border rounded-xl transition flex items-center gap-2">📝 Заголовок</button>
            <button onClick={() => handleAddBlock('text')} className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50 border rounded-xl transition flex items-center gap-2">📄 Текст / Статья</button>
            <button onClick={() => handleAddBlock('video')} className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50 border rounded-xl transition flex items-center gap-2">🎥 Видео YouTube</button>
            <button onClick={() => handleAddBlock('image')} className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50 border rounded-xl transition flex items-center gap-2">🖼️ Картинка</button>
            <button onClick={() => handleAddBlock('grammar_card')} className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50 border rounded-xl transition flex items-center gap-2">📚 Карточка правила</button>

            <p className="text-slate-400 text-[10px] uppercase font-bold pt-3">Интерактив</p>
            <button onClick={() => handleAddBlock('flashcards')} className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50 border rounded-xl transition flex items-center gap-2">🎴 Флешкарты</button>
            <button onClick={() => handleAddBlock('multiple_choice')} className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50 border rounded-xl transition flex items-center gap-2">❓ Тест (Multiple Choice)</button>
            <button onClick={() => handleAddBlock('gap_fill')} className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50 border rounded-xl transition flex items-center gap-2">✏️ Пропуски в тексте</button>
            <button onClick={() => handleAddBlock('matching')} className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50 border rounded-xl transition flex items-center gap-2">🔗 Сопоставление пар</button>
            <button onClick={() => handleAddBlock('open_input')} className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50 border rounded-xl transition flex items-center gap-2">💬 Разговорный вопрос</button>
          </div>
        </div>

        {/* Center Canvas Page */}
        <div className="lg:col-span-3 space-y-6">
          {activePage.blocks.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border-2 border-dashed border-slate-200 text-center space-y-3">
              <span className="text-4xl">🧩</span>
              <h3 className="font-bold text-slate-800 text-lg">Страница пуста</h3>
              <p className="text-slate-400 text-xs max-w-sm mx-auto">Нажмите на любой инструмент слева, чтобы добавить первый блок материала или упражнения!</p>
            </div>
          ) : (
            activePage.blocks.map((b, idx) => (
              <div key={b.id || idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative group hover:border-indigo-300 transition">
                {/* Floating Block Actions Toolbar */}
                <div className="flex justify-between items-center bg-slate-100 p-2 rounded-xl mb-4 text-xs font-bold border border-slate-200">
                  <span className="text-slate-500 uppercase px-2">Блок #{idx + 1}: {b.type}</span>

                  <div className="flex items-center gap-1">
                    <button onClick={() => handleMoveBlock(idx, -1)} disabled={idx === 0} className="p-1 px-2 bg-white rounded-lg border hover:bg-slate-50 disabled:opacity-30">⬆️</button>
                    <button onClick={() => handleMoveBlock(idx, 1)} disabled={idx === activePage.blocks.length - 1} className="p-1 px-2 bg-white rounded-lg border hover:bg-slate-50 disabled:opacity-30">⬇️</button>
                    <button onClick={() => handleDuplicateBlock(idx)} className="p-1 px-2 bg-white rounded-lg border hover:bg-slate-50">📋 Клон</button>
                    <button onClick={() => handleDeleteBlock(idx)} className="p-1 px-2 bg-red-50 text-red-600 rounded-lg border border-red-200 hover:bg-red-100">🗑️</button>

                    {/* EMBEDDED BLOCK-LEVEL ✨ AI BUTTON */}
                    <div className="relative group/ai ml-2">
                      <button
                        disabled={aiGeneratingBlockId === b.id}
                        className="px-3 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg shadow-xs hover:opacity-95 transition flex items-center gap-1"
                      >
                        {aiGeneratingBlockId === b.id ? '⌛ AI создаёт...' : '✨ AI Помощник'}
                      </button>

                      {/* Contextual AI Dropdown Options */}
                      <div className="absolute right-0 top-full mt-1 hidden group-hover/ai:block bg-slate-900 text-white rounded-xl p-2 shadow-2xl z-30 w-56 text-xs space-y-1">
                        <p className="text-[10px] text-emerald-400 font-bold px-2 py-1 uppercase">Создать из этого блока:</p>
                        
                        {b.type === 'text' && (
                          <>
                            <button onClick={() => handleAiTransformBlock(b, idx, 'flashcards')} className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 rounded-lg">🎴 Сгенерировать Флешкарты</button>
                            <button onClick={() => handleAiTransformBlock(b, idx, 'quiz')} className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 rounded-lg">❓ Создать Тест по тексту</button>
                            <button onClick={() => handleAiTransformBlock(b, idx, 'gap_fill')} className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 rounded-lg">✏️ Создать Пропуски (Gap Fill)</button>
                            <button onClick={() => handleAiTransformBlock(b, idx, 'matching')} className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 rounded-lg">🔗 Сопоставление синонимов</button>
                            <button onClick={() => handleAiTransformBlock(b, idx, 'discussion')} className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 rounded-lg">💬 Вопросы для обсуждения</button>
                          </>
                        )}

                        {b.type === 'flashcards' && (
                          <>
                            <button onClick={() => handleAiTransformBlock(b, idx, 'matching')} className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 rounded-lg">🔗 Превратить в Сопоставление</button>
                            <button onClick={() => handleAiTransformBlock(b, idx, 'quiz')} className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 rounded-lg">❓ Создать Тест по словам</button>
                          </>
                        )}

                        {b.type === 'grammar_card' && (
                          <>
                            <button onClick={() => handleAiTransformBlock(b, idx, 'gap_fill')} className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 rounded-lg">✏️ Задания на правило (Gap Fill)</button>
                            <button onClick={() => handleAiTransformBlock(b, idx, 'reorder')} className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 rounded-lg">🧩 Порядок слов (Reorder)</button>
                          </>
                        )}

                        {b.type !== 'text' && b.type !== 'flashcards' && b.type !== 'grammar_card' && (
                          <button onClick={() => handleAiTransformBlock(b, idx, 'general')} className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 rounded-lg">💡 Создать упражнение к этому блоку</button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Render Block Content */}
                <BlockRenderer block={b} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
