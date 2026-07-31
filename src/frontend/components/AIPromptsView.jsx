import React, { useState } from 'react';

export const AIPromptsView = () => {
  const [copiedIdx, setCopiedIdx] = useState(null);
  const NL = String.fromCharCode(10);

  // PROMPT 1: FULL UNLIMITED PDF & TEXTBOOK PARSER
  const promptPdfParser = [
    "Ты — главный методист и архитектор интерактивных учебных программ по английскому языку.",
    "Я отправляю тебе материалы из PDF / учебника / распечатки (статьи Breaking News English, грамматические рабочие листы, разборы тестов или правила).",
    "",
    "ТВОЯ ГЛАВНАЯ ЗАДАЧА:",
    "1. Проанализируй весь переданный текст и ВСЕ СТРАНИЦЫ ИСХОДНОГО МАТЕРИАЛА.",
    "2. РЕШИ ВСЕ УПРАЖНЕНИЯ И ИСПОЛЬЗУЙ КЛЮЧИ ОТВЕТОВ! Если в конце PDF есть блок 'ANSWERS', используй их для 100% точной разметки ключей.",
    "3. Преврати материал в многостраничный интерактивный JSON (от 2 до 20+ страниц для полного покрытия файла).",
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

  // PROMPT 2: 8-STAGE ESL METHODOLOGY & CEFR GRAMMAR MATRIX
  const promptMethodologicalEsl = [
    "Ты — главный методист английского языка высшей квалификации.",
    "Создай полноценный многостраничный интерактивный урок английского языка, строго соблюдая 8-этапную ESL методику.",
    "",
    "8-ЭТАПНАЯ МЕТОДОЛОГИЧЕСКАЯ СТРУКТУРА УРОКА:",
    "1. Lead-in (Разогрев & Снятие трудностей): Вопрос для разминки (open_input) + Флешкарты вокабуляра (flashcards) с произношением.",
    "2. Gist Understanding (Общее понимание): Текст (text) + Определение главной идеи (multiple_choice).",
    "3. Detailed Understanding (Детальное понимание): Вопросы True/False (multiple_choice) + Пояснения.",
    "4. Grammar & Vocabulary Presentation: Правило грамматики уровня (grammar_card) с формулой и примерами.",
    "5. Controlled Practice (Подстановочные задания): Соединение пар синонимов/фразовых глаголов (matching), заполнение пропусков (gap_fill).",
    "6. Transformational Practice (Трансформационные задания): Сборка предложений из перемешанных слов (sentence_reorder), сортировка по группам (categorization).",
    "7. Freer Production (Свободная речевая практика): Открытые разговорные вопросы и ролевые ситуации (open_input).",
    "8. Homework (Домашнее задание): Упражнения на закрепление целевого вокабуляра (gap_fill) + Эссе (open_input).",
    "",
    "МАТРИЦА ГРАММАТИЧЕСКИХ ТЕМ ПО УРОВНЯМ CEFR:",
    "- A1: Present Simple, to be, there is/are, going to, modal can/must.",
    "- A2: Past Simple, Present Continuous for future, Comparatives, should/have to.",
    "- B1: Past Continuous/Perfect, Conditionals 1 & 2, Passive Voice, Reported Speech, Present Perfect vs Past Simple.",
    "- B2: Conditionals 3 & Mixed, Future Perfect/Continuous, Past Modals (should have/could have), wish/if only, Gerund vs Infinitive.",
    "- C1: Inversion, Advanced Narrative Tenses, Cleft sentences (It was... that), Advanced Passive.",
    "",
    "СТРОГИЕ ПРАВИЛА ФОРМАТА JSON:",
    "1. Верни СТРОГО чистый JSON без маркдаун оберток.",
    "2. Используй одинарные кавычки ' в текстах.",
    "",
    "Создай урок на тему '[УКАЖИТЕ ТЕМУ, напр. Business Meetings]' для уровня [B1/B2]:"
  ].join(NL);

  const prompts = [
    {
      title: "📖 Master PDF Parser (Для учебников, Breaking News English и сканов)",
      desc: "Распознает любую страницу из PDF, автоматически забирает ответы из ключей (Answers) и превращает материал в многостраничный JSON.",
      prompt: promptPdfParser
    },
    {
      title: "🎓 8-Этапный ESL Методологический Промпт (с матрицей CEFR)",
      desc: "Генерирует уроки с нуля от Lead-in и Flashcards до трансформации, порядка слов и ролевых игр с соблюдением грамматической сетки A1-C1.",
      prompt: promptMethodologicalEsl
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
        <h2 className="text-2xl font-bold text-slate-900 mb-1">💡 AI Промпты для ChatGPT / Claude</h2>
        <p className="text-slate-500 text-sm">Скопируйте нужный промпт, вставьте в ChatGPT или Claude вместе с материалом и получите готовый интерактивный JSON!</p>
      </div>

      <div className="space-y-6">
        {prompts.map((item, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg text-slate-800">{item.title}</h3>
              <button
                onClick={() => handleCopy(item.prompt, idx)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
              >
                {copiedIdx === idx ? 'Скопировано! ✅' : 'Скопировать промпт'}
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
