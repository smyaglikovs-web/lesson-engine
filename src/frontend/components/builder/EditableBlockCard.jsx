import React, { useState } from 'react';
import { BlockVideo } from '../BlockMedia.jsx';
import { compressAndUploadImage, getYouTubeId } from '@utils/youtube.js';

// Auto-cleaner for raw VTT/SRT subtitle files and timestamped text
function cleanVttToSentences(vttText = '') {
  if (!vttText) return '';
  return vttText
    .replace(/^WEBVTT.*/gi, '')
    .replace(/Kind:.*/gi, '')
    .replace(/Language:.*/gi, '')
    .replace(/\d{2}:\d{2}:\d{2}\.\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}\.\d{3}.*/g, '')
    .replace(/\d{2}:\d{2}\.\d{3}\s*-->\s*\d{2}:\d{2}\.\d{3}.*/g, '')
    .replace(/\d{2}:\d{2}\s*-->\s*\d{2}:\d{2}.*/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\[music\]/gi, '')
    .replace(/\[applause\]/gi, '')
    .replace(/\[\w+\]/gi, '')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const EditableBlockCard = ({ block, onChange }) => {
  const [fetchingSubtitles, setFetchingSubtitles] = useState(false);
  const [subtitleStatus, setSubtitleStatus] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

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

  if (block.type === 'image') {
    const images = block.images || (block.url ? [{ url: block.url, caption: block.caption || '' }] : []);

    const updateImg = (idx, field, val) => {
      const updated = [...images];
      updated[idx] = { ...updated[idx], [field]: val };
      onChange({ ...block, images: updated, url: updated[0]?.url || '' });
    };

    const handleAddUrl = () => {
      const url = prompt('Вставьте ссылку на изображение (Image URL):');
      if (url) {
        const updated = [...images, { url, caption: '' }];
        onChange({ ...block, images: updated, url: updated[0]?.url || '' });
      }
    };

    const handleFileUploadCDN = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploadingImage(true);
      try {
        const compressedBase64 = await compressAndUploadImage(file);
        const updated = [...images, { url: compressedBase64, caption: file.name }];
        onChange({ ...block, images: updated, url: updated[0]?.url || '' });
      } catch(err) {
        alert('Ошибка загрузки фото: ' + err.message);
      } finally {
        setUploadingImage(false);
      }
    };

    const removeImg = (idx) => {
      const updated = images.filter((_, i) => i !== idx);
      onChange({ ...block, images: updated, url: updated[0]?.url || '' });
    };

    return (
      <div className="space-y-4">
        <input
          type="text"
          value={block.caption || ''}
          onChange={e => onChange({ ...block, caption: e.target.value })}
          placeholder="Заголовок галереи / описание (Опционально)..."
          className="p-2.5 border rounded-xl text-xs font-bold w-full"
        />

        {images.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {images.map((img, i) => (
              <div key={i} className="p-2 bg-slate-50 border rounded-xl space-y-2 relative group">
                <img src={img.url} alt="Thumb" className="w-full h-28 object-cover rounded-lg border" />
                <input
                  type="text"
                  value={img.caption || ''}
                  onChange={e => updateImg(i, 'caption', e.target.value)}
                  placeholder="Подпись к фото..."
                  className="p-1.5 border rounded-lg text-xs w-full bg-white"
                />
                <button onClick={() => removeImg(i)} className="absolute top-1 right-1 bg-red-600 text-white text-xs w-6 h-6 rounded-full font-bold shadow-md">✕</button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 flex-wrap items-center">
          <button onClick={handleAddUrl} className="px-3.5 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-100 flex items-center gap-1">
            🔗 Добавить картинку по ссылке
          </button>
          <label className="px-3.5 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-100 cursor-pointer flex items-center gap-1">
            {uploadingImage ? '⌛ Обработка фото...' : '📁 Загрузить с ПК / телефона'}
            <input type="file" accept="image/*" onChange={handleFileUploadCDN} disabled={uploadingImage} className="hidden" />
          </label>
        </div>
      </div>
    );
  }

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

    const handleTranscriptInput = (e) => {
      let textVal = e.target.value;
      // Auto-clean WebVTT or SRT timestamps if pasted
      if (textVal.includes('-->') || textVal.includes('WEBVTT')) {
        textVal = cleanVttToSentences(textVal);
      }
      onChange({ ...block, transcript: textVal });
    };

    const handleAutoFetchSubtitles = async () => {
      if (!block.url) return alert('Сначала вставьте ссылку на YouTube видео!');
      setFetchingSubtitles(true);
      setSubtitleStatus('⌛ Извлечение речевого транскрипта из YouTube...');

      const videoId = getYouTubeId(block.url);
      let transcript = null;
      let title = block.title || '';

      // Step 1: Invidious Open CORS Subtitle API (<500ms)
      if (videoId) {
        const invidiousEndpoints = [
          `https://inv.tux.pizza/api/v1/captions/${videoId}?lang=en`,
          `https://invidious.drgns.space/api/v1/captions/${videoId}?lang=en`,
          `https://vid.puffyan.us/api/v1/captions/${videoId}?lang=en`
        ];

        for (const endpoint of invidiousEndpoints) {
          if (transcript) break;
          try {
            const invRes = await fetch(endpoint);
            if (invRes.ok) {
              const vtt = await invRes.text();
              if (vtt && vtt.length > 100) {
                const clean = cleanVttToSentences(vtt);
                if (clean.length > 50) {
                  transcript = clean.slice(0, 3500);
                }
              }
            }
          } catch(e) {}
        }
      }

      // Step 2: Server API Fallback
      if (!transcript) {
        try {
          const res = await fetch('/api/youtube/transcript', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: block.url })
          });
          
          if (res.ok) {
            const data = await res.json();
            if (data.transcript && data.transcript.length > 50) {
              transcript = cleanVttToSentences(data.transcript);
              if (data.title) title = data.title;
            }
          }
        } catch(e) {}
      }

      setFetchingSubtitles(false);

      if (transcript) {
        onChange({ ...block, title: title || block.title, transcript });
        setSubtitleStatus(`✅ Речевой транскрипт загружен! (${transcript.split(' ').length} слов)`);
      } else {
        setSubtitleStatus(`ℹ️ Скопируйте текст из TubeTranscript/YouTube и вставьте в поле ниже — оно автоматически очистит таймкоды!`);
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
            placeholder="Ссылка YouTube (...)"
            className="p-2.5 border rounded-xl text-xs font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold text-slate-500 uppercase">
              📝 Субтитры / Содержание видео (для AI Помощника)
            </label>
            <button
              type="button"
              disabled={fetchingSubtitles || !block.url}
              onClick={handleAutoFetchSubtitles}
              className="px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-xs font-bold transition disabled:opacity-40 cursor-pointer"
            >
              {fetchingSubtitles ? '⌛ Извлечение...' : '🪄 Авто-Извлечь Субтитры'}
            </button>
          </div>

          {subtitleStatus && <p className="text-xs font-semibold text-indigo-600 bg-indigo-50/80 p-2 rounded-lg border border-indigo-100">{subtitleStatus}</p>}

          <textarea
            rows="6"
            value={block.transcript || ''}
            onChange={handleTranscriptInput}
            placeholder="Вставьте сюда текст из TubeTranscript/YouTube — таймкоды очистятся автоматически..."
            className="w-full p-2.5 border rounded-xl text-xs font-sans bg-slate-50 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 leading-relaxed"
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

  if (block.type === 'gap_fill_bank') {
    return (
      <div className="space-y-3">
        <input
          type="text"
          value={block.instruction || ''}
          onChange={e => onChange({ ...block, instruction: e.target.value })}
          placeholder="Инструкция..."
          className="p-2 border rounded-xl text-xs w-full"
        />
        <textarea
          rows="2"
          value={block.text || ''}
          onChange={e => onChange({ ...block, text: e.target.value })}
          placeholder="Текст с правильными ответами в скобках [слово]..."
          className="p-2.5 border rounded-xl text-sm font-medium w-full"
        ></textarea>
        <input
          type="text"
          value={(block.distractors || []).join(', ')}
          onChange={e => onChange({ ...block, distractors: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
          placeholder="Фальшивые доп. слова в банк (через запятую): was, Paris, tomorrow..."
          className="p-2 border rounded-xl text-xs w-full text-amber-700 bg-amber-50/50"
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
