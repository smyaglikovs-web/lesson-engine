import React, { useState } from 'react';
import { BlockVideo } from '../BlockMedia.jsx';
import { compressAndUploadImage } from '../../utils/youtube.js';

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

// 1. TEXT BLOCK EDITOR
const TextBlockEditor = ({ block, onChange }) => {
  const [topicInput, setTopicInput] = useState('');
  const [textLength, setTextLength] = useState('250');
  const [generatingText, setGeneratingText] = useState(false);

  const handleAiAutoBuildText = async () => {
    if (!topicInput.trim()) return alert('Type a topic or hint for the reading text first!');
    setGeneratingText(true);
    try {
      const res = await fetch('/api/ai/transform-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actions: ['generate_text_passage'],
          sourceText: topicInput.trim(),
          targetLength: textLength,
          level: 'B1'
        })
      });
      const data = await res.json();
      if (res.ok && data.success && data.newBlocks?.[0]?.text) {
        onChange({ ...block, text: data.newBlocks[0].text });
      } else {
        alert('AI text generation failed. Please try again.');
      }
    } catch (e) {
      alert('Error generating reading text');
    } finally {
      setGeneratingText(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="bg-gradient-to-r from-indigo-50/80 to-purple-50/80 p-3.5 rounded-2xl border border-indigo-100 space-y-2">
        <label className="block text-[11px] font-extrabold text-indigo-900 uppercase tracking-wider">
          🪄 AI Text Auto-Writer: Type a topic and AI will write the passage
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={topicInput}
            onChange={e => setTopicInput(e.target.value)}
            placeholder="e.g. History of Twenty One Pilots, Ordering food..."
            className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex gap-2">
            <select
              value={textLength}
              onChange={e => setTextLength(e.target.value)}
              className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 cursor-pointer"
            >
              <option value="150">Short (~150w)</option>
              <option value="250">Medium (~250w)</option>
              <option value="400">Long (~400w)</option>
            </select>
            <button
              type="button"
              disabled={generatingText || !topicInput.trim()}
              onClick={handleAiAutoBuildText}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs shadow-xs transition disabled:opacity-40 cursor-pointer flex-shrink-0"
            >
              {generatingText ? '⌛ Writing...' : '🪄 AI Write'}
            </button>
          </div>
        </div>
      </div>

      <textarea
        rows="6"
        value={block.text || ''}
        onChange={e => onChange({ ...block, text: e.target.value })}
        placeholder="Enter or paste reading story text..."
        className="w-full p-3.5 border border-slate-200 rounded-xl text-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed font-sans"
      ></textarea>
    </div>
  );
};

// 2. GRAMMAR CARD EDITOR
const GrammarCardEditor = ({ block, onChange }) => {
  const [grammarTopicInput, setGrammarTopicInput] = useState(block.title || '');
  const [generatingGrammar, setGeneratingGrammar] = useState(false);

  const examples = Array.isArray(block.examples) ? block.examples : [];
  const updateExample = (idx, val) => {
    const updated = [...examples];
    updated[idx] = val;
    onChange({ ...block, examples: updated });
  };
  const addExample = () => onChange({ ...block, examples: [...examples, 'Example sentence'] });
  const removeExample = (idx) => onChange({ ...block, examples: examples.filter((_, i) => i !== idx) });

  const handleAiAutoBuildRule = async () => {
    if (!grammarTopicInput.trim()) return alert('Type a grammar topic name first');
    setGeneratingGrammar(true);
    try {
      const res = await fetch('/api/ai/transform-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actions: ['generate_grammar_card'],
          sourceText: grammarTopicInput.trim(),
          level: 'B1'
        })
      });
      const data = await res.json();
      if (res.ok && data.success && data.newBlocks?.[0]) {
        const rule = data.newBlocks[0];
        onChange({
          ...block,
          title: rule.title || grammarTopicInput,
          formula: rule.formula || '',
          explanation: rule.explanation || '',
          examples: Array.isArray(rule.examples) ? rule.examples : ['Example sentence']
        });
      }
    } catch (e) {
      alert('Error auto-building grammar card');
    } finally {
      setGeneratingGrammar(false);
    }
  };

  return (
    <div className="space-y-4 bg-gradient-to-r from-indigo-50/70 to-blue-50/70 p-5 rounded-3xl border border-indigo-100">
      <div className="bg-white p-3.5 rounded-2xl border border-indigo-100 space-y-2 shadow-2xs">
        <label className="block text-[11px] font-extrabold text-indigo-900 uppercase tracking-wider">
          🪄 AI Rule Auto-Builder: Type topic name and let AI construct the rule card
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={grammarTopicInput}
            onChange={e => setGrammarTopicInput(e.target.value)}
            placeholder="e.g. Third Conditional, Used to vs Would..."
            className="flex-1 p-2.5 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="button"
            disabled={generatingGrammar || !grammarTopicInput.trim()}
            onClick={handleAiAutoBuildRule}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs shadow-xs transition disabled:opacity-40 cursor-pointer"
          >
            {generatingGrammar ? '⌛ Building...' : '🪄 AI Build Rule'}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <input
          type="text"
          value={block.title || ''}
          onChange={e => onChange({ ...block, title: e.target.value })}
          placeholder="Grammar Rule Title..."
          className="p-2.5 border rounded-xl text-sm font-bold w-full bg-white"
        />
        <input
          type="text"
          value={block.formula || ''}
          onChange={e => onChange({ ...block, formula: e.target.value })}
          placeholder="Formula (e.g. Subject + had + V3)..."
          className="p-2.5 border rounded-xl text-xs font-mono w-full bg-white text-indigo-900 font-bold"
        />
        <textarea
          rows="2"
          value={block.explanation || ''}
          onChange={e => onChange({ ...block, explanation: e.target.value })}
          placeholder="Explanation of the rule..."
          className="p-2.5 border rounded-xl text-xs w-full leading-relaxed bg-white font-medium"
        ></textarea>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Context Examples:</label>
          {examples.map((ex, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                type="text"
                value={ex}
                onChange={e => updateExample(i, e.target.value)}
                className="p-2 border rounded-xl text-xs flex-1 bg-white font-medium"
              />
              {examples.length > 1 && <button onClick={() => removeExample(i)} className="text-red-500 font-bold px-2 cursor-pointer">✕</button>}
            </div>
          ))}
        </div>
        <button onClick={addExample} className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer">+ Add Example</button>
      </div>
    </div>
  );
};

// 3. TEACHER NOTES EDITOR
const TeacherNotesEditor = ({ block, onChange }) => (
  <div className="space-y-3 bg-amber-50/80 p-4 rounded-2xl border border-amber-200">
    <div className="flex items-center gap-2">
      <span className="text-base">👨‍🏫</span>
      <h5 className="font-extrabold text-amber-950 text-xs uppercase tracking-wider">
        Заметки для Учителя (Скрыты от учеников)
      </h5>
    </div>
    <div>
      <label className="block text-[10px] font-bold text-amber-900 uppercase mb-1">🎯 Цель этапа (Stage Aim):</label>
      <input
        type="text"
        value={block.aim || ''}
        onChange={e => onChange({ ...block, aim: e.target.value })}
        placeholder="например: To practice target collocations in context..."
        className="w-full p-2.5 bg-white border border-amber-300 rounded-xl text-xs font-medium"
      />
    </div>
    <div>
      <label className="block text-[10px] font-bold text-amber-900 uppercase mb-1">💬 You can say (Речевой скрипт для учителя):</label>
      <textarea
        rows="3"
        value={block.speech || ''}
        onChange={e => onChange({ ...block, speech: e.target.value })}
        placeholder="например: Look at these sentences and choose the best option..."
        className="w-full p-2.5 bg-white border border-amber-300 rounded-xl text-xs font-medium"
      ></textarea>
    </div>
  </div>
);

// 4. INLINE SELECT EDITOR
const InlineSelectEditor = ({ block, onChange }) => (
  <div className="space-y-3">
    <input
      type="text"
      value={block.instruction || ''}
      onChange={e => onChange({ ...block, instruction: e.target.value })}
      placeholder="Инструкция к заданию..."
      className="p-2 border rounded-xl text-xs w-full"
    />
    <div className="space-y-1">
      <label className="block text-[10px] font-bold text-indigo-900 uppercase">
        Предложения с выпадающими списками (Укажите звёздочкой * правильный ответ):
      </label>
      <textarea
        rows="5"
        value={block.text || ''}
        onChange={e => onChange({ ...block, text: e.target.value })}
        placeholder="1. We can [stop over* | set off] at Brussels.
2. I like traveling [off the beaten path* | steer clear of]."
        className="w-full p-3 border border-indigo-200 rounded-xl text-xs font-mono bg-slate-900 text-emerald-400 outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
      ></textarea>
    </div>
  </div>
);

// 5. SPINNING WHEEL EDITOR
const SpinningWheelEditor = ({ block, onChange }) => {
  const rawItems = Array.isArray(block.items) ? block.items.join('\n') : '';

  return (
    <div className="space-y-3 bg-purple-50/60 p-4 rounded-2xl border border-purple-200">
      <div className="flex items-center gap-2">
        <span className="text-base">🎡</span>
        <h5 className="font-extrabold text-purple-950 text-xs uppercase tracking-wider">
          Колесо Вопросов и Слов
        </h5>
      </div>
      <input
        type="text"
        value={block.title || ''}
        onChange={e => onChange({ ...block, title: e.target.value })}
        placeholder="Заголовок колеса (e.g. Speaking Warm-Up)..."
        className="w-full p-2 bg-white border rounded-xl text-xs font-bold"
      />
      <div>
        <label className="block text-[10px] font-bold text-purple-900 uppercase mb-1">
          Вопросы или слова для вращения (по одному на строке):
        </label>
        <textarea
          rows="6"
          value={rawItems}
          onChange={e => {
            const list = e.target.value.split('\n').map(s => s.trim()).filter(Boolean);
            onChange({ ...block, items: list });
          }}
          placeholder="What is your favorite travel memory?
Have you ever been disappointed by a famous place?
Where do you plan to go next?"
          className="w-full p-2.5 bg-white border border-purple-200 rounded-xl text-xs font-sans"
        ></textarea>
      </div>
      <label className="flex items-center gap-2 text-xs font-bold text-purple-950 cursor-pointer pt-1">
        <input
          type="checkbox"
          checked={block.eliminateMode || false}
          onChange={e => onChange({ ...block, eliminateMode: e.target.checked })}
          className="w-4 h-4 accent-purple-600 rounded"
        />
        <span>Удалять выпавший вопрос из колеса после ответа</span>
      </label>
    </div>
  );
};

// 6. VIDEO BLOCK EDITOR
const VideoBlockEditor = ({ block, onChange }) => {
  const [fetchingSubtitles, setFetchingSubtitles] = useState(false);
  const [subtitleStatus, setSubtitleStatus] = useState('');

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
    if (textVal.includes('-->') || textVal.includes('WEBVTT')) {
      textVal = cleanVttToSentences(textVal);
    }
    onChange({ ...block, transcript: textVal });
  };

  const handleAutoFetchSubtitles = async () => {
    if (!block.url) return alert('Enter YouTube URL first!');
    setFetchingSubtitles(true);
    setSubtitleStatus('⌛ Extracting transcript...');

    let transcript = null;
    try {
      const res = await fetch('/api/youtube/transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: block.url })
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.transcript) {
          transcript = cleanVttToSentences(data.transcript);
        }
      }
    } catch(e) {}

    setFetchingSubtitles(false);

    if (transcript) {
      onChange({ ...block, transcript });
      setSubtitleStatus(`✅ Transcript loaded! (${transcript.split(' ').length} words)`);
    } else {
      setSubtitleStatus(`ℹ️ Subtitles not found automatically. Please paste transcript below.`);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="text"
          value={block.title || ''}
          onChange={e => onChange({ ...block, title: e.target.value })}
          placeholder="Video Title..."
          className="p-2.5 border rounded-xl text-xs font-semibold"
        />
        <input
          type="text"
          value={block.url || ''}
          onChange={e => handleUrlChange(e.target.value)}
          placeholder="YouTube URL..."
          className="p-2.5 border rounded-xl text-xs font-mono"
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <label className="text-[10px] font-bold text-slate-500 uppercase">
            📝 Video Transcript / Script (Used by AI Assistant)
          </label>
          <button
            type="button"
            disabled={fetchingSubtitles || !block.url}
            onClick={handleAutoFetchSubtitles}
            className="px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-xs font-bold transition disabled:opacity-40 cursor-pointer"
          >
            {fetchingSubtitles ? '⌛ Extracting...' : '🪄 Fetch Subtitles'}
          </button>
        </div>

        {subtitleStatus && <p className="text-xs font-semibold text-indigo-600 bg-indigo-50/80 p-2 rounded-lg border border-indigo-100">{subtitleStatus}</p>}

        <textarea
          rows="5"
          value={block.transcript || ''}
          onChange={handleTranscriptInput}
          placeholder="Paste raw transcripts here..."
          className="w-full p-2.5 border rounded-xl text-xs font-sans bg-slate-50 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 leading-relaxed"
        ></textarea>
      </div>

      {block.url && <BlockVideo block={block} />}
    </div>
  );
};

// 7. IMAGE BLOCK EDITOR
const ImageBlockEditor = ({ block, onChange }) => {
  const [uploadingImage, setUploadingImage] = useState(false);
  const images = Array.isArray(block.images) ? block.images : (block.url ? [{ url: block.url, caption: block.caption || '' }] : []);

  const updateImg = (idx, field, val) => {
    const updated = [...images];
    updated[idx] = { ...updated[idx], [field]: val };
    onChange({ ...block, images: updated, url: updated[0]?.url || '' });
  };

  const handleAddUrl = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      const updated = [...images, { url, caption: '' }];
      onChange({ ...block, images: updated, url: updated[0]?.url || '' });
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const compressedBase64 = await compressAndUploadImage(file);
      const updated = [...images, { url: compressedBase64, caption: file.name }];
      onChange({ ...block, images: updated, url: updated[0]?.url || '' });
    } catch(err) {
      alert('Image upload error: ' + err.message);
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
        placeholder="Gallery caption / description..."
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
                placeholder="Caption..."
                className="p-1.5 border rounded-lg text-xs w-full bg-white"
              />
              <button onClick={() => removeImg(i)} className="absolute top-1 right-1 bg-red-600 text-white text-xs w-6 h-6 rounded-full font-bold shadow-md cursor-pointer">✕</button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 flex-wrap items-center">
        <button onClick={handleAddUrl} className="px-3.5 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-100 cursor-pointer flex items-center gap-1">
          🔗 Add Image URL
        </button>
        <label className="px-3.5 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-100 cursor-pointer flex items-center gap-1">
          {uploadingImage ? '⌛ Compressing photo...' : '📁 Upload Photo'}
          <input type="file" accept="image/*" onChange={handleFileUpload} disabled={uploadingImage} className="hidden" />
        </label>
      </div>
    </div>
  );
};

// 8. AUDIO BLOCK EDITOR
const AudioBlockEditor = ({ block, onChange }) => (
  <div className="space-y-3">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <input
        type="text"
        value={block.title || ''}
        onChange={e => onChange({ ...block, title: e.target.value })}
        placeholder="Audio Title..."
        className="p-2.5 border rounded-xl text-xs font-semibold"
      />
      <input
        type="text"
        value={block.url || ''}
        onChange={e => onChange({ ...block, url: e.target.value })}
        placeholder="Direct MP3 / Audio URL..."
        className="p-2.5 border rounded-xl text-xs font-mono"
      />
    </div>
    <textarea
      rows="3"
      value={block.transcript || ''}
      onChange={e => onChange({ ...block, transcript: e.target.value })}
      placeholder="Audio transcript (optional, visible to students via toggle)..."
      className="w-full p-2.5 border rounded-xl text-xs"
    ></textarea>
  </div>
);

// 9. SENTENCE REORDER EDITOR
const SentenceReorderEditor = ({ block, onChange }) => {
  const words = (block.sentence || '').trim().split(' ').filter(Boolean);
  return (
    <div className="space-y-3">
      <input
        type="text"
        value={block.instruction || ''}
        onChange={e => onChange({ ...block, instruction: e.target.value })}
        placeholder="Instruction..."
        className="p-2 border rounded-xl text-xs w-full"
      />
      <input
        type="text"
        value={block.sentence || ''}
        onChange={e => onChange({ ...block, sentence: e.target.value })}
        placeholder="Target sentence (e.g. She had never seen such a dress before.)..."
        className="p-2.5 border rounded-xl text-sm font-bold w-full"
      />
      {words.length > 0 && (
        <div className="p-3 bg-slate-50 border rounded-xl space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Слова для перемешивания:</label>
          <div className="flex flex-wrap gap-1.5">
            {words.map((w, i) => (
              <span key={i} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-indigo-700">
                {w}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// 10. CATEGORIZATION / BUCKETS EDITOR
const CategorizationEditor = ({ block, onChange }) => {
  const categories = block.categories || ['Категория 1', 'Категория 2'];
  const items = block.items || [];

  const updateCategory = (idx, val) => {
    const updated = [...categories];
    updated[idx] = val;
    onChange({ ...block, categories: updated });
  };
  const addCategory = () => onChange({ ...block, categories: [...categories, `Категория ${categories.length + 1}`] });
  const removeCategory = (idx) => {
    const updated = categories.filter((_, i) => i !== idx);
    onChange({ ...block, categories: updated });
  };

  const updateItem = (idx, field, val) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: val };
    onChange({ ...block, items: updated });
  };
  const addItem = () => onChange({
    ...block,
    items: [...items, { id: `it-${Date.now()}`, text: 'Новое слово', categoryIndex: 0 }]
  });
  const removeItem = (idx) => {
    const updated = items.filter((_, i) => i !== idx);
    onChange({ ...block, items: updated });
  };

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={block.instruction || ''}
        onChange={e => onChange({ ...block, instruction: e.target.value })}
        placeholder="Instruction..."
        className="p-2 border rounded-xl text-xs w-full"
      />

      <div className="space-y-2 bg-indigo-50/50 p-3.5 rounded-2xl border border-indigo-100">
        <label className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider">Категории (Коробки):</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {categories.map((cat, idx) => (
            <div key={idx} className="flex gap-1.5 items-center">
              <input
                type="text"
                value={cat}
                onChange={e => updateCategory(idx, e.target.value)}
                className="p-2 border rounded-xl text-xs font-bold flex-1 bg-white"
              />
              {categories.length > 2 && (
                <button onClick={() => removeCategory(idx)} className="text-red-500 font-bold px-2 cursor-pointer">✕</button>
              )}
            </div>
          ))}
        </div>
        <button onClick={addCategory} className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold cursor-pointer">+ Добавить категорию</button>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Слова для сортировки:</label>
        <div className="space-y-2">
          {items.map((it, idx) => (
            <div key={it.id || idx} className="flex gap-2 items-center bg-slate-50 p-2 rounded-xl border">
              <input
                type="text"
                value={it.text || ''}
                onChange={e => updateItem(idx, 'text', e.target.value)}
                placeholder="Слово..."
                className="p-2 border rounded-lg text-xs flex-1 bg-white font-bold"
              />
              <select
                value={it.categoryIndex ?? 0}
                onChange={e => updateItem(idx, 'categoryIndex', Number(e.target.value))}
                className="p-2 border rounded-lg text-xs bg-white font-semibold cursor-pointer"
              >
                {categories.map((cat, cIdx) => (
                  <option key={cIdx} value={cIdx}>{cat}</option>
                ))}
              </select>
              <button onClick={() => removeItem(idx)} className="text-red-500 font-bold px-2 cursor-pointer">✕</button>
            </div>
          ))}
        </div>
        <button onClick={addItem} className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer">+ Добавить слово</button>
      </div>
    </div>
  );
};

// MAIN EDITABLE BLOCK CARD ROUTER
export const EditableBlockCard = ({ block, onChange }) => {
  if (!block || typeof block !== 'object') {
    return <p className="text-xs text-slate-400 font-medium">Invalid block data.</p>;
  }

  if (block.type === 'heading') {
    return (
      <div className="flex gap-2 items-center">
        <select
          value={block.level || 2}
          onChange={e => onChange({ ...block, level: Number(e.target.value) })}
          className="p-2 border rounded-xl text-xs font-bold bg-slate-50 cursor-pointer"
        >
          <option value={1}>H1 (Заголовок 1)</option>
          <option value={2}>H2 (Заголовок 2)</option>
          <option value={3}>H3 (Подзаголовок)</option>
        </select>
        <input
          type="text"
          value={block.text || ''}
          onChange={e => onChange({ ...block, text: e.target.value })}
          placeholder="Текст заголовка..."
          className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-slate-800 text-base outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
    );
  }

  if (block.type === 'text') {
    return <TextBlockEditor block={block} onChange={onChange} />;
  }

  if (block.type === 'grammar_card') {
    return <GrammarCardEditor block={block} onChange={onChange} />;
  }

  if (block.type === 'teacher_notes') {
    return <TeacherNotesEditor block={block} onChange={onChange} />;
  }

  if (block.type === 'inline_select') {
    return <InlineSelectEditor block={block} onChange={onChange} />;
  }

  if (block.type === 'spinning_wheel') {
    return <SpinningWheelEditor block={block} onChange={onChange} />;
  }

  if (block.type === 'image') {
    return <ImageBlockEditor block={block} onChange={onChange} />;
  }

  if (block.type === 'video') {
    return <VideoBlockEditor block={block} onChange={onChange} />;
  }

  if (block.type === 'audio') {
    return <AudioBlockEditor block={block} onChange={onChange} />;
  }

  if (block.type === 'sentence_reorder') {
    return <SentenceReorderEditor block={block} onChange={onChange} />;
  }

  if (block.type === 'categorization') {
    return <CategorizationEditor block={block} onChange={onChange} />;
  }

  if (block.type === 'flashcards') {
    const cards = Array.isArray(block.cards) ? block.cards : [];
    const updateCard = (idx, field, val) => {
      const updated = [...cards];
      updated[idx] = { ...updated[idx], [field]: val };
      onChange({ ...block, cards: updated });
    };
    const addCard = () => onChange({ ...block, cards: [...cards, { front: 'Word', back: 'Translation', example: '' }] });
    const removeCard = (idx) => onChange({ ...block, cards: cards.filter((_, i) => i !== idx) });

    return (
      <div className="space-y-3">
        <input
          type="text"
          value={block.title || ''}
          onChange={e => onChange({ ...block, title: e.target.value })}
          placeholder="Flashcards Title..."
          className="p-2 border rounded-xl text-xs font-bold w-full"
        />
        <div className="space-y-2">
          {cards.map((c, i) => (
            <div key={i} className="flex gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <input
                type="text"
                value={c.front || ''}
                onChange={e => updateCard(i, 'front', e.target.value)}
                placeholder="Target Word..."
                className="p-2 border rounded-lg text-xs w-1/3 font-bold bg-white"
              />
              <input
                type="text"
                value={c.back || ''}
                onChange={e => updateCard(i, 'back', e.target.value)}
                placeholder="Translation / Definition..."
                className="p-2 border rounded-lg text-xs w-1/3 bg-white"
              />
              <input
                type="text"
                value={c.example || ''}
                onChange={e => updateCard(i, 'example', e.target.value)}
                placeholder="Context Example Sentence..."
                className="p-2 border rounded-lg text-xs w-1/3 italic bg-white"
              />
              <button onClick={() => removeCard(i)} className="text-red-500 font-bold px-2 cursor-pointer">✕</button>
            </div>
          ))}
        </div>
        <button onClick={addCard} className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer">+ Add Flashcard</button>
      </div>
    );
  }

  if (block.type === 'multiple_choice') {
    const options = Array.isArray(block.options) ? block.options : ['Option A', 'Option B'];
    const updateOpt = (idx, val) => {
      const updated = [...options];
      updated[idx] = val;
      onChange({ ...block, options: updated });
    };
    const addOpt = () => onChange({ ...block, options: [...options, 'New Option'] });
    const removeOpt = (idx) => onChange({ ...block, options: options.filter((_, i) => i !== idx) });

    return (
      <div className="space-y-3">
        <input
          type="text"
          value={block.question || ''}
          onChange={e => onChange({ ...block, question: e.target.value })}
          placeholder="Quiz question..."
          className="p-2.5 border rounded-xl text-sm font-bold w-full"
        />
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Answer Options (Select correct radio):</label>
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
                className="p-2 border rounded-xl text-xs flex-1 bg-white font-medium"
              />
              {options.length > 2 && <button onClick={() => removeOpt(i)} className="text-red-500 font-bold px-2 cursor-pointer">✕</button>}
            </div>
          ))}
        </div>
        <button onClick={addOpt} className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold cursor-pointer">+ Add Option</button>
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
          placeholder="Instruction..."
          className="p-2 border rounded-xl text-xs w-full"
        />
        <textarea
          rows="4"
          value={block.text || ''}
          onChange={e => {
            const textVal = e.target.value;
            const matches = [...textVal.matchAll(/\[(.*?)\]/g)].map(m => m[1].trim());
            onChange({ ...block, text: textVal, answers: matches });
          }}
          placeholder="Sentences with gaps in brackets:
1. Yesterday she [went] to school.
2. They [have seen] this movie before."
          className="p-2.5 border rounded-xl text-sm font-medium w-full font-mono leading-relaxed"
        ></textarea>
        <p className="text-[11px] text-slate-400">Распознанные ответы: <strong className="text-indigo-600 font-bold">{block.answers?.join(', ') || 'нет'}</strong></p>
      </div>
    );
  }

  if (block.type === 'gap_fill_bank') {
    const distractors = Array.isArray(block.distractors) ? block.distractors : [];
    return (
      <div className="space-y-3">
        <input
          type="text"
          value={block.instruction || ''}
          onChange={e => onChange({ ...block, instruction: e.target.value })}
          placeholder="Instruction..."
          className="p-2 border rounded-xl text-xs w-full"
        />
        <textarea
          rows="3"
          value={block.text || ''}
          onChange={e => onChange({ ...block, text: e.target.value })}
          placeholder="Paragraph with correct answers in brackets [word]..."
          className="p-2.5 border rounded-xl text-sm font-medium w-full leading-relaxed"
        ></textarea>
        <input
          type="text"
          value={distractors.join(', ')}
          onChange={e => onChange({ ...block, distractors: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
          placeholder="Distractor words (comma separated): was, Paris, tomorrow..."
          className="p-2 border rounded-xl text-xs w-full text-amber-800 bg-amber-50/50"
        />
      </div>
    );
  }

  if (block.type === 'matching') {
    const pairs = Array.isArray(block.pairs) ? block.pairs : [];
    const updatePair = (idx, field, val) => {
      const updated = [...pairs];
      updated[idx] = { ...updated[idx], [field]: val };
      onChange({ ...block, pairs: updated });
    };
    const addPair = () => onChange({ ...block, pairs: [...pairs, { left: 'Word', right: 'Match' }] });
    const removePair = (idx) => onChange({ ...block, pairs: pairs.filter((_, i) => i !== idx) });

    return (
      <div className="space-y-3">
        <input
          type="text"
          value={block.instruction || ''}
          onChange={e => onChange({ ...block, instruction: e.target.value })}
          placeholder="Instruction..."
          className="p-2 border rounded-xl text-xs w-full"
        />
        <div className="space-y-2">
          {pairs.map((p, i) => (
            <div key={i} className="flex gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <input
                type="text"
                value={p.left || ''}
                onChange={e => updatePair(i, 'left', e.target.value)}
                placeholder="Left word..."
                className="p-2 border rounded-lg text-xs flex-1 font-bold bg-white"
              />
              <span className="text-slate-400">➔</span>
              <input
                type="text"
                value={p.right || ''}
                onChange={e => updatePair(i, 'right', e.target.value)}
                placeholder="Right pair..."
                className="p-2 border rounded-lg text-xs flex-1 font-bold text-indigo-700 bg-white"
              />
              <button onClick={() => removePair(i)} className="text-red-500 font-bold px-2 cursor-pointer">✕</button>
            </div>
          ))}
        </div>
        <button onClick={addPair} className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer">+ Add Pair</button>
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
          placeholder="Discussion question / Prompt..."
          className="p-2.5 border rounded-xl text-sm font-bold w-full"
        />
      </div>
    );
  }

  return <p className="text-xs text-slate-500">Configure block options as needed.</p>;
};
