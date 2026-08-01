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
    else if (type === 'multiple_choice') newBlock = { ...newBlock, question: 'Вопрос
