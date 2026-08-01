import React, { useState } from 'react';
import { BlockRenderer } from './BlockRenderer.jsx';
import { BlockVideo } from './BlockMedia.jsx';

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

  if (block.type === 'flashcards') {
    const cards = block.cards || [];
    const updateCard = (idx, field, val) => {
      const updated = [...cards];
      updated[idx] = { ...updated[idx], [field]: val };
      onChange({ ...block, cards: updated });
    };
    const addCard = () => onChange({ ...block, cards: [...cards, { front: 'Word', back: 'Перевод', example: '' }] });
    const removeCard = (idx) => onChange({ ...block, cards: cards.filter((_, i) => i !== idx) });

    return (
      <div className="space-y-3">
        <input
          type="text"
          value={block.title || ''}
          onChange={e => onChange({ ...block, title: e.target.value })}
          placeholder="Заголовок карточек..."
          className="p-2 border rounded-xl text-xs font-bold w-full"
        />
        <div className="space-y-2">
          {cards.map((c, i) => (
            <div key={i} className="flex gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <input
                type="text"
                value={c.front || ''}
                onChange={e => updateCard(i, 'front', e.target.value)}
                placeholder="Слово..."
                className="p-2 border rounded-lg text-xs w-1/3 font-bold bg-white"
              />
              <input
                type="text"
                value={c.back || ''}
                onChange={e => updateCard(i, 'back', e.target.value)}
                placeholder="Перевод..."
                className="p-2 border rounded-lg text-xs w-1/3 bg-white"
              />
              <input
                type="text"
                value={c.example || ''}
                onChange={e => updateCard(i, 'example', e.target.value)}
                placeholder="Пример..."
                className="p-2 border rounded-lg text-xs w-1/3 italic bg-white"
              />
              <button onClick={() => removeCard(i)} className="text-red-500 font-bold px-2">✕</button>
            </div>
          ))}
        </div>
        <button onClick={addCard} className="px-3.5 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold">+ Добавить флешкарту</button>
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
          <label className="text-[10px] font-bold text-slate-400 uppercase">Варианты ответов (отметьте верный):</label>
          {options.map((opt, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                type="radio"
                name={`correct-${block.id}`}
                checked={Number(block.correct) === i}
                onChange={() => onChange({ ...block, correct: i })}
                className="w-4 h-4 accent-indigo-600"
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
          placeholder="Инструкция..."
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
          placeholder="Предложение с пропуском [ответ]..."
          className="p-2.5 border rounded-xl text-sm font-medium w-full"
        />
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
          placeholder="Инструкция..."
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
        <button onClick={addPair} className="px-3.5 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold">+ Добавить пару</button>
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
          placeholder="Вопрос..."
          className="p-2.5 border rounded-xl text-sm font-bold w-full"
        />
      </div>
    );
  }

  return <p className="text-xs text-slate-500">Настройте этот блок при необходимости.</p>;
};

export const VisualBuilderView = ({ onSaveLesson, onCancel }) => {
  const [title, setTitle] = useState('Новый урок');
  const [level, setLevel] = useState('B1');
  const [topic, setTopic] = useState('Общая тема');
  const [description, setDescription] = useState('Интерактивный урок');

  const [pages, setPages] = useState([
    {
      id: 'p1',
      title: 'Часть 1: Материалы урока',
      blocks: [
        { id: 'b1', type: 'heading', level: 1, text: 'Добро пожаловать на урок' },
        { id: 'b2', type: 'text', text: 'Введите сюда текст урока. Нажмите ✨ AI Помощник, чтобы выбрать и сгенерировать точные упражнения к этому тексту!' }
      ]
    }
  ]);

  const [activePageIndex, setActivePageIndex] = useState(0);
  const [aiModalTarget, setAiModalTarget] = useState(null); // { block, blockIdx }
  const [selectedTasks, setSelectedTasks] = useState(['flashcards']);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [previewBlockIds, setPreviewBlockIds] = useState({});
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
    else if (type === 'text') newBlock = { ...newBlock, text: 'Введите текст...' };
    else if (type === 'video') newBlock = { ...newBlock, title: 'Посмотрите видео:', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' };
    else if (type === 'flashcards') newBlock = { ...newBlock, title: 'Ключевые слова', cards: [{ front: 'Word', back: 'Перевод', example: 'Sentence' }] };
    else if (type === 'multiple_choice') newBlock = { ...newBlock, question: 'Вопрос теста?', options: ['Вариант A', 'Вариант B'], correct: 0 };
    else if (type === 'gap_fill') newBlock = { ...newBlock, instruction: 'Заполните пропуск:', text: 'She [is working] today.', answers: ['is working'] };
    else if (type === 'matching') newBlock = { ...newBlock, instruction: 'Соедините пары:', pairs: [{ left: 'Word', right: 'Match' }] };
    else if (type === 'open_input') newBlock = { ...newBlock, prompt: 'Вопрос для обсуждения?' };

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

  const toggleTaskSelection = (taskKey) => {
    if (selectedTasks.includes(taskKey)) {
      setSelectedTasks(selectedTasks.filter(t => t !== taskKey));
    } else {
      setSelectedTasks([...selectedTasks, taskKey]);
    }
  };

  const handleExecuteAiTasks = async () => {
    if (!aiModalTarget || selectedTasks.length === 0) return;
    setAiGenerating(true);

    try {
      const res = await fetch('/api/ai/transform-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actions: selectedTasks,
          sourceBlock: aiModalTarget.block,
          level
        })
      });
      const data = await res.json();

      if (data.success && Array.isArray(data.newBlocks)) {
        const updatedPages = [...pages];
        const blocks = updatedPages[activePageIndex].blocks;
        const formattedBlocks = data.newBlocks.map((b, i) => ({ ...b, id: `ai-b-${Date.now()}-${i}` }));
        
        blocks.splice(aiModalTarget.blockIdx + 1, 0, ...formattedBlocks);
        setPages(updatedPages);
        setAiModalTarget(null);
      } else {
        alert('AI ошибка: ' + (data.error || 'Не удалось сгенерировать'));
      }
    } catch (e) {
      alert('Ошибка: ' + e.message);
    } finally {
      setAiGenerating(false);
    }
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
      {/* Top Bar */}
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

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Palette */}
        <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 h-fit sticky top-20">
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">🛠️ Палитра блоков</h3>
          
          <div className="space-y-1.5 text-xs font-semibold">
            <p className="text-slate-400 text-[10px] uppercase font-bold pt-1">Материалы</p>
            <button onClick={() => handleAddBlock('heading')} className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50 border rounded-xl transition flex items-center gap-2">📝 Заголовок</button>
            <button onClick={() => handleAddBlock('text')} className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50 border rounded-xl transition flex items-center gap-2">📄 Текст / Статья</button>
            <button onClick={() => handleAddBlock('video')} className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50 border rounded-xl transition flex items-center gap-2">🎥 Видео YouTube</button>

            <p className="text-slate-400 text-[10px] uppercase font-bold pt-3">Интерактив</p>
            <button onClick={() => handleAddBlock('flashcards')} className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50 border rounded-xl transition flex items-center gap-2">🎴 Флешкарты</button>
            <button onClick={() => handleAddBlock('multiple_choice')} className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50 border rounded-xl transition flex items-center gap-2">❓ Тест Multiple Choice</button>
            <button onClick={() => handleAddBlock('gap_fill')} className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50 border rounded-xl transition flex items-center gap-2">✏️ Пропуски (Gap Fill)</button>
            <button onClick={() => handleAddBlock('matching')} className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50 border rounded-xl transition flex items-center gap-2">🔗 Сопоставление пар</button>
            <button onClick={() => handleAddBlock('open_input')} className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50 border rounded-xl transition flex items-center gap-2">💬 Вопрос для ответа</button>
          </div>
        </div>

        {/* Center Canvas Page */}
        <div className="lg:col-span-3 space-y-6">
          {activePage.blocks.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border-2 border-dashed border-slate-200 text-center space-y-3">
              <span className="text-4xl">🧩</span>
              <h3 className="font-bold text-slate-800 text-lg">Страница пуста</h3>
              <p className="text-slate-400 text-xs">Нажмите на инструмент слева, чтобы добавить блок!</p>
            </div>
          ) : (
            activePage.blocks.map((b, idx) => {
              const isPreview = previewBlockIds[b.id];
              return (
                <div key={b.id || idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative group hover:border-indigo-300 transition">
                  {/* Floating Toolbar */}
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

                      {/* ✨ AI BUTTON -> OPENS SELECTIVE MODAL */}
                      <button
                        onClick={() => setAiModalTarget({ block: b, blockIdx: idx })}
                        className="ml-2 px-3 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg shadow-xs hover:opacity-95 transition flex items-center gap-1"
                      >
                        ✨ AI Помощник
                      </button>
                    </div>
                  </div>

                  {isPreview ? <BlockRenderer block={b} /> : <EditableBlockCard block={b} onChange={(updated) => handleUpdateBlock(idx, updated)} />}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* SELECTIVE AI MODAL */}
      {aiModalTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b">
              <div className="flex items-center gap-2">
                <span className="text-xl">✨</span>
                <h3 className="font-bold text-slate-900 text-lg">AI Помощник для блока #{aiModalTarget.blockIdx + 1}</h3>
              </div>
              <button onClick={() => setAiModalTarget(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
            </div>

            <p className="text-xs text-slate-500">Отметьте, какие именно задания сгенерировать из этого блока:</p>

            <div className="space-y-2.5 text-sm font-medium">
              <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-indigo-50/50 transition">
                <input type="checkbox" checked={selectedTasks.includes('flashcards')} onChange={() => toggleTaskSelection('flashcards')} className="w-4 h-4 accent-indigo-600" />
                <span>🎴 Только Флешкарты (Слова с переводом)</span>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-indigo-50/50 transition">
                <input type="checkbox" checked={selectedTasks.includes('true_false')} onChange={() => toggleTaskSelection('true_false')} className="w-4 h-4 accent-indigo-600" />
                <span>❓ Только Тест True / False (Правда или Ложь)</span>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-indigo-50/50 transition">
                <input type="checkbox" checked={selectedTasks.includes('gap_fill')} onChange={() => toggleTaskSelection('gap_fill')} className="w-4 h-4 accent-indigo-600" />
                <span>✏️ Только Заполнение пропусков (Gap Fill)</span>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-indigo-50/50 transition">
                <input type="checkbox" checked={selectedTasks.includes('matching')} onChange={() => toggleTaskSelection('matching')} className="w-4 h-4 accent-indigo-600" />
                <span>🔗 Только Сопоставление пар (Синонимы / Перевод)</span>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-indigo-50/50 transition">
                <input type="checkbox" checked={selectedTasks.includes('discussion')} onChange={() => toggleTaskSelection('discussion')} className="w-4 h-4 accent-indigo-600" />
                <span>💬 Только Вопросы для разговорной практики</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setAiModalTarget(null)} className="px-4 py-2.5 border rounded-xl text-xs font-bold">Отмена</button>
              <button
                onClick={handleExecuteAiTasks}
                disabled={selectedTasks.length === 0 || aiGenerating}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl text-xs shadow-md disabled:opacity-40"
              >
                {aiGenerating ? '⌛ AI создаёт...' : `🚀 Сгенерировать (${selectedTasks.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
