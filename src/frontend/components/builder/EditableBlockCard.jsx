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

export const EditableBlockCard = ({ block, onChange }) => {
  const [fetchingSubtitles, setFetchingSubtitles] = useState(false);
  const [subtitleStatus, setSubtitleStatus] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Grammar Card State
  const [grammarTopicInput, setGrammarTopicInput] = useState(block.title || '');
  const [generatingGrammar, setGeneratingGrammar] = useState(false);

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
          <option value={1}>H1 (Heading 1)</option>
          <option value={2}>H2 (Heading 2)</option>
          <option value={3}>H3 (Heading 3)</option>
        </select>
        <input
          type="text"
          value={block.text || ''}
          onChange={e => onChange({ ...block, text: e.target.value })}
          placeholder="Enter section heading..."
          className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-slate-800 text-base outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
    );
  }

  if (block.type === 'text') {
    return (
      <div className="space-y-2">
        <textarea
          rows="6"
          value={block.text || ''}
          onChange={e => onChange({ ...block, text: e.target.value })}
          placeholder="Enter or paste reading passage / story text..."
          className="w-full p-3.5 border border-slate-200 rounded-xl text-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed font-sans"
        ></textarea>
      </div>
    );
  }

  if (block.type === 'grammar_card') {
    const examples = Array.isArray(block.examples) ? block.examples : [];
    const updateExample = (idx, val) => {
      const updated = [...examples];
      updated[idx] = val;
      onChange({ ...block, examples: updated });
    };
    const addExample = () => onChange({ ...block, examples: [...examples, 'Example sentence'] });
    const removeExample = (idx) => onChange({ ...block, examples: examples.filter((_, i) => i !== idx) });

    const handleAiAutoBuildRule = async () => {
      if (!grammarTopicInput.trim()) return alert('Type a grammar topic name first (e.g. Third Conditional)');
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
        {/* IN-BLOCK AI RULE BUILDER BAR */}
        <div className="bg-white p-3.5 rounded-2xl border border-indigo-100 space-y-2 shadow-2xs">
          <label className="block text-[11px] font-extrabold text-indigo-900 uppercase tracking-wider">
            🪄 AI Rule Auto-Builder: Type topic name and let AI construct the rule card
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={grammarTopicInput}
              onChange={e => setGrammarTopicInput(e.target.value)}
              placeholder="e.g. Third Conditional, Used to vs Would, Inversion..."
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
            placeholder="Grammar Rule Title (e.g., Third Conditional)..."
            className="p-2.5 border rounded-xl text-sm font-bold w-full bg-white"
          />
          <input
            type="text"
            value={block.formula || ''}
            onChange={e => onChange({ ...block, formula: e.target.value })}
            placeholder="Formula (e.g., Subject + had + V3 + would have + V3)..."
            className="p-2.5 border rounded-xl text-xs font-mono w-full bg-white text-indigo-900 font-bold"
          />
          <textarea
            rows="2"
            value={block.explanation || ''}
            onChange={e => onChange({ ...block, explanation: e.target.value })}
            placeholder="Explanation of rule usage..."
            className="p-2.5 border rounded-xl text-xs w-full leading-relaxed bg-white font-medium"
          ></textarea>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Context Example Sentences:</label>
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
  }

  if (block.type === 'image') {
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

    const handleFileUploadCDN = async (e) => {
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
            {uploadingImage ? '⌛ Processing image...' : '📁 Upload Photo'}
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
        setSubtitleStatus(`ℹ️ Subtitles not fetched automatically. Paste text below.`);
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
            placeholder="YouTube Link (...)"
            className="p-2.5 border rounded-xl text-xs font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold text-slate-500 uppercase">
              📝 Video Transcript / Script (For AI Assistant)
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
        <input
          type="text"
          value={block.text || ''}
          onChange={e => {
            const textVal = e.target.value;
            const match = textVal.match(/\[(.*?)\]/);
            const extractedAns = match ? [match[1]] : (block.answers || []);
            onChange({ ...block, text: textVal, answers: extractedAns });
          }}
          placeholder="Sentence with gap in brackets [correct_answer]..."
          className="p-2.5 border rounded-xl text-sm font-medium w-full"
        />
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
          placeholder="Distractor words for word bank (comma separated): was, Paris, tomorrow..."
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
