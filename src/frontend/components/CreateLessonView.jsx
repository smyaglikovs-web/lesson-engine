import React, { useState, useRef } from 'react';
import { VisualBuilderView } from './VisualBuilderView.jsx';

const DEFAULT_LESSON = {
  title: "New Interactive Lesson",
  level: "B1",
  topic: "General English",
  description: "Interactive lesson created with Lesson Engine.",
  pages: [
    {
      id: "p1",
      title: "Part 1: Introduction",
      blocks: [
        { id: "b1", type: "heading", level: 1, text: "Welcome to the Lesson" },
        { id: "b2", type: "text", text: "Read the story and complete the tasks below." }
      ]
    }
  ]
};

export const CreateLessonView = ({ initialLesson, onSaveLesson, onCancel }) => {
  // Mode selector: 'topic_ai' | 'scan_pdf' | 'visual' | 'json'
  const [mode, setMode] = useState(initialLesson ? 'visual' : 'topic_ai');
  const [currentLesson, setCurrentLesson] = useState(initialLesson || DEFAULT_LESSON);
  const [jsonText, setJsonText] = useState(JSON.stringify(initialLesson || DEFAULT_LESSON, null, 2));

  // 1-CLICK TOPIC GENERATOR STATE
  const [topicInput, setTopicInput] = useState('');
  const [topicLevel, setTopicLevel] = useState('B1');
  const [optionalSourceText, setOptionalSourceText] = useState('');
  const [topicFormat, setTopicFormat] = useState('live');

  // DOCUMENT & PDF SCANNER STATE
  const [docText, setDocText] = useState('');
  const [docTopic, setDocTopic] = useState('');
  const [docLevel, setDocLevel] = useState('C1');
  const [scanningDoc, setScanningDoc] = useState(false);
  const pdfInputRef = useRef(null);

  // Loading & Feedback
  const [generating, setGenerating] = useState(false);
  const [banner, setBanner] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // --------------------------------------------------------------------------
  // 1. FAST TOPIC GENERATION
  // --------------------------------------------------------------------------
  const handleGenerateFromTopic = async () => {
    if (!topicInput.trim()) {
      setErrorMsg('Пожалуйста, введите тему урока (например: Job Interview или Ordering Food).');
      return;
    }

    setGenerating(true);
    setBanner('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicInput.trim(),
          level: topicLevel,
          text: optionalSourceText.trim(),
          format: topicFormat
        })
      });

      const data = await res.json();
      if (res.ok && data.success && data.jsonText) {
        const parsed = JSON.parse(data.jsonText);
        setCurrentLesson(parsed);
        setJsonText(data.jsonText);
        setMode('visual');
        setBanner(`🎉 Урок на тему "${topicInput.trim()}" успешно сгенерирован AI!`);
      } else {
        setErrorMsg(data.error || 'Ошибка генерации. Попробуйте ещё раз.');
      }
    } catch (e) {
      setErrorMsg('Ошибка соединения с AI сервисом.');
    } finally {
      setGenerating(false);
    }
  };

  // --------------------------------------------------------------------------
  // 2. DOCUMENT & PDF TEXTBOOK SCANNER
  // --------------------------------------------------------------------------
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      setDocText(content);
      if (!docTopic) {
        setDocTopic(file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " "));
      }
    };
    reader.readAsText(file);
  };

  const handleScanDocument = async () => {
    if (!docText.trim()) {
      setErrorMsg('Вставьте текст из учебника или загрузите файл для сканирования.');
      return;
    }

    setScanningDoc(true);
    setBanner('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/ai/scan-doc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: docText.trim(),
          topic: docTopic.trim() || 'Scanned Practice Lesson',
          level: docLevel
        })
      });

      const data = await res.json();
      if (res.ok && data.success && data.jsonText) {
        const parsed = JSON.parse(data.jsonText);
        setCurrentLesson(parsed);
        setJsonText(data.jsonText);
        setMode('visual');
        setBanner(`🎉 Учебник/Тест успешно преобразован в интерактивный урок!`);
      } else {
        setErrorMsg(data.error || 'Ошибка сканирования документа.');
      }
    } catch (e) {
      setErrorMsg('Ошибка соединения при сканировании.');
    } finally {
      setScanningDoc(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full min-w-0">
      {/* MODE SELECTION TABS */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-1.5 max-w-2xl mx-auto">
        <button
          type="button"
          onClick={() => setMode('topic_ai')}
          className={`flex-1 min-w-28 py-2.5 rounded-xl font-extrabold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
            mode === 'topic_ai' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          ⚡ Быстрая AI тема
        </button>
        <button
          type="button"
          onClick={() => setMode('scan_pdf')}
          className={`flex-1 min-w-32 py-2.5 rounded-xl font-extrabold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
            mode === 'scan_pdf' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          📄 Сканировать PDF / Учебник
        </button>
        <button
          type="button"
          onClick={() => setMode('visual')}
          className={`flex-1 min-w-28 py-2.5 rounded-xl font-extrabold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
            mode === 'visual' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          🧩 Lego Конструктор
        </button>
        <button
          type="button"
          onClick={() => setMode('json')}
          className={`flex-1 min-w-24 py-2.5 rounded-xl font-extrabold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
            mode === 'json' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          📋 JSON
        </button>
      </div>

      {banner && (
        <div className="p-4 bg-emerald-600 text-white font-bold text-xs rounded-2xl flex justify-between items-center shadow-md animate-fade-in">
          <span>{banner}</span>
          <button type="button" onClick={() => setBanner('')} className="text-white text-base cursor-pointer">✕</button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-600 text-white font-bold text-xs rounded-2xl flex justify-between items-center shadow-md animate-fade-in">
          <span>⚠️ {errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg('')} className="text-white text-base cursor-pointer">✕</button>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 1. FAST 1-CLICK AI GENERATOR BY TOPIC                                */}
      {/* -------------------------------------------------------------------- */}
      {mode === 'topic_ai' && (
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-sm max-w-2xl mx-auto space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">⚡</span>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Генерация урока по теме за 20 секунд</h2>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              Введите тему — AI создаст структурированную историю (220–250 слов), ключевые слова, вопросы и упражнения.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                Тема урока (Topic) *
              </label>
              <input
                type="text"
                value={topicInput}
                onChange={e => setTopicInput(e.target.value)}
                placeholder="например: Twenty One Pilots Breach, Job Interview, Travel in Rome..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-600 rounded-2xl text-sm font-bold text-slate-900 outline-none transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  Уровень CEFR
                </label>
                <select
                  value={topicLevel}
                  onChange={e => setTopicLevel(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-600 rounded-2xl text-xs font-bold text-slate-900 outline-none cursor-pointer"
                >
                  <option>A1</option><option>A2</option><option>B1</option><option>B2</option><option>C1</option><option>C2</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  Формат
                </label>
                <select
                  value={topicFormat}
                  onChange={e => setTopicFormat(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-600 rounded-2xl text-xs font-bold text-slate-900 outline-none cursor-pointer"
                >
                  <option value="live">🟢 Урок с учителем (Live)</option>
                  <option value="homework">📚 Домашнее задание (ДЗ)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                Дополнительный текст или статья (Необязательно)
              </label>
              <textarea
                rows="4"
                value={optionalSourceText}
                onChange={e => setOptionalSourceText(e.target.value)}
                placeholder="Если у вас уже есть конкретный текст или транскрипт, вставьте его сюда..."
                className="w-full p-4 bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-600 rounded-2xl text-xs font-sans text-slate-800 outline-none leading-relaxed"
              ></textarea>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-3 border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="button"
              disabled={generating || !topicInput.trim()}
              onClick={handleGenerateFromTopic}
              className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white font-extrabold rounded-2xl text-xs shadow-md transition disabled:opacity-40 cursor-pointer flex items-center gap-2"
            >
              <span>{generating ? '⌛ AI создаёт урок...' : '🚀 Сгенерировать урок'}</span>
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 2. TEXTBOOK & PDF SCANNER TOOL                                       */}
      {/* -------------------------------------------------------------------- */}
      {mode === 'scan_pdf' && (
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-sm max-w-2xl mx-auto space-y-6 animate-fade-in">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">📄</span>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Преобразование PDF / Учебника в Урок</h2>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              Загрузите сканированный тест или вставьте текст из учебника. AI решит все задания и создаст интерактивный урок.
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  Название учебника / Теста
                </label>
                <input
                  type="text"
                  value={docTopic}
                  onChange={e => setDocTopic(e.target.value)}
                  placeholder="например: Test 35: Advanced Vocabulary"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 focus:bg-white rounded-2xl text-xs font-bold text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  Уровень
                </label>
                <select
                  value={docLevel}
                  onChange={e => setDocLevel(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 focus:bg-white rounded-2xl text-xs font-bold text-slate-900 outline-none cursor-pointer"
                >
                  <option>A1</option><option>A2</option><option>B1</option><option>B2</option><option>C1</option><option>C2</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                  Содержимое учебника / Текст теста *
                </label>
                <label className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold rounded-xl text-xs cursor-pointer transition flex items-center gap-1.5 shadow-2xs">
                  📁 Загрузить файл (.txt / .docx / .json)
                  <input
                    type="file"
                    ref={pdfInputRef}
                    onChange={handleFileUpload}
                    accept=".txt,.json,.csv,.vtt,.docx"
                    className="hidden"
                  />
                </label>
              </div>

              <textarea
                rows="10"
                value={docText}
                onChange={e => setDocText(e.target.value)}
                placeholder="Вставьте скопированный текст из PDF учебника, упражнений или теста... AI автоматически распознает варианты ответов, фразовые глаголы и трансформирует их в интерактивные блоки."
                className="w-full p-4 bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-600 rounded-2xl text-xs font-mono text-slate-900 outline-none leading-relaxed"
              ></textarea>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-3 border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="button"
              disabled={scanningDoc || !docText.trim()}
              onClick={handleScanDocument}
              className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white font-extrabold rounded-2xl text-xs shadow-md transition disabled:opacity-40 cursor-pointer flex items-center gap-2"
            >
              <span>{scanningDoc ? '⌛ AI решает и создаёт урок...' : '🚀 Сканировать и создать урок'}</span>
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 3. LEGO VISUAL BUILDER CANVAS                                        */}
      {/* -------------------------------------------------------------------- */}
      {mode === 'visual' && (
        <VisualBuilderView
          initialLesson={currentLesson}
          onSaveLesson={onSaveLesson}
          onChangeLesson={l => { setCurrentLesson(l); setJsonText(JSON.stringify(l, null, 2)); }}
          onCancel={onCancel}
        />
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 4. DIRECT RAW JSON EDITOR                                            */}
      {/* -------------------------------------------------------------------- */}
      {mode === 'json' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200">
            <h2 className="text-base sm:text-xl font-bold text-slate-900">Прямое редактирование JSON</h2>
            <button
              type="button"
              onClick={() => onSaveLesson(JSON.parse(jsonText))}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs transition"
            >
              Сохранить в D1
            </button>
          </div>
          <textarea
            rows="24"
            value={jsonText}
            onChange={e => {
              setJsonText(e.target.value);
              try {
                setCurrentLesson(JSON.parse(e.target.value));
              } catch (err) {}
            }}
            className="w-full p-4 font-mono text-xs bg-slate-900 text-emerald-400 rounded-2xl outline-none shadow-inner leading-relaxed"
          ></textarea>
        </div>
      )}
    </div>
  );
};
