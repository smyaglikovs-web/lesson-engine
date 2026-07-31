import React, { useState } from 'react';
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
  } catch (err1) {
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

export const CreateLessonView = ({ onSaveLesson, onCancel }) => {
  const [jsonText, setJsonText] = useState(JSON.stringify(DEFAULT_NEW_JSON, null, 2));
  const [parsedLesson, setParsedLesson] = useState(DEFAULT_NEW_JSON);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // AI Generator Modal State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiText, setAiText] = useState('');
  const [aiLevel, setAiLevel] = useState('B1');
  const [aiTopic, setAiTopic] = useState('');
  const [generating, setGenerating] = useState(false);

  const handleJsonChange = (val) => {
    setJsonText(val);
    try {
      var parsed = cleanAndParseJson(val);
      setParsedLesson(parsed);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSave = async () => {
    if (error || !parsedLesson) return;
    setSaving(true);
    const newLesson = { ...parsedLesson, id: 'lesson-' + Date.now() };
    await onSaveLesson(newLesson);
    setSaving(false);
  };

  // Execute Free Cloudflare Workers AI Generation
  const handleGenerateAiLesson = async () => {
    if (!aiText.trim()) return alert('Вставьте текст или материалы учебника');
    setGenerating(true);

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: aiText, level: aiLevel, topic: aiTopic || 'General' })
      });
      const data = await res.json();

      if (data.success && data.jsonText) {
        handleJsonChange(data.jsonText);
        setShowAiModal(false);
        alert('🎉 Урок успешно сгенерирован AI!');
      } else {
        alert('Ошибка AI генератора: ' + (data.error || 'Попробуйте еще раз.'));
      }
    } catch (err) {
      alert('Ошибка при вызове AI: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Конструктор уроков (JSON + AI Generator)</h2>
          <p className="text-xs text-slate-500">Сгенерируйте урок одной кнопкой с помощью AI или отредактируйте JSON вручную</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowAiModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-sm hover:opacity-95 transition text-sm flex items-center gap-2"
          >
            🤖 AI Автогенератор
          </button>
          <button onClick={onCancel} className="px-4 py-2 border rounded-xl hover:bg-slate-100 text-sm">Отмена</button>
          <button onClick={handleSave} disabled={!!error || saving} className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 text-sm">
            {saving ? 'Сохранение...' : 'Сохранить в D1'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          {error && <div className="p-3 mb-3 bg-red-50 text-red-700 rounded-lg text-xs font-mono">{error}</div>}
          <textarea
            rows="24"
            value={jsonText}
            onChange={(e) => handleJsonChange(e.target.value)}
            className="w-full p-4 font-mono text-xs bg-slate-900 text-emerald-400 rounded-xl outline-none shadow-inner"
            placeholder="Вставьте JSON здесь..."
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

      {/* AI GENERATOR MODAL */}
      {showAiModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4 pb-3 border-b">
              <div className="flex items-center gap-2">
                <span className="text-xl">🤖</span>
                <h3 className="text-xl font-bold text-slate-900">Бесплатный AI Генератор Уроков</h3>
              </div>
              <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Уровень языковой подготовки</label>
                  <select value={aiLevel} onChange={e => setAiLevel(e.target.value)} className="w-full p-2.5 border rounded-xl font-medium">
                    <option>A1</option><option>A2</option><option>B1</option><option>B2</option><option>C1</option><option>C2</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Тема урока (Опционально)</label>
                  <input type="text" value={aiTopic} onChange={e => setAiTopic(e.target.value)} placeholder="например: Travel & Airport" className="w-full p-2.5 border rounded-xl" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Текст или материалы из PDF / учебника</label>
                <textarea
                  rows="10"
                  value={aiText}
                  onChange={e => setAiText(e.target.value)}
                  placeholder="Вставьте скопированный текст из PDF, статьи, упражнений Breaking News English или любого учебника..."
                  className="w-full p-3 border rounded-xl text-sm font-sans outline-none focus:ring-2 focus:ring-indigo-500"
                ></textarea>
              </div>

              <div className="p-3 bg-indigo-50 text-indigo-900 rounded-xl text-xs">
                💡 <strong>Как это работает:</strong> Бесплатная модель Cloudflare Workers AI (Llama 3.1 70B) создаст многостраничный урок с флешкартами, грамматикой, сопоставлениями, тестами, порядком слов и ДЗ!
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowAiModal(false)} className="px-4 py-2.5 border rounded-xl text-sm font-medium">Отмена</button>
                <button
                  onClick={handleGenerateAiLesson}
                  disabled={generating || !aiText.trim()}
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-md disabled:opacity-50 text-sm"
                >
                  {generating ? '⌛ AI создаёт интерактивный урок...' : '🚀 Сгенерировать урок'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
