import React, { useState } from 'react';
import { BlockRenderer } from './BlockRenderer.jsx';
import { EditableBlockCard } from './builder/EditableBlockCard.jsx';
import { BuilderPalette } from './builder/BuilderPalette.jsx';
import { BuilderAiModal } from './builder/BuilderAiModal.jsx';
import { BuilderPagesBar } from './builder/BuilderPagesBar.jsx';

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
  const [aiModalTarget, setAiModalTarget] = useState(null);
  const [selectedTasks, setSelectedTasks] = useState(['flashcards']);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [previewBlockIds, setPreviewBlockIds] = useState({});
  const [saving, setSaving] = useState(false);

  const [draggedBlockIdx, setDraggedBlockIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

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
    else if (type === 'video') newBlock = { ...newBlock, title: 'Посмотрите видео:', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', transcript: '' };
    else if (type === 'image') newBlock = { ...newBlock, caption: 'Картинки', images: [{ url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d', caption: '' }] };
    else if (type === 'flashcards') newBlock = { ...newBlock, title: 'Ключевые слова', cards: [{ front: 'Word', back: 'Перевод', example: 'Sentence' }] };
    else if (type === 'multiple_choice') newBlock = { ...newBlock, question: 'Вопрос теста?', options: ['Вариант A', 'Вариант B'], correct: 0 };
    else if (type === 'gap_fill') newBlock = { ...newBlock, instruction: 'Заполните пропуск:', text: 'She [is working] today.', answers: ['is working'] };
    else if (type === 'gap_fill_bank') newBlock = { ...newBlock, instruction: '🧩 Заполните пропуски словами из банка:', text: 'She [is flying] to London. They [are meeting] at [night].', distractors: ['was', 'yesterday'] };
    else if (type === 'matching') newBlock = { ...newBlock, instruction: 'Соедините пары:', pairs: [{ left: 'Word', right: 'Match' }] };
    else if (type === 'open_input') newBlock = { ...newBlock, prompt: 'Вопрос для обсуждения?' };

    const updatedPages = [...pages];
    updatedPages[activePageIndex].blocks.push(newBlock);
    setPages(updatedPages);
  };

  const handleDragStart = (e, idx) => { setDraggedBlockIdx(idx); e.dataTransfer.effectAllowed = 'move'; };
  const handleDragOver = (e, idx) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (dragOverIdx !== idx) setDragOverIdx(idx); };
  const handleDrop = (e, dropIdx) => {
    e.preventDefault();
    if (draggedBlockIdx === null || draggedBlockIdx === dropIdx) return;
    const updatedPages = [...pages];
    const blocks = updatedPages[activePageIndex].blocks;
    const [draggedBlock] = blocks.splice(draggedBlockIdx, 1);
    blocks.splice(dropIdx, 0, draggedBlock);
    setPages(updatedPages); setDraggedBlockIdx(null); setDragOverIdx(null);
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

  const handleMoveBlockToPage = (blockIdx, targetPageIndex) => {
    if (targetPageIndex === activePageIndex) return;
    const updatedPages = [...pages];
    const [movedBlock] = updatedPages[activePageIndex].blocks.splice(blockIdx, 1);
    updatedPages[targetPageIndex].blocks.push(movedBlock);
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
    setSelectedTasks(prev => prev.includes(taskKey) ? prev.filter(t => t !== taskKey) : [...prev, taskKey]);
  };

  const handleExecuteAiTasks = async () => {
    if (!aiModalTarget || selectedTasks.length === 0) return;
    setAiGenerating(true);
    try {
      const res = await fetch('/api/ai/transform-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actions: selectedTasks, sourceBlock: aiModalTarget.block, level })
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.newBlocks)) {
        const updatedPages = [...pages];
        const blocks = updatedPages[activePageIndex].blocks;
        const formattedBlocks = data.newBlocks.map((b, i) => ({ ...b, id: `ai-b-${Date.now()}-${i}` }));
        blocks.splice(aiModalTarget.blockIdx + 1, 0, ...formattedBlocks);
        setPages(updatedPages);
        setAiModalTarget(null);
      } else alert('AI ошибка: ' + (data.error || 'Не удалось сгенерировать'));
    } catch (e) { alert('Ошибка: ' + e.message); }
    finally { setAiGenerating(false); }
  };

  const handleAddPage = () => {
    const newPage = { id: 'p-' + Date.now(), title: `Часть ${pages.length + 1}: Новый раздел`, blocks: [] };
    setPages([...pages, newPage]);
    setActivePageIndex(pages.length);
  };

  const handleDeletePage = (pageIdx) => {
    if (pages.length <= 1) return alert('Урок должен содержать хотя бы 1 страницу!');
    if (!confirm('Удалить эту страницу со всеми её блоками?')) return;
    setPages(pages.filter((_, i) => i !== pageIdx));
    setActivePageIndex(Math.max(0, pageIdx - 1));
  };

  const handleSave = async () => {
    setSaving(true);
    await onSaveLesson({ id: 'lesson-' + Date.now(), title, level, topic, description, pages });
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-2 w-full max-w-xl">
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="text-2xl font-extrabold text-slate-900 w-full outline-none border-b border-transparent focus:border-indigo-500" placeholder="Название урока..." />
          <div className="flex gap-3 text-xs">
            <select value={level} onChange={e => setLevel(e.target.value)} className="p-1.5 border rounded-lg font-bold"><option>A1</option><option>A2</option><option>B1</option><option>B2</option><option>C1</option><option>C2</option></select>
            <input type="text" value={topic} onChange={e => setTopic(e.target.value)} className="p-1.5 border rounded-lg w-40" placeholder="Тема..." />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="px-4 py-2.5 border rounded-xl hover:bg-slate-50 text-sm font-medium">Отмена</button>
          <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 text-sm shadow-md">{saving ? 'Сохранение...' : 'Сохранить урок 🎉'}</button>
        </div>
      </div>

      {/* Pages Tabs */}
      <BuilderPagesBar
        pages={pages}
        activePageIndex={activePageIndex}
        setActivePageIndex={setActivePageIndex}
        onAddPage={handleAddPage}
        onDeletePage={handleDeletePage}
        onUpdatePageTitle={(val) => { const u = [...pages]; u[activePageIndex].title = val; setPages(u); }}
      />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <BuilderPalette onAddBlock={handleAddBlock} />

        {/* Center Canvas */}
        <div className="lg:col-span-3 space-y-6">
          {activePage.blocks.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border-2 border-dashed border-slate-200 text-center space-y-3">
              <span className="text-4xl">🧩</span>
              <h3 className="font-bold text-slate-800 text-lg">Страница пуста</h3>
              <p className="text-slate-400 text-xs">Нажмите на инструмент слева, чтобы добавить первый блок!</p>
            </div>
          ) : (
            activePage.blocks.map((b, idx) => (
              <div
                key={b.id || idx}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={(e) => handleDrop(e, idx)}
                className={`bg-white p-6 rounded-2xl border shadow-sm relative transition ${draggedBlockIdx === idx ? 'opacity-30 border-dashed border-indigo-400' : ''} ${dragOverIdx === idx ? 'border-2 border-indigo-600 bg-indigo-50/20 ring-2 ring-indigo-500/20' : 'border-slate-200 hover:border-indigo-300'}`}
              >
                <div className="flex justify-between items-center bg-slate-100 p-2 rounded-xl mb-4 text-xs font-bold border border-slate-200">
                  <div className="flex items-center gap-2">
                    <span draggable onDragStart={(e) => handleDragStart(e, idx)} onDragEnd={() => { setDraggedBlockIdx(null); setDragOverIdx(null); }} className="cursor-grab active:cursor-grabbing p-1 bg-white rounded-lg border border-slate-200 text-slate-400 hover:text-slate-800 text-xs font-mono">⠿ Drag</span>
                    <span className="text-slate-500 uppercase">Блок #{idx + 1}: {b.type}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {pages.length > 1 && (
                      <select value={activePageIndex} onChange={(e) => handleMoveBlockToPage(idx, Number(e.target.value))} className="p-1 bg-white border rounded-lg text-xs font-bold text-slate-600">
                        {pages.map((p, pIdx) => <option key={p.id} value={pIdx}>{pIdx === activePageIndex ? '📄 Тек. страница' : `➡️ На стр. ${pIdx + 1}`}</option>)}
                      </select>
                    )}
                    <button onClick={() => togglePreview(b.id)} className="p-1 px-2.5 bg-white rounded-lg border text-indigo-600 font-bold">{previewBlockIds[b.id] ? '✏️ Редактировать' : '👁️ Предпросмотр'}</button>
                    <button onClick={() => handleMoveBlock(idx, -1)} disabled={idx === 0} className="p-1 px-2 bg-white rounded-lg border disabled:opacity-30">⬆️</button>
                    <button onClick={() => handleMoveBlock(idx, 1)} disabled={idx === activePage.blocks.length - 1} className="p-1 px-2 bg-white rounded-lg border disabled:opacity-30">⬇️</button>
                    <button onClick={() => handleDuplicateBlock(idx)} className="p-1 px-2 bg-white rounded-lg border">📋 Клон</button>
                    <button onClick={() => handleDeleteBlock(idx)} className="p-1 px-2 bg-red-50 text-red-600 rounded-lg border border-red-200">🗑️</button>
                    <button onClick={() => setAiModalTarget({ block: b, blockIdx: idx })} className="ml-2 px-3 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg text-xs">✨ AI Помощник</button>
                  </div>
                </div>
                {previewBlockIds[b.id] ? <BlockRenderer block={b} /> : <EditableBlockCard block={b} onChange={(updated) => handleUpdateBlock(idx, updated)} />}
              </div>
            ))
          )}
        </div>
      </div>

      <BuilderAiModal
        aiModalTarget={aiModalTarget}
        selectedTasks={selectedTasks}
        toggleTaskSelection={(t) => setSelectedTasks(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}
        onExecute={handleExecuteAiTasks}
        onClose={() => setAiModalTarget(null)}
        aiGenerating={aiGenerating}
      />
    </div>
  );
};
