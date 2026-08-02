// CLOUDFLARE WORKER BACKEND - LESSON ENGINE WITH AUTO-NORMALIZATION & CEFR MATRIX

const CEFR_MATRIX = {
  'A1': 'Target Grammar: Present Simple, to be, there is/are, will/going to, Past Simple of be, articles (a/an/the), personal pronouns, modals (can/must). Target Vocabulary: Basic A1 core everyday vocabulary. Sentence Structure: Short, direct sentences (5-10 words).',
  'A2': 'Target Grammar: Past Simple (regular/irregular), Present Continuous for future, Comparatives/Superlatives, some/any/much/many, modals (should/have to), want/like + to-infinitive or gerund. Target Vocabulary: Daily routines, hobbies, travel, shopping. Sentence Structure: Simple compound sentences with and/but/because.',
  'B1': 'Target Grammar: Past Continuous, Past Perfect, Conditionals 1 & 2, Passive Voice, Reported Speech, Relative Clauses (who/which/that), Present Perfect vs Past Simple, will/should/might. Target Vocabulary: Intermediate work, feelings, environment, education, media. Sentence Structure: Varied clause structures.',
  'B2': 'Target Grammar: Conditionals 3 & Mixed Conditionals, Future Perfect & Future Continuous, Past Modals (should have/could have), Non-defining relative clauses, wish/if only, Gerund vs Infinitive nuances. Target Vocabulary: Upper-intermediate abstract concepts, business, tech, subtle idioms. Sentence Structure: Complex with linking devices (however, despite, nevertheless).',
  'C1': 'Target Grammar: Inversion (Not only did..., Hardly had I...), Inversion in Conditionals (Had I known...), Cleft sentences (It was X that...), Advanced Passive, Past Perfect Continuous, Advanced Past Modals. Target Vocabulary: Advanced C1 academic, sophisticated idioms, subtle nuances. Sentence Structure: Sophisticated, highly varied narrative prose.'
};

const DEFAULT_STARTER_LESSON = {
  id: 'lesson-sample-b1',
  title: 'B1 Grammar & Video Lesson: Present Continuous',
  level: 'B1',
  topic: 'Grammar & Video',
  description: 'Sample interactive ESL lesson with YouTube video, grammar rule card, multiple choice quiz, matching pairs, and homework.',
  pages: [
    {
      id: 'p1',
      title: 'Part 1: Video & Rule',
      blocks: [
        { id: 'b1', type: 'heading', level: 1, text: 'Present Continuous in English' },
        { id: 'b2', type: 'video', title: 'Watch the learning video:', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
        { id: 'b3', type: 'grammar_card', title: 'Formation Rule', formula: 'Subject + am / is / are + Verb-ing', explanation: 'Used for actions happening now or planned future arrangements.', examples: ['I am meeting my friends tonight.', 'She is flying to London tomorrow.'] }
      ]
    },
    {
      id: 'p2',
      title: 'Part 2: Interactive Practice',
      blocks: [
        { id: 'b4', type: 'multiple_choice', question: 'Which option is correct for a planned meeting tomorrow?', options: ['I meet my doctor tomorrow', 'I am meeting my doctor tomorrow', 'I met my doctor tomorrow'], correct: 1, explanation: 'For planned future arrangements, use Present Continuous (am meeting).' },
        { id: 'b5', type: 'matching', instruction: 'Match the verb forms:', pairs: [{ left: 'Fly', right: 'Flying' }, { left: 'Run', right: 'Running' }, { left: 'Make', right: 'Making' }] },
        { id: 'b6', type: 'open_input', prompt: 'Write your plans for tomorrow (2 sentences):', placeholder: 'Tomorrow I am...' }
      ]
    },
    {
      id: 'p3',
      title: 'Part 3: Homework Practice',
      blocks: [
        { id: 'b7', type: 'heading', level: 2, text: 'Homework: Vocabulary & Grammar Practice' },
        { id: 'b8', type: 'gap_fill', instruction: 'Fill the gap with the correct verb form:', text: 'She [is flying] to London tomorrow morning.', answers: ['is flying'] }
      ]
    }
  ]
};

const JSON_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-teacher-password',
  'Content-Type': 'application/json; charset=utf-8'
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function cleanAndParseJson(rawText) {
  if (!rawText) return null;
  let clean = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
  
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    clean = clean.substring(start, end + 1);
  } else {
    const arrayStart = clean.indexOf('[');
    const arrayEnd = clean.lastIndexOf(']');
    if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
      clean = clean.substring(arrayStart, arrayEnd + 1);
    }
  }

  try {
    return JSON.parse(clean);
  } catch (err) {
    try {
      let fixed = '';
      let inString = false;
      for (let i = 0; i < clean.length; i++) {
        const c = clean[i];
        if (c === '"' && (i === 0 || clean[i - 1] !== '\\')) {
          inString = !inString;
          fixed += c;
        } else if (inString && (c === '\n' || c === '\r')) {
          fixed += '\\n';
        } else {
          fixed += c;
        }
      }
      return JSON.parse(fixed);
    } catch (e2) {
      console.error('JSON Parse Error:', err, 'Raw:', rawText);
      throw new Error('AI generated invalid JSON: ' + err.message);
    }
  }
}

async function ensureTables(db) {
  if (!db) return;
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS lessons (
        id TEXT PRIMARY KEY,
        title TEXT,
        level TEXT,
        topic TEXT,
        description TEXT,
        pages_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS homework_submissions (
        id TEXT PRIMARY KEY,
        lesson_id TEXT,
        student_name TEXT,
        score INTEGER,
        total_questions INTEGER,
        answers TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS room_states (
        room_id TEXT PRIMARY KEY,
        page_idx INTEGER DEFAULT 0,
        student_answers TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    const countRecord = await db.prepare('SELECT COUNT(*) as count FROM lessons').first();
    if (!countRecord || countRecord.count === 0) {
      await db.prepare(`
        INSERT INTO lessons (id, title, level, topic, description, pages_json)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        DEFAULT_STARTER_LESSON.id,
        DEFAULT_STARTER_LESSON.title,
        DEFAULT_STARTER_LESSON.level,
        DEFAULT_STARTER_LESSON.topic,
        DEFAULT_STARTER_LESSON.description,
        JSON.stringify(DEFAULT_STARTER_LESSON.pages)
      ).run();
    }
  } catch (e) {
    console.error('D1 Tables Init Warning:', e);
  }
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: JSON_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      await ensureTables(env.DB);

      // AUTH LOGIN
      if (path === '/api/teacher/login' && request.method === 'POST') {
        const body = await request.json();
        const validPass = env.TEACHER_PASSWORD || 'teacher123';
        if (body.password === validPass) {
          return jsonResponse({ success: true });
        }
        return jsonResponse({ error: 'Invalid password' }, 401);
      }

      // FULL AI LESSON GENERATOR
      if (path === '/api/ai/generate' && request.method === 'POST') {
        const { text, level = 'B1', topic = 'General English' } = await request.json();

        const cefrRules = CEFR_MATRIX[level] || CEFR_MATRIX['B1'];

        const systemPrompt = `You are a world-class CELTA ELT Methodologist. Generate a complete 5-PAGE interactive English lesson in JSON strictly matching CEFR level ${level}.

STRICT RULES:
1. 100% Target Language Policy: All instructions, questions, texts MUST be in English.
2. CEFR Level ${level} Target: ${cefrRules}
3. EVERY SINGLE FIELD MUST BE FULLY POPULATED WITH HIGH-QUALITY ENGLISH TEXT. NO EMPTY STRINGS OR PLACEHOLDERS!

LESSON STRUCTURE:
Page 1: Lead-in & Core Reading Passage
- "heading": Lesson Title
- "open_input": 2 Lead-in discussion questions
- "flashcards": 6 key vocabulary cards ({ front, back, example })
- "text": A complete 200-word reading passage strictly matching CEFR ${level}.

Page 2: Comprehension
- "multiple_choice": 1 main idea question
- "matching": 5 pairs based on facts from text
- "multiple_choice": 4 True/False questions with explanations

Page 3: Grammar Presentation
- "grammar_card": Target CEFR ${level} grammar rule ({ title, formula, explanation, examples })
- "matching": 5 collocation/synonym pairs

Page 4: Semi-Controlled Practice
- "gap_fill_bank": Paragraph with [answers] in brackets and 3 distractors
- "gap_fill": 4 sentence transformations with [answer] in brackets

Page 5: Production & Homework
- "open_input": 3 speaking discussion questions
- "open_input": Writing / roleplay prompt
- "gap_fill": 4 homework gap fill items

RETURN ONLY VALID JSON FORMAT:
{
  "title": "Title",
  "level": "${level}",
  "topic": "${topic}",
  "description": "Short description",
  "pages": [
    { "id": "p1", "title": "Part 1: Lead-in & Reading", "blocks": [...] },
    { "id": "p2", "title": "Part 2: Text Comprehension", "blocks": [...] },
    { "id": "p3", "title": "Part 3: Grammar Presentation", "blocks": [...] },
    { "id": "p4", "title": "Part 4: Practice & Transformation", "blocks": [...] },
    { "id": "p5", "title": "Part 5: Production & Homework", "blocks": [...] }
  ]
}`;

        const userContent = `Topic: ${topic}\nMaterial/Context: ${text || 'Create a topic-based story.'}`;

        if (!env.AI) {
          return jsonResponse({ error: 'Cloudflare Workers AI binding (AI) is not configured.' }, 500);
        }

        const aiResponse = await env.AI.run('@cf/meta/llama-3.1-70b-instruct', {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent }
          ],
          temperature: 0.3,
          max_tokens: 3800
        });

        const rawText = aiResponse?.response || aiResponse?.choices?.[0]?.message?.content;
        const parsedJson = cleanAndParseJson(rawText);

        return jsonResponse({ success: true, jsonText: JSON.stringify(parsedJson, null, 2) });
      }

      // SINGLE BLOCK AI TRANSFORMER
      if (path === '/api/ai/transform-block' && request.method === 'POST') {
        const { actions = [], sourceBlock = {}, lessonContext = '', level = 'B1' } = await request.json();
        const cefrRules = CEFR_MATRIX[level] || CEFR_MATRIX['B1'];

        const systemPrompt = `You are an expert ELT Materials Designer. Generate complete interactive exercise blocks based on the provided Reading Passage/Context for CEFR Level ${level}.

STRICT RULES:
1. 100% English target language policy.
2. EVERY ITEM MUST BE 100% POPULATED WITH RICH TEXT. NO EMPTY PLACEHOLDERS!
3. CEFR Level ${level} Target: ${cefrRules}

REQUESTED ACTION TASKS (${actions.join(', ')}):
Generate JSON block objects for requested task types:

- "listening": multiple_choice block with 4 comprehension questions ({ question, options [3], correct, explanation }).
- "flashcards": flashcards block with 6 items ({ cards: [{ front, back, example }] }).
- "true_false": multiple_choice block with 4 True/False questions.
- "gap_fill": gap_fill block with 5 sentences containing [answer] in brackets.
- "gap_fill_bank": gap_fill_bank block with text containing [answers] and 3 distractors.
- "matching": matching block with 6 pairs [{ left, right }].
- "discussion": open_input block with 3 speaking discussion prompts.
- "grammar": grammar_card block with CEFR ${level} rule ({ title, formula, explanation, examples }).

RETURN ONLY VALID JSON ARRAY OF BLOCK OBJECTS:
[ { "type": "multiple_choice", ... } ]`;

        const userContent = `CEFR Level: ${level}\nLesson Text/Context:\n${lessonContext || sourceBlock.text || sourceBlock.transcript || JSON.stringify(sourceBlock)}`;

        const aiResponse = await env.AI.run('@cf/meta/llama-3.1-70b-instruct', {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent }
          ],
          temperature: 0.3,
          max_tokens: 2500
        });

        const rawText = aiResponse?.response || aiResponse?.choices?.[0]?.message?.content;
        const parsedBlocks = cleanAndParseJson(rawText);

        return jsonResponse({ success: true, newBlocks: Array.isArray(parsedBlocks) ? parsedBlocks : [parsedBlocks] });
      }

      // YOUTUBE TRANSCRIPT
      if (path === '/api/youtube/transcript' && request.method === 'POST') {
        const { url: ytUrl } = await request.json();
        if (!ytUrl) return jsonResponse({ error: 'No URL provided' }, 400);

        try {
          const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(ytUrl)}&format=json`);
          if (oembedRes.ok) {
            const oembedData = await oembedRes.json();
            return jsonResponse({ success: true, transcript: `Video Title: ${oembedData.title}. Author: ${oembedData.author_name}.` });
          }
        } catch (e) {}

        return jsonResponse({ success: false, message: 'Paste transcripts manually if unavailable.' });
      }

      // LESSONS CRUD (WITH AUTO-NORMALIZATION FOR PAGES)
      if (path === '/api/lessons' && request.method === 'GET') {
        const { results } = await env.DB.prepare('SELECT id, title, level, topic, description, created_at FROM lessons ORDER BY created_at DESC').all();
        return jsonResponse(results || []);
      }

      if (path.startsWith('/api/lessons/') && request.method === 'GET') {
        const id = path.split('/')[3];
        const record = await env.DB.prepare('SELECT * FROM lessons WHERE id = ?').bind(id).first();
        if (!record) return jsonResponse({ error: 'Lesson not found' }, 404);

        let parsedData = [];
        try {
          parsedData = JSON.parse(record.pages_json || '[]');
        } catch (e) {}

        // Auto-normalize flat block arrays into page structure
        let pages = [];
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          if (parsedData[0].type && !parsedData[0].blocks) {
            pages = [{ id: 'p1', title: record.topic || 'Part 1', blocks: parsedData }];
          } else {
            pages = parsedData;
          }
        } else if (parsedData && typeof parsedData === 'object' && parsedData.blocks) {
          pages = [{ id: 'p1', title: record.topic || 'Part 1', blocks: parsedData.blocks }];
        }

        return jsonResponse({
          id: record.id,
          title: record.title,
          level: record.level,
          topic: record.topic,
          description: record.description,
          pages: pages.length > 0 ? pages : [{ id: 'p1', title: 'Part 1', blocks: [] }]
        });
      }

      if (path === '/api/lessons' && request.method === 'POST') {
        const lesson = await request.json();
        const id = lesson.id || 'lesson-' + Date.now();
        const pagesJson = JSON.stringify(lesson.pages || lesson.blocks || []);

        await env.DB.prepare(`
          INSERT INTO lessons (id, title, level, topic, description, pages_json)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            title=excluded.title,
            level=excluded.level,
            topic=excluded.topic,
            description=excluded.description,
            pages_json=excluded.pages_json
        `).bind(id, lesson.title || 'Untitled', lesson.level || 'B1', lesson.topic || 'General', lesson.description || '', pagesJson).run();

        return jsonResponse({ success: true, id });
      }

      if (path.startsWith('/api/lessons/') && request.method === 'DELETE') {
        const id = path.split('/')[3];
        await env.DB.prepare('DELETE FROM lessons WHERE id = ?').bind(id).run();
        return jsonResponse({ success: true });
      }

      // HOMEWORK SUBMISSIONS
      if (path === '/api/homework/submit' && request.method === 'POST') {
        const { lessonId, studentName, score = 0, totalQuestions = 0, answers = {} } = await request.json();
        const id = 'sub-' + Date.now();

        await env.DB.prepare(`
          INSERT INTO homework_submissions (id, lesson_id, student_name, score, total_questions, answers)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(id, lessonId, studentName, score, totalQuestions, JSON.stringify(answers)).run();

        return jsonResponse({ success: true, id });
      }

      if (path.startsWith('/api/homework/') && request.method === 'GET') {
        const lessonId = path.split('/')[3];
        const { results } = await env.DB.prepare('SELECT * FROM homework_submissions WHERE lesson_id = ? ORDER BY created_at DESC').bind(lessonId).all();
        return jsonResponse(results || []);
      }

      // REALTIME ROOM STATE SYNC
      if (path.match(/\/api\/rooms\/[^/]+\/state/) && request.method === 'GET') {
        const roomId = path.split('/')[3];
        const record = await env.DB.prepare('SELECT * FROM room_states WHERE room_id = ?').bind(roomId).first();
        if (!record) {
          return jsonResponse({ isOnline: false, page_idx: 0, student_answers: {} });
        }
        return jsonResponse({
          isOnline: true,
          page_idx: record.page_idx,
          student_answers: JSON.parse(record.student_answers || '{}')
        });
      }

      if (path.match(/\/api\/rooms\/[^/]+\/state/) && request.method === 'POST') {
        const roomId = path.split('/')[3];
        const { pageIdx = 0, answers = {} } = await request.json();

        await env.DB.prepare(`
          INSERT INTO room_states (room_id, page_idx, student_answers, updated_at)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(room_id) DO UPDATE SET
            page_idx=excluded.page_idx,
            student_answers=excluded.student_answers,
            updated_at=CURRENT_TIMESTAMP
        `).bind(roomId, pageIdx, JSON.stringify(answers)).run();

        return jsonResponse({ success: true });
      }

      return jsonResponse({ error: 'Endpoint not found: ' + path }, 404);

    } catch (err) {
      console.error('Worker Router Error:', err);
      return jsonResponse({ error: err.message || 'Internal Server Error' }, 500);
    }
  }
};
