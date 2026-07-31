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
      // 1. FREE CLOUDFLARE WORKERS AI LESSON GENERATOR
      if (path === '/api/ai/generate' && method === 'POST') {
        const { text, level = 'B1', topic = 'General English' } = await request.json();

        if (!text || text.trim().length < 10) {
          return json({ error: "Предоставьте текст или материалы для генерации урока." }, 400);
        }

        const systemPrompt = `Ты — старший методист английского языка высшей категории.
Твоя задача — извлечь максимум пользы из предоставленного текста/PDF и создать НЕЛЕНИВЫЙ, разноплановый, глубокий интерактивный урок английского языка уровня ${level} на тему "${topic}".

СТРОГИЕ ТРЕБОВАНИЯ К КАЧЕСТВУ УРОКА:
1. НЕ БУДЬ ЛЕНИВЫМ! Составь насыщенный урок из 3-5 страниц с высоким педагогическим качеством.
2. ИСПОЛЬЗУЙ РАЗНООБРАЗНЫЕ ИНТЕРАКТИВНЫЕ БЛОКИ:
   - flashcards: для 5-8 ключевых сложных слов/фраз текста с переводом на русский и примером.
   - grammar_card: главная грамматика или правила из текста с формулой и примерами.
   - sentence_reorder: 2-3 упражнения на составление сложных предложений из слов.
   - categorization: распределение 6-8 слов/фраз по 2 тематическим корзинам.
   - multiple_choice: 3-4 глубоких вопроса на понимание текста и детальную грамматику.
   - gap_fill: 3-5 пропусков в контекстных предложениях с ответами в скобках [ответ].
   - matching: 4-6 пар синонимов или фраз (pairs изначально верно соединены!).
   - open_input: 2 глубоких дискуссионных вопроса для развития речи и письма.

ВЕРНИ СТРОГО ЧИСТЫЙ JSON БЕЗ МАРКДАУНА (без \`\`\`json):
{
  "title": "Название урока на английском",
  "level": "${level}",
  "topic": "${topic}",
  "description": "Подробное описание результатов урока",
  "pages": [
    {
      "id": "p1",
      "title": "Часть 1: Ключевая лексика & Флешкарты",
      "blocks": [
        { "id": "b1", "type": "heading", "level": 1, "text": "Заголовок темы" },
        { "id": "b2", "type": "text", "text": "Вводный текст или контекст..." },
        { "id": "b3", "type": "flashcards", "title": "Target Vocabulary", "lang": "en-US", "cards": [{ "front": "Word", "back": "Перевод", "example": "Context sentence." }] }
      ]
    },
    {
      "id": "p2",
      "title": "Часть 2: Текст для чтения & Грамматика",
      "blocks": [
        { "id": "b4", "type": "text", "text": "Основной учебный текст..." },
        { "id": "b5", "type": "grammar_card", "title": "Grammar Focus", "formula": "Subject + Formula", "explanation": "Пояснение", "examples": ["Example 1"] }
      ]
    },
    {
      "id": "p3",
      "title": "Часть 3: Понимание текста & Тесты",
      "blocks": [
        { "id": "b6", "type": "multiple_choice", "question": "Вопрос?", "options": ["A", "B", "C"], "correct": 0, "explanation": "Пояснение" },
        { "id": "b7", "type": "matching", "instruction": "Соедините слова с их значениями:", "pairs": [{ "left": "Word", "right": "Meaning" }] }
      ]
    },
    {
      "id": "p4",
      "title": "Часть 4: Порядок слов & Сортировка",
      "blocks": [
        { "id": "b8", "type": "sentence_reorder", "instruction": "Соберите предложение:", "sentence": "Complete correct target sentence", "words": ["words", "scrambled"] },
        { "id": "b9", "type": "categorization", "instruction": "Распределите слова по группам:", "categories": ["Group A", "Group B"], "items": [{ "id": "c1", "text": "Word", "categoryIndex": 0 }] }
      ]
    },
    {
      "id": "p5",
      "title": "Часть 5: Домашнее задание & Развитие речи",
      "blocks": [
        { "id": "b10", "type": "gap_fill", "instruction": "Заполните пропуск:", "text": "The student [understands] the rules.", "answers": ["understands"] },
        { "id": "b11", "type": "open_input", "prompt": "Развернутый разговорный вопрос...", "placeholder": "Write your answer..." }
      ]
    }
  ]
}`;

        // Call Free Cloudflare Workers AI (Llama 3.1 70B)
        const aiResponse = await env.AI.run('@cf/meta/llama-3.1-70b-instruct', {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Вот учебные материалы для создания урока:\n\n${text}` }
          ],
          max_tokens: 3500,
          temperature: 0.3
        });

        const generatedText = aiResponse.response || "";
        
        // Sanitize JSON
        var tb = String.fromCharCode(96, 96, 96);
        var cleanJsonText = generatedText.split(tb + 'json').join('').split(tb).join('').trim();

        return json({ success: true, jsonText: cleanJsonText });
      }

      // 2. Lessons API
      if (path === '/api/lessons' && method === 'GET') return json(await getLessons(env));
      if (path === '/api/lessons' && method === 'POST') return json(await saveLesson(env, await request.json()));
      if (path.startsWith('/api/lessons/') && method === 'GET') {
        const data = await getSingleLesson(env, path.split('/api/lessons/')[1]);
        return data ? new Response(data, { headers: { "Content-Type": "application/json" } }) : json({ error: "Not found" }, 404);
      }
      if (path.startsWith('/api/lessons/') && method === 'DELETE') return json(await deleteLesson(env, path.split('/api/lessons/')[1]));

      // 3. Realtime Rooms API
      if (path.startsWith('/api/rooms/') && path.endsWith('/state') && method === 'POST') {
        const roomId = path.split('/api/rooms/')[1].replace('/state', '');
        const body = await request.json();
        return json(await updateRoomState(env, roomId, body.pageIdx, body.answers));
      }
      if (path.startsWith('/api/rooms/') && path.endsWith('/state') && method === 'GET') {
        const roomId = path.split('/api/rooms/')[1].replace('/state', '');
        return json(await getRoomState(env, roomId));
      }

      // 4. Homework API
      if (path === '/api/homework/submit' && method === 'POST') return json(await submitHomework(env, await request.json()));
      if (path.startsWith('/api/homework/') && method === 'GET') return json(await getHomeworkSubmissions(env, path.split('/api/homework/')[1]));

      // 5. Serve Frontend Static Assets
      return env.ASSETS.fetch(request);

    } catch (err) {
      return json({ error: err.message }, 500);
    }
  }
};
