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
        return { id: `it-${idx}`, text: it, categoryIndex: idx % b.categories.length };
      }
      return {
        id: it.id || `it-${idx}`,
        text: it.text || `Item ${idx + 1}`,
        categoryIndex: typeof it.categoryIndex === 'number' ? it.categoryIndex : 0
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
    return null;
  }
}

export async function runAiPipeline(env, systemPrompt, userContent, maxTokens = 3000, topic = '', level = 'B1') {
  // 1. GROQ TIER
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

  // 2. GEMINI TIER
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

  // 3. CLOUDFLARE WORKERS AI TIER
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
        title: 'Part 1: Lead-in, Vocabulary & Story',
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
        title: 'Part 2: Comprehension & Lexis',
        blocks: [
          { id: 'b5', type: 'heading', level: 2, text: 'Comprehension & Vocabulary Practice' }
        ]
      },
      {
        id: 'p3',
        title: 'Part 3: Grammar & Controlled Practice',
        blocks: [
          { id: 'b6', type: 'heading', level: 2, text: 'Grammar Focus' }
        ]
      },
      {
        id: 'p4',
        title: 'Part 4: Production & Speaking',
        blocks: [
          { id: 'b7', type: 'heading', level: 2, text: 'Speaking & Free Practice' }
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

// 1-PAGE CORE MASTERPIECE AI GENERATOR
export async function generateFullLessonWithAI(env, payload) {
  const { text = '', level = 'B1', topic = 'General English' } = payload;
  const cefrRules = CEFR_MATRIX[level] || CEFR_MATRIX['B1'];

  const systemPrompt = `You are a world-class CELTA ELT Author and Master Materials Writer.
Your mission is to focus 100% of your pedagogical brilliance and creativity on crafting a MASTERPIECE FOUNDATION on PAGE 1 for CEFR Level ${level} on the topic "${topic}".

CEFR Level ${level} Guidelines:
${cefrRules}

STRICT PAGE 1 SPECIFICATION:
Page 1 MUST contain exactly these 4 high-craft blocks:
1. "heading" (level: 1): An inspiring, authentic educational title for "${topic}".
2. "open_input": A warm-up lead-in discussion prompt containing AT LEAST 3 numbered, thought-provoking speaking questions (1., 2., 3.) activating background knowledge and personal interest.
3. "flashcards": 6 to 8 target high-yield vocabulary words/phrases extracted from or essential for this story.
   Each card MUST have:
   - "front": target word or collocation
   - "back": Russian translation or clear definition
   - "example": engaging example sentence showing the word in context.
4. "text": A beautiful, immersive, and educational 250-350 word reading story/article written with rich language specifically calibrated for CEFR Level ${level}, naturally integrating the target flashcard vocabulary.

PAGES 2, 3, 4:
Provide clean, structured subsequent pages with placeholders ready for the teacher to build interactive tasks in the Lego Builder.

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
          "prompt": "🔥 Warm-up & Lead-in Discussion:\n1. [First engaging question?]\n2. [Second thought-provoking question?]\n3. [Third personal opinion question?]" 
        },
        { 
          "type": "flashcards", 
          "title": "Key Target Vocabulary", 
          "cards": [
            { "front": "target word", "back": "translation or definition", "example": "Context sentence." }
          ] 
        },
        { 
          "type": "text", 
          "text": "A rich 250-350 word educational story passage strictly for CEFR ${level}..." 
        }
      ]
    },
    {
      "id": "p2",
      "title": "Part 2: Comprehension & Vocabulary",
      "blocks": [
        { "type": "heading", "level": 2, "text": "Part 2: Comprehension & Practice" }
      ]
    },
    {
      "id": "p3",
      "title": "Part 3: Grammar & Practice",
      "blocks": [
        { "type": "heading", "level": 2, "text": "Part 3: Grammar Focus" }
      ]
    },
    {
      "id": "p4",
      "title": "Part 4: Production & Speaking",
      "blocks": [
        { "type": "heading", "level": 2, "text": "Part 4: Speaking & Production" }
      ]
    }
  ]
}

RETURN ONLY A VALID ROOT JSON OBJECT.`;

  const userPrompt = `Topic: ${topic}\nLevel: ${level}\nSource material / Inspiration:\n${text || 'Create an original, captivating educational reading story on this topic.'}`;

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

// CONTEXTUAL SINGLE & MULTI-BLOCK AI ASSISTANT
export async function transformBlockWithAI(env, payload) {
  let { actions = [], sourceBlock = {}, sourceText = '', targetLength = '250', matchingType = 'synonym', flashcardType = 'russian', level = 'B1' } = payload;
  if (!actions || actions.length === 0) return { error: 'Выберите хотя бы одно задание.' };

  const targetBlockType = String(sourceBlock.type || '').toLowerCase().trim();

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
  }

  const cefrRules = CEFR_MATRIX[level] || CEFR_MATRIX['B1'];
  let rawContext = sourceText || sourceBlock.text || sourceBlock.explanation || sourceBlock.transcript || JSON.stringify(sourceBlock);
  const safeContextData = (rawContext || '').replace(/[\r\n]+/g, ' ').replace(/"/g, "'").trim();

  if (actions.includes('generate_text_passage')) {
    const textPrompt = `You are an ELT Materials Writer. Write an engaging educational reading story for CEFR Level ${level} (~${targetLength} words).\nCEFR Level ${level}: ${cefrRules}\nRETURN JSON ROOT OBJECT: { "blocks": [ { "type": "text", "text": "Full educational story passage..." } ] }`;
    try {
      const result = await runAiPipeline(env, textPrompt, `Topic/Context: ${safeContextData}`, 2000);
      const textVal = result.data.blocks?.[0]?.text || result.data.text || JSON.stringify(result.data);
      return { success: true, isFallback: result.isFallback, newBlocks: [{ type: 'text', text: textVal }] };
    } catch (e) {
      return { error: 'Failed to generate text: ' + e.message };
    }
  }

  const systemPrompt = `You are a CELTA ELT Materials Designer. Generate a root JSON object with a "blocks" array matching CEFR Level ${level} (${cefrRules}) directly testing the source context.
JSON SCHEMA: { "blocks": [ ... ] }`;

  try {
    const result = await runAiPipeline(env, systemPrompt, `Source Context:\n${safeContextData}`, 2500);
    const rawList = result.data?.blocks || result.data?.newBlocks || (Array.isArray(result.data) ? result.data : [result.data]);
    
    let cleanBlocks = [];
    rawList.forEach(b => {
      const res = sanitizeBlockStructure(b);
      if (Array.isArray(res)) cleanBlocks.push(...res);
      else cleanBlocks.push(res);
    });

    return { success: true, isFallback: result.isFallback, newBlocks: cleanBlocks };
  } catch (err) {
    return { error: 'AI task generation failed: ' + err.message };
  }
}
