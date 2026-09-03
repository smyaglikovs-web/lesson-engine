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
  if (type === 'reorder' || type === 'sentence_order' || type === 'unscramble') type = 'sentence_reorder';
  if (type === 'categories' || type === 'bucket') type = 'categorization';
  if (type === 'inline' || type === 'select_gap' || type === 'drop_down') type = 'inline_select';
  if (type === 'wheel' || type === 'roulette') type = 'spinning_wheel';
  if (type === 'notes' || type === 'teacher_notes') type = 'teacher_notes';
  if (type === 'drag-and-drop' || type === 'word_bank') type = 'gap_fill_bank';

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

export async function runAiPipeline(env, systemPrompt, userContent, maxTokens = 2500) {
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
        }, 5000);

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
        }, 5000);

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

  return { data: null, isFallback: true };
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

// --------------------------------------------------------------------------
// 3-STAGE CHAINED AI LESSON GENERATION PIPELINE
// (Supports both simple TOPIC-ONLY requests and rich MULTI-INPUT text)
// --------------------------------------------------------------------------

export async function generateFullLessonWithAI(env, payload) {
  const { 
    text = '', 
    level = 'B1', 
    topic = 'General English Practice',
    context = '',
    format = 'live',
    targetKeywords = [],
    selectedTasks = ['multiple_choice', 'gap_fill_bank', 'matching', 'sentence_reorder'],
    includeGrammar = false,
    finalTask = 'speaking'
  } = payload;

  const resolvedTopic = topic.trim() || 'General English Lesson';
  const cefrRules = CEFR_MATRIX[level] || CEFR_MATRIX['B1'];
  const audienceContext = context ? `Target Student Context/Persona: "${context}"` : 'General Adult ESL Learners';
  const keywordConstraints = targetKeywords.length > 0 
    ? `MANDATORY KEYWORDS TO TEST: ${JSON.stringify(targetKeywords)}`
    : `Extract 6-8 high-yield collocations/vocabulary items for topic "${resolvedTopic}".`;

  // --------------------------------------------------------------------------
  // STAGE 1: LEXICAL & STRUCTURAL PROFILER (Micro-Prompt)
  // --------------------------------------------------------------------------
  const stage1SystemPrompt = `[ROLE]
You are a CELTA/DELTA Master Methodologist.

[CONTEXT]
Target CEFR Level: ${level} (${cefrRules})
Topic: "${resolvedTopic}"
${audienceContext}
${keywordConstraints}

[TASK]
Extract/profile 6-8 target vocabulary items, 3 lead-in discussion questions, and the target grammar rule for this topic.

[CONSTRAINTS]
- Output MUST be valid JSON only.
- 6 to 8 vocabulary items with front (English word/phrase), back (Russian translation or definition), and example sentence.
- 3 warm-up discussion questions.

[OUTPUT FORMAT]
{
  "warmupQuestions": ["Question 1?", "Question 2?", "Question 3?"],
  "targetWords": [
    { "front": "word/phrase", "back": "translation or definition", "example": "Context sentence." }
  ],
  "grammarTitle": "Target Grammar Rule",
  "grammarFormula": "Subject + Verb Structure",
  "grammarExplanation": "Short clear rule explanation"
}`;

  const userContextPrompt = text.trim()
    ? `Source Material / Transcript:\n${text}`
    : `Generate high-yield materials for Topic: "${resolvedTopic}". Context: ${audienceContext}`;

  const stage1Result = await runAiPipeline(env, stage1SystemPrompt, userContextPrompt, 1200);
  const profile = stage1Result.data || {
    warmupQuestions: [
      `What comes to your mind first when you think about ${resolvedTopic}?`,
      "Have you ever experienced this in real life?",
      "Why is this topic relevant today?"
    ],
    targetWords: targetKeywords.length > 0 
      ? targetKeywords.map(k => ({ front: k, back: 'Ключевое понятие', example: `Understanding ${k} is crucial.` }))
      : [
          { front: 'Key Concept', back: 'Основное понятие', example: `Understanding this is crucial for ${resolvedTopic}.` },
          { front: 'To engage with', back: 'Взаимодействовать', example: 'Students engage actively with materials.' },
          { front: 'Perspective', back: 'Точка зрения', example: 'A fresh perspective changes everything.' },
          { front: 'Significance', back: 'Значимость', example: 'The cultural significance is undeniable.' },
          { front: 'To cultivate', back: 'Развивать', example: 'Practice helps cultivate fluency.' },
          { front: 'Outcome', back: 'Результат', example: 'The outcome exceeded our expectations.' }
        ],
    grammarTitle: 'Present Perfect & Key Stems',
    grammarFormula: 'Subject + have/has + V3',
    grammarExplanation: 'Used for actions with current conversational relevance.'
  };

  // --------------------------------------------------------------------------
  // STAGE 2: STORY / PASSAGE SYNTHESIZER (Micro-Prompt)
  // --------------------------------------------------------------------------
  const wordsToWeave = (profile.targetWords || []).map(w => w.front).join(', ');
  const stage2SystemPrompt = `[ROLE]
You are an award-winning ELT graded reader writer.

[CONTEXT]
Target CEFR Level: ${level} (${cefrRules})
Topic: "${resolvedTopic}"
Target vocabulary to naturally weave into the story: ${wordsToWeave}

[TASK]
Write a rich 250-320 word educational story/passage for this lesson.

[CONSTRAINTS]
- Text MUST be 100% natural English adapted strictly to CEFR ${level}.
- Output JSON root object only.

[OUTPUT FORMAT]
{
  "title": "${resolvedTopic}",
  "storyText": "Complete 250-320 word reading passage here..."
}`;

  const stage2Result = await runAiPipeline(env, stage2SystemPrompt, `Topic: ${resolvedTopic}\nContext: ${audienceContext}\nProvided notes: ${text.substring(0, 400)}`, 1400);
  const storyText = stage2Result.data?.storyText || `${resolvedTopic} is an essential part of modern communication. By exploring key vocabulary and structures, learners develop natural conversational fluency. Understanding these concepts allows students to express nuanced thoughts with confidence.`;

  // --------------------------------------------------------------------------
  // STAGE 3: PARALLEL EXERCISE SYNTHESIS (Micro-Prompt)
  // --------------------------------------------------------------------------
  const tasksToGenerate = Array.isArray(selectedTasks) && selectedTasks.length > 0 
    ? selectedTasks 
    : ['multiple_choice', 'gap_fill_bank', 'matching', 'sentence_reorder'];

  const stage3SystemPrompt = `[ROLE]
You are an ELT Materials Task Creator.

[CONTEXT]
Target Level: ${level}
Story context: "${storyText.substring(0, 300)}..."
Target vocabulary: ${JSON.stringify(profile.targetWords)}
Format: ${format === 'live' ? 'Live teacher-led lesson with oral discussion' : 'Self-paced auto-graded homework'}

[TASK]
Generate exercise blocks matching the requested tasks: ${JSON.stringify(tasksToGenerate)}.

[CONSTRAINTS]
- Return a JSON object with a "blocks" array.
- For "gap_fill_bank", put 4-5 target words in brackets [word] in a cohesive paragraph and provide 3 distractors.
- For "multiple_choice", provide 3 questions with 3-4 options and correct index.
- For "matching", provide 6 target pairs.
- For "sentence_reorder", provide a sentence drilling target grammar.

[OUTPUT FORMAT]
{
  "blocks": [
    { "type": "multiple_choice", "question": "Question?", "options": ["A", "B", "C"], "correct": 0, "explanation": "Reason" },
    { "type": "gap_fill_bank", "instruction": "Fill the gaps:", "text": "Paragraph with [target]...", "distractors": ["wrong1", "wrong2"] },
    { "type": "matching", "instruction": "Match pairs:", "pairs": [ { "left": "A", "right": "B" } ] },
    { "type": "sentence_reorder", "instruction": "Put words in order:", "sentence": "Complete sentence here." }
  ]
}`;

  const stage3Result = await runAiPipeline(env, stage3SystemPrompt, `Generate exercises for: ${JSON.stringify(tasksToGenerate)}`, 2000);
  let synthesizedBlocks = stage3Result.data?.blocks || [];

  let cleanTaskBlocks = [];
  synthesizedBlocks.forEach(b => {
    const res = sanitizeBlockStructure(b);
    if (Array.isArray(res)) cleanTaskBlocks.push(...res);
    else cleanTaskBlocks.push(res);
  });

  // Fallback blocks if AI missed any
  if (cleanTaskBlocks.length === 0) {
    cleanTaskBlocks = [
      {
        type: 'gap_fill_bank',
        instruction: 'Fill in the blanks using words from the bank:',
        text: `Consistent [practice] is the foundation of mastering [communication] in any language.`,
        distractors: ['barrier', 'hesitation']
      },
      {
        type: 'matching',
        instruction: 'Match the target words with their meanings:',
        pairs: profile.targetWords.slice(0, 6).map(w => ({ left: w.front, right: w.back }))
      }
    ];
  }

  // --------------------------------------------------------------------------
  // STAGE 4: ASSEMBLE COMPLETE LESSON OBJECT
  // --------------------------------------------------------------------------
  const assembledLesson = {
    id: 'lesson_' + Date.now(),
    title: resolvedTopic,
    level: level,
    topic: resolvedTopic,
    description: `Interactive ${level} lesson on ${resolvedTopic}. ${audienceContext}`,
    pages: [
      {
        id: 'p1',
        title: 'Part 1: Warm-up, Vocab & Story',
        blocks: [
          { id: `b_h1_${Date.now()}`, type: 'heading', level: 1, text: resolvedTopic },
          { 
            id: `b_warm_${Date.now()}`, 
            type: 'open_input', 
            prompt: `💬 Warm-up & Lead-in Discussion:\n${profile.warmupQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}` 
          },
          { 
            id: `b_fc_${Date.now()}`, 
            type: 'flashcards', 
            title: 'Key Target Vocabulary', 
            cards: profile.targetWords 
          },
          { 
            id: `b_txt_${Date.now()}`, 
            type: 'text', 
            text: storyText 
          }
        ]
      }
    ]
  };

  if (includeGrammar) {
    assembledLesson.pages.push({
      id: 'p_grammar',
      title: 'Part 2: Grammar Focus',
      blocks: [
        { id: `b_gh_${Date.now()}`, type: 'heading', level: 2, text: 'Grammar Presentation' },
        { 
          id: `b_gcard_${Date.now()}`, 
          type: 'grammar_card', 
          title: profile.grammarTitle, 
          formula: profile.grammarFormula, 
          explanation: profile.grammarExplanation, 
          examples: [`Example: ${profile.targetWords[0]?.example || 'Consistent practice yields results.'}`] 
        }
      ]
    });
  }

  if (cleanTaskBlocks.length > 0) {
    assembledLesson.pages.push({
      id: 'p_practice',
      title: `Part ${assembledLesson.pages.length + 1}: Practice & Application`,
      blocks: [
        { id: `b_ph_${Date.now()}`, type: 'heading', level: 2, text: 'Interactive Practice' },
        ...cleanTaskBlocks
      ]
    });
  }

  if (finalTask !== 'none') {
    assembledLesson.pages.push({
      id: 'p_production',
      title: `Part ${assembledLesson.pages.length + 1}: Production & Wrap-up`,
      blocks: [
        { id: `b_prodh_${Date.now()}`, type: 'heading', level: 2, text: 'Speaking & Wrap-up' },
        {
          id: `b_wheel_${Date.now()}`,
          type: 'spinning_wheel',
          title: '🎡 Speaking Discussion Roulette',
          instruction: 'Spin the wheel and answer the question!',
          items: profile.warmupQuestions.concat([
            `How will you use this vocabulary in your own life?`,
            "Summarize the main idea in 3 sentences."
          ]),
          eliminateMode: true
        }
      ]
    });
  }

  return {
    success: true,
    isFallback: stage1Result.isFallback || stage2Result.isFallback,
    jsonText: JSON.stringify(assembledLesson, null, 2)
  };
}

export async function transformBlockWithAI(env, payload) {
  let { actions = [], sourceBlock = {}, sourceText = '', targetLength = '250', matchingType = 'synonym', flashcardType = 'russian', level = 'B1' } = payload;
  if (!actions || actions.length === 0) return { error: 'Select at least one task.' };

  const cefrRules = CEFR_MATRIX[level] || CEFR_MATRIX['B1'];
  let rawContext = sourceText || sourceBlock.text || sourceBlock.explanation || sourceBlock.transcript || JSON.stringify(sourceBlock);
  const safeContextData = (rawContext || '').replace(/[\r\n]+/g, ' ').replace(/"/g, "'").trim();

  const prompt = `[ROLE]
You are a CELTA ELT Materials Designer.

[CONTEXT]
Target CEFR Level: ${level} (${cefrRules})
Source Material: "${safeContextData}"

[TASK]
Generate exercise blocks for actions: ${JSON.stringify(actions)}.

[CONSTRAINTS]
- Output valid JSON with a "blocks" array.
- Strictly adhere to CEFR Level ${level}.

[OUTPUT FORMAT]
{
  "blocks": [
    { "type": "multiple_choice", "question": "...", "options": ["A", "B", "C"], "correct": 0 }
  ]
}`;

  try {
    const result = await runAiPipeline(env, prompt, `Source:\n${safeContextData}`, 2000);
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
