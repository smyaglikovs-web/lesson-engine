export async function transformBlockWithAI(env, payload) {
  const { action, sourceBlock, level = 'B1' } = payload;

  let prompt = '';
  let expectedFormat = '';

  // 1. TEXT BLOCK ACTIONS
  if (sourceBlock.type === 'text') {
    if (action === 'flashcards') {
      prompt = `Extract 6-8 key vocabulary words from this text and create flashcards with Russian translation and example sentence:\n\nTEXT:\n"${sourceBlock.text}"`;
      expectedFormat = `{ "type": "flashcards", "title": "Vocabulary from text", "lang": "en-US", "cards": [{ "front": "Word", "back": "Перевод", "example": "Sentence" }] }`;
    } else if (action === 'quiz') {
      prompt = `Create 4 multiple-choice reading comprehension questions based on this text:\n\nTEXT:\n"${sourceBlock.text}"`;
      expectedFormat = `{ "type": "multiple_choice_group", "blocks": [{ "type": "multiple_choice", "question": "Question?", "options": ["A", "B", "C"], "correct": 0, "explanation": "Why" }] }`;
    } else if (action === 'gap_fill') {
      prompt = `Create 5 gap-fill sentences testing key vocabulary from this text. Use format 'Sentence [answer] here.':\n\nTEXT:\n"${sourceBlock.text}"`;
      expectedFormat = `{ "type": "gap_fill_group", "blocks": [{ "type": "gap_fill", "instruction": "Fill the gap:", "text": "Sentence [answer] here.", "answers": ["answer"] }] }`;
    } else if (action === 'matching') {
      prompt = `Create 6 matching pairs of synonyms or definitions from this text:\n\nTEXT:\n"${sourceBlock.text}"`;
      expectedFormat = `{ "type": "matching", "instruction": "Match the words from the text:", "pairs": [{ "left": "Word", "right": "Definition/Synonym" }] }`;
    } else if (action === 'discussion') {
      prompt = `Create 3 deep speaking discussion questions based on the theme of this text:\n\nTEXT:\n"${sourceBlock.text}"`;
      expectedFormat = `{ "type": "open_input", "prompt": "Discussion Question?", "placeholder": "Your thoughts..." }`;
    }
  }

  // 2. FLASHCARDS ACTIONS
  else if (sourceBlock.type === 'flashcards') {
    if (action === 'matching') {
      const words = (sourceBlock.cards || []).map(c => `${c.front} = ${c.back}`).join(', ');
      prompt = `Convert these flashcard words into a matching exercise:\nWORDS: ${words}`;
      expectedFormat = `{ "type": "matching", "instruction": "Match the vocabulary pairs:", "pairs": [{ "left": "Word", "right": "Translation" }] }`;
    } else if (action === 'quiz') {
      const words = (sourceBlock.cards || []).map(c => `${c.front} (${c.back})`).join(', ');
      prompt = `Create a 4-question multiple choice test based on these vocabulary words:\nWORDS: ${words}`;
      expectedFormat = `{ "type": "multiple_choice_group", "blocks": [{ "type": "multiple_choice", "question": "What is the meaning of X?", "options": ["A", "B", "C"], "correct": 0 }] }`;
    }
  }

  // 3. GRAMMAR CARD ACTIONS
  else if (sourceBlock.type === 'grammar_card') {
    if (action === 'gap_fill') {
      prompt = `Create 5 gap-fill sentences practicing this grammar rule: "${sourceBlock.title} - ${sourceBlock.formula}". Use format 'Sentence [answer] here.':`;
      expectedFormat = `{ "type": "gap_fill_group", "blocks": [{ "type": "gap_fill", "instruction": "Practice the rule:", "text": "Sentence [answer] here.", "answers": ["answer"] }] }`;
    } else if (action === 'reorder') {
      prompt = `Create 3 sentence reorder exercises practicing this grammar rule: "${sourceBlock.title}":`;
      expectedFormat = `{ "type": "reorder_group", "blocks": [{ "type": "sentence_reorder", "instruction": "Reorder sentence:", "sentence": "Full sentence here", "words": ["words", "shuffled"] }] }`;
    }
  }

  // Fallback default
  if (!prompt) {
    prompt = `Create an interactive exercise based on this block content: ${JSON.stringify(sourceBlock)}`;
    expectedFormat = `{ "type": "open_input", "prompt": "Practice question...", "placeholder": "Answer..." }`;
  }

  const systemPrompt = `Ты — ведущий методист английского языка.
Создай ТОЛЬКО 1 интерактивный блок упражнения по запросу пользователя.
Уровень языка: ${level}.

ВЕРНИ СТРОГО ЧИСТЫЙ JSON БЕЗ МАРКДАУН ОБЕРТОК (без \`\`\`json):
${expectedFormat}`;

  try {
    const aiResponse = await env.AI.run('@cf/meta/llama-3.1-70b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: 2500,
      temperature: 0.3
    });

    const generatedText = aiResponse.response || "";
    var tb = String.fromCharCode(96, 96, 96);
    var cleanJsonText = generatedText.split(tb + 'json').join('').split(tb).join('').trim();
    const generatedBlock = JSON.parse(cleanJsonText);

    return { success: true, newBlock: generatedBlock };
  } catch (err) {
    return { error: 'AI error: ' + err.message };
  }
}
