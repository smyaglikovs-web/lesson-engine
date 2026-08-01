import React, { useState } from 'react';
import { BlockRenderer } from './BlockRenderer.jsx';
import { BlockVideo } from './BlockMedia.jsx';

// LIVE EDITABLE BLOCK COMPONENT FOR TEACHER CANVAS
const EditableBlockCard = ({ block, onChange }) => {
  if (block.type === 'heading') {
    return (
      <div className="flex gap-2 items-center">
        <select
          value={block.level || 2}
          onChange={e => onChange({ ...block, level: Number(e.target.value) })}
          className="p-2 border rounded-xl text-xs font-bold bg-slate-50"
        >
          <option value={1}>H1 (Заголовок 1)</option>
          <option value={2}>H2 (Заголовок 2)</option>
          <option value={3}>H3 (Заголовок 3)</option>
        </select>
        <input
          type="text"
          value={block.text || ''}
          onChange={e => onChange({ ...block, text: e.target.value })}
          placeholder="Введите заголовок..."
          className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-slate-800 text-lg outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
    );
  }

  if (block.type === 'text') {
    return (
      <textarea
        rows="5"
        value={block.text || ''}
        onChange={e => onChange({ ...block, text: e.target.value })}
        placeholder="Введите или вставьте текст статьи / рассказа..."
        className="w-full p-3.5 border border-slate-200 rounded-xl text-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed font-sans"
      ></textarea>
    );
  }

  if (block.type === 'video') {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            value={block.title || ''}
            onChange={e => onChange({ ...block, title: e.target.value })}
            placeholder="Название видео..."
            className="p-2.5 border rounded-xl text-xs font-semibold"
          />
          <input
            type="text"
            value={block.url || ''}
            onChange={e => onChange({ ...block, url: e.target.value })}
            placeholder="Ссылка YouTube (https://www.youtube.com/watch?v=...)"
            className="p-2.5 border rounded-xl text-xs font-mono"
          />
        </div>
        {block.url && <BlockVideo block={block} />}
      </div>
    );
  }

  if (block.type === 'image') {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            value={block.url || ''}
            onChange={e => onChange({ ...block, url: e.target.value })}
            placeholder="Ссылка на изображение (URL)..."
            className="p-2.5 border rounded-xl text-xs font-mono"
          />
          <input
            type="text"
            value={block.caption || ''}
            onChange={e => onChange({ ...block, caption: e.target.value })}
            placeholder="Подпись к картинке..."
            className="p-2.5 border rounded-xl text-xs font-medium"
          />
        </div>
        {block.url && <img src={block.url} alt="Preview" className="max-h-60 rounded-xl object-cover border" />}
      </div>
    );
  }

  if (block.type === 'flashcards') {
    const cards = block.cards || [];
    const updateCard = (idx, field, val) => {
      const updated = [...cards];
      updated[idx] = { ...updated[idx], [field]: val };
      onChange({ ...block, cards: updated });
    };
    const addCard = () => onChange({ ...block, cards: [...cards, { front: 'New Word', back: 'Перевод', example: '' }] });
    const removeCard = (idx) => onChange({ ...block, cards: cards.filter((_, i) => i !== idx) });

    return (
      <div className="space-y-3">
        <input
          type="text"
          value={block.title || ''}
          onChange={e => onChange({ ...block, title: e.target.value })}
          placeholder="Заголовок карточек (напр. Target Vocabulary)..."
          className="p-2 border rounded-xl text-xs font-bold w-full"
        />
        <div className="space-y-2">
          {cards.map((c, i) => (
            <div key={i} className="flex gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <input
                type="text"
                value={c.front || ''}
                onChange={e => updateCard(i, 'front', e.target.value)}
                placeholder="Слово (Английский)..."
                className="p-2 border rounded-lg text-xs w-1/3 font-bold bg-white"
              />
              <input
                type="text"
                value={c.back || ''}
                onChange={e => updateCard(i, 'back', e.target.value)}
                placeholder="Перевод (Русский)..."
                className="p-2 border rounded-lg text-xs w-1/3 bg-white"
              />
              <input
                type="text"
                value={c.example || ''}
                onChange={e => updateCard(i, 'example', e.target.value)}
                placeholder="Пример (Example)..."
                className="p-2 border rounded-lg text-xs w-1/3 italic bg-white"
              />
              <button onClick={() => removeCard(i)} className="text-red-500 font-bold px-2 hover:bg-red-50 rounded-lg">✕</button>
            </div>
          ))}
        </div>
        <button onClick={addCard} className="px-3.5 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-100">+ Добавить флешкарту</button>
      </div>
    );
  }

  if (block.type === 'multiple_choice') {
    const options = block.options || ['Вариант A', 'Вариант B'];
    const updateOpt = (idx, val) => {
      const updated = [...options];
      updated[idx] = val;
      onChange({ ...block, options: updated });
    };
    const addOpt = () => onChange({ ...block, options: [...options, 'Новый вариант'] });
    const removeOpt = (idx) => onChange({ ...block, options: options.filter((_, i) => i !== idx) });

    return (
      <div className="space-y-3">
        <input
          type="text"
          value={block.question || ''}
          onChange={e => onChange({ ...block, question: e.target.value })}
          placeholder="Вопрос теста..."
          className="p-2.5 border rounded-xl text-sm font-bold w-full"
        />
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Варианты ответов (отметьте правильный):</label>
          {options.map((opt, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                type="radio"
                name={`correct-${block.id}`}
                checked={Number(block.correct) === i}
                onChange={() => onChange({ ...block, correct: i })}
                className="w-4 h-4 accent-indigo-600 cursor-pointer"
              />
              <input
                type="text"
                value={opt}
                onChange={e => updateOpt(i, e.target.value)}
                className="p-2 border rounded-xl text-xs flex-1 bg-white"
              />
              {options.length > 2 && <button onClick={() => removeOpt(i)} className="text-red-500 font-bold px-2">✕</button>}
            </div>
          ))}
        </div>
        <button onClick={addOpt} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold">+ Добавить вариант</button>
        <input
          type="text"
          value={block.explanation || ''}
          onChange={e => onChange({ ...block, explanation: e.target.value })}
          placeholder="Пояснение к правильному ответу..."
          className="p-2 border rounded-xl text-xs w-full text-slate-500"
        />
      </div>
    );
  }

  if (block.type === 'gap_fill') {
    return (
      <div className="space-y-2">
        <input
          type="text"
          value={block.instruction || ''}
          onChange={e => onChange({ ...block, instruction: e.target.value })}
          placeholder="Инструкция (напр. Заполните пропуск:)..."
          className="p-2 border rounded-xl text-xs w-full"
        />
        <input
          type="text"
          value={block.text || ''}
          onChange={e => {
            const textVal = e.target.value;
            const match = textVal.match(/\[(.*?)\]/);
            const extractedAns = match ? [match[1]] : (block.answers || []);
            onChange({ ...block, text: textVal, answers: extractedAns });
          }}
          placeholder="Предложение с пропуском в скобках [правильный_ответ]..."
          className="p-2.5 border rounded-xl text-sm font-medium w-full"
        />
        <p className="text-[11px] text-slate-400">💡 Пример: She <strong className="text-indigo-600">[is working]</strong> today. Ответ автоматически извлекается из скобок!</p>
      </div>
    );
  }

  if (block.type === 'matching') {
    const pairs = block.pairs || [];
    const updatePair = (idx, field, val) => {
      const updated = [...pairs];
      updated[idx] = { ...updated[idx], [field]: val };
      onChange({ ...block, pairs: updated });
    };
    const addPair = () => onChange({ ...block, pairs: [...pairs, { left: 'Слово', right: 'Пара' }] });
    const removePair = (idx) => onChange({ ...block, pairs: pairs.filter((_, i) => i !== idx) });

    return (
      <div className="space-y-3">
        <input
          type="text"
          value={block.instruction || ''}
          onChange={e => onChange({ ...block, instruction: e.target.value })}
          placeholder="Инструкция (напр. Соедините слова:)..."
          className="p-2 border rounded-xl text-xs w-full"
        />
        <div className="space-y-2">
          {pairs.map((p, i) => (
            <div key={i} className="flex gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <input
                type="text"
                value={p.left || ''}
                onChange={e => updatePair(i, 'left', e.target.value)}
                placeholder="Левая сторона..."
                className="p-2 border rounded-lg text-xs flex-1 font-bold bg-white"
              />
              <span className="text-slate-400">➔</span>
              <input
                type="text"
                value={p.right || ''}
                onChange={e => updatePair(i, 'right', e.target.value)}
                placeholder="Правая сторона..."
                className="p-2 border rounded-lg text-xs flex-1 font-bold text-indigo-700 bg-white"
              />
              <button onClick={() => removePair(i)} className="text-red-500 font-bold px-2">✕</button>
            </div>
          ))}
        </div>
        <button onClick={addPair} className="px-3.5 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-100">+ Добавить пару</button>
      </div>
    );
  }

  if (block.type === 'open_input') {
    return (
      <div className="space-y-2">
        <input
          type="text"
          value={block.prompt || ''}
          onChange={e => onChange({ ...block, prompt: e.target.value })}
          placeholder="Вопрос для обсуждения / ответа..."
          className="p-2.5 border rounded-xl text-sm font-bold w-full"
        />
        <input
          type="text"
          value={block.placeholder || ''}
          onChange={e => onChange({ ...block, placeholder: e.target.value })}
          placeholder="Подсказка в поле (Placeholder)..."
          className="p-2 border rounded-xl text-xs w-full text-slate-400"
        />
      </div>
    );
  }

  return <p className="text-xs text-slate-500">Редактирование этого блока выполняется через меню или JSON.</p>;
};

export const VisualBuilderView = ({ onSaveLesson, onCancel }) => {
  const [title, setTitle] = useState('Новый урок');
  const [level, setLevel] = useState('B1');
  const [topic, setTopic] = useState('Общая тема');
  const [description, setDescription] = useState('Урок создан в визуальном конструкторе');

  const [pages, setPages] = useState([
    {
      id: 'p1',
      title: 'Часть 1: Материалы урока',
      blocks: [
        { id: 'b1', type: 'heading', level: 1, text: 'Добро пожаловать на урок' },
        { id: 'b2', type: 'text', text: 'Введите или вставьте сюда текст вашего урока. Затем нажмите ✨ AI Помощник, чтобы сгенерировать флешкарты или тесты прямо из этого текста!' }
      ]
    }
  ]);

  const [activePageIndex, setActivePageIndex] = useState(0);
  const [aiGeneratingBlockId, setAiGeneratingBlockId] = useState(null);
  const [previewBlockIds, setPreviewBlockIds] = useState({}); // { blockId: boolean }
  const [saving, setSaving] = useState(false);

  const activePage = pages[activePageIndex] || pages[0];

  const handleUpdateBlock = (blockIdx, updatedBlock) => {
    const updatedPages = [...pages];
    updatedPages[activePageIndex].blocks[blockIdx] = updatedBlock;
    setPages(updatedPages);
  };

  const togglePreview = (blockId) => {
    setPreviewBlockIds(prev => ({ ...prev, [blockId]: !prev[blockId] }));
  };

  const handleAddBlock = (type) => {
    let newBlock = { id: 'b-' + Date.now(), type };

    if (type === 'heading') newBlock = { ...newBlock, level: 2, text: 'Новый заголовок' };
    else if (type === 'text') newBlock = { ...newBlock, text: 'Введите текст материала...' };
    else if (type === 'video') newBlock = { ...newBlock, title: 'Посмотрите видео:', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' };
    else if (type === 'image') newBlock = { ...newBlock, caption: 'Картинка', url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d' };
    else if (type === 'flashcards') newBlock = { ...newBlock, title: 'Ключевые слова', cards: [{ front: 'Word', back: 'Перевод', example: 'Example sentence' }] };
    else if (type === 'multiple_choice') newBlock = { ...newBlock, question: 'Вопрос теста?', options: ['Вариант A', 'Вариант B', 'Вариант C'], correct: 0, explanation: 'Пояснение' };
    else if (type === 'gap_fill') newBlock = { ...newBlock, instruction: 'Заполните пропуск:', text: 'She [is working] today.', answers: ['is working'] };
    else if (type === 'matching') newBlock = { ...newBlock, instruction: 'Соедините пары:', pairs: [{ left: 'Word', right: 'Match' }] };
    else if (type === 'open_input') newBlock = { ...newBlock, prompt: 'Вопрос для обсуждения?', placeholder: 'Введите ответ...' };

    const updatedPages = [...pages];
    updatedPages[activePageIndex].blocks.push(newBlock);
    setPages(updatedPages);
  };

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

        if (data.newBlock.type?.endsWith('_group') && Array.isArray(data.newBlock.blocks)) {
          const formattedBlocks = data.newBlock.blocks.map((b, i) => ({ ...b, id: `ai-b-${Date.now()}-${i}` }));
          blocks.splice(blockIdx + 1, 0, ...formattedBlocks);
        } else {
          const formattedBlock = { ...data.newBlock, id: 'ai-b-' + Date.now() };
          blocks.splice(blockIdx + 1, 0, formattedBlock);
        }

        setPages(updatedPages);
      } else {
        alert('AI ошибка: ' + (data.error || 'Не удалось сгенерировать'));
      }
    } catch (e) {
      alert('Ошибка: ' + e.message);
    } finally {
      setAiGeneratingBlockId(null);
    }
  };

  const handleAddPage = () => {
    const newPage = {
      id: 'p-' + Date.now(),
      title: `Часть ${pages.length + 1}: Новый раздел`,
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
              <p className="text-slate-400 text-xs max-w-sm mx-auto">Нажмите на любой инструмент слева, чтобы добавить первый блок!</p>
            </div>
          ) : (
            activePage.blocks.map((b, idx) => {
              const isPreview = previewBlockIds[b.id];
              return (
                <div key={b.id || idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative group hover:border-indigo-300 transition">
                  {/* Floating Block Actions Toolbar */}
                  <div className="flex justify-between items-center bg-slate-100 p-2 rounded-xl mb-4 text-xs font-bold border border-slate-200">
                    <span className="text-slate-500 uppercase px-2">Блок #{idx + 1}: {b.type}</span>

                    <div className="flex items-center gap-1">
                      <button onClick={() => togglePreview(b.id)} className="p-1 px-2.5 bg-white rounded-lg border hover:bg-slate-50 text-indigo-600 font-bold">
                        {isPreview ? '✏️ Редактировать' : '👁️ Предпросмотр'}
                      </button>
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

                          {b.type !== 'text' && b.type !== 'flashcards' && (
                            <button onClick={() => handleAiTransformBlock(b, idx, 'general')} className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 rounded-lg">💡 Создать упражнение к этому блоку</button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Render Editable Inputs or Student Preview */}
                  {isPreview ? (
                    <BlockRenderer block={b} />
                  ) : (
                    <EditableBlockCard block={b} onChange={(updated) => handleUpdateBlock(idx, updated)} />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
