import React, { useState } from 'react';

export const AIPromptsView = () => {
  const [copiedIdx, setCopiedIdx] = useState(null);
  const NL = String.fromCharCode(10);

  const promptMasterTextbook = [
    "Ты — главный методист и разработчик интерактивных учебных программ по английскому языку.",
    "Я отправляю тебе учебные материалы (PDF, сканы, статьи, главы из учебника).",
    "",
    "ТВОЯ ГЛАВНАЯ ЗАДАЧА:",
    "1. Проанализируй весь переданный материал от начала до конца.",
    "2. РЕШИ ВСЕ УПРАЖНЕНИЯ ИЗ УЧЕБНИКА! Автоматически вычисли правильные ответы для всех тестов, пропусков, сопоставлений и сортировок.",
    "3. Разбей весь материал на НЕОГРАНИЧЕННОЕ КОЛИЧЕСТВО СТРАНИЦ (от 1 до 20+ страниц) в зависимости от объема исходного файла.",
    "4. Группируй страницы по логическим секциям: Warm-up, Vocabulary & Flashcards, Reading, Grammar Rule, Controlled Practice, Speaking, Homework Part 1, Homework Part 2 и т.д.",
    "",
    "СПИСОК ВСЕХ 10 ДОСТУПНЫХ ИНТЕРАКТИВНЫХ БЛОКОВ:",
    "1. heading — Заголовки (level: 1, 2 или 3).",
    "2. text — Тексты для чтения, диалоги и правила.",
    "3. grammar_card — Карточки грамматики (title, formula, explanation, examples: ['...']).",
    "4. flashcards — Переворачивающиеся флешкарты лексики с произношением (title, lang: 'en-US', cards: [{ 'front': 'Word', 'back': 'Перевод', 'example': 'Sentence' }]).",
    "5. sentence_reorder — Сборка предложения из перемешанных слов (instruction, sentence: 'Correct target sentence', words: ['scrambled', 'words']).",
    "6. categorization — Сортировка слов в 2-4 корзины (instruction, categories: ['Категория A', 'Категория B'], items: [{ 'id': 'i1', 'text': 'Apple', 'categoryIndex': 0 }]).",
    "7. multiple_choice — Тесты с выбором (question, options: ['A', 'B'], correct: ИНДЕКС_ОТ_0, explanation).",
    "8. gap_fill — Заполнение пропусков (instruction, text: 'Start [answer] end.', answers: ['answer']).",
    "9. matching — Соединение пар (instruction, pairs: [{ 'left': 'Word', 'right': 'Correct Match' }]). Pairs ДОЛЖНЫ БЫТЬ ИЗНАЧАЛЬНО ВЕРНО СОЕДИНЕНЫ!",
    "10. open_input — Открытые вопросы для дискуссий и эссе (prompt, placeholder).",
    "",
    "СТРОГИЕ ПРАВИЛА ФОРМАТА JSON:",
    "1. Верни СТРОГО чистый JSON без маркдаун оберток (```json).",
    "2. НЕ используй двойные кавычки внутри текста! Используй ТОЛЬКО одинарные кавычки ' (например, 'Boarding pass').",
    "3. Генерируй СКОЛЬКО УГОДНО СТРАНИЦ в массиве 'pages' (p1, p2, p3... pN), чтобы полностью покрыть весь исходный материал!",
    "",
    "СТРУКТУРА МНОГОСТРАНИЧНОГО JSON (Пример):",
    "{",
    '  "title": "Полное название модуля/урока",',
    '  "level": "B1-B2",',
    '  "topic": "Тема",',
    '  "description": "Описание",',
    '  "pages": [',
    '    { "id": "p1", "title": "Страница 1: Lead-in & Vocabulary", "blocks": [...] },',
    '    { "id": "p2", "title": "Страница 2: Target Flashcards", "blocks": [...] },',
    '    { "id": "p3", "title": "Страница 3: Reading Article", "blocks": [...] },',
    '    { "id": "p4", "title": "Страница 4: Grammar Focus", "blocks": [...] },',
    '    { "id": "p5", "title": "Страница 5: Sentence Reordering Practice", "blocks": [...] },',
    '    { "id": "p6", "title": "Страница 6: Categorization & Word Sorting", "blocks": [...] },',
    '    { "id": "p7", "title": "Страница 7: Homework - Vocabulary Practice", "blocks": [...] },',
    '    { "id": "p8", "title": "Страница 8: Homework - Open Writing", "blocks": [...] }',
    "  ]",
    "}",
    "",
    "Вот исходные учебные материалы (PDF / Текст):"
  ].join(NL);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(0);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-1">🚀 Неограниченный Master AI Промпт</h2>
        <p className="text-slate-500 text-sm">Скопируйте промпт, вставьте в ChatGPT/Claude/Gemini и отправьте вместе с ЛЮБЫМ объемом учебного материала (PDF, глава, статья)!</p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg text-slate-800">📖 Master Prompt (Без ограничений по количеству страниц)</h3>
          <button
            onClick={() => handleCopy(promptMasterTextbook)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
          >
            {copiedIdx === 0 ? 'Скопировано! ✅' : 'Скопировать Master Промпт'}
          </button>
        </div>
        <p className="text-slate-500 text-sm mb-4">Генерирует от 1 до 20+ интерактивных страниц с авто-решением задач, флешкартами, грамматикой, сортировкой и ДЗ.</p>
        <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto whitespace-pre-wrap max-h-96">
          {promptMasterTextbook}
        </pre>
      </div>
    </div>
  );
};
