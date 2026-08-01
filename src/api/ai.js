export async function transformBlockWithAI(env, payload) {
  const { actions = [], sourceBlock, level = 'B1' } = payload;

  if (actions.length === 0) {
    return { error: 'Выберите хотя бы одно задание.' };
  }

  const taskInstructions = [];
  if (actions.includes('flashcards')) {
    taskInstructions.push(`- FLASHCARDS: 6-8 key words with Russian translation and example sentence. Format: { "type": "flashcards", "title": "Target Vocabulary", "lang": "en-US", "cards": [{ "front": "Word", "back": "Перевод", "example": "Sentence" }] }`);
  }
  if (actions.includes('true_false')) {
    taskInstructions.push(`- TRUE/FALSE QUIZ: 4 true/false comprehension questions based on content. Format: { "type": "multiple_choice", "question": "Statement...", "options": ["True", "False"], "correct": 0, "explanation": "Why" }`);
  }
  if (actions.includes('gap_fill')) {
    taskInstructions.push(`- GAP FILL: 5 sentences testing key words in format 'Sentence [answer] here.': { "type": "gap_fill", "instruction": "Fill the gaps:", "text": "Sentence [answer] here.", "answers": ["answer"] }`);
  }
  if (actions.includes('matching')) {
    taskInstructions.push(`- MATCHING: 6 pairs of synonyms or translations: { "type": "matching", "instruction": "Match the pairs:", "pairs": [{ "left": "Word", "right": "Match" }] }`);
  }
  if (actions.includes('discussion')) {
    taskInstructions.push(`- DISCUSSION: 3 deep discussion questions: { "type": "open_input", "prompt": "Discussion question?", "placeholder": "Your answer..." }`);
  }

  const systemPrompt = `Ты — ведущий методист английского языка.
Твоя задача — создать СТРОГО УКАЗАННЫЕ ИНТЕРАКТИВНЫЕ БЛОКИ на основе предоставленного материала.
Уровень языка: ${level}.

ТРЕБУЕМЫЕ БЛОКИ ДЛЯ СОЗДАНИЯ:
${taskInstructions.join('\n')}

ВЕРНИ СТРОГО ЧИСТЫЙ JSON МАССИВ БЛОКОВ (без \`\`\`json):
{
  "blocks": [
    /* созданные блоки */
  ]
}`;

  const userPrompt = `СОДЕРЖАНИЕ ИСХОДНОГО БЛОКА:\n${JSON.stringify(sourceBlock)}`;

  try {
    const aiResponse = await env.AI.run('@cf/meta/llama-3.1-70b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 3500,
      temperature: 0.3
    });

    const generatedText = aiResponse.response || "";
    var tb = String.fromCharCode(96, 96, 96);
    var cleanJsonText = generatedText.split(tb + 'json').join('').split(tb).join('').trim();
    const parsedData = JSON.parse(cleanJsonText);

    const newBlocks = Array.isArray(parsedData.blocks) ? parsedData.blocks : [parsedData];
    return { success: true, newBlocks };
  } catch (err) {
    return { error: 'AI error: ' + err.message };
  }
}
