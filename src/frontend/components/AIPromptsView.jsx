import React, { useState } from 'react';

export const AIPromptsView = () => {
  const [copiedIdx, setCopiedIdx] = useState(null);
  const NL = String.fromCharCode(10);

  const promptMasterTextbook = [
    "Ты — опытный методист английского языка и эксперт по интерактивным учебным материалам.",
    "Я отправлю тебе материалы из учебника / PDF / текст (грамматику, лексику, статьи, упражнения).",
    "",
    "ТВОЯ ГЛАВНАЯ ЗАДАЧА:",
    "1. Проанализируй весь исходный материал.",
    "2. РЕШИ ВСЕ УПРАЖНЕНИЯ ИЗ УЧЕБНИКА! Вычисли правильные ответы для всех тестов, пропусков, сопоставлений и сортировок.",
    "3. Упакуй урок в многостраничный интерактивный JSON формат c правильными ключами.",
    "4. Создай 3 страницы: Часть 1 (Лексика & Теория), Часть 2 (Интерактивная практика), Часть 3 (Домашнее задание).",
    "",
    "ПОДДЕРЖИВАЕМЫЕ ИНТЕРАКТИВНЫЕ БЛОКИ В JSON:",
    "1. heading — Заголовок ({ 'type': 'heading', 'level': 1|2|3, 'text': '...' })",
    "2. text — Параграф текста ({ 'type': 'text', 'text': '...' })",
    "3. grammar_card — Карточка правила ({ 'type': 'grammar_card', 'title': '...', 'formula': '...', 'explanation': '...', 'examples': ['...'] })",
    "4. flashcards — Переворачивающиеся флешкарты с произношением ({ 'type': 'flashcards', 'title': 'Лексика', 'lang': 'en-US', 'cards': [{ 'front': 'Word', 'back': 'Перевод', 'example': 'Sentence' }] })",
    "5. sentence_reorder — Сборка предложения из слов ({ 'type': 'sentence_reorder', 'instruction': 'Составьте предложение:', 'sentence': 'Target sentence here', 'words': ['Sentence', 'here', 'Target'] })",
    "6. categorization — Сортировка слов в 2 корзины ({ 'type': 'categorization', 'instruction': 'Распределите слова:', 'categories': ['Существительные', 'Глаголы'], 'items': [{ 'id': 'i1', 'text': 'Apple', 'categoryIndex': 0 }, { 'id': 'i2', 'text': 'Run', 'categoryIndex': 1 }] })",
    "7. multiple_choice — Выбор правильного ответа ({ 'type': 'multiple_choice', 'question': '...', 'options': ['A', 'B', 'C'], 'correct': 1, 'explanation': '...' })",
    "8. gap_fill — Заполнение пропусков ({ 'type': 'gap_fill', 'instruction': '...', 'text': 'Start [answer] end.', 'answers': ['answer'] })",
    "9. matching — Соединение пар ({ 'type': 'matching', 'instruction': '...', 'pairs': [{ 'left': 'Word', 'right': 'Match' }] })",
    "10. open_input — Разговорный вопрос ({ 'type': 'open_input', 'prompt': '...', 'placeholder': '...' })",
    "",
    "КРИТИЧЕСКИЕ ПРАВИЛА JSON:",
    "1. Верни СТРОГО чистый JSON без markdown оберток.",
    "2. Используй одинарные кавычки ' внутри текстов, чтобы не ломать структуру JSON.",
    "",
    "ПРИМЕР СТРУКТУРЫ JSON:",
    "{",
    '  "title": "Название урока",',
    '  "level": "B1",',
    '  "topic": "Тема",',
    '  "description": "Описание урока",',
    '  "pages": [',
    "    {",
    '      "id": "p1",',
    '      "title": "Часть 1: Лексика и Грамматика",',
    '      "blocks": [',
    '        { "id": "b1", "type": "heading", "level": 1, "text": "Travel Vocabulary" },',
    '        { "id": "b2", "type": "flashcards", "title": "Ключевые слова:", "lang": "en-US", "cards": [{ "front": "Boarding pass", "back": "Посадочный талон", "example": "Show your boarding pass." }] },',
    '        { "id": "b3", "type": "grammar_card", "title": "Present Perfect", "formula": "Have/Has + V3", "explanation": "Жизненный опыт", "examples": ["I have visited London."] }',
    "      ]",
    "    },",
    "    {",
    '      "id": "p2",',
    '      "title": "Часть 2: Интерактивная практика",',
    '      "blocks": [',
    '        { "id": "b4", "type": "sentence_reorder", "instruction": "Соберите предложение:", "sentence": "She has booked her flights", "words": ["booked", "flights", "She", "has", "her"] },',
    '        { "id": "b5", "type": "categorization", "instruction": "Распределите слова:", "categories": ["Аэропорт", "Отель"], "items": [{ "id": "c1", "text": "Luggage", "categoryIndex": 0 }, { "id": "c2", "text": "Reception", "categoryIndex": 1 }] },',
    '        { "id": "b6", "type": "multiple_choice", "question": "Which is correct?", "options": ["I have go", "I have gone"], "correct": 1, "explanation": "V3 form of go is gone" }',
    "      ]",
    "    },",
    "    {",
    '      "id": "p3",',
    '      "title": "Часть 3: Домашнее задание",',
    '      "blocks": [',
    '        { "id": "b7", "type": "gap_fill", "instruction": "Вставьте пропущенное слово:", "text": "I have already [packed] my bags.", "answers": ["packed"] },',
    '        { "id": "b8", "type": "open_input", "prompt": "Напишите 3 предложения о вашем последнем путешествии:", "placeholder": "Last summer I..." }',
    "      ]",
    "    }",
    "  ]",
    "}",
    "",
    "Вот материалы учебника / PDF / статьи:"
  ].join(NL);

  const promptTopicGenerator = [
    'Создай полный 3-страничный интерактивный урок английского языка на тему "[ВСТАВЬТЕ ТЕМУ, напр. Business Negotiations]" для уровня [A2/B1/B2].',
    "",
    "ТРЕБОВАНИЯ:",
    "1. Страница 1: Заголовок + Флешкарты вокабуляра (flashcards) с переводом и примерами + Грамматическая карточка (grammar_card).",
    "2. Страница 2: Практика (sentence_reorder на порядок слов, categorization на сортировку, multiple_choice вопросы).",
    "3. Страница 3: Домашнее задание (gap_fill на пропуски + open_input на разговорную практику).",
    "4. Верни СТРОГО чистый JSON формата без маркдаун оберток. Используй одинарные кавычки ' в текстах."
  ].join(NL);

  const prompts = [
    {
      title: "📖 Полный Промпт для Учебников / PDF (Со всеми 12 видами упражнений)",
      desc: "Скопируйте страницу из любого учебника (Oxford, Cambridge, Macmillan). AI решит упражнения, расставит ключи и создаст флешкарты, порядок слов и ДЗ.",
      prompt: promptMasterTextbook
    },
    {
      title: "🎯 Промпт для Генерации Урока по Любой Теме с Нуля",
      desc: "Генерация полного интерактивного урока без исходных материалов (например, B2 Job Interviews).",
      prompt: promptTopicGenerator
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
        <h2 className="text-2xl font-bold text-slate-900 mb-1">💡 Обновленный Master AI Промпт</h2>
        <p className="text-slate-500 text-sm">Скопируйте промпт, откройте ChatGPT или Claude, вставьте текст/PDF из учебника и получите готовый многостраничный JSON!</p>
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
                {copiedIdx === idx ? 'Скопировано! ✅' : 'Скопировать Master Промпт'}
              </button>
            </div>
            <p className="text-slate-500 text-sm mb-4">{item.desc}</p>
            <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto whitespace-pre-wrap max-h-96">
              {item.prompt}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
};
