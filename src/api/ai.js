export const CEFR_MATRIX = {
  'A1': 'Target Grammar: Present Simple, to be, there is/are, basic plurals. Short sentences (5-10 words). Everyday basic vocabulary.',
  'A2': 'Target Grammar: Past Simple, Present Continuous, Comparatives. Daily routines, travel, hobbies.',
  'B1': 'Target Grammar: Past Continuous, Conditionals 1 & 2, Present Perfect, Passive Voice. Work, feelings, modern lifestyle.',
  'B2': 'Target Grammar: Conditionals 3, Future Perfect, Past Modals, Wish clauses, Complex Passives. Idioms, abstract concepts.',
  'C1': 'Target Grammar: Inversion, Cleft sentences, Advanced Modals, Participle clauses. Nuanced, academic, idiomatic language.',
  'C2': 'Target Grammar: Mastery of nuance, inversion, complex subjunctive, idiomatic mastery, stylistic flexibility. Academic and native-like precision.'
};

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9'
};

export function getYouTubeId(url = '') {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname.includes('youtu.be')) {
      return parsedUrl.pathname.slice(1).split('?')[0];
    }
    if (parsedUrl.hostname.includes('youtube.com')) {
      if (parsedUrl.pathname.includes('/shorts/')) {
        return parsedUrl.pathname.split('/shorts/')[1].split('/')[0].split('?')[0];
      }
      return parsedUrl.searchParams.get('v');
    }
  } catch (e) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = String(url).match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }
  return null;
}

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
  if (type === 'notes' || type === 'teacher_notes') type = 'teacher_notes';

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
    b.correct = (detectedCorrect >= 0 && detectedCorrect < b.options.length) ? detectedCorrect : 0;
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

  // CATEGORIZATION NORMALIZATION
  if (b.type === 'categorization') {
    if (!Array.isArray(b.categories) || b.categories.length === 0) {
      b.categories = ['Category 1', 'Category 2'];
    }
    const rawItems = Array.isArray(b.items) ? b.items : [];
    b.items = rawItems.map((it, idx) => {
      if (typeof it === 'string') {
        return { id: `it-${idx}-${Date.now()}`, text: it, categoryIndex: idx % b.categories.length };
      }
      return {
        id: it.id || `it-${idx}-${Date.now()}`,
        text: it.text || `Item ${idx + 1}`,
        categoryIndex: typeof it.categoryIndex === 'number' ? it.categoryIndex : (idx % b.categories.length)
      };
    });
  }

  // FLASHCARDS NORMALIZATION
  if (b.type === 'flashcards') {
    let rawCards = Array.isArray(b.cards) ? b.cards : [];
    b.cards = rawCards.map(c => {
      if (typeof c === 'object' && c !== null) {
        return {
          front: String(c.front || c.word || c.term || 'Word'),
          back: String(c.back || c.translation || c.definition || 'Translation'),
          example: String(c.example || c.sentence || '')
        };
      }
      return { front: 'Word', back: 'Translation', example: '' };
    });
  }

  // GAP FILL NORMALIZATION
  if (b.type === 'gap_fill') {
    if (!Array.isArray(b.answers) || b.answers.length === 0) {
      const matches = [...(b.text || '').matchAll(/\[(.*?)\]/g)].map(m => m[1].trim());
      b.answers = matches.length > 0 ? matches : ['answer'];
    }
  }

  // GAP FILL BANK NORMALIZATION
  if (b.type === 'gap_fill_bank') {
    if (!Array.isArray(b.distractors)) {
      b.distractors = ['option', 'example'];
    }
  }

  return [b];
}

export function cleanAndParseJson(rawText) {
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
      return null;
    }
  }
}

export async function runAiPipeline(env, systemPrompt, userContent, maxTokens = 3000, topic = '', level = 'B1') {
  if (env.GROQ_API_KEY && env.GROQ_API_KEY.trim().length > 5) {
    const groqKey = env.GROQ_API_KEY.trim();
    for (const model of ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant']) {
      try {
        const res = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userContent }],
            temperature: 0.2,
            response_format: { type: 'json_object' }
          })
        }, 6000);

        if (res.ok) {
          const data = await res.json();
          const parsed = cleanAndParseJson(data?.choices?.[0]?.message?.content);
          if (parsed) return { data: parsed, isFallback: false };
        }
      } catch (e) {}
    }
  }

  if (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim().length > 5) {
    const apiKey = env.GEMINI_API_KEY.trim();
    for (const gModel of ['gemini-2.0-flash', 'gemini-1.5-flash']) {
      try {
        const gUrl = `https://generativelanguage.googleapis.com/v1beta/models/${gModel}:generateContent?key=${apiKey}`;
        const gRes = await fetchWithTimeout(gUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: userContent }] }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
          })
        }, 6000);

        if (gRes.ok) {
          const gData = await gRes.json();
          const parsed = cleanAndParseJson(gData?.candidates?.[0]?.content?.parts?.[0]?.text);
          if (parsed) return { data: parsed, isFallback: false };
        }
      } catch (eG) {}
    }
  }

  if (env.AI) {
    for (const cfModel of ['@cf/meta/llama-3.3-70b-instruct-fp8-fast', '@cf/meta/llama-3.1-8b-instruct-fast']) {
      try {
        const resCf = await env.AI.run(cfModel, {
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userContent }],
          temperature: 0.2,
          max_tokens: maxTokens
        });
        const rawCf = resCf?.response || resCf?.choices?.[0]?.message?.content;
        const parsedCf = cleanAndParseJson(rawCf);
        if (parsedCf) return { data: parsedCf, isFallback: false };
      } catch (eCf) {}
    }
  }

  return { data: createFallbackLesson(topic, level), isFallback: true };
}

function createFallbackLesson(topic = 'General English Practice', level = 'B1') {
  return {
    title: `${topic} (${level})`,
    level: level,
    topic: topic,
    description: `Interactive CEFR ${level} Lesson on ${topic}`,
    pages: [
      {
        id: 'p1',
        title: 'Part 1: Warm-up, Vocabulary & Story',
        blocks: [
          { id: 'b1', type: 'heading', level: 1, text: `${topic}` },
          { 
            id: 'b2', 
            type: 'open_input', 
            prompt: `🔥 Warm-up & Lead-in Discussion:\n1. What comes to your mind first when you hear about "${topic}"?\n2. Have you ever had personal experience with this in real life?\n3. Why do you think this topic is important for modern English speakers?` 
          },
          { 
            id: 'b3', 
            type: 'flashcards', 
            title: `Target Vocabulary (${topic})`, 
            cards: [
              { front: 'Key Concept', back: 'Основное понятие / Ключевая идея', example: `Understanding this is crucial when exploring ${topic}.` },
              { front: 'To engage with', back: 'Взаимодействовать / Погружаться', example: 'Students actively engage with real-world materials.' },
              { front: 'Perspective', back: 'Взгляд / Точка зрения', example: 'Looking at this from a fresh perspective changes everything.' },
              { front: 'Significance', back: 'Значимость / Важность', example: 'The cultural significance cannot be underestimated.' },
              { front: 'To cultivate', back: 'Развивать / Культивировать', example: 'Consistent practice helps cultivate natural fluency.' },
              { front: 'Outcome', back: 'Результат / Итог', example: 'The final outcome exceeded all our expectations.' }
            ]
          },
          { 
            id: 'b4', 
            type: 'text', 
            text: `${topic} has increasingly become one of the most dynamic and discussed subjects in modern communication. Understanding its background not only enriches our conceptual vocabulary, but also provides a deeper look into how language reflects contemporary culture, everyday choices, and evolving perspectives.\n\nWhen we look closely at ${topic}, we notice that it directly influences how people express their thoughts, negotiate meaning, and navigate complex social situations. By examining real-world contexts and exploring target idioms, learners can bridge the gap between textbook theory and natural conversational confidence.` 
          }
        ]
      },
      {
        id: 'p2',
        title: 'Part 2: Comprehension & Practice',
        blocks: [
          { id: 'b5', type: 'heading', level: 2, text: 'Part 2: Comprehension & Practice' }
        ]
      },
      {
        id: 'p3',
        title: 'Part 3: Grammar Focus',
        blocks: [
          { id: 'b6', type: 'heading', level: 2, text: 'Part 3: Grammar Focus' }
        ]
      },
      {
        id: 'p4',
        title: 'Part 4: Production & Speaking',
        blocks: [
          { id: 'b7', type: 'heading', level: 2, text: 'Part 4: Speaking & Production' }
        ]
      }
    ]
  };
}

export async function fetchYouTubeTranscriptNative(videoUrl) {
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
    } catch (e) {}

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
              const decoded = m[1]
                .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/<[^>]+>/g, '').trim();
              if (decoded) fullText += decoded + ' ';
            }
            fullText = fullText.replace(/\s+/g, ' ').trim();
            if (fullText.length > 40) transcriptText = fullText.slice(0, 3500);
          }
        }
      } catch (e) {}
    }

    return { title, transcript: transcriptText, videoId };
  } catch (e) {
    return null;
  }
}

export async function generateFullLessonWithAI(env, payload) {
  const { text = '', level = 'B1', topic = 'General English' } = payload;
  const cefrRules = CEFR_MATRIX[level] || CEFR_MATRIX['B1'];

  const systemPrompt = `You are a world-class CELTA ELT Author. Focus 100% of your effort on crafting a MASTERPIECE Page 1 for CEFR Level ${level} on "${topic}".
CEFR Level ${level} Guidelines: ${cefrRules}

STRICT PAGE 1 SPECIFICATION:
1. "heading" (level: 1): Inspiring title.
2. "open_input": A warm-up prompt with 3 distinct numbered questions (1., 2., 3.) on separate lines.
3. "flashcards": 6-8 target high-yield vocabulary items (front, back, example).
4. "text": An engaging 250-350 word educational reading story written for CEFR ${level}.

PAGES 2, 3, 4:
Provide clean subsequent pages with section headings.

MANDATORY JSON FORMAT:
{
  "title": "${topic}",
  "level": "${level}",
  "topic": "${topic}",
  "description": "Master CEFR ${level} Lesson on ${topic}",
  "pages": [
    {
      "id": "p1",
      "title": "Part 1: Warm-up, Vocabulary & Story",
      "blocks": [
        { "type": "heading", "level": 1, "text": "${topic}" },
        { 
          "type": "open_input", 
          "prompt": "🔥 Warm-up & Lead-in Discussion:\n1. [Question 1?]\n2. [Question 2?]\n3. [Question 3?]" 
        },
        { 
          "type": "flashcards", 
          "title": "Key Target Vocabulary", 
          "cards": [ { "front": "word", "back": "translation or definition", "example": "Context sentence." } ] 
        },
        { 
          "type": "text", 
          "text": "A rich 250-350 word educational story passage strictly for CEFR ${level}..." 
        }
      ]
    },
    {
      "id": "p2",
      "title": "Part 2: Comprehension & Practice",
      "blocks": [ { "type": "heading", "level": 2, "text": "Part 2: Comprehension & Practice" } ]
    },
    {
      "id": "p3",
      "title": "Part 3: Grammar Focus",
      "blocks": [ { "type": "heading", "level": 2, "text": "Part 3: Grammar Focus" } ]
    },
    {
      "id": "p4",
      "title": "Part 4: Production & Speaking",
      "blocks": [ { "type": "heading", "level": 2, "text": "Part 4: Speaking & Production" } ]
    }
  ]
}
RETURN ONLY A VALID ROOT JSON OBJECT.`;

  const userPrompt = `Topic: ${topic}\nLevel: ${level}\nSource material / Context:\n${text || 'Create an original, captivating educational reading story on this topic.'}`;

  try {
    const result = await runAiPipeline(env, systemPrompt, userPrompt, 2800, topic, level);
    const parsedJson = result.data;

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

    return { 
      success: true, 
      isFallback: result.isFallback, 
      jsonText: JSON.stringify(parsedJson, null, 2) 
    };
  } catch (err) {
    return { 
      success: true, 
      isFallback: true, 
      jsonText: JSON.stringify(createFallbackLesson(topic, level), null, 2) 
    };
  }
}

export async function transformBlockWithAI(env, payload) {
  let { actions = [], sourceBlock = {}, sourceText = '', targetLength = '250', matchingType = 'synonym', flashcardType = 'russian', level = 'B1' } = payload;
  if (!actions || actions.length === 0) return { error: 'Выберите хотя бы одно задание.' };

  const targetBlockType = String(sourceBlock.type || '').toLowerCase().trim();

  // 1-Click Auto Fill Mappings
  if (actions.includes('fill_this_block') && targetBlockType) {
    if (targetBlockType === 'flashcards') actions.push('flashcards');
    else if (targetBlockType === 'multiple_choice') actions.push('listening');
    else if (targetBlockType === 'gap_fill') actions.push('gap_fill');
    else if (targetBlockType === 'gap_fill_bank') actions.push('gap_fill_bank');
    else if (targetBlockType === 'matching') actions.push('matching');
    else if (targetBlockType === 'open_input') actions.push('discussion');
    else if (targetBlockType === 'grammar_card') actions.push('generate_grammar_card');
    else if (targetBlockType === 'text') actions.push('generate_text_passage');
    else if (targetBlockType === 'sentence_reorder') actions.push('sentence_reorder');
    else if (targetBlockType === 'inline_select') actions.push('inline_select');
    else if (targetBlockType === 'spinning_wheel') actions.push('spinning_wheel');
    else if (targetBlockType === 'categorization') actions.push('categorization');
    else if (targetBlockType === 'teacher_notes') actions.push('teacher_notes');
  }

  const cefrRules = CEFR_MATRIX[level] || CEFR_MATRIX['B1'];
  let rawContext = sourceText || sourceBlock.text || sourceBlock.explanation || sourceBlock.transcript || JSON.stringify(sourceBlock);
  const safeContextData = (rawContext || '').replace(/[\r\n]+/g, ' ').replace(/"/g, "'").trim();

  // A. TEXT REFINEMENT TOOLS
  if (actions.includes('generate_text_passage') || actions.includes('expand_text') || actions.includes('shorten_text') || actions.includes('refine_level')) {
    let wordCountTarget = targetLength || '250';
    let specificInstruction = `Write an engaging educational reading story for CEFR Level ${level} (~${wordCountTarget} words).`;

    if (actions.includes('expand_text')) {
      wordCountTarget = '400';
      specificInstruction = `Expand the following story into a rich, immersive 350-450 word educational reading passage for CEFR Level ${level}, adding detailed background, vivid examples, and natural nuance.`;
    } else if (actions.includes('shorten_text')) {
      wordCountTarget = '150';
      specificInstruction = `Condense and summarize this story into a crisp, clear 120-160 word passage for CEFR Level ${level}, preserving the core ideas and target vocabulary.`;
    } else if (actions.includes('refine_level')) {
      specificInstruction = `Rewrite this reading text strictly adapting vocabulary, idioms, and grammatical structures for CEFR Level ${level} (~250 words).`;
    }

    const textPrompt = `You are a CELTA ELT Materials Writer.
${specificInstruction}
CEFR Level ${level} Rules: ${cefrRules}

RETURN A VALID JSON ROOT OBJECT:
{
  "blocks": [
    {
      "type": "text",
      "text": "Full rewritten and beautifully formatted educational passage..."
    }
  ]
}`;

    try {
      const result = await runAiPipeline(env, textPrompt, `Source Context / Input:\n${safeContextData}`, 2200);
      const generatedText = result.data?.blocks?.[0]?.text || result.data?.text || (typeof result.data === 'string' ? result.data : '');

      if (generatedText && generatedText.length > 50) {
        return { success: true, isFallback: result.isFallback, newBlocks: [{ type: 'text', text: generatedText }] };
      }
      return { 
        success: true, 
        isFallback: true, 
        newBlocks: [{ 
          type: 'text', 
          text: `${safeContextData}\n\nFurthermore, exploring this topic reveals how modern language continues to evolve across international contexts. By actively analyzing key structures and real-world examples, students develop natural fluency, confidence in conversation, and deeper cultural comprehension.` 
        }] 
      };
    } catch (e) {
      return { error: 'Failed to refine text: ' + e.message };
    }
  }

  // B. GRAMMAR CARD GENERATION
  if (actions.includes('generate_grammar_card')) {
    const grammarPrompt = `Generate 1 Grammar Card JSON root object for CEFR Level ${level} (${cefrRules}):
{
  "blocks": [
    {
      "type": "grammar_card",
      "title": "${safeContextData}",
      "formula": "Subject + Verb Structure",
      "explanation": "Rule explanation for CEFR ${level}",
      "examples": ["Example sentence 1", "Example sentence 2"]
    }
  ]
}`;
    try {
      const result = await runAiPipeline(env, grammarPrompt, `Grammar Topic: ${safeContextData}`, 1000);
      const rawList = result.data?.blocks || (Array.isArray(result.data) ? result.data : [result.data]);
      let cleanBlocks = [];
      rawList.forEach(b => {
        const res = sanitizeBlockStructure(b);
        if (Array.isArray(res)) cleanBlocks.push(...res);
        else cleanBlocks.push(res);
      });
      return { success: true, isFallback: result.isFallback, newBlocks: cleanBlocks };
    } catch (e) {
      return { error: 'Failed to generate grammar card: ' + e.message };
    }
  }

  // C. MULTI-TASK & EXERCISE SCHEMAS
  let tasksInstructions = '';

  if (actions.includes('grammar_quiz')) {
    tasksInstructions += `
- GENERATE 1 "multiple_choice" block drilling grammar for CEFR Level ${level}.
  Schema: { "type": "multiple_choice", "question": "Grammar gap sentence?", "options": ["Correct option", "Distractor 1", "Distractor 2"], "correct": 0, "explanation": "Grammar rule reason." }`;
  }

  if (actions.includes('grammar_transform')) {
    tasksInstructions += `
- GENERATE 1 "gap_fill" block with 4 sentence transformations.
  Schema: { "type": "gap_fill", "instruction": "Complete the second sentence using the target grammar structure:", "text": "1. Prompt sentence.\\nTransformation: She [had never seen] such a sight.\\n2. Prompt sentence.\\nTransformation: Rarely [do we witness] this.", "answers": ["had never seen", "do we witness"] }`;
  }

  if (actions.includes('listening') || (actions.includes('multiple_choice') && !actions.includes('grammar_quiz'))) {
    tasksInstructions += `
- GENERATE 1 "multiple_choice" block with 3-4 comprehension questions based directly on the context.
  Schema: { "type": "multiple_choice", "question": "Comprehension question text?", "options": ["Correct Option", "Distractor 1", "Distractor 2"], "correct": 0, "explanation": "Why this option is correct based on context." }`;
  }

  if (actions.includes('true_false')) {
    tasksInstructions += `
- GENERATE 3 separate "multiple_choice" blocks for True/False questions based on the context.
  Schema: { "type": "multiple_choice", "question": "Statement from the story...", "options": ["True", "False", "Not Stated"], "correct": 0, "explanation": "Reference to the text." }`;
  }

  if (actions.includes('flashcards')) {
    const backStyle = flashcardType === 'russian' ? 'Russian translation' : 'simple English definition';
    tasksInstructions += `
- GENERATE 1 "flashcards" block with 6 target vocabulary words extracted directly from the context.
  Schema: { "type": "flashcards", "title": "Key Target Vocabulary", "cards": [ { "front": "target word", "back": "${backStyle}", "example": "Context sentence." } ] }`;
  }

  if (actions.includes('gap_fill') && !actions.includes('grammar_transform')) {
    tasksInstructions += `
- GENERATE 1 "gap_fill" block with 4 sentences, putting target words in brackets [word].
  Schema: { "type": "gap_fill", "instruction": "Complete the sentences with target words:", "text": "1. Sentence with [word1].\\n2. Sentence with [word2].", "answers": ["word1", "word2"] }`;
  }

  if (actions.includes('gap_fill_bank')) {
    tasksInstructions += `
- GENERATE 1 "gap_fill_bank" block using a cohesive paragraph containing 4-5 [target words] in brackets and 3 distractors.
  Schema: { "type": "gap_fill_bank", "instruction": "🧩 Fill the gaps using words from the bank:", "text": "A cohesive story paragraph with [target1] and [target2] and [target3]...", "distractors": ["wrong1", "wrong2", "wrong3"] }`;
  }

  if (actions.includes('matching')) {
    tasksInstructions += `
- GENERATE 1 "matching" block with 6 pairs configured as "${matchingType}".
  Schema: { "type": "matching", "instruction": "Match the pairs:", "pairs": [ { "left": "word/phrase", "right": "definition/translation" } ] }`;
  }

  if (actions.includes('discussion') || actions.includes('open_input')) {
    tasksInstructions += `
- GENERATE 1 "open_input" block with 2-3 communicative discussion questions numbered 1, 2, 3 on separate lines.
  Schema: { "type": "open_input", "prompt": "💬 Speaking Discussion:\\n1. Question 1?\\n2. Question 2?\\n3. Question 3?" }`;
  }

  if (actions.includes('inline_select')) {
    tasksInstructions += `
- GENERATE 1 "inline_select" block with 3-4 sentences containing [correct_option* | wrong_option].
  CRITICAL: DO NOT use dashes or underscores like '----- [option]'. Write natural sentences where the dropdown replaces the word directly!
  Schema: { "type": "inline_select", "instruction": "Choose the correct words in context:", "text": "1. By next year they [will have released* | were releasing] their album.\\n2. Fans should [analyze* | ignore] the lyrics carefully." }`;
  }

  if (actions.includes('categorization')) {
    tasksInstructions += `
- GENERATE 1 "categorization" block with 2-3 categories and 6-8 items to sort based on the material.
  Schema: { "type": "categorization", "instruction": "📦 Sort the words/phrases into correct categories:", "categories": ["Category A", "Category B"], "items": [ { "id": "it-1", "text": "Item 1", "categoryIndex": 0 }, { "id": "it-2", "text": "Item 2", "categoryIndex": 1 }, { "id": "it-3", "text": "Item 3", "categoryIndex": 0 }, { "id": "it-4", "text": "Item 4", "categoryIndex": 1 } ] }`;
  }

  if (actions.includes('spinning_wheel')) {
    tasksInstructions += `
- GENERATE 1 "spinning_wheel" block with 6 engaging speaking questions directly based on this context.
  Schema: { "type": "spinning_wheel", "title": "🎡 Speaking Discussion Wheel", "instruction": "Spin the wheel and answer the question!", "items": ["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?", "Question 6?"], "eliminateMode": false }`;
  }

  if (actions.includes('sentence_reorder')) {
    tasksInstructions += `
- GENERATE 1 "sentence_reorder" block with a rich target sentence from the context.
  Schema: { "type": "sentence_reorder", "instruction": "🧩 Reorder the words to form a correct sentence:", "sentence": "Complete target sentence here." }`;
  }

  if (actions.includes('teacher_notes')) {
    tasksInstructions += `
- GENERATE 1 "teacher_notes" block with stage aims and teacher speech scripts.
  Schema: { "type": "teacher_notes", "aim": "Methodological goal...", "speech": "Spoken teacher instructions..." }`;
  }

  const systemPrompt = `You are a CELTA ELT Materials Designer. Generate a root JSON object with a "blocks" array matching CEFR Level ${level} (${cefrRules}) directly testing the source context.

MANDATORY JSON FORMAT:
{
  "blocks": [
    ...
  ]
}

EXERCISE SPECIFICATIONS:${tasksInstructions}`;

  try {
    const result = await runAiPipeline(env, systemPrompt, `Source Context:\n${safeContextData}`, 2500);
    const rawList = result.data?.blocks || result.data?.newBlocks || (Array.isArray(result.data) ? result.data : [result.data]);
    
    let cleanBlocks = [];
    rawList.forEach(b => {
      const res = sanitizeBlockStructure(b);
      if (Array.isArray(res)) cleanBlocks.push(...res);
      else cleanBlocks.push(res);
    });

    if (cleanBlocks.length === 0) {
      return { error: 'Не удалось сформировать задания. Попробуйте ещё раз.' };
    }

    return { success: true, isFallback: result.isFallback, newBlocks: cleanBlocks };
  } catch (err) {
    return { error: 'AI task generation failed: ' + err.message };
  }
}
