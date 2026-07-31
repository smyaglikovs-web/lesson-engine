import React, { useState } from 'react';

export const AIPromptsView = () => {
  const [copiedIdx, setCopiedIdx] = useState(null);
  const NL = String.fromCharCode(10);

  const promptMasterPdfParser = [
    "Ты — эксперт-методист английского языка и архитектор интерактивных учебных программ.",
    "Я отправляю тебе материалы из PDF / учебника / распечатки (статьи Breaking News English, грамматические рабочие листы, разборы тестов или правила).",
    "",
    "ТВОЯ ГЛАВНАЯ ЗАДАЧА:",
    "1. Проанализируй весь переданный текст и ВСЕ СТРАНИЦЫ ИСХОДНОГО МАТЕРИАЛА.",
    "2. РЕШИ ВСЕ УПРАЖНЕНИЯ И ИСПОЛЬЗУЙ КЛЮЧИ ОТВЕТОВ! Если в конце PDF есть блок 'ANSWERS', используй их для 100% точной разметки ключей.",
    "3. Преврати материал в многостраничный интерактивный JSON (от 2 до 15+ страниц).",
    "",
    "КАК ПРЕВРАЩАТЬ ТИПЫ УПРАЖНЕНИЙ ИЗ PDF В JSON:",
    "- Статья / Текст ➔ { 'type': 'text', 'text': '...' }",
    "- Правило / Разбор ошибок / Заметки ➔ { 'type': 'grammar_card', 'title': '...', 'formula': '...', 'explanation': '...', 'examples': ['...'] }",
    "- Словарь / Фразы / Ключевая лексика ➔ { 'type': 'flashcards', 'title': 'Vocabulary', 'lang': 'en-US', 'cards': [{ 'front': 'Word', 'back': 'Перевод/Определение', 'example': 'Sentence' }] }",
    "- True / False & Выбор ответа ➔ { 'type': 'multiple_choice', 'question': '...', 'options': ['True', 'False'], 'correct': 0|1, 'explanation': '...' }",
    "- Synonym Match & Phrase Match ➔ { 'type': 'matching', 'instruction': 'Соедините синонимы/фразы:', 'pairs': [{ 'left': 'Word', 'right': 'Match' }] } (ПАРЫ ДОЛЖНЫ БЫТЬ ВЕРНО СОЕДИНЕНЫ!)",
    "- Заполнение пропусков (Gap Fills) / Префиксы / Окончания ➔ { 'type': 'gap_fill', 'instruction': '...', 'text': 'It is [uncomfortable] to sit here.', 'answers': ['uncomfortable'] }",
    "- Порядок слов / Сборка предложений ➔ { 'type': 'sentence_reorder', 'instruction': '...', 'sentence': 'Target sentence', 'words': ['scrambled', 'words'] }",
    "- Сортировка слов по группам ➔ { 'type': 'categorization', 'instruction': '...', 'categories': ['Group A', 'Group B'], 'items': [{ 'id': 'i1', 'text': 'Word', 'categoryIndex': 0 }] }",
    "- Вопросы для обсуждения (Discussion) & Эссе ➔ { 'type': 'open_input', 'prompt': 'Question text...', 'placeholder': 'Ваш ответ...' }",
    "",
    "СТРОГИЕ ПРАВИЛА ФОРМАТА JSON:",
    "1. Верни СТРОГО чистый JSON без маркдаун оберток (```json).",
    "2. Используй ТОЛЬКО одинарные кавычки ' внутри текстов и вопросов, чтобы не ломать JSON.",
    "3. Создавай сколько угодно страниц (p1, p2, p3 ... pN) для полного покрытия PDF!",
    "",
    "СТРУКТУРА JSON:",
    "{",
    '  "title": "Название урока из PDF",',
    '  "level": "B1-B2",',
    '  "topic": "Тема",',
    '  "description": "Описание",',
    '  "pages": [',
    '    { "id": "p1", "title": "Часть 1: Текст и Лексика", "blocks": [...] },',
    '    { "id": "p2", "title": "Часть 2: Понимание текста & True/False", "blocks": [...] },',
    '    { "id": "p3", "title": "Часть 3: Практика лексики & Синонимы", "blocks": [...] },',
    '    { "id": "p4", "title": "Часть 4: Грамматические упражнения", "blocks": [...] },',
    '    { "id": "p5", "title": "Часть 5: Вопросы для обсуждения (Discussion)", "blocks": [...] },',
    '    { "id": "p6", "title": "Часть 6: Домашнее задание", "blocks": [...] }',
    "  ]",
    "}",
    "",
    "Вот исходный текст PDF / учебного материала:"
  ].join(NL);

  const handleCopy = () => {
    navigator.clipboard.writeText(promptMasterPdfParser);
    setCopiedIdx(0);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-1">🚀 Master PDF Parser AI Промпт</h2>
        <p className="text-slate-500 text-sm">Скопируйте промпт, вставьте в ChatGPT/Claude вместе с текстом из любого PDF (Breaking News English, рабочих листов или тестов) и получите готовый интерактивный JSON!</p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg text-slate-800">📖 Master Prompt (Для PDF статей, тестов и рабочих листов)</h3>
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
          >
            {copiedIdx === 0 ? 'Скопировано! ✅' : 'Скопировать Master Промпт'}
          </button>
        </div>
        <p className="text-slate-500 text-sm mb-4">Автоматически считывает ключи ответов из PDF, конвертирует True/False, Синонимы, Пропуски, Префиксы, Вопросы и создаст многостраничный урок.</p>
        <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto whitespace-pre-wrap max-h-96">
          {promptMasterPdfParser}
        </pre>
      </div>
    </div>
  );
};
