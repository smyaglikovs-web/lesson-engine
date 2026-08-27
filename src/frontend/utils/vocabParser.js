// SMART WORD LIST PARSER & EXERCISE GENERATOR

// 1. Detects delimiter (Tab, Semicolon, Pipe, or Dash) & Parses Rows
export function parseWordListText(rawText) {
  if (!rawText || typeof rawText !== 'string') return [];

  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const items = [];

  for (let line of lines) {
    let parts = [];

    if (line.includes('\t')) {
      parts = line.split('\t');
    } else if (line.includes(';')) {
      parts = line.split(';');
    } else if (line.includes('|')) {
      parts = line.split('|');
    } else if (line.includes(' - ')) {
      parts = line.split(' - ');
    } else if (line.includes(' — ')) {
      parts = line.split(' — ');
    } else {
      continue;
    }

    const word = (parts[0] || '').trim();
    const translation = (parts[1] || '').trim();
    const example = (parts[2] || '').trim();

    if (word && translation) {
      items.push({ word, translation, example });
    }
  }

  return items;
}

// 2. Helper: Helper to find and bracket target word inside example sentence
function createGapFillSentence(word, translation, example) {
  if (!example) {
    return `[${word}] — ${translation}`;
  }

  // Clean parentheses like "Typecast (as)" -> "Typecast"
  const cleanWord = word.replace(/\(.*?\)/g, '').trim();
  const rootWords = cleanWord.split(' ').filter(w => w.length > 2);
  
  let regexPattern = cleanWord;
  if (rootWords.length > 0) {
    // Match either full phrase or main stem
    regexPattern = rootWords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+.*');
  }

  const regex = new RegExp(`(${regexPattern}|${cleanWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i');
  
  if (regex.test(example)) {
    return example.replace(regex, '[$1]');
  }

  // If not matched verbatim in conjugated sentence, append bracketed hint
  return `${example} ➔ [${word}]`;
}

// 3. Helper: Shuffle Array
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 4. MAIN GENERATOR: Builds 4-5 Interactive Stages
export function generateVocabLesson(topicTitle = 'Vocabulary Trainer', level = 'B2', wordsList = []) {
  if (!wordsList || wordsList.length === 0) return null;

  const lessonId = 'vocab-' + Date.now();
  const allTranslations = wordsList.map(w => w.translation);

  // STAGE 1: Flashcards Block
  const flashcardsBlock = {
    id: `b-fc-${Date.now()}`,
    type: 'flashcards',
    title: `🎴 Target Vocabulary (${wordsList.length} words)`,
    cards: wordsList.map(w => ({
      front: w.word,
      back: w.translation,
      example: w.example || ''
    }))
  };

  // STAGE 2: Matching Pairs (Chunked into sets of 6)
  const matchingBlocks = [];
  const chunkSize = 6;
  for (let i = 0; i < wordsList.length; i += chunkSize) {
    const chunk = wordsList.slice(i, i + chunkSize);
    matchingBlocks.push({
      id: `b-match-${i}-${Date.now()}`,
      type: 'matching',
      instruction: `🔗 Соедините слова и переводы (Группа ${Math.floor(i / chunkSize) + 1}):`,
      pairs: chunk.map(c => ({ left: c.word, right: c.translation }))
    });
  }

  // STAGE 3: Multiple Choice Quiz (Smart Distractors)
  const mcBlocks = wordsList.slice(0, 10).map((w, idx) => {
    // Pick 3 random wrong options from other words
    const wrongOptions = shuffle(allTranslations.filter(t => t !== w.translation)).slice(0, 3);
    const allOptions = shuffle([w.translation, ...wrongOptions]);
    const correctIdx = allOptions.indexOf(w.translation);

    return {
      id: `b-mc-${idx}-${Date.now()}`,
      type: 'multiple_choice',
      question: `❓ Выберите правильный перевод для слова: "${w.word}"`,
      options: allOptions,
      correct: correctIdx,
      explanation: w.example ? `Пример: "${w.example}"` : `Правильный перевод: ${w.translation}`
    };
  });

  // STAGE 4: Sentence Gap Fill (Active Recall)
  const gapFillSentences = wordsList
    .filter(w => Boolean(w.example))
    .slice(0, 8)
    .map(w => createGapFillSentence(w.word, w.translation, w.example))
    .join('\n');

  const gapFillBlock = {
    id: `b-gap-${Date.now()}`,
    type: 'gap_fill',
    instruction: '✏️ Вставьте пропущенные целевые слова по контексту предложений:',
    text: gapFillSentences
  };

  // Build the 4-Page Course
  return {
    id: lessonId,
    title: topicTitle,
    level: level,
    topic: 'Vocabulary Trainer',
    description: `Интерактивный тренажёр слов: ${wordsList.length} лексических единиц с озвучкой, проверкой перевода и контекстными примерами.`,
    pages: [
      {
        id: 'p1',
        title: 'Этап 1: Ознакомление и Карточки',
        blocks: [
          { id: 'b-h1', type: 'heading', level: 1, text: topicTitle },
          { id: 'b-intro', type: 'text', text: `Изучите карточки ниже. Нажимайте на карточку для переворота и на 🔊 для прослушивания правильного произношения.` },
          flashcardsBlock
        ]
      },
      {
        id: 'p2',
        title: 'Этап 2: Сопоставление пар',
        blocks: [
          { id: 'b-h2', type: 'heading', level: 2, text: '🔗 Быстрое закрепление' },
          ...matchingBlocks
        ]
      },
      {
        id: 'p3',
        title: 'Этап 3: Тест на знание значений',
        blocks: [
          { id: 'b-h3', type: 'heading', level: 2, text: '❓ Проверка понимания' },
          ...mcBlocks
        ]
      },
      {
        id: 'p4',
        title: 'Этап 4: Контекстная практика',
        blocks: [
          { id: 'b-h4', type: 'heading', level: 2, text: '✏️ Вставка слов в контекст' },
          gapFillBlock,
          { id: 'b-open', type: 'open_input', prompt: '💬 Выберите 3 любых новых слова из урока и составьте с ними свои собственные предложения:' }
        ]
      }
    ]
  };
}
