import { getLessons, saveLesson, getSingleLesson, deleteLesson } from './api/lessons.js';
import { updateRoomState, getRoomState } from './api/rooms.js';
import { submitHomework, getHomeworkSubmissions } from './api/homework.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    const json = (data, status = 200) => 
      new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

    try {
      if (path === '/api/ai/generate' && method === 'POST') {
        const { text, level = 'B1', topic = 'General English' } = await request.json();

        if (!text || text.trim().length < 10) {
          return json({ error: "Предоставьте текст или материалы для генерации урока." }, 400);
        }

        const systemPrompt = `Ты — строгий методист английского языка высшей квалификации.
Твоя задача — извлечь максимум из предоставленного текста и создать ПОЛНОЦЕННЫЙ, НЕЛЕНИВЫЙ, ОБШИРНЫЙ интерактивный урок уровня ${level} на тему "${topic}".

СТРОГИЕ ТРЕБОВАНИЯ К КОЛИЧЕСТВУ ЭЛЕМЕНТОВ В КАЖДОМ УПРАЖНЕНИИ (НЕ СОЗДАВАЙ ПО 1 ВОПРОСУ!):

1. ТЕКСТЫ ДЛЯ ЧТЕНИЯ (text): Смысловой, насыщенный текст объемом МИНИМУМ 250-350 слов, без обрезков.
2. ФЛЕШКАРТЫ (flashcards): МИНИМУМ 8-10 карточек с понятным переводом и контекстным примером.
3. ТЕСТОВЫЕ ВОПРОСЫ (multiple_choice):
   - НЕ создавай по 1 вопросу! Каждая страница с тестами должна содержать МИНИМУМ 4-6 РАЗНЫХ ВОПРОСОВ (каждый со своими options, correct и explanation).
4. ЗАПОЛНЕНИЕ ПРОПУСКОВ (gap_fill): МИНИМУМ 6-8 отдельных предложений с пропусками в формате 'Sentence [answer] here.'.
5. СОПОСТАВЛЕНИЕ (matching): МИНИМУМ 6-8 пар синонимов, антонимов или определений.
6. ПОРЯДОК СЛОВ (sentence_reorder): МИНИМУМ 4-5 развернутых предложений для сборки.
7. СОРТИРОВКА (categorization): МИНИМУМ 8-10 элементов, распределенных по 2-3 категориям.
8. РАЗГОВОРНАЯ ПРАКТИКА (open_input): МИНИМУМ 3-4 глубоких вопроса для обсуждения или ролевых заданий.

СТРУКТУРА СТРАНИЦ УРОКА:
- Страница 1: Lead-in & Vocabulary Bank (Open input discussion + 8-10 Flashcards).
- Страница 2: Reading & Detailed Text Analysis (Text 300+ words + 5 Comprehension Questions).
- Страница 3: Grammar Focus & Rule (Grammar Card + 6 Controlled Gap-Fill exercises).
- Страница 4: Vocabulary Matching & Categorization (6-8 Matching Pairs + 8-10 Categorization Items).
- Страница 5: Sentence Word Order & Syntax (4-5 Sentence Reorder exercises).
- Страница 6: Speaking, Role-Play & Homework (3 Open Discussion Questions + 6 Homework Gap-Fills).

ВЕРНИ СТРОГО ЧИСТЫЙ JSON БЕЗ МАРКДАУН ОБЕРТОК (без \`\`\`json):
{
  "title": "Full Lesson Title",
  "level": "${level}",
  "topic": "${topic}",
  "description": "Comprehensive lesson description",
  "pages": [
    {
      "id": "p1",
      "title": "Part 1: Lead-in & Vocabulary Bank",
      "blocks": [
        { "id": "p1-b1", "type": "heading", "level": 1, "text": "Warm-Up & Vocabulary" },
        { "id": "p1-b2", "type": "open_input", "prompt": "Warm-up discussion question...", "placeholder": "Share your thoughts..." },
        { "id": "p1-b3", "type": "flashcards", "title": "Key Vocabulary", "lang": "en-US", "cards": [
          { "front": "Word 1", "back": "Перевод 1", "example": "Example 1" },
          { "front": "Word 2", "back": "Перевод 2", "example": "Example 2" },
          { "front": "Word 3", "back": "Перевод 3", "example": "Example 3" },
          { "front": "Word 4", "back": "Перевод 4", "example": "Example 4" },
          { "front": "Word 5", "back": "Перевод 5", "example": "Example 5" },
          { "front": "Word 6", "back": "Перевод 6", "example": "Example 6" },
          { "front": "Word 7", "back": "Перевод 7", "example": "Example 7" },
          { "front": "Word 8", "back": "Перевод 8", "example": "Example 8" }
        ]}
      ]
    },
    {
      "id": "p2",
      "title": "Part 2: Reading & Comprehension",
      "blocks": [
        { "id": "p2-b1", "type": "text", "text": "Full detailed article text (300+ words)..." },
        { "id": "p2-b2", "type": "multiple_choice", "question": "Question 1?", "options": ["A", "B", "C"], "correct": 0, "explanation": "Explanation 1" },
        { "id": "p2-b3", "type": "multiple_choice", "question": "Question 2?", "options": ["A", "B", "C"], "correct": 1, "explanation": "Explanation 2" },
        { "id": "p2-b4", "type": "multiple_choice", "question": "Question 3?", "options": ["A", "B", "C"], "correct": 2, "explanation": "Explanation 3" },
        { "id": "p2-b5", "type": "multiple_choice", "question": "Question 4?", "options": ["A", "B", "C"], "correct": 0, "explanation": "Explanation 4" },
        { "id": "p2-b6", "type": "multiple_choice", "question": "Question 5?", "options": ["A", "B", "C"], "correct": 1, "explanation": "Explanation 5" }
      ]
    },
    {
      "id": "p3",
      "title": "Part 3: Grammar & Gap Fills",
      "blocks": [
        { "id": "p3-b1", "type": "grammar_card", "title": "Grammar Rule", "formula": "Subject + Verb", "explanation": "Detailed explanation", "examples": ["Example A", "Example B"] },
        { "id": "p3-b2", "type": "gap_fill", "instruction": "Fill in the gaps in sentences 1-6:", "text": "1. She [always] arrives on time.", "answers": ["always"] },
        { "id": "p3-b3", "type": "gap_fill", "instruction": "", "text": "2. They [have] finished the project.", "answers": ["have"] },
        { "id": "p3-b4", "type": "gap_fill", "instruction": "", "text": "3. He [is] working right now.", "answers": ["is"] },
        { "id": "p3-b5", "type": "gap_fill", "instruction": "", "text": "4. We [will] call you tomorrow.", "answers": ["will"] },
        { "id": "p3-b6", "type": "gap_fill", "instruction": "", "text": "5. I [enjoy] learning English.", "answers": ["enjoy"] },
        { "id": "p3-b7", "type": "gap_fill", "instruction": "", "text": "6. You [should] take a break.", "answers": ["should"] }
      ]
    },
    {
      "id": "p4",
      "title": "Part 4: Matching & Categorization",
      "blocks": [
        { "id": "p4-b1", "type": "matching", "instruction": "Match the words with their definitions:", "pairs": [
          { "left": "Word 1", "right": "Definition 1" },
          { "left": "Word 2", "right": "Definition 2" },
          { "left": "Word 3", "right": "Definition 3" },
          { "left": "Word 4", "right": "Definition 4" },
          { "left": "Word 5", "right": "Definition 5" },
          { "left": "Word 6", "right": "Definition 6" }
        ]},
        { "id": "p4-b2", "type": "categorization", "instruction": "Sort words into Category A or Category B:", "categories": ["Category A", "Category B"], "items": [
          { "id": "c1", "text": "Item 1", "categoryIndex": 0 },
          { "id": "c2", "text": "Item 2", "categoryIndex": 1 },
          { "id": "c3", "text": "Item 3", "categoryIndex": 0 },
          { "id": "c4", "text": "Item 4", "categoryIndex": 1 },
          { "id": "c5", "text": "Item 5", "categoryIndex": 0 },
          { "id": "c6", "text": "Item 6", "categoryIndex": 1 },
          { "id": "c7", "text": "Item 7", "categoryIndex": 0 },
          { "id": "c8", "text": "Item 8", "categoryIndex": 1 }
        ]}
      ]
    },
    {
      "id": "p5",
      "title": "Part 5: Word Order & Reordering",
      "blocks": [
        { "id": "p5-b1", "type": "sentence_reorder", "instruction": "Reorder sentence 1:", "sentence": "She has been working here for three years", "words": ["working", "for", "three", "years", "She", "has", "here", "been"] },
        { "id": "p5-b2", "type": "sentence_reorder", "instruction": "Reorder sentence 2:", "sentence": "They will announce the results tomorrow morning", "words": ["tomorrow", "results", "announce", "They", "will", "morning", "the"] },
        { "id": "p5-b3", "type": "sentence_reorder", "instruction": "Reorder sentence 3:", "sentence": "I would have called you if I had time", "words": ["called", "have", "time", "would", "I", "you", "if", "had"] },
        { "id": "p5-b4", "type": "sentence_reorder", "instruction": "Reorder sentence 4:", "sentence": "Never have I seen such an amazing performance", "words": ["seen", "such", "an", "have", "I", "performance", "Never", "amazing"] }
      ]
    },
    {
      "id": "p6",
      "title": "Part 6: Speaking & Homework",
      "blocks": [
        { "id": "p6-b1", "type": "open_input", "prompt": "Discussion 1: What is your opinion on the main topic?", "placeholder": "Write at least 3-4 sentences..." },
        { "id": "p6-b2", "type": "open_input", "prompt": "Discussion 2: Describe a personal experience related to this lesson.", "placeholder": "Write your response..." },
        { "id": "p6-b3", "type": "heading", "level": 2, "text": "Homework Assignment" },
        { "id": "p6-b4", "type": "gap_fill", "instruction": "Homework: Complete with target vocabulary:", "text": "1. The company plans to [expand] its business.", "answers": ["expand"] },
        { "id": "p6-b5", "type": "gap_fill", "instruction": "", "text": "2. She made a significant [contribution] to the project.", "answers": ["contribution"] },
        { "id": "p6-b6", "type": "gap_fill", "instruction": "", "text": "3. We need to find a sustainable [solution].", "answers": ["solution"] }
      ]
    }
  ]
}`;

        const aiResponse = await env.AI.run('@cf/meta/llama-3.1-70b-instruct', {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Материалы для сплошной генерации насыщенного урока:\n\n${text}` }
          ],
          max_tokens: 4500,
          temperature: 0.3
        });

        const generatedText = aiResponse.response || "";
        var tb = String.fromCharCode(96, 96, 96);
        var cleanJsonText = generatedText.split(tb + 'json').join('').split(tb).join('').trim();

        return json({ success: true, jsonText: cleanJsonText });
      }

      if (path === '/api/lessons' && method === 'GET') return json(await getLessons(env));
      if (path === '/api/lessons' && method === 'POST') return json(await saveLesson(env, await request.json()));
      if (path.startsWith('/api/lessons/') && method === 'GET') {
        const data = await getSingleLesson(env, path.split('/api/lessons/')[1]);
        return data ? new Response(data, { headers: { "Content-Type": "application/json" } }) : json({ error: "Not found" }, 404);
      }
      if (path.startsWith('/api/lessons/') && method === 'DELETE') return json(await deleteLesson(env, path.split('/api/lessons/')[1]));

      if (path.startsWith('/api/rooms/') && path.endsWith('/state') && method === 'POST') {
        const roomId = path.split('/api/rooms/')[1].replace('/state', '');
        const body = await request.json();
        return json(await updateRoomState(env, roomId, body.pageIdx, body.answers));
      }
      if (path.startsWith('/api/rooms/') && path.endsWith('/state') && method === 'GET') {
        const roomId = path.split('/api/rooms/')[1].replace('/state', '');
        return json(await getRoomState(env, roomId));
      }

      if (path === '/api/homework/submit' && method === 'POST') return json(await submitHomework(env, await request.json()));
      if (path.startsWith('/api/homework/') && method === 'GET') return json(await getHomeworkSubmissions(env, path.split('/api/homework/')[1]));

      return env.ASSETS.fetch(request);

    } catch (err) {
      return json({ error: err.message }, 500);
    }
  }
};
