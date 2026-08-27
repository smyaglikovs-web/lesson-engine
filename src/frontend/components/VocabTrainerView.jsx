import React, { useState } from 'react';
import { parseWordListText, generateVocabLesson } from '../utils/vocabParser.js';

export const VocabTrainerView = ({ onSaveLesson, onCancel }) => {
  const [inputText, setInputText] = useState('');
  const [topicTitle, setTopicTitle] = useState('Appearance & Clothes Vocabulary');
  const [level, setLevel] = useState('B2');
  const [parsedWords, setParsedWords] = useState([]);
  const [saving, setSaving] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');

  const handleTextChange = (text) => {
    setInputText(text);
    const parsed = parseWordListText(text);
    setParsedWords(parsed);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      handleTextChange(content);
    };
    reader.readAsText(file);
  };

  const handleCreateAndSave = async () => {
    if (parsedWords.length === 0) {
      alert('Пожалуйста, вставьте список слов или загрузите файл.');
      return;
    }

    setSaving(true);
    try {
      const lessonObj = generateVocabLesson(topicTitle, level, parsedWords);
      await onSaveLesson(lessonObj);
      
      const shareUrl = `${window.location.origin}/?trainer=${lessonObj.id}`;
      setGeneratedLink(shareUrl);
    } catch (e) {
      alert('Ошибка создания тренажёра: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    alert('🔗 Ссылка для учеников скопирована в буфер обмена!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex justify-between items-start border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-3xl">🎴</span>
              <h2 className="text-2xl font-extrabold text-slate-900">Генератор Vocab Trainer</h2>
            </div>
            <p className="text-slate-500 text-xs mt-1">
              Вставьте слова с табуляцией (<code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600">Слово [Tab] Перевод [Tab] Пример</code>) или загрузите файл.
            </p>
          </div>
          <button onClick={onCancel} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer">
            ✕ Закрыть
          </button>
        </div>

        {/* SETTINGS BAR */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-1">
            <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider">Название темы</label>
            <input
              type="text"
              value={topicTitle}
              onChange={e => setTopicTitle(e.target.value)}
              placeholder="например: Clothes & Appearance B2"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 focus:bg-white rounded-xl text-sm font-bold text-slate-900 outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider">Уровень</label>
            <select
              value={level}
              onChange={e => setLevel(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 focus:bg-white rounded-xl text-sm font-bold text-slate-900 outline-none cursor-pointer"
            >
              <option>A1</option><option>A2</option><option>B1</option><option>B2</option><option>C1</option><option>C2</option>
            </select>
          </div>
        </div>

        {/* INPUT & FILE UPLOAD */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider">Вставьте список слов:</label>
            <label className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-extrabold cursor-pointer transition flex items-center gap-1.5">
              📁 Загрузить файл (.txt / .tsv / .csv)
              <input type="file" accept=".txt,.tsv,.csv" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
          <textarea
            rows="8"
            value={inputText}
            onChange={e => handleTextChange(e.target.value)}
            placeholder="Garment	Предмет одежды	We speak about ourselves in the language of garments.
Be liable to	Быть склонным к...	Others are liable to judge quickly."
            className="w-full p-4 border border-slate-200 rounded-2xl text-xs font-mono bg-slate-900 text-emerald-400 outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
          ></textarea>
        </div>

        {/* PARSED PREVIEW STATS */}
        {parsedWords.length > 0 && (
          <div className="bg-indigo-50/80 p-4 rounded-2xl border border-indigo-100 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-extrabold text-indigo-900 uppercase">
                Распознано слов: <strong className="text-indigo-600 text-sm">{parsedWords.length}</strong>
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                Будет создано 4 этапа: Карточки ➔ Пары ➔ Тест ➔ Контекстные пропуски
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-2">
              {parsedWords.map((w, idx) => (
                <div key={idx} className="bg-white p-2.5 rounded-xl border border-indigo-100 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px]">{idx + 1}</span>
                    <strong className="text-slate-900">{w.word}</strong>
                    <span className="text-slate-400">➔</span>
                    <span className="text-indigo-700 font-medium">{w.translation}</span>
                  </div>
                  {w.example && <span className="text-slate-400 italic text-[11px] max-w-xs truncate">"{w.example}"</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GENERATED LINK SUCCESS MODAL */}
        {generatedLink && (
          <div className="bg-emerald-50 border-2 border-emerald-500 p-5 rounded-2xl space-y-3 animate-fade-in">
            <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-base">
              <span>🎉</span>
              <span>Vocab Trainer успешно создан и сохранён!</span>
            </div>
            <p className="text-xs text-slate-600">
              Отправьте эту ссылку ученикам. Каждый ученик введёт своё имя, пройдёт 4 этапа, а результаты сохранятся у вас в базе.
            </p>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                readOnly
                value={generatedLink}
                className="w-full p-3 bg-white border border-emerald-300 rounded-xl text-xs font-mono text-slate-800 font-bold"
              />
              <button
                onClick={copyToClipboard}
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-md transition cursor-pointer flex-shrink-0"
              >
                📋 Копировать
              </button>
              <a
                href={generatedLink}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-3 bg-slate-900 text-white font-bold rounded-xl text-xs shadow-md hover:bg-slate-800 flex-shrink-0"
              >
                ▶ Тест
              </a>
            </div>
          </div>
        )}

        {/* ACTION BUTTON */}
        {!generatedLink && (
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onCancel} className="px-5 py-2.5 border rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer">
              Отмена
            </button>
            <button
              onClick={handleCreateAndSave}
              disabled={saving || parsedWords.length === 0}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-sm shadow-md transition disabled:opacity-40 cursor-pointer"
            >
              {saving ? '⌛ Создание и сохранение...' : `⚡ Создать Vocab Trainer (${parsedWords.length} слов)`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
