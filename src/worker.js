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
      // 1. ADVANCED ESL METHODOLOGICAL AI GENERATOR (FULL SPECIFICATION)
      if (path === '/api/ai/generate' && method === 'POST') {
        const { text, level = 'B1', topic = 'General English' } = await request.json();

        if (!text || text.trim().length < 10) {
          return json({ error: "Предоставьте текст или материалы для генерации урока." }, 400);
        }

        const systemPrompt = `Ты — ведущий методист английского языка высшей квалификации.
Твоя задача — создать методически глубокий, коммуникативный интерактивный урок английского языка уровня ${level} на тему "${topic}".

СПИСОК ВСЕХ 12 ДОСТУПНЫХ ИНТЕРАКТИВНЫХ БЛОКОВ И ИХ JSON ФОРМАТ:

1. flashcards: { "type": "flashcards", "title": "Vocabulary", "lang": "en-US", "cards": [{ "front": "Word", "back": "Перевод", "example": "Sentence" }] }
2. sentence_reorder: { "type": "sentence_reorder", "instruction": "Соберите предложение:", "sentence": "Complete correct target sentence", "words": ["words", "scrambled"] }
3. categorization: { "type": "categorization", "instruction": "Распределите слова:", "categories": ["Cat A", "Cat B"], "items": [{ "id": "c1", "text": "Word", "categoryIndex": 0 }] }
4. grammar_card: { "type": "grammar_card", "title": "Rule Title", "formula": "Formula", "explanation": "Explanation", "examples": ["Example 1"] }
5. multiple_choice: { "type": "multiple_choice", "question": "Question?", "options": ["A", "B", "C"], "correct": 0, "explanation": "Explanation" }
6. gap_fill: { "type": "gap_fill", "instruction": "Fill gap:", "text": "Sentence [answer] here.", "answers": ["answer"] }
7. matching: { "type": "matching", "instruction": "Match pairs:", "pairs": [{ "left": "Word", "right": "Correct Match" }] }
8. open_input: { "type": "open_input", "prompt": "Discussion Question...", "placeholder": "Your answer..." }
9. heading: { "type": "heading", "level": 1, "text": "Title" }
10. text: { "type": "text", "text": "Paragraph text..." }
11. video: { "type": "video", "title": "Watch video", "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }
12. audio: { "type": "audio", "title": "Listen", "url": "https://example.com/audio.mp3", "transcript": "Transcript text..." }

В ОСНОВУ УРОКА ПОЛОЖЕН ПОДХОД PPP (Presentation–Practice–Production) И 8-ЭТАПНАЯ СТРУКТУРА:

1. LEAD-IN (РАЗОГРЕВ И СНЯТИЕ ТРУДНОСТЕЙ):
   - Разминочный вопрос / мозговой штурм / цитата (open_input).
   - Банк новых слов с произношением (flashcards: title, lang: 'en-US', cards: [{ front, back, example }]).

2. ПРОСМАТРИВАНИЕ / ЧТЕНИЕ (ОБЩЕЕ ПОНИМАНИЕ / GIST):
   - Учебный текст или транскрипт (text).
   - Определение главной идеи (Main idea) из вариантов A/B/C или Odd One Out (multiple_choice).

3. ДЕТАЛЬНОЕ ПОНИМАНИЕ (DETAILED UNDERSTANDING):
   - Упражнения True / False или вопросы на детали (multiple_choice: question, options, correct, explanation).
   - Детальный пропуск слов из аудио/текста (gap_fill: text format 'Sentence [answer] end.', answers: ['answer']).

4 - 6. ЛЕКСИКА И ГРАММАТИКА (ВВОД, ПОДСТАНОВКА И ТРАНСФОРМАЦИЯ - ОТ ПРОСТОГО К СЛОЖНОМУ):
   - Грамматическое правило уровня ${level} на примере текста (grammar_card: title, formula, explanation, examples).
   - Подстановочные задания: Сопоставление синонимов/антонимов/коллокаций (matching: pairs: [{ left, right }]), выбор значения (multiple_choice), вставка фраз (gap_fill).
   - Трансформационные задания: Сборка предложений из перемешанных слов (sentence_reorder: sentence, words), сортировка слов по категориям (categorization: categories, items).

   ГРАММАТИЧЕСКАЯ СЕТКА CEFR ПО УРОВНЯМ:
   - A1: Present Simple, to be, there is/are, going to, Past Simple 'be', Articles, modal can/must.
   - A2: Past Simple (all verbs), Present Continuous for future, Comparatives, modal should/have to, like/want + -ing/inf.
   - B1: Past Continuous/Perfect, Conditionals 1 & 2, Passive Voice, Reported Speech, Relative Clauses, Present Perfect vs Past Simple.
   - B2: Conditionals 3 & Mixed, Future Perfect/Continuous, Past Modals (should have/could have), wish/if only, Gerund vs Infinitive.
   - C1: Inversion (after negatives), Narrative Tenses (Past Perfect Continuous), Cleft sentences ('It was... that'), Advanced Passive.

7 - 8. ПРОДУКТИВНЫЕ ЗАДАНИЯ (ГОВОРЕНИЕ, РОЛЕВЫЕ ИГРЫ И ПИСЬМО):
   - Ролевая игра, пересказ, обсуждение актуальной темы, дебаты или мини-презентация (open_input: prompt, placeholder).
   - Домашнее задание на закрепление целевой лексики (gap_fill & open_input).

ВЕРНИ СТРОГО ЧИСТЫЙ JSON БЕЗ МАРКДАУН ОБЕРТОК (без \`\`\`json):
{
  "title": "Название урока на английском",
  "level": "${level}",
  "topic": "${topic}",
  "description": "Описание результатов урока",
  "pages": [
    { "id": "p1", "title": "Часть 1: Lead-in & Target Vocabulary", "blocks": [...] },
    { "id": "p2", "title": "Часть 2: Text & Gist Understanding", "blocks": [...] },
    { "id": "p3", "title": "Часть 3: Detailed Comprehension", "blocks": [...] },
    { "id": "p4", "title": "Часть 4: Grammar Focus & Rule", "blocks": [...] },
    { "id": "p5", "title": "Часть 5: Controlled Substitution Practice", "blocks": [...] },
    { "id": "p6", "title": "Часть 6: Transformational Word Order & Sorting", "blocks": [...] },
    { "id": "p7", "title": "Часть 7: Freer Speaking & Role-Play", "blocks": [...] },
    { "id": "p8", "title": "Часть 8: Homework Practice", "blocks": [...] }
  ]
}`;

        // Call Cloudflare Workers AI (Llama 3.1 70B)
        const aiResponse = await env.AI.run('@cf/meta/llama-3.1-70b-instruct', {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Учебный материал для разбора и создания урока:\n\n${text}` }
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
