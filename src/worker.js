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
      // 1. ADVANCED ESL METHODOLOGICAL AI GENERATOR
      if (path === '/api/ai/generate' && method === 'POST') {
        const { text, level = 'B1', topic = 'General English' } = await request.json();

        if (!text || text.trim().length < 10) {
          return json({ error: "Предоставьте текст или материалы для генерации урока." }, 400);
        }

        const systemPrompt = `Ты — методист английского языка высшей квалификации.
Твоя задача — создать НЕЛЕНИВЫЙ, полноценный, многостраничный интерактивный урок уровня ${level} на тему "${topic}", строго следуя 8-этапной ESL методике.

МЕТОДОЛОГИЧЕСКАЯ СТРУКТУРА УРОКА (ПО СТРАНИЦАМ):

СТРАНИЦА 1: Lead-in & Target Vocabulary (Разогрев и ввод)
- Блок open_input: Разминочный вопрос на тему.
- Блок flashcards: 6-8 ключевых слов/коллокаций с переводом, примером и звуком (lang: 'en-US').

СТРАНИЦА 2: Text / Article & Gist Understanding (Общее понимание)
- Блок text: Учебный текст или транскрипт.
- Блок multiple_choice: Выбор основной идеи (Main Idea) или Odd One Out (лишний факт).

СТРАНИЦА 3: Detailed Understanding & Grammar Focus (Детальное понимание)
- Блок multiple_choice: 3-4 детальных вопроса True/False или выбор ответа.
- Блок grammar_card: Грамматика уровня ${level} из текста с формулой, правилом и примерами.
  * Грамматика для уровня ${level}:
    - A1: Present Simple, to be, there is/are, going to, modal can/must.
    - A2: Past Simple, Present Continuous for future, Comparatives, should/have to.
    - B1: Past Continuous/Perfect, Conditionals 1 & 2, Passive Voice, Reported Speech, Present Perfect vs Past Simple.
    - B2: Conditionals 3 & Mixed, Future Perfect/Continuous, Past Modals (should have/could have), wish/if only, Gerund vs Infinitive.
    - C1: Inversion, Advanced Narrative Tenses, Cleft sentences (It was... that), Advanced Passive.

СТРАНИЦА 4: Controlled & Transformational Practice (Подстановочные и трансформационные задания)
- Блок matching: 4-6 пар синонимов/антонимов или устойчивых словосочетаний (pairs изначально ВЕРНО соединены!).
- Блок sentence_reorder: 2-3 задания на сборку предложений с нужным порядком слов/грамматикой.
- Блок categorization: Сортировка 6 слов/фраз по 2 категории.

СТРАНИЦА 5: Homework & Freer Production (Продуктивная практика и ДЗ)
- Блок gap_fill: 3-5 пропусков в предложениях (формат 'Sentence [answer] here.', answers: ['answer']).
- Блок open_input: 2 глубоких дискуссионных вопроса для обсуждения/письма.

ВЕРНИ СТРОГО ЧИСТЫЙ JSON БЕЗ МАРКДАУН ОБЕРТОК (без \`\`\`json):
{
  "title": "Название урока на английском",
  "level": "${level}",
  "topic": "${topic}",
  "description": "Подробное описание урока",
  "pages": [
    { "id": "p1", "title": "Часть 1: Lead-in & Target Vocabulary", "blocks": [...] },
    { "id": "p2", "title": "Часть 2: Text & Gist Understanding", "blocks": [...] },
    { "id": "p3", "title": "Часть 3: Detailed Practice & Grammar Focus", "blocks": [...] },
    { "id": "p4", "title": "Часть 4: Controlled & Transformational Practice", "blocks": [...] },
    { "id": "p5", "title": "Часть 5: Freer Speaking & Homework", "blocks": [...] }
  ]
}`;

        // Call Cloudflare Workers AI
        const aiResponse = await env.AI.run('@cf/meta/llama-3.1-70b-instruct', {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Материалы учебника для генерации урока:\n\n${text}` }
          ],
          max_tokens: 3800,
          temperature: 0.3
        });

        const generatedText = aiResponse.response || "";
        var tb = String.fromCharCode(96, 96, 96);
        var cleanJsonText = generatedText.split(tb + 'json').join('').split(tb).join('').trim();

        return json({ success: true, jsonText: cleanJsonText });
      }

      // API Routes
      if (path === '/api/lessons' && method === 'GET') return json(await getLessons(env));
      if (path === '/api/lessons' && method === 'POST') return json(await saveLesson(env, await request.json()));
      if (path.startsWith('/api/lessons/') && method === 'GET') {
        const data = await getSingleLesson(env, path.split('/api/lessons/')[1]);
        return data ? new Response(data, { headers: { "Content-Type": "application/json" } }) : json({ error: "Not found" }, 404);
      }
      if (path.startsWith('/api/lessons/') && method === 'DELETE') return json(await deleteLesson(env, path.split('/api/lessons/')[1]));

      // Room & Homework API
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
