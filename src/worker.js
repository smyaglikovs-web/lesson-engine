// CLOUDFLARE WORKER BACKEND - ACTIVE 2026 MODEL CASCADE (GEMINI + LLAMA 3.3 + DEEPSEEK R1 + QWEN 2.5)

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

// ULTRA-RESILIENT JSON PARSER
function cleanAndParseJson(rawText) {
  if (!rawText) return null;
  let clean = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

  const firstBrace = clean.indexOf('{');
  const firstBracket = clean.indexOf('[');
  
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    const lastBrace = clean.lastIndexOf('}');
    if (lastBrace > firstBrace) clean = clean.substring(firstBrace, lastBrace + 1);
  } else if (firstBracket !== -1) {
    const lastBracket = clean.lastIndexOf(']');
    if (lastBracket > firstBracket) clean = clean.substring(firstBracket, lastBracket + 1);
  }

  try {
    return JSON.parse(clean);
  } catch (e1) {
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
        } else if (inString && c === '\t') {
          fixed += '\\t';
        } else {
          fixed += c;
        }
      }
      return JSON.parse(fixed);
    } catch (e2) {
      let stack = [];
      let repaired = '';
      let insideStr = false;

      for (let i = 0; i < clean.length; i++) {
        const char = clean[i];
        if (char === '"' && (i === 0 || clean[i - 1] !== '\\')) {
          insideStr = !insideStr;
        }
        repaired += char;
        if (!insideStr) {
          if (char === '{') stack.push('}');
          else if (char === '[') stack.push(']');
          else if (char === '}' || char === ']') stack.pop();
        }
      }

      if (insideStr) repaired += '"';
      while (stack.length > 0) repaired += stack.pop();

      try {
        return JSON.parse(repaired);
      } catch (e3) {
        return null;
      }
    }
  }
}

// BULLETPROOF CASCADE AI PIPELINE
async function runAiPipeline(env, systemPrompt, userContent, maxTokens = 3800) {
  // 1. TIER 1: GOOGLE GEMINI 1.5/2.0 FLASH REST API
  if (env.GEMINI_API_KEY) {
    const geminiModels = ['gemini-1.5-flash', 'gemini-2.0-flash'];
    for (const gModel of geminiModels) {
      try {
        const gRestUrl = `https://generativelanguage.googleapis.com/v1beta/models/${gModel}:generateContent?key=${env.GEMINI_API_KEY}`;
        const gRestRes = await fetch(gRestUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userContent}` }] }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
          })
        });

        if (gRestRes.ok) {
          const gData = await gRestRes.json();
          const gRawText = gData?.candidates?.[0]?.content?.parts?.[0]?.text;
          const gParsed = cleanAndParseJson(gRawText);
          if (gParsed) return gParsed;
        } else {
          console.warn(`Gemini model ${gModel} returned status ${gRestRes.status}, cascading to Workers AI...`);
        }
      } catch (eGemini) {
        console.warn(`Gemini call for ${gModel} failed:`, eGemini);
      }
    }
  }

  // 2. TIER 2: WORKERS AI META LLAMA 3.3 70B FAST
  if (env.AI) {
    try {
      const resL3 = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        temperature: 0.2,
        max_tokens: maxTokens
      });

      const rawL3 = resL3?.response || resL3?.choices?.[0]?.message?.content;
      const parsedL3 = cleanAndParseJson(rawL3);
      if (parsedL3) return parsedL3;
    } catch (eL3) {
      console.warn('Llama 3.3 70B Fast failed, cascading to DeepSeek R1...', eL3);
    }

    // 3. TIER 3: WORKERS AI DEEPSEEK R1 DISTILL QWEN 32B
    try {
      const resDs = await env.AI.run('@cf/deepseek-ai/deepseek-r1-distill-qwen-32b', {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        temperature: 0.2,
        max_tokens: maxTokens
      });

      const rawDs = resDs?.response || resDs?.choices?.[0]?.message?.content;
      const parsedDs = cleanAndParseJson(rawDs);
      if (parsedDs) return parsedDs;
    } catch (eDs) {
      console.warn('DeepSeek R1 failed, cascading to Llama 3.1 8B...', eDs);
    }

    // 4. TIER 4: WORKERS AI META LLAMA 3.1 8B (ULTRA-FAST 100% RELIABLE)
    try {
      const resL8 = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
          { role: 'system', content: systemPrompt + '\nSTRICT RULE: Output 100% valid JSON.' },
          { role: 'user', content: userContent }
        ],
        temperature: 0.1,
        max_tokens: maxTokens
      });

      const rawL8 = resL8?.response || resL8?.choices?.[0]?.message?.content;
      const parsedL8 = cleanAndParseJson(rawL8);
      if (parsedL8) return parsedL8;
    } catch (eL8) {
      console.warn('Llama 3.1 8B failed, cascading to Qwen 2.5 72B...', eL8);
    }

    // 5. TIER 5: WORKERS AI QWEN 2.5 72B (STRICT JSON GUARD FALLBACK)
    try {
      const resQwen = await env.AI.run('@cf/qwen/qwen2.5-72b-instruct', {
        messages: [
          { role: 'system', content: systemPrompt + '\nSTRICT RULE: Output 100% valid JSON with zero conversational text.' },
          { role: 'user', content: userContent }
        ],
        temperature: 0.1,
        max_tokens: maxTokens
      });

      const rawQwen = resQwen?.response || resQwen?.choices?.[0]?.message?.content;
      const parsedQwen = cleanAndParseJson(rawQwen);
      if (parsedQwen) return parsedQwen;
    } catch (eQwen) {
      console.error('All AI models in cascade failed:', eQwen);
    }
  }

  throw new Error('AI Generation failed on all cascade tiers. Please try again.');
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

    try {
      await db.prepare(`ALTER TABLE lessons ADD COLUMN pages_json TEXT`).run();
    } catch (e) {}

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

        const systemPrompt = `You are a CELTA ELT Methodologist. Generate a complete 5-PAGE interactive English lesson in JSON strictly matching CEFR level ${level}.

STRICT BLOCK TYPE NAMES (USE ONLY THESE EXACT KEYS):
- "heading": { "type": "heading", "level": 1, "text": "Title" }
- "text": { "type": "text", "text": "Full reading passage story..." }
- "open_input": { "type": "open_input", "prompt": "Question text?" }
- "flashcards": { "type": "flashcards", "title": "Vocab", "cards": [ { "front": "word", "back": "translation", "example": "sentence" } ] }
- "multiple_choice": { "type": "multiple_choice", "question": "Question?", "options": ["A", "B", "C"], "correct": 0, "explanation": "Reason" }
- "matching": { "type": "matching", "instruction": "Match pairs:", "pairs": [ { "left": "word", "right": "match" } ] }
- "grammar_card": { "type": "grammar_card", "title": "Rule Title", "formula": "Formula", "explanation": "Explanation", "examples": ["Ex 1"] }
- "gap_fill_bank": { "type": "gap_fill_bank", "instruction": "Fill gaps:", "text": "Story with [answers] in brackets.", "distractors": ["fake1"] }
- "gap_fill": { "type": "gap_fill", "instruction": "Transform:", "text": "Sentence with [answer].", "answers": ["answer"] }

STRICT QUOTE RULE:
- Use single quotes (') for quotes or speech inside text values. NO unescaped double quotes!
- 100% Target Language Policy: All instructions, questions, texts MUST be in English.
- CEFR Level ${level} Target: ${cefrRules}

RETURN ONLY VALID JSON MATCHING THIS EXACT TEMPLATE:
{
  "title": "${topic}",
  "level": "${level}",
  "topic": "${topic}",
  "description": "Interactive CEFR ${level} Lesson on ${topic}",
  "pages": [
    {
      "id": "p1",
      "title": "Part 1: Lead-in & Reading",
      "blocks": [
        { "type": "heading", "level": 1, "text": "${topic}" },
        { "type": "open_input", "prompt": "What do you know about ${topic}?" },
        { "type": "flashcards", "title": "Key Vocabulary", "cards": [ { "front": "word", "back": "translation", "example": "sentence" } ] },
        { "type": "text", "text": "Write a complete 220-word reading passage about ${topic} for CEFR Level ${level}..." }
      ]
    },
    {
      "id": "p2",
      "title": "Part 2: Text Comprehension",
      "blocks": [
        { "type": "multiple_choice", "question": "Main idea of the reading passage?", "options": ["A", "B", "C"], "correct": 0, "explanation": "Explanation" },
        { "type": "matching", "instruction": "Match facts from the reading passage:", "pairs": [ { "left": "Fact", "right": "Detail" } ] },
        { "type": "multiple_choice", "question": "True or False question?", "options": ["True", "False", "Not Stated"], "correct": 0, "explanation": "Explanation" }
      ]
    },
    {
      "id": "p3",
      "title": "Part 3: Grammar Presentation",
      "blocks": [
        { "type": "grammar_card", "title": "Target Grammar Rule for ${level}", "formula": "Formula", "explanation": "Explanation", "examples": ["Example 1"] },
        { "type": "matching", "instruction": "Match collocations:", "pairs": [ { "left": "Word", "right": "Preposition" } ] }
      ]
    },
    {
      "id": "p4",
      "title": "Part 4: Practice & Transformation",
      "blocks": [
        { "type": "gap_fill_bank", "instruction": "Fill gaps:", "text": "Paragraph with [answers] in brackets.", "distractors": ["extra1"] },
        { "type": "gap_fill", "instruction": "Transform sentence:", "text": "Sentence with [answer].", "answers": ["answer"] }
      ]
    },
    {
      "id": "p5",
      "title": "Part 5: Production & Homework",
      "blocks": [
        { "type": "open_input", "prompt": "Speaking discussion question on ${topic}?" },
        { "type": "open_input", "prompt": "Writing / roleplay prompt?" },
        { "type": "gap_fill", "instruction": "Homework practice:", "text": "Sentence with [answer].", "answers": ["answer"] }
      ]
    }
  ]
}`;

        const userContent = `Topic: ${topic}\nMaterial/Context: ${text || 'Create a topic-based story.'}`;

        const parsedJson = await runAiPipeline(env, systemPrompt, userContent, 3800);
        return jsonResponse({ success: true, jsonText: JSON.stringify(parsedJson, null, 2) });
      }

      // SINGLE BLOCK & CONTEXTUAL AI ASSISTANT
      if (path === '/api/ai/transform-block' && request.method === 'POST') {
        const {
          actions = [],
          sourceBlock = {},
          sourceText = '',
          targetLength = '250',
          matchingType = 'synonym',
          flashcardType = 'russian',
          level = 'B1'
        } = await request.json();

        const cefrRules = CEFR_MATRIX[level] || CEFR_MATRIX['B1'];
        const contextData = sourceText || sourceBlock.text || sourceBlock.explanation || sourceBlock.transcript || JSON.stringify(sourceBlock);

        // IN-BLOCK AI TEXT PASSAGE AUTO-WRITER
        if (actions.includes('generate_text_passage')) {
          const targetWords = targetLength + ' words';
          const textSystemPrompt = `You are a master ELT Materials Writer. Write an engaging, educational reading story/passage on the topic provided for CEFR Level ${level}.

Target Length: ~${targetWords}.
CEFR Level ${level} Target: ${cefrRules}
STRICT QUOTE RULE: Use single quotes (') for quotes or speech inside text.
RETURN ONLY A VALID JSON ARRAY CONTAINING A SINGLE TEXT BLOCK OBJECT:
[
  {
    "type": "text",
    "text": "Full educational reading passage story written strictly for CEFR Level ${level}..."
  }
]`;

          const parsedBlocks = await runAiPipeline(env, textSystemPrompt, `Topic/Hint for Reading Text: ${contextData}`, 3000);
          const newStoryText = Array.isArray(parsedBlocks) ? (parsedBlocks[0]?.text || JSON.stringify(parsedBlocks[0])) : (parsedBlocks.text || JSON.stringify(parsedBlocks));
          return jsonResponse({ success: true, newBlocks: [{ type: 'text', text: newStoryText }] });
        }

        // SPECIAL CASE: IN-BLOCK AI GRAMMAR RULE AUTO-BUILDER
        if (actions.includes('generate_grammar_card')) {
          const grammarSystemPrompt = `You are a master ELT Methodologist. Generate a comprehensive Grammar Presentation Card for the grammar topic provided for CEFR Level ${level}.

CEFR Level ${level} Target: ${cefrRules}
STRICT QUOTE RULE: Use single quotes (') for quotes or speech inside text strings.
RETURN ONLY A VALID JSON ARRAY CONTAINING A SINGLE GRAMMAR_CARD BLOCK OBJECT:
[
  {
    "type": "grammar_card",
    "title": "${contextData}",
    "formula": "Rule Formula (e.g. Subject + had + V3 + would have + V3)",
    "explanation": "Clear CEFR Level ${level} explanation of when and how to use this grammar rule.",
    "examples": [ "Example sentence 1.", "Example sentence 2.", "Example sentence 3." ]
  }
]`;

          const fallbackParsed = await runAiPipeline(env, grammarSystemPrompt, `Grammar Topic Name: ${contextData}`, 1500);
          return jsonResponse({ success: true, newBlocks: Array.isArray(fallbackParsed) ? fallbackParsed : [fallbackParsed] });
        }

        // UNBREAKABLE TEXT REFINEMENT
        if (actions.includes('expand_text') || actions.includes('shorten_text') || actions.includes('refine_level')) {
          let textInstruction = 'Expand this reading passage into a richer, longer, more detailed story (350-450 words) with CEFR Level ' + level + ' vocabulary.';
          
          if (actions.includes('shorten_text')) {
            textInstruction = 'Shorten this reading passage into a concise summary (~150 words) matching CEFR Level ' + level + '.';
          } else if (actions.includes('refine_level')) {
            textInstruction = 'Rewrite this reading passage strictly adapting grammar and vocabulary to CEFR Level ' + level + '.';
          }

          const textSystemPrompt = `You are a master ELT Materials Writer. ${textInstruction}\nCEFR Level ${level} Target: ${cefrRules}\nSTRICT QUOTE RULE: Use single quotes (') for quotes inside text.\nRETURN ONLY A VALID JSON OBJECT WITH "text":\n{ "text": "Full rewritten reading story text here..." }`;

          const parsedObj = await runAiPipeline(env, textSystemPrompt, `Original Text:\n${contextData}`, 3000);
          const newStoryText = parsedObj.text || (Array.isArray(parsedObj) ? parsedObj[0]?.text : JSON.stringify(parsedObj));
          return jsonResponse({ success: true, newBlocks: [{ type: 'text', text: newStoryText }] });
        }

        // DYNAMIC TASK PROMPT CONSTRUCTION (FEW-SHOT TEMPLATES FOR ZERO ERRORS)
        let taskInstructions = '';
        if (actions.includes('listening')) {
          taskInstructions += `- Generate 1 "multiple_choice" block with 4 comprehension questions based on context. Template:\n[ { "type": "multiple_choice", "question": "Question 1?", "options": ["Option A", "Option B", "Option C"], "correct": 0, "explanation": "Reason" } ]\n`;
        }
        if (actions.includes('flashcards')) {
          taskInstructions += `- Generate 1 "flashcards" block with 6 target vocabulary words from context. Template:\n[ { "type": "flashcards", "title": "Key Vocabulary", "cards": [ { "front": "word", "back": "${flashcardType === 'russian' ? 'Russian translation' : 'English definition'}", "example": "sentence" } ] } ]\n`;
        }
        if (actions.includes('true_false')) {
          taskInstructions += `- Generate 1 "multiple_choice" block with 4 True/False questions based on context. Template:\n[ { "type": "multiple_choice", "question": "True or False?", "options": ["True", "False", "Not Stated"], "correct": 0, "explanation": "Reason" } ]\n`;
        }
        if (actions.includes('gap_fill')) {
          taskInstructions += `- Generate 1 "gap_fill" block with 4 sentences containing [answer] in brackets.\n`;
        }
        if (actions.includes('gap_fill_bank')) {
          taskInstructions += `- Generate 1 "gap_fill_bank" block with text containing [answers] and 3 distractors.\n`;
        }
        if (actions.includes('matching')) {
          taskInstructions += `- Generate 1 "matching" block with 6 pairs [{ left, right }] configured as "${matchingType}".\n`;
        }
        if (actions.includes('discussion')) {
          taskInstructions += `- Generate 1 "open_input" block with 3 speaking discussion prompts.\n`;
        }
        if (actions.includes('grammar_transform')) {
          taskInstructions += `- Generate 1 "gap_fill" block with 4 sentence transformations targeting grammar.\n`;
        }
        if (actions.includes('grammar_quiz')) {
          taskInstructions += `- Generate 1 "multiple_choice" block with 4 questions testing grammar.\n`;
        }
        if (actions.includes('fill_this_block')) {
          taskInstructions += `- Generate 1 100% full, non-empty block of type "${sourceBlock.type}".\n`;
        }

        const systemPrompt = `You are an expert ELT Materials Designer. Your task is to generate ONLY the requested exercise block(s) for CEFR Level ${level} based DIRECTLY on the provided source context.

STRICT RULES:
1. ONLY generate the specific block(s) requested below. Do NOT generate any unrequested extra blocks!
2. All exercise items MUST be 100% full and populated with rich English content based on context.
3. Use single quotes (') inside string values. No unescaped double quotes!
4. 100% English target language policy (except Russian translations if explicitly requested).
5. CEFR Level ${level} Target: ${cefrRules}

REQUESTED EXERCISE TASK(S) TO GENERATE:
${taskInstructions}

RETURN ONLY A VALID JSON ARRAY OF THE REQUESTED BLOCK OBJECT(S):
[ { "type": "${sourceBlock.type || 'multiple_choice'}", ... } ]`;

        const userContent = `CEFR Level: ${level}\nSource Context:\n${contextData}`;

        const parsedBlocks = await runAiPipeline(env, systemPrompt, userContent, 2500);
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

      // LESSONS CRUD
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

        try {
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
        } catch (e1) {
          await env.DB.prepare(`
            INSERT INTO lessons (id, title, level, topic, description)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              title=excluded.title,
              level=excluded.level,
              topic=excluded.topic,
              description=excluded.description
          `).bind(id, lesson.title || 'Untitled', lesson.level || 'B1', lesson.topic || 'General', lesson.description || '').run();
        }

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
