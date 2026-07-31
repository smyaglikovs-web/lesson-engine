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
        const { text = '', level = 'B1', topic = '' } = await request.json();

        const activeTopic = topic.trim() || 'General English Practice';
        const hasSourceText = text.trim().length > 5;

        const systemPrompt = `Ты — ведущий методист английского языка высшей квалификации.
Твоя задача — создать ПОЛНОЦЕННЫЙ, НЕЛЕНИВЫЙ, ОБШИРНЫЙ интерактивный урок уровня ${level} на тему "${activeTopic}".

${hasSourceText 
  ? 'ИСПОЛЬЗУЙ ПРЕДОСТАВЛЕННЫЙ НИЖЕ ТЕКСТ КАК ИСТОЧНИК ДЛЯ ВСЕХ УПРАЖНЕНИЙ.' 
  : 'НАПИШИ ИНТЕРЕСНЫЙ, НАСЫЩЕННЫЙ УЧЕБНЫЙ ТЕКСТ ОБЪЕМОМ МИНИМУМ 300 СЛОВ С НУЛЯ НА УКАЗАННУЮ ТЕМУ.'}

СТРОГИЕ ТРЕБОВАНИЯ К КОЛИЧЕСТВУ ЭЛЕМЕНТОВ В УРОКЕ (НЕ СОЗДАВАЙ ПО 1 ВОПРОСУ!):

1. ТЕКСТЫ ДЛЯ ЧТЕНИЯ (text): Смысловой текст объемом МИНИМУМ 250-350 слов.
2. ФЛЕШКАРТЫ (flashcards): МИНИМУМ 8-10 карточек с переводом на русский и примером.
3. ТЕСТОВЫЕ ВОПРОСЫ (multiple_choice): МИНИМУМ 4-6 отдельных вопросов с options, correct и explanation.
4. ЗАПОЛНЕНИЕ ПРОПУСКОВ (gap_fill): МИНИМУМ 6-8 предложений с пропусками (формат 'Sentence [answer] here.').
5. СОПОСТАВЛЕНИЕ (matching): МИНИМУМ 6-8 пар синонимов, антонимов или определений.
6. ПОРЯДОК СЛОВ (sentence_reorder): МИНИМУМ 4-5 предложений для сборки из слов.
7. СОРТИРОВКА (categorization): МИНИМУМ 8-10 элементов по 2-3 категориям.
8. РАЗГОВОРНАЯ ПРАКТИКА (open_input): МИНИМУМ 3-4 глубоких вопроса для обсуждения.

ВЕРНИ СТРОГО ЧИСТЫЙ JSON БЕЗ МАРКДАУН ОБЕРТОК (без \`\`\`json):
{
  "title": "${activeTopic} (${level})",
  "level": "${level}",
  "topic": "${activeTopic}",
  "description": "Интерактивный урок уровня ${level}",
  "pages": [
    {
      "id": "p1",
      "title": "Part 1: Lead-in & Vocabulary",
      "blocks": [
        { "id": "p1-b1", "type": "heading", "level": 1, "text": "${activeTopic}" },
        { "id": "p1-b2", "type": "open_input", "prompt": "Warm-up discussion question on ${activeTopic}...", "placeholder": "Your answer..." },
        { "id": "p1-b3", "type": "flashcards", "title": "Target Vocabulary", "lang": "en-US", "cards": [
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
        { "id": "p2-b1", "type": "text", "text": "Full detailed story/article (300+ words)..." },
        { "id": "p2-b2", "type": "multiple_choice", "question": "Comprehension Question 1?", "options": ["A", "B", "C"], "correct": 0, "explanation": "Expl 1" },
        { "id": "p2-b3", "type": "multiple_choice", "question": "Comprehension Question 2?", "options": ["A", "B", "C"], "correct": 1, "explanation": "Expl 2" },
        { "id": "p2-b4", "type": "multiple_choice", "question": "Comprehension Question 3?", "options": ["A", "B", "C"], "correct": 2, "explanation": "Expl 3" },
        { "id": "p2-b5", "type": "multiple_choice", "question": "Comprehension Question 4?", "options": ["A", "B", "C"], "correct": 0, "explanation": "Expl 4" }
      ]
    },
    {
      "id": "p3",
      "title": "Part 3: Grammar Rule & Practice",
      "blocks": [
        { "id": "p3-b1", "type": "grammar_card", "title": "Grammar Focus", "formula": "Formula", "explanation": "Explanation", "examples": ["Example A", "Example B"] },
        { "id": "p3-b2", "type": "gap_fill", "instruction": "Fill gaps in sentences 1-6:", "text": "1. She [always] arrives on time.", "answers": ["always"] },
        { "id": "p3-b3", "type": "gap_fill", "instruction": "", "text": "2. They [have] finished.", "answers": ["have"] },
        { "id": "p3-b4", "type": "gap_fill", "instruction": "", "text": "3. He [is] working.", "answers": ["is"] },
        { "id": "p3-b5", "type": "gap_fill", "instruction": "", "text": "4. We [will] call you.", "answers": ["will"] },
        { "id": "p3-b6", "type": "gap_fill", "instruction": "", "text": "5. I [enjoy] English.", "answers": ["enjoy"] },
        { "id": "p3-b7", "type": "gap_fill", "instruction": "", "text": "6. You [should] rest.", "answers": ["should"] }
      ]
    },
    {
      "id": "p4",
      "title": "Part 4: Matching & Categorization",
      "blocks": [
        { "id": "p4-b1", "type": "matching", "instruction": "Match synonyms/definitions:", "pairs": [
          { "left": "Word 1", "right": "Match 1" },
          { "left": "Word 2", "right": "Match 2" },
          { "left": "Word 3", "right": "Match 3" },
          { "left": "Word 4", "right": "Match 4" },
          { "left": "Word 5", "right": "Match 5" },
          { "left": "Word 6", "right": "Match 6" }
        ]},
        { "id": "p4-b2", "type": "categorization", "instruction": "Sort words by category:", "categories": ["Category A", "Category B"], "items": [
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
      "title": "Part 5: Sentence Order & Speaking",
      "blocks": [
        { "id": "p5-b1", "type": "sentence_reorder", "instruction": "Reorder sentence 1:", "sentence": "She has been working here for three years", "words": ["working", "for", "three", "years", "She", "has", "here", "been"] },
        { "id": "p5-b2", "type": "sentence_reorder", "instruction": "Reorder sentence 2:", "sentence": "They will announce the results tomorrow morning", "words": ["tomorrow", "results", "announce", "They", "will", "morning", "the"] },
        { "id": "p5-b3", "type": "sentence_reorder", "instruction": "Reorder sentence 3:", "sentence": "I would have called you if I had time", "words": ["called", "have", "time", "would", "I", "you", "if", "had"] },
        { "id": "p5-b4", "type": "open_input", "prompt": "Discussion: What are your thoughts on this topic?", "placeholder": "Write your response..." },
        { "id": "p5-b5", "type": "gap_fill", "instruction": "Homework: Complete sentence:", "text": "1. We need a sustainable [solution].", "answers": ["solution"] }
      ]
    }
  ]
}`;

        const promptInput = hasSourceText 
          ? `Учебный материал для создания урока:\n\n${text}`
          : `Создай полноценный многостраничный урок с нуля на тему "${activeTopic}" уровня ${level}.`;

        const aiResponse = await env.AI.run('@cf/meta/llama-3.1-70b-instruct', {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: promptInput }
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
