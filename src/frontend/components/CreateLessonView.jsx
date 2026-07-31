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
        {
          "id": "b2",
          "type": "video",
          "title": "Посмотрите обучающее видео:",
          "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        },
        {
          "id": "b3",
          "type": "grammar_card",
          "title": "Правило образования",
          "formula": "Subject + am / is / are + Verb-ing",
          "explanation": "Используется для запланированных действий в будущем.",
          "examples": ["I am meeting my friends tonight.", "She is flying to London tomorrow."]
        }
      ]
    },
    {
      "id": "p2",
      "title": "Часть 2: Интерактивная практика",
      "blocks": [
        {
          "id": "b4",
          "type": "multiple_choice",
          "question": "Какой вариант верный для запланированной встречи завтра?",
          "options": ["I meet my doctor tomorrow", "I am meeting my doctor tomorrow", "I met my doctor tomorrow"],
          "correct": 1,
          "explanation": "Для запланированных встреч используем Present Continuous (am meeting)."
        },
        {
          "id": "b5",
          "type": "matching",
          "instruction": "Соедините слова:",
          "pairs": [
            { "left": "Fly", "right": "Flying" },
            { "left": "Run", "right": "Running" },
            { "left": "Make", "right": "Making" }
          ]
        },
        {
          "id": "b6",
          "type": "open_input",
          "prompt": "Напишите ваши планы на завтра (2 предложения):",
          "placeholder": "Tomorrow I am..."
        }
      ]
    },
    {
      "id": "p3",
      "title": "Часть 3: Домашнее задание",
      "blocks": [
        { "id": "b7", "type": "heading", "level": 2, "text": "Homework: Vocabulary Practice" },
        {
          "id": "b8",
          "type": "gap_fill",
          "instruction": "Заполните пропуск нужной формой глагола:",
          "text": "She [is flying] to London tomorrow morning.",
          "answers": ["is flying"]
        }
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

  const handleEditMedia = (blockId, field, currentVal) => {
    const newUrl = prompt("Вставьте новую ссылку на Медиа (Image URL, MP3 link, or YouTube URL):", currentVal || "");
    if (newUrl === null) return;

    const updatedPages = parsedLesson.pages?.map(page => ({
      ...page,
      blocks: page.blocks.map(b => b.id === blockId ? { ...b, [field]: newUrl } : b)
    }));

    const updatedLesson = { ...parsedLesson, pages: updatedPages };
    setParsedLesson(updatedLesson);
    setJsonText(JSON.stringify(updatedLesson, null, 2));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Создание нового урока (JSON Editor)</h2>
          <p className="text-xs text-slate-500">Вставьте скопированный от AI JSON слева и смотрите интерактивное превью справа</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="px-4 py-2 border rounded-xl hover:bg-slate-100">Отмена</button>
          <button onClick={handleSave} disabled={!!error || saving} className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50">
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
                <BlockRenderer key={b.id} block={b} onEditMedia={handleEditMedia} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
