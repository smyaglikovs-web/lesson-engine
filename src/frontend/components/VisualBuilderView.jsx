import React, { useState } from 'react';
import { BlockRenderer } from './BlockRenderer.jsx';
import { BlockVideo } from './BlockMedia.jsx';

// Extract YouTube Video ID
function getYouTubeId(url = '') {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Free Open-Source YouTube Captions Fetcher
const fetchYouTubeTranscriptAuto = async (videoUrl) => {
  const videoId = getYouTubeId(videoUrl);
  if (!videoId) return null;

  try {
    const res = await fetch(`https://yt.lemnoslife.com/nokey/captions?videoId=${videoId}`);
    if (res.ok) {
      const data = await res.json();
      if (data.captionTracks && data.captionTracks.length > 0) {
        const track = data.captionTracks.find(t => t.languageCode === 'en' || t.languageCode?.startsWith('en')) || data.captionTracks[0];
        if (track && track.baseUrl) {
          const subRes = await fetch(track.baseUrl);
          if (subRes.ok) {
            const xmlText = await subRes.text();
            const cleanText = xmlText.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
            if (cleanText.length > 50) return cleanText.slice(0, 3500);
          }
        }
      }
    }
  } catch(e) {}

  return null;
};

const EditableBlockCard = ({ block, onChange }) => {
  const [fetchingSubtitles, setFetchingSubtitles] = useState(false);
  const [subtitleStatus, setSubtitleStatus] = useState('');

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

  // VIDEO BLOCK WITH AUTO SUBTITLE FETCH BUTTON
  if (block.type === 'video') {
    const handleUrlChange = async (newUrl) => {
      onChange({ ...block, url: newUrl });
      if (newUrl.includes('youtube.com') || newUrl.includes('youtu.be')) {
        try {
          const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(newUrl)}&format=json`);
          if (res.ok) {
            const data = await res.json();
            if (data.title) {
              onChange({ ...block, url: newUrl, title: data.title });
            }
          }
        } catch(e) {}
      }
    };

    const handleAutoFetchSubtitles = async () => {
      if (!block.url) return alert('Сначала вставьте ссылку на YouTube видео!');
      setFetchingSubtitles(true);
      setSubtitleStatus('⌛ Извлечение субтитров...');

      const transcript = await fetchYouTubeTranscriptAuto(block.url);
      setFetchingSubtitles(false);

      if (transcript) {
        onChange({ ...block, transcript });
        setSubtitleStatus(`✅ Субтитры загружены (${transcript.split(' ').length} слов)`);
      } else {
        setSubtitleStatus('⚠️ У видео нет доступных английских субтитров. Вставьте описание вручную ниже.');
      }
    };

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
            onChange={e => handleUrlChange(e.target.value)}
            placeholder="Ссылка YouTube (https://www.youtube.com/watch?v=...)"
            className="p-2.5 border rounded-xl text-xs font-mono"
          />
        </div>

        {/* TRANSCRIPT & AUTO-FETCH BUTTON */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold text-slate-500 uppercase">
              📝 Субтитры / Содержание видео (для AI Помощника)
            </label>
            <button
              type="button"
              disabled={fetchingSubtitles || !block.url}
              onClick={handleAutoFetchSubtitles}
              className="px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-xs font-bold transition disabled:opacity-40"
            >
              {fetchingSubtitles ? '⌛ Загрузка субтитров...' : '🪄 Авто-Извлечь Субтитры'}
            </button>
          </div>

          {subtitleStatus && <p className="text-xs font-semibold text-indigo-600">{subtitleStatus}</p>}

          <textarea
            rows="3"
            value={block.transcript || ''}
            onChange={e => onChange({ ...block, transcript: e.target.value })}
            placeholder="Нажмите '🪄 Авто-Извлечь Субтитры' выше, или вставьте субтитры/описание видео вручную сюда..."
            className="w-full p-2.5 border rounded-xl text-xs font-sans bg-slate-50 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
          ></textarea>
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
    else if (type === 'flashcards') newBlock = { ...newBlock, title: 'Ключевые слова', cards: [{ front: 'Word', back: 'Перевод', example: 'Sentence' }] };
    else if (type === 'multiple_choice') newBlock = { ...newBlock, question: 'Вопрос теста?', options: ['Вариант A', 'Вариант B'], correct: 0 };
    else if (type === 'gap_fill') newBlock = { ...newBlock, instruction: 'Заполните пропуск:', text: 'She [is working] today.', answers: ['is working'] };
    else if (type === 'matching') newBlock = { ...newBlock, instruction: 'Соедините пары:', pairs: [{ left: 'Word', right: 'Match' }] };
    else if (type === 'open_input') newBlock = { ...newBlock, prompt: 'Вопрос для обсуждения?' };

    const updatedPages = [...pages];
    updatedPages[activePageIndex].blocks.push(newBlock);
    setPages(updatedPages);
  };

  const handleDragStart = (e, idx) => {
    setDraggedBlockIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIdx !== idx) setDragOverIdx(idx);
  };

  const handleDrop = (e, dropIdx) => {
    e.preventDefault();
    if (draggedBlockIdx === null || draggedBlockIdx === dropIdx) return;

    const updatedPages = [...pages];
    const blocks = updatedPages[activePageIndex].blocks;
    const [draggedBlock] = blocks.splice(draggedBlockIdx, 1);
    blocks.splice(dropIdx, 0, draggedBlock);

    setPages(updatedPages);
    setDraggedBlockIdx(null);
    setDragOverIdx(null);
  };

  const handleDragEnd = () => {
    setDraggedBlockIdx(null);
    setDragOverIdx(null);
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

  const handleAddPage = () => {
    const newPage = {
      id: 'p-' + Date.now(),
      title: `Часть ${pages.length + 1}: Новый раздел`,
      blocks: []
    };
    setPages([...pages, newPage]);
    setActivePageIndex(pages.length);
  };

  const handleDeletePage = (pageIdx) => {
    if (pages.length <= 1) return alert('Урок должен содержать хотя бы 1 страницу!');
    if (!confirm('Удалить эту страницу со всеми её блоками?')) return;
    const updatedPages = pages.filter((_, i) => i !== pageIdx);
    setPages(updatedPages);
    setActivePageIndex(Math.max(0, pageIdx - 1));
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

      {/* Pages Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <span className="text-xs font-bold text-slate-400 uppercase px-2">Страницы:</span>
        {pages.map((p, idx) => (
          <div key={p.id} className="flex items-center gap-1">
            <button
              onClick={() => setActivePageIndex(idx)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex-shrink-0 ${activePageIndex === idx ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-50 border text-slate-700 hover:bg-slate-100'}`}
            >
              {p.title || `Страница ${idx + 1}`}
            </button>
            {pages.length > 1 && activePageIndex === idx && (
              <button onClick={() => handleDeletePage(idx)} className="p-1 text-slate-400 hover:text-red-600 text-xs font-bold" title="Удалить страницу">✕</button>
            )}
          </div>
        ))}
        <button onClick={handleAddPage} className="px-3.5 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition">+ Добавить страницу</button>
      </div>

      {/* Active Page Title Inline Edit */}
      <div className="flex items-center gap-3 bg-indigo
