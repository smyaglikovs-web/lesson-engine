// INDESTRUCTIBLE MULTI-PROVIDER AI TURBO ENGINE (ACCURATE CONTEXTUAL TASK GENERATION)

export const CEFR_MATRIX = {
  'A1': 'Target Grammar: Present Simple, to be, there is/are, basic plurals. Short sentences (5-10 words). Everyday basic vocabulary.',
  'A2': 'Target Grammar: Past Simple, Present Continuous, Comparatives. Daily routines, travel, hobbies.',
  'B1': 'Target Grammar: Past Continuous, Conditionals 1 & 2, Present Perfect, Passive Voice. Work, feelings, modern lifestyle.',
  'B2': 'Target Grammar: Conditionals 3, Future Perfect, Past Modals, Wish clauses, Complex Passives. Idioms, abstract concepts.',
  'C1': 'Target Grammar: Inversion, Cleft sentences, Advanced Modals, Participle clauses. Nuanced, academic, idiomatic language.'
};

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9'
};

function getYouTubeId(url = '') {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = String(url).match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// 1. ULTRA-FAST FETCH WITH STRICT TIMEOUT
async function fetchWithTimeout(url, options = {}, timeoutMs = 5500) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// 2. SANITIZES & ENFORCES VALID ENGINE PRIMITIVES
export function sanitizeBlockStructure(b) {
  if (!b || typeof b !== 'object') return [b];

  let type = String(b.type || 'text').toLowerCase().trim();
  if (type === 'header' || type === 'title') type = 'heading';
  if (type === 'paragraph' || type === 'reading' || type === 'article') type = 'text';
  if (type === 'quiz' || type === 'question' || type === 'true_false') type = 'multiple_choice';
  if (type === 'vocab' || type === 'words') type = 'flashcards';
  if (type === 'rule' || type === 'grammar') type = 'grammar_card';
  if (type === 'reorder' || type === 'sentence_order') type = 'sentence_reorder';
  if (type === 'categories' || type === 'bucket') type = 'categorization';
  if (type === 'inline' || type === 'select_gap') type = 'inline_select';
  if (type === 'wheel' || type === 'roulette') type = 'spinning_wheel';

  b.type = type;

  // MULTIPLE CHOICE NORMALIZATION
  if (b.type === 'multiple_choice' && Array.isArray(b.options)) {
    let cleanOptions = [];
    let detectedCorrect = typeof b.correct === 'number' ? b.correct : 0;

    b.options.forEach((opt, idx) => {
      if (typeof opt === 'string') {
        cleanOptions.push(opt);
      } else if (opt && typeof opt === 'object') {
        const textVal = opt.text || opt.option || opt.value || opt.label || opt.answer || JSON.stringify(opt);
        cleanOptions.push(String(textVal));
        if (opt.isCorrect === true || opt.correct === true) {
          detectedCorrect = idx;
        }
      } else {
        cleanOptions.push(String(opt));
      }
    });

    b.options = cleanOptions.length > 0 ? cleanOptions : ['Option A', 'Option B'];
    b.correct = detectedCorrect;
  }

  // MATCHING NORMALIZATION
  if (b.type === 'matching') {
    let rawPairs = Array.isArray(b.pairs) ? b.pairs : [];
    b.pairs = rawPairs.map(p => {
      if (typeof p === 'object' && p !== null) {
        const leftVal = p.left || p.term || p.word || p.item || 'Word';
        const rightVal = p.right || p.definition || p.match || p.answer || 'Match';
        return { left: String(leftVal), right: String(rightVal) };
      }
      return { left: 'Word', right: 'Match' };
    });
  }

  // FLASHCARDS NORMALIZATION
  if (b.type === 'flashcards') {
    let rawCards = Array.isArray(b.cards) ? b.cards : [];
    b.cards = rawCards.map(c => {
      if (typeof c === 'object' && c !== null) {
        const frontVal = c.front || c.word || c.term || 'Word';
        const backVal = c.back || c.translation || c.definition || 'Translation';
        const exVal = c.example || c.sentence || '';
        return { front: String(frontVal), back: String(backVal), example: String(exVal) };
      }
      return { front: 'Word', back: 'Translation', example: '' };
    });
  }

  // GAP FILL NORMALIZATION (MULTI-GAP SUPPORT)
  if (b.type === 'gap_fill') {
    if (!Array.isArray(b.answers) || b.answers.length === 0) {
      const matches = [...(b.text || '').matchAll(/\[(.*?)\]/g)].map(m => m[1].trim());
      b.answers = matches.length > 0 ? matches : ['answer'];
    }
  }

  return [b];
}

// 3. ULTRA-RESILIENT JSON PARSER WITH AUTO-REPAIR
export function cleanAndParseJson(rawText, topic = '', level = 'B1') {
  if (!rawText) return null;

  let clean = rawText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  clean = clean.replace(/```json/gi, '').replace(/```/g, '').trim();

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
      repaired = repaired.replace(/,\s*([\}\]])/g, '$1');

      try {
        return JSON.parse(repaired);
      } catch (e3) {
        return null;
      }
    }
  }
}

// 4. TURBO MULTI-PROVIDER AI CASCADE
export async function runAiPipeline(env, systemPrompt, userContent, maxTokens = 3000, topic = '', level = 'B1') {
  
  // TIER 1: GROQ API (1.0s – 1.8s)
  if (env.GROQ_API_KEY && env.GROQ_API_KEY.trim().length > 5) {
    const groqKey = env.GROQ_API_KEY.trim();
    const fastGroqModels = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];

    for (const model of fastGroqModels) {
      try {
        const res = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userContent }
            ],
            temperature: 0.15,
            response_format: { type: 'json_object' }
          })
        }, 5500);

        if (res.ok) {
          const data = await res.json();
          const content = data?.choices?.[0]?.message?.content;
          const parsed = cleanAndParseJson(content, topic, level);
          if (parsed) return parsed;
        }
      } catch (e) {}
    }
  }

  // TIER 2: GEMINI API (1.5s – 2.0s)
  if (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim().length > 5) {
    const apiKey = env.GEMINI_API_KEY.trim();
    const geminiModels = ['gemini-2.0-flash', 'gemini-1.5-flash'];

    for (const gModel of geminiModels) {
      try {
        const gUrl = `https://generativelanguage.googleapis.com/v1beta/models/${gModel}:generateContent?key=${apiKey}`;
        const gRes = await fetchWithTimeout(gUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: userContent }] }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.15 }
          })
        }, 5500);

        if (gRes.ok) {
          const gData = await gRes.json();
          const gText = gData?.candidates?.[0]?.content?.parts?.[0]?.text;
          const gParsed = cleanAndParseJson(gText, topic, level);
          if (gParsed) return gParsed;
        }
      } catch (eG) {}
    }
  }

  // TIER 3: CLOUDFLARE WORKERS AI
  if (env.AI) {
    const cfModels = [
      '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
      '@cf/meta/llama-3.1-8b-instruct-fast',
      '@cf/meta/llama-3.1-70b-instruct'
    ];
    for (const cfModel of cfModels) {
      try {
        const resCf = await env.AI.run(cfModel, {
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userContent }],
          temperature: 0.15,
          max_tokens: maxTokens
        });

        const rawCf = resCf?.response || resCf?.choices?.[0]?.message?.content;
        const parsedCf = cleanAndParseJson(rawCf, topic, level);
        if (parsedCf) return parsedCf;
      } catch (eCf) {}
    }
  }

  // TIER 4: OPENROUTER API (Backup)
  if (env.OPENROUTER_API_KEY && env.OPENROUTER_API_KEY.trim().length > 5) {
    const freeModels = ['meta-llama/llama-3.3-70b-instruct:free', 'qwen/qwen-2.5-72b-instruct:free'];
    for (const model of freeModels) {
      try {
        const res = await fetchWithTimeout('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.OPENROUTER_API_KEY.trim()}`
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userContent }]
          })
        }, 5500);

        if (res.ok) {
          const data = await res.json();
          const content = data?.choices?.[0]?.message?.content;
          const parsed = cleanAndParseJson(content, topic, level);
          if (parsed) return parsed;
        }
      } catch (e) {}
    }
  }

  return createFallbackLesson(topic, level);
}

// 5. DETERMINISTIC INSTANT FALLBACK
function createFallbackLesson(topic = 'General English Practice', level = 'B1') {
  return {
    title: `${topic} (${level})`,
    level: level,
    topic: topic,
    description: `Interactive CEFR ${level} Lesson on ${topic}`,
    pages: [
      {
        id: 'p1',
        title: 'Part 1: Lead-in & Vocabulary',
        blocks: [
          { id: 'b1', type: 'heading', level: 1, text: `${topic}` },
          { id: 'b2', type: 'open_input', prompt: `What do you already know or think about ${topic}?` },
          { id: 'b3', type: 'flashcards', title: 'Target Vocabulary', cards: [
            { front: 'Key Concept', back: 'Основное понятие', example: `Understanding ${topic} is crucial.` },
            { front: 'Practice', back: 'Практика', example: 'Consistent practice brings natural fluency.' }
          ]},
          { id: 'b4', type: 'text', text: `${topic} is a widely studied theme in modern English learning. Exploring this subject helps improve reading comprehension, active vocabulary retention, and natural conversation skills. In this lesson, we will analyze key concepts, practice relevant structures, and apply them in interactive tasks.` }
        ]
      },
      {
        id: 'p2',
        title: 'Part 2: Comprehension & Grammar',
        blocks: [
          { id: 'b5', type: 'grammar_card', title: `Grammar Focus (${level})`, formula: 'Subject + Verb + Object', explanation: `Standard sentence patterns used when discussing ${topic}.`, examples: [`We are actively studying ${topic}.`] },
          { id: 'b6', type: 'multiple_choice', question: `Which statement best relates to ${topic}?`, options: ['It requires regular practice', 'It has no practical use', 'It is never used in real conversation'], correct: 0, explanation: 'Regular practice forms the foundation of communicative mastery.' }
        ]
      },
      {
        id: 'p3',
        title: 'Part 3: Production & Practice',
        blocks: [
          { id: 'b7', type: 'gap_fill', instruction: 'Complete the sentence with the target word:', text: `We are actively studying [${topic}] today.`, answers: [topic] },
          { id: 'b8', type: 'open_input', prompt: `Write 3 sentences sharing your personal thoughts or experience with ${topic}:` }
        ]
      }
    ]
  };
}

// 6. YOUTUBE TRANSCRIPT SCRAPER
export async function fetchYouTubeTranscriptNative(videoUrl, env = {}) {
  try {
    const videoId = getYouTubeId(videoUrl);
    if (!videoId) return null;

    let title = '';
    let transcriptText = '';

    try {
      const oembedRes = await fetchWithTimeout(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`, { headers: BROWSER_HEADERS }, 3000);
      if (oembedRes.ok) {
        const odata = await oembedRes.json();
        title = odata.title || '';
      }
    } catch(e) {}

    const timedTextUrls = [
      `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&kind=asr`,
      `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en`,
      `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en-US`
    ];

    for (const ttUrl of timedTextUrls) {
      if (transcriptText) break;
      try {
        const res = await fetchWithTimeout(ttUrl, { headers: BROWSER_HEADERS }, 3000);
        if (res.ok) {
          const xml = await res.text();
          if (xml && xml.includes('<text')) {
            const textRegex = /<text[^>]*>(.*?)<\/text>/g;
            let fullText = '';
            let m;
            while ((m = textRegex.exec(xml)) !== null) {
              let decodedText = m[1]
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&#39;/g, "'")
                .replace(/&quot;/g, '"')
                .replace(/<[^>]+>/g, '')
                .trim();
              if (decodedText) fullText += decodedText + ' ';
            }
            fullText = fullText.replace(/\s+/g, ' ').trim();
            if (fullText.length > 40) transcriptText = fullText.slice(0, 3500);
          }
        }
      } catch(e) {}
    }

    return { title, transcript: transcriptText, videoId };
  } catch (e) {
    return null;
  }
}

// 7. FULL AI LESSON GENERATOR
export async function generateFullLessonWithAI(env, payload) {
  const { text = '', level = 'B1', topic = 'General English' } = payload;
  const cefrRules = CEFR_MATRIX[level] || CEFR_MATRIX['B1'];

  const systemPrompt = `You are a master CELTA ELT Methodologist. Generate a 4-PAGE interactive English lesson in JSON strictly matching CEFR level ${level}.
CEFR Target: ${cefrRules}

BLOCK KEYS: "heading", "text", "open_input", "flashcards", "multiple_choice", "matching", "grammar_card", "gap_fill_bank", "gap_fill", "sentence_reorder".

CRITICAL RULE:
- On Page 1, write a complete, engaging 180-220 word educational reading passage for CEFR Level ${level}.
- Never output raw objects inside "options". "options" must be an array of simple strings.

STRICT JSON SCHEMA:
{
  "title": "${topic}",
  "level": "${level}",
  "topic": "${topic}",
  "description": "CEFR ${level} Lesson on ${topic}",
  "pages": [
    {
      "id": "p1",
      "title": "Part 1: Lead-in & Reading",
      "blocks": [
        { "type": "heading", "level": 1, "text": "${topic}" },
        { "type": "open_input", "prompt": "What do you already know about ${topic}?" },
        { "type": "flashcards", "title": "Key Vocabulary", "cards": [ { "front": "word", "back": "translation", "example": "Context sentence." } ] },
        { "type": "text", "text": "A rich 200-word educational story text about ${topic} strictly for CEFR ${level}..." }
      ]
    },
    {
      "id": "p2",
      "title": "Part 2: Comprehension & Matching",
      "blocks": [
        { "type": "multiple_choice", "question": "Comprehension Question?", "options": ["Option A", "Option B", "Option C"], "correct": 0, "explanation": "Reason" },
        { "type": "matching", "instruction": "Match the pairs:", "pairs": [ { "left": "Term", "right": "Definition" } ] }
      ]
    },
    {
      "id": "p3",
      "title": "Part 3: Grammar & Practice",
      "blocks": [
        { "type": "grammar_card", "title": "Target Grammar Rule", "formula": "Formula", "explanation": "Explanation", "examples": ["Example 1", "Example 2"] },
        { "type": "gap_fill", "instruction": "Complete the sentence with target form:", "text": "1. She [practiced] yesterday.\\n2. They [have arrived] on time.", "answers": ["practiced", "have arrived"] }
      ]
    },
    {
      "id": "p4",
      "title": "Part 4: Production & Discussion",
      "blocks": [
        { "type": "open_input", "prompt": "Discussion question for speaking or written reflection?" }
      ]
    }
  ]
}`;

  const userPrompt = `Topic: ${topic}\nMaterial/Context: ${text || 'Create an educational story on the topic.'}`;

  try {
    const parsedJson = await runAiPipeline(env, systemPrompt, userPrompt, 2800, topic, level);
    if (parsedJson && parsedJson.pages) {
      parsedJson.pages.forEach(p => {
        let cleanBlocks = [];
        (p.blocks || []).forEach(b => {
          const res = sanitizeBlockStructure(b);
          if (Array.isArray(res)) cleanBlocks.push(...res);
          else cleanBlocks.push(res);
        });
        p.blocks = cleanBlocks;
      });
    }
    return { success: true, jsonText: JSON.stringify(parsedJson, null, 2) };
  } catch (err) {
    return { success: true, jsonText: JSON.stringify(createFallbackLesson(topic, level), null, 2) };
  }
}

// 8. CONTEXTUAL SINGLE & MULTI-BLOCK AI ASSISTANT (FIXED TASK DISPATCHER)
export async function transformBlockWithAI(env, payload) {
  let { actions = [], sourceBlock = {}, sourceText = '', targetLength = '250', matchingType = 'synonym', flashcardType = 'russian', level = 'B1' } = payload;
  if (!actions || actions.length === 0) return { error: 'Выберите хотя бы одно задание.' };

  const cefrRules = CEFR_MATRIX[level] || CEFR_MATRIX['B1'];
  let rawContext = sourceText || sourceBlock.text || sourceBlock.explanation || sourceBlock.transcript || JSON.stringify(sourceBlock);
  const safeContextData = (rawContext || '').replace(/[\r\n]+/g, ' ').replace(/"/g, "'").trim();

  // A. REWRITE / EXPAND / SHORTEN TEXT
  if (actions.includes('generate_text_passage')) {
    const textPrompt = `You are an ELT Materials Writer. Write an engaging educational reading text for CEFR Level ${level} (~${targetLength} words).\nCEFR Level ${level}: ${cefrRules}\nRETURN JSON OBJECT: { "text": "Full educational story passage..." }`;
    try {
      const parsedObj = await runAiPipeline(env, textPrompt, `Topic/Context: ${safeContextData}`, 2000);
      const textVal = parsedObj.text || (Array.isArray(parsedObj) ? parsedObj[0]?.text : JSON.stringify(parsedObj));
      return { success: true, newBlocks: [{ type: 'text', text: textVal }] };
    } catch (e) {
      return { error: 'Failed to generate text: ' + e.message };
    }
  }

  if (actions.includes('expand_text') || actions.includes('shorten_text') || actions.includes('refine_level')) {
    let instruction = `Expand this text into a detailed 350-400 word educational story matching CEFR Level ${level}.`;
    if (actions.includes('shorten_text')) instruction = `Shorten this text into a concise summary (~150 words) matching CEFR Level ${level}.`;
    else if (actions.includes('refine_level')) instruction = `Rewrite this reading text strictly adapting grammar and vocabulary to CEFR Level ${level}.`;

    const textPrompt = `You are an ELT Materials Writer. ${instruction}\nCEFR Level ${level}: ${cefrRules}\nRETURN JSON OBJECT: { "text": "Full rewritten text..." }`;
    try {
      const parsedObj = await runAiPipeline(env, textPrompt, `Original Text:\n${safeContextData}`, 2000);
      const textVal = parsedObj.text || (Array.isArray(parsedObj) ? parsedObj[0]?.text : JSON.stringify(parsedObj));
      return { success: true, newBlocks: [{ type: 'text', text: textVal }] };
    } catch (e) {
      return { error: 'Failed to refine text: ' + e.message };
    }
  }

  // B. GRAMMAR CARD GENERATION
  if (actions.includes('generate_grammar_card')) {
    const grammarPrompt = `Generate 1 Grammar Card JSON object for CEFR Level ${level}:\n{ "type": "grammar_card", "title": "${safeContextData}", "formula": "Subject + Verb", "explanation": "Rule explanation", "examples": ["Example 1", "Example 2"] }`;
    try {
      const parsed = await runAiPipeline(env, grammarPrompt, `Grammar Topic: ${safeContextData}`, 1000);
      const clean = sanitizeBlockStructure(parsed);
      return { success: true, newBlocks: clean };
    } catch (e) {
      return { error: 'Failed to generate grammar card: ' + e.message };
    }
  }

  // C. MULTI-TASK GENERATOR: Build specific exercise schemas for each requested action
  let tasksInstructions = '';

  if (actions.includes('listening') || actions.includes('multiple_choice')) {
    tasksInstructions += `
- GENERATE 1 "multiple_choice" block with 4 comprehension questions based on the text.
  Schema: { "type": "multiple_choice", "question": "Question text?", "options": ["Option A", "Option B", "Option C", "Option D"], "correct": 0, "explanation": "Why this option is correct based on the text." }`;
  }

  if (actions.includes('true_false')) {
    tasksInstructions += `
- GENERATE 3 separate "multiple_choice" blocks for True/False questions based on the text.
  Schema: { "type": "multiple_choice", "question": "Statement from the story...", "options": ["True", "False", "Not Stated"], "correct": 0, "explanation": "Reference to the text." }`;
  }

  if (actions.includes('flashcards')) {
    const backStyle = flashcardType === 'russian' ? 'Russian translation' : 'simple English definition';
    tasksInstructions += `
- GENERATE 1 "flashcards" block with 6 target vocabulary words extracted directly from the text.
  Schema: { "type": "flashcards", "title": "Key Vocabulary from Story", "cards": [ { "front": "target word", "back": "${backStyle}", "example": "Context sentence from story." } ] }`;
  }

  if (actions.includes('gap_fill') || actions.includes('grammar_transform')) {
    tasksInstructions += `
- GENERATE 1 "gap_fill" block with 4 sentences from the text, putting the target words in brackets [word].
  Schema: { "type": "gap_fill", "instruction": "Complete the sentences with target words from the story:", "text": "1. Sentence with [word1].\\n2. Sentence with [word2].", "answers": ["word1", "word2"] }`;
  }

  if (actions.includes('gap_fill_bank')) {
    tasksInstructions += `
- GENERATE 1 "gap_fill_bank" block using a paragraph from the text containing [target words] in brackets and 3 distractor words.
  Schema: { "type": "gap_fill_bank", "instruction": "Fill the gaps using words from the bank:", "text": "Paragraph with [word1] and [word2]...", "distractors": ["wrong1", "wrong2", "wrong3"] }`;
  }

  if (actions.includes('matching')) {
    tasksInstructions += `
- GENERATE 1 "matching" block with 6 pairs extracted from the text configured as "${matchingType}".
  Schema: { "type": "matching", "instruction": "Match the pairs from the story:", "pairs": [ { "left": "word/phrase", "right": "definition/translation" } ] }`;
  }

  if (actions.includes('discussion') || actions.includes('open_input')) {
    tasksInstructions += `
- GENERATE 1 "open_input" block with 2-3 communicative discussion questions exploring the themes of this text.
  Schema: { "type": "open_input", "prompt": "Discussion questions based on the story?" }`;
  }

  if (actions.includes('grammar_quiz')) {
    tasksInstructions += `
- GENERATE 1 "multiple_choice" block with 4 questions testing the grammar rule in context.
  Schema: { "type": "multiple_choice", "question": "Grammar question?", "options": ["Correct form", "Distractor 1", "Distractor 2"], "correct": 0, "explanation": "Rule explanation." }`;
  }

  if (actions.includes('inline_select')) {
    tasksInstructions += `
- GENERATE 1 "inline_select" block with 3 sentences from the text containing [correct_option* | wrong_option].
  Schema: { "type": "inline_select", "instruction": "Choose the correct words in context:", "text": "1. Sentence with [correct* | wrong].\\n2. Sentence with [correct* | wrong]." }`;
  }

  if (actions.includes('spinning_wheel')) {
    tasksInstructions += `
- GENERATE 1 "spinning_wheel" block with 6 engaging speaking questions based on this story.
  Schema: { "type": "spinning_wheel", "title": "🎡 Speaking Discussion Wheel", "instruction": "Spin the wheel and answer the question!", "items": ["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?", "Question 6?"] }`;
  }

  const systemPrompt = `You are a CELTA ELT Materials Designer. Generate ONLY a valid JSON array of requested interactive exercise blocks matching CEFR Level ${level} based on the source text provided.

CRITICAL RULES:
1. Every generated exercise MUST directly reference and test facts, vocabulary, and grammar from the source text.
2. "options" MUST be an array of simple plain text strings. Never output objects inside "options".
3. Return ONLY a valid JSON array containing the requested exercise blocks.

EXERCISE SPECIFICATIONS:${tasksInstructions}`;

  try {
    const parsedBlocks = await runAiPipeline(env, systemPrompt, `Source Context/Story:\n${safeContextData}`, 2500);
    const rawList = Array.isArray(parsedBlocks) ? parsedBlocks : (parsedBlocks?.blocks || [parsedBlocks]);
    
    let cleanBlocks = [];
    rawList.forEach(b => {
      const res = sanitizeBlockStructure(b);
      if (Array.isArray(res)) cleanBlocks.push(...res);
      else cleanBlocks.push(res);
    });

    if (cleanBlocks.length === 0) {
      return { error: 'Не удалось сформировать задания. Попробуйте ещё раз.' };
    }

    return { success: true, newBlocks: cleanBlocks };
  } catch (err) {
    return { error: 'AI task generation failed: ' + err.message };
  }
}
