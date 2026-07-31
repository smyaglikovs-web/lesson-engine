import React, { useState } from 'react';

export const AIPromptsView = () => {
  const [copiedIdx, setCopiedIdx] = useState(null);
  const NL = String.fromCharCode(10);

  const promptTextbook = [
    "Ты — опытный методист английского языка и эксперт по составлению учебных материалов.",
    "Я отправляю тебе материалы из учебника / PDF (текст, правила, упражнения).",
    "",
    "ТВОЯ ГЛАВНАЯ ЗАДАЧА:",
    "1. Проанализируй весь исходный материал.",
    "2. РЕШИ ВСЕ УПРАЖНЕНИЯ ИЗ УЧЕБНИКА! Вычисли правильные ответы для всех тестов, пропусков и сопоставлений.",
    "3. Сохрани оригинальные тексты, заголовки и формулировки упражнений из учебника.",
    "4. Закодируй ВСЕ упражнения в интерактивный JSON формат c правильными ответами.",
    "5. СОЗДАЙ ДОПОЛНИТЕЛЬНУЮ СТРАНИЦУ 'Домашнее задание' (Homework) с упражнениями на закрепление ключевой лексики уроков.",
    "",
    "ПРАВИЛА ТИПОВ БЛОКОВ В JSON:",
    "- heading: Заголовки (level: 1, 2 или 3).",
    "- text: Тексты для чтения и статьи.",
    "- grammar_card: Карточки с правилами и лексикой (title, formula, explanation, examples).",
    "- multiple_choice: Вопросы с выбором (options: [...], correct: ИНДЕКС_ПРАВИЛЬНОГО_ОТВЕТА от 0, explanation).",
    "- gap_fill: Пропуски в тексте. Текст формата 'Start [answer] end.', answers: ['answer'].",
    "- matching: Соединить пары. pairs: [{ 'left': 'слово', 'right': 'правильная_пара' }]. Pairs должны быть ИЗНАЧАЛЬНО ВЕРНО СОЕДИНЕНЫ!",
    "- open_input: Открытые вопросы для обсуждения (prompt, placeholder).",
    "",
    "КРИТИЧЕСКИЕ ПРАВИЛА ФОРМАТА JSON:",
    "1. Верни СТРОГО чистый JSON без маркдаун оберток.",
    "2. НЕ используй двойные кавычки внутри текста! Используй ТОЛЬКО одинарные кавычки ' (например, 'Looksmaxxing', 'Empower').",
    "",
    "ПРИМЕР СТРУКТУРЫ JSON:",
    "{",
    '  "title": "Название урока из учебника",',
    '  "level": "B1",',
    '  "topic": "Тема",',
    '  "description": "Описание урока",',
    '  "pages": [',
    "    {",
    '      "id": "p1",',
    '      "title": "Часть 1: Чтение и Теория",',
    '      "blocks": [',
    '        { "id": "b1", "type": "heading", "level": 1, "text": "Заголовок" },',
    '        { "id": "b2", "type": "text", "text": "Текст учебника..." },',
    '        { "id": "b3", "type": "grammar_card", "title": "Правило", "formula": "Формула", "explanation": "Пояснение", "examples": ["Пример 1"] }',
    "      ]",
    "    },",
    "    {",
    '      "id": "p2",',
    '      "title": "Часть 2: Практика (Упражнения из учебника)",',
    '      "blocks": [',
    '        { "id": "b4", "type": "matching", "instruction": "Соедините слова из упражнения в учебнике:", "pairs": [{"left": "Word", "right": "Solved Match"}] },',
    '        { "id": "b5", "type": "multiple_choice", "question": "Вопрос из учебника?", "options": ["Вариант A", "Вариант B"], "correct": 0, "explanation": "Решение" },',
    '        { "id": "b6", "type": "gap_fill", "instruction": "Заполните пропуски:", "text": "Sentence with [correct_word].", "answers": ["correct_word"] }',
    "      ]",
    "    },",
    "    {",
    '      "id": "p3",',
    '      "title": "Часть 3: Домашнее задание (Vocabulary Homework)",',
    '      "blocks": [',
    '        { "id": "b7", "type": "heading", "level": 2, "text": "Homework: Target Vocabulary" },',
    '        { "id": "b8", "type": "gap_fill", "instruction": "Вставьте ключевые слова урока в предложения:", "text": "The patient suffered from severe [anxiety].", "answers": ["anxiety"] },',
    '        { "id": "b9", "type": "open_input", "prompt": "Составьте 3 предложения с изученными фразами:", "placeholder": "Напишите предложения..." }',
    "      ]",
    "    }",
    "  ]",
    "}",
    "",
    "Вот материалы учебника:"
  ].join(NL);

  const promptArticle = [
    "Ты — методист английского языка.",
    "Преврати этот текст/статью в полноценный 3-частевой интерактивный урок с Домашним Заданием.",
    "",
    "ТРЕБОВАНИЯ:",
    "1. Составь ЧАСТЬ 1 (Чтение + Карточка ключевой лексики/грамматики grammar_card).",
    "2. Составь ЧАСТЬ 2 (Интерактивные упражнения: matching, multiple_choice с решением, open_input).",
    "3. Составь ЧАСТЬ 3 (Домашнее задание: gap_fill на отработку целевого вокабуляра статьи + open_input).",
    "4. Верни СТРОГО чистый JSON. Используй одинарные кавычки ' вместо двойных кавычек внутри текста.",
    "",
    "Вот текст статьи:"
  ].join(NL);

  const prompts = [
    {
      title: "📖 Превратить страницу из Учебника / PDF в Урок + ДЗ (с Авто-Решением всех задач)",
      desc: "Скопируйте страницу учебника или упражнения. AI сам решит все задачи, расставит правильные ключи в JSON и создаст ДЗ на вокабуляр.",
      prompt: promptTextbook
    },
    {
      title: "📰 Превратить Новостную Статью / Текст в Полный Урок + ДЗ",
      desc: "Скопируйте статью или текст. AI выделит лексику, составит упражнения и страницу домашнего задания.",
      prompt: promptArticle
    }
  ];

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-1">💡 AI Промпты для Генерации Уроков</h2>
        <p className="text-slate-500 text-sm">Скопируйте нужный промпт и вставьте его в ChatGPT, Claude или Gemini вместе с материалом учебника.</p>
      </div>

      <div className="space-y-6">
        {prompts.map((item, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg text-slate-800">{item.title}</h3>
              <button
                onClick={() => handleCopy(item.prompt, idx)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-xl shadow-sm transition"
              >
                {copiedIdx === idx ? 'Скопировано! ✅' : 'Скопировать промпт'}
              </button>
            </div>
            <p className="text-slate-500 text-sm mb-4">{item.desc}</p>
            <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto whitespace-pre-wrap">
              {item.prompt}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
};
