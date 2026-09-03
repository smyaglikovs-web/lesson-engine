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

async function fetchWithTimeout(url, options = {}, timeoutMs = 12000) {
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

// --------------------------------------------------------------------------
// OBJECT-SAFE JSON PARSER
// --------------------------------------------------------------------------
export function cleanAndParseJson(rawText) {
  if (!rawText) return null;
  if (typeof rawText === 'object' && rawText !== null) return rawText;
  if (typeof rawText !== 'string') return null;

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

// --------------------------------------------------------------------------
// BLOCK NORMALIZER & SANITIZER
// --------------------------------------------------------------------------
export function sanitizeBlockStructure(b) {
  if (!b || typeof b !== 'object') return [];

  let type = String(b.type || '').toLowerCase().trim();

  // Smart property-based type inference
  if (!type) {
    if (b.options || b.choices || b.questions || b.statement || b.question) type = 'multiple_choice';
    else if (b.cards || b.flashcards) type = 'flashcards';
    else if (b.pairs || b.matches) type = 'matching';
    else if (b.formula || (b.explanation && b.examples)) type = 'grammar_card';
    else if (b.sentences || (b.sentence && !b.options)) type = 'sentence_reorder';
    else if (b.categories || (b.items && b.items[0]?.categoryIndex !== undefined)) type = 'categorization';
    else if (b.items && (b.eliminateMode !== undefined || b.title?.includes('🎡') || b.title?.includes('wheel'))) type = 'spinning_wheel';
    else if (b.distractors) type = 'gap_fill_bank';
    else if (b.answers) type = 'gap_fill';
    else if (b.url) type = 'link';
    else if (b.prompt || b.speech || b.aim) type = b.speech ? 'teacher_notes' : 'open_input';
    else if (b.text || b.paragraph || b.content || b.passage || b.story) type = 'text';
    else return [];
  }

  // Type normalization
  if (type === 'header' || type === 'title' || type === 'h1' || type === 'h2' || type === 'h3') type = 'heading';
  if (type === 'paragraph' || type === 'reading' || type === 'article' || type === 'story' || type === 'reading_comprehension') type = 'text';
  if (type === 'quiz' || type === 'question' || type === 'true_false' || type === 'true-false' || type === 'true/false' || type === 'mc' || type === 'multiple-choice') type = 'multiple_choice';
  if (type === 'vocab' || type === 'words' || type === 'flashcard' || type === 'cards' || type === 'vocabulary_building') type = 'flashcards';
  if (type === 'rule' || type === 'grammar' || type === 'grammar-card' || type === 'grammar_focus') type = 'grammar_card';
  if (type === 'reorder' || type === 'sentence_order' || type === 'unscramble' || type === 'sentence-reorder' || type === 'sentence-construction') type = 'sentence_reorder';
  if (type === 'categories' || type === 'bucket' || type === 'sorting' || type === 'category') type = 'categorization';
  if (type === 'inline' || type === 'select_gap' || type === 'drop_down' || type === 'dropdown_select' || type === 'inline-select') type = 'inline_select';
  if (type === 'wheel' || type === 'roulette' || type === 'spinning-wheel' || type === 'speaking_wheel') type = 'spinning_wheel';
  if (type === 'notes' || type === 'teacher_notes' || type === 'teacher-notes') type = 'teacher_notes';
  if (type === 'drag-and-drop' || type === 'word_bank' || type === 'drag_and_drop' || type === 'gap-fill-bank') type = 'gap_fill_bank';
  if (type === 'gapfill' || type === 'gap-fill' || type === 'fill_gap' || type === 'fill-in-the-blank') type = 'gap_fill';
  if (type === 'url' || type === 'website' || type === 'web_link' || type === 'embed') type = 'link';
  if (type === 'prompt' || type === 'speaking' || type === 'discussion' || type === 'question_input' || type === 'writing') type = 'open_input';

  b.type = type;

  // 1. MULTIPLE CHOICE & TRUE/FALSE UNROLLING
  if (b.type === 'multiple_choice') {
    if (Array.isArray(b.questions) && b.questions.length > 0) {
      return b.questions.map((q, qIdx) => {
        const rawOpts = q.options || q.choices || ['Option A', 'Option B'];
        const cleanOpts = Array.isArray(rawOpts) ? rawOpts.map(o => String(o?.text || o).trim()) : ['Option A', 'Option B'];
        return {
          id: `b-mc-${Date.now()}-${qIdx}`,
          type: 'multiple_choice',
          question: q.question || q.statement || q.prompt || 'Choose the correct answer:',
          options: cleanOpts.length > 0 ? cleanOpts : ['Option A', 'Option B'],
          correct: typeof q.correct === 'number' ? q.correct : 0,
          explanation: q.explanation || ''
        };
      });
    }

    let cleanOptions = [];
    let detectedCorrect = typeof b.correct === 'number' ? b.correct : 0;
    const rawOpts = b.options || b.choices || ['Option A', 'Option B'];

    if (Array.isArray(rawOpts)) {
      rawOpts.forEach((opt, idx) => {
        if (typeof opt === 'string') cleanOptions.push(opt.trim());
        else if (opt && typeof opt === 'object') {
          cleanOptions.push(String(opt.text || opt.option || opt.value || JSON.stringify(opt)).trim());
          if (opt.isCorrect === true || opt.correct === true) detectedCorrect = idx;
        } else cleanOptions.push(String(opt).trim());
      });
    }

    b.options = cleanOptions.length > 0 ? cleanOptions : ['Option A', 'Option B'];
    b.correct = (detectedCorrect >= 0 && detectedCorrect < b.options.length) ? detectedCorrect : 0;
    b.question = b.question || b.statement || b.prompt || 'Choose the correct answer:';
  }

  // 2. TEXT NORMALIZATION
  if (b.type === 'text') {
    b.text = String(b.text || b.paragraph || b.content || b.story || b.passage || '').trim();
    if (!b.text) return [];
  }

  // 3. GAP FILL NORMALIZATION
  if (b.type === 'gap_fill') {
    let rawText = String(b.text || b.paragraph || b.content || '').trim();
    if (Array.isArray(b.sentences)) rawText = b.sentences.join('\n');
    b.text = rawText.replace(/\[[-_.\s]{2,}\]/g, '[answer]');
    const matches = [...(b.text || '').matchAll(/\[(.*?)\]/g)]
      .map(m => m[1].trim())
      .filter(w => !/^[-_.\s]+$/.test(w));
    b.answers = matches.length > 0 ? matches : ['answer'];
    b.instruction = b.instruction || 'Fill the missing words in the blanks:';
  }

  // 4. GAP FILL BANK NORMALIZATION
  if (b.type === 'gap_fill_bank') {
    let rawText = String(b.text || b.paragraph || b.content || b.passage || '').trim();
    b.text = rawText.replace(/\[[-_.\s]{2,}\]/g, '[practice]');
    let distractors = Array.isArray(b.distractors) ? b.distractors : [];
    distractors = distractors.map(d => String(d).trim()).filter(d => Boolean(d) && !/^[-_.\s]+$/.test(d));
    b.distractors = distractors.length > 0 ? distractors : ['barrier', 'hesitation', 'distraction'];
    b.instruction = b.instruction || 'Fill the gaps using the correct words from the bank:';
  }

  // 5. INLINE SELECT NORMALIZATION
  if (b.type === 'inline_select') {
    let rawText = String(b.text || b.paragraph || b.content || '').trim();
    if (Array.isArray(b.sentences)) rawText = b.sentences.join('\n');
    b.text = rawText;
    b.instruction = b.instruction || 'Choose the correct word in context:';
  }

  // 6. MULTI-SENTENCE REORDER NORMALIZATION
  if (b.type === 'sentence_reorder') {
    let sentencesList = [];
    if (Array.isArray(b.sentences) && b.sentences.length > 0) {
      sentencesList = b.sentences.map(s => String(s).trim()).filter(Boolean);
    } else if (b.sentence && typeof b.sentence === 'string') {
      sentencesList = [b.sentence.trim()];
    } else if (b.text && typeof b.text === 'string') {
      sentencesList = b.text.split('\n').map(s => s.trim()).filter(Boolean);
    }
    b.sentences = sentencesList.length > 0 ? sentencesList : ['Consistent daily practice builds conversational fluency.'];
    b.sentence = b.sentences[0];
    b.instruction = b.instruction || 'Put the words in order to form correct sentences:';
  }

  // 7. OPEN INPUT NORMALIZATION
  if (b.type === 'open_input') {
    b.prompt = String(b.prompt || b.question || b.discussion || b.text || 'Discussion question / prompt...').trim();
  }

  // 8. FLASHCARDS NORMALIZATION
  if (b.type === 'flashcards') {
    let rawCards = Array.isArray(b.cards) ? b.cards : [];
    b.cards = rawCards.map(c => ({
      front: String(c.front || c.word || c.term || 'Target Word').trim(),
      back: String(c.back || c.translation || c.definition || 'Meaning').trim(),
      example: String(c.example || c.sentence || '').trim()
    }));
    b.title = b.title || 'Key Target Vocabulary';
  }

  // 9. MATCHING NORMALIZATION
  if (b.type === 'matching') {
    let rawPairs = b.pairs || b.items || b.matches || [];
    let normalizedPairs = [];
    const usedRightVals = new Set();

    if (Array.isArray(rawPairs)) {
      rawPairs.forEach((p, idx) => {
        let leftVal = p.left || p.term || p.word || (Array.isArray(p) ? p[0] : `Word ${idx + 1}`);
        let rightVal = p.right || p.definition || p.translation || (Array.isArray(p) ? p[1] : `Match ${idx + 1}`);
        leftVal = String(leftVal).trim();
        rightVal = String(rightVal).trim();

        if (leftVal && rightVal) {
          if (usedRightVals.has(rightVal.toLowerCase())) {
            rightVal = `${rightVal} (${leftVal.slice(0, 8)})`;
          }
          usedRightVals.add(rightVal.toLowerCase());
          normalizedPairs.push({ left: leftVal, right: rightVal });
        }
      });
    }

    b.instruction = b.instruction || 'Match the words with their definitions / translations:';
    b.pairs = normalizedPairs.length > 0 ? normalizedPairs : [{ left: 'Concept', right: 'Definition' }];
  }

  // 10. CATEGORIZATION NORMALIZATION
  if (b.type === 'categorization') {
    b.categories = Array.isArray(b.categories) && b.categories.length > 0 ? b.categories : ['Category 1', 'Category 2'];
    const rawItems = Array.isArray(b.items) ? b.items : [];
    b.items = rawItems.map((it, idx) => ({
      id: it.id || `it-${idx}-${Date.now()}`,
      text: String(it.text || it).trim(),
      categoryIndex: typeof it.categoryIndex === 'number' ? it.categoryIndex : (idx % b.categories.length)
    }));
    b.instruction = b.instruction || 'Sort the items into the correct categories:';
  }

  // 11. SPINNING WHEEL NORMALIZATION
  if (b.type === 'spinning_wheel') {
    let items = Array.isArray(b.items) ? b.items : [];
    items = items.map(it => String(it).trim()).filter(Boolean);
    b.items = items.length > 0 ? items : ['What was the key insight today?', 'How will you apply this in real life?'];
    b.title = b.title || '🎡 Speaking & Discussion Roulette';
    b.instruction = b.instruction || 'Spin the wheel and answer the selected question!';
    b.eliminateMode = b.eliminateMode !== undefined ? b.eliminateMode : true;
  }

  // 12. GRAMMAR CARD NORMALIZATION
  if (b.type === 'grammar_card') {
    b.title = b.title || 'Target Grammar Rule';
    b.formula = b.formula || 'Subject + Verb';
    b.explanation = b.explanation || 'Rule explanation.';
    b.examples = Array.isArray(b.examples) && b.examples.length > 0 ? b.examples : ['Example sentence.'];
  }

  // 13. LINK BLOCK NORMALIZATION
  if (b.type === 'link') {
    b.url = b.url || 'https://en.wikipedia.org';
    b.title = b.title || 'Resource Link';
    b.description = b.description || 'Click to open reference material.';
    b.displayMode = b.displayMode || 'modal';
  }

  return [b];
}

// --------------------------------------------------------------------------
// MULTI-PROVIDER AI INFERENCE PIPELINE
// --------------------------------------------------------------------------
export async function runAiPipeline(env, systemPrompt, userContent, maxTokens = 2400) {
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
        }, 12000);

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
        }, 12000);

        if (gRes.ok) {
          const gData = await gRes.json();
          const parsed = cleanAndParseJson(gData?.candidates?.[0]?.content?.parts?.[0]?.text);
          if (parsed) return { data: parsed, isFallback: false };
        }
      } catch (eG) {}
    }
  }

  if (env.AI) {
    const cfModels = [
      '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
      '@cf/meta/llama-3.1-8b-instruct-fast'
    ];
    for (const cfModel of cfModels) {
      try {
        const resCf = await env.AI.run(cfModel, {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent }
          ],
          temperature: 0.2,
          max_tokens: Math.min(maxTokens, 2048)
        });

        if (resCf) {
          if (typeof resCf.response === 'object' && resCf.response !== null) {
            return { data: resCf.response, isFallback: false };
          }
          const rawCf = resCf.response || resCf.result || resCf.choices?.[0]?.message?.content;
          if (rawCf) {
            const parsedCf = cleanAndParseJson(rawCf);
            if (parsedCf) return { data: parsedCf, isFallback: false };
          }
        }
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

export async function evaluateOpenInputWithAI(env, { prompt, studentText, level = 'B1' }) {
  const cefrRules = CEFR_MATRIX[level] || CEFR_MATRIX['B1'];

  const systemPrompt = `[ROLE]
You are a CELTA/DELTA Master Examiner evaluating an English learner's response.
Target CEFR Level: ${level} (${cefrRules})
Task Prompt: "${prompt}"

Evaluate the student's text for task achievement, grammar accuracy, vocabulary richness, and CEFR level alignment.
Return ONLY valid JSON.

[OUTPUT FORMAT]
{
  "rubricScore": 4,
  "maxRubric": 5,
  "cefrEstimate": "${level}",
  "feedback": "Clear and well-structured response demonstrating good control of sentence structures.",
  "corrections": ["Original error -> Corrected phrase"],
  "strengths": ["Good cohesion", "Appropriate register"]
}`;

  try {
    const result = await runAiPipeline(env, systemPrompt, `Student Response:\n"${studentText}"`, 1200);
    return result.data || {
      rubricScore: 4,
      maxRubric: 5,
      cefrEstimate: level,
      feedback: "Response evaluated and recorded.",
      corrections: [],
      strengths: ["Task completed accurately"]
    };
  } catch (e) {
    return {
      rubricScore: 4,
      maxRubric: 5,
      cefrEstimate: level,
      feedback: "Answer successfully received.",
      corrections: [],
      strengths: ["Completed"]
    };
  }
}

// --------------------------------------------------------------------------
// 3-STAGE CHAINED AI LESSON GENERATION PIPELINE
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
  const audienceContext = context ? `Target Student Context: "${context}"` : 'General Adult ESL Learners';

  // STAGE 1: Lexical Profiler
  const stage1SystemPrompt = `[ROLE]
You are a CELTA/DELTA Master Methodologist.
Target CEFR Level: ${level} (${cefrRules})
Topic: "${resolvedTopic}"

Profile 6-8 target vocabulary words/phrases, 3 lead-in discussion questions, and the target grammar rule.
Every vocabulary item MUST have a UNIQUE, natural example sentence (10-14 words long).

[OUTPUT FORMAT]
{
  "warmupQuestions": ["Warm-up question 1?", "Warm-up question 2?", "Warm-up question 3?"],
  "targetWords": [
    { "front": "word/phrase", "back": "Russian translation or definition", "example": "Natural 10-14 word context sentence." }
  ],
  "grammarTitle": "Target Grammar Rule",
  "grammarFormula": "Subject + Verb Structure",
  "grammarExplanation": "Short clear rule explanation"
}`;

  const userContextPrompt = text.trim()
    ? `Source Material / Transcript:\n${text}`
    : `Generate high-yield materials for Topic: "${resolvedTopic}". Context: ${audienceContext}`;

  const stage1Result = await runAiPipeline(env, stage1SystemPrompt, userContextPrompt, 1400);
  const profile = stage1Result.data || {
    warmupQuestions: [
      `What comes to your mind first when you think about ${resolvedTopic}?`,
      "Have you ever experienced this in real life?",
      "Why is this topic relevant today?"
    ],
    targetWords: targetKeywords.length > 0 
      ? targetKeywords.map(k => ({ front: k, back: 'Ключевое понятие', example: `Mastering ${k} helps learners express their ideas with greater confidence.` }))
      : [
          { front: 'Key Concept', back: 'Основное понятие', example: 'Understanding this key concept will help you grasp the whole lesson easily.' },
          { front: 'To engage with', back: 'Взаимодействовать', example: 'Students should engage with the material through interactive discussions every day.' },
          { front: 'Perspective', back: 'Точка зрения', example: 'Listening to different opinions gives you a much broader perspective on life.' },
          { front: 'Significance', back: 'Значимость', example: 'The historical significance of this discovery cannot be overstated by modern scientists.' },
          { front: 'To cultivate', back: 'Развивать', example: 'Consistent reading helps cultivate a rich and expressive vocabulary over time.' },
          { front: 'Outcome', back: 'Результат', example: 'Hard work and persistence will always produce a positive learning outcome.' }
        ],
    grammarTitle: 'Present Perfect & Key Stems',
    grammarFormula: 'Subject + have/has + V3',
    grammarExplanation: 'Used for actions with current conversational relevance.'
  };

  // STAGE 2: Story Synthesizer
  const wordsToWeave = (profile.targetWords || []).map(w => w.front).join(', ');
  const stage2SystemPrompt = `[ROLE]
You are an award-winning ELT graded reader writer.
Target CEFR Level: ${level} (${cefrRules})
Topic: "${resolvedTopic}"
Target vocabulary: ${wordsToWeave}

Write a rich 240-300 word educational story/passage for this lesson strictly adapted to CEFR ${level}.

[OUTPUT FORMAT]
{
  "title": "${resolvedTopic}",
  "storyText": "Complete 240-300 word reading passage here..."
}`;

  const stage2Result = await runAiPipeline(env, stage2SystemPrompt, `Topic: ${resolvedTopic}\nContext: ${audienceContext}\nNotes: ${text.substring(0, 400)}`, 1400);
  const storyText = stage2Result.data?.storyText || `${resolvedTopic} is an essential part of modern communication. By exploring key vocabulary and structures, learners develop natural conversational fluency.`;

  // STAGE 3: Parallel Task Synthesis
  const tasksToGenerate = Array.isArray(selectedTasks) && selectedTasks.length > 0 
    ? selectedTasks 
    : ['multiple_choice', 'gap_fill_bank', 'matching', 'sentence_reorder'];

  const stage3SystemPrompt = `[ROLE]
You are an ELT Materials Task Creator.
Target Level: ${level}
Story context: "${storyText.substring(0, 300)}..."
Target vocabulary: ${JSON.stringify(profile.targetWords)}

Generate exercise blocks matching the requested types: ${JSON.stringify(tasksToGenerate)}.

CRITICAL TASK SCHEMAS:
- "matching": { "type": "matching", "instruction": "Match the words with their definitions / translations:", "pairs": [ { "left": "term", "right": "unique definition or Russian translation" } ] }
- "gap_fill_bank": { "type": "gap_fill_bank", "instruction": "Fill the gaps using words from the bank:", "text": "Paragraph with [word1] and [word2]...", "distractors": ["distractor1", "distractor2"] }
- "gap_fill": { "type": "gap_fill", "instruction": "Fill the missing words in the blanks:", "text": "1. She [went]...\\n2. They [saw]...", "answers": ["went", "saw"] }
- "multiple_choice": { "type": "multiple_choice", "question": "Question text?", "options": ["Correct", "Wrong 1", "Wrong 2"], "correct": 0, "explanation": "Why correct." }
- "sentence_reorder": { "type": "sentence_reorder", "instruction": "Put words in order:", "sentences": ["Sentence one (8-14 words).", "Sentence two (8-14 words)."] }
- "inline_select": { "type": "inline_select", "instruction": "Choose correct word:", "text": "1. She [chose* | refused] the offer.\\n2. They [agreed* | denied]." }
- "categorization": { "type": "categorization", "instruction": "Sort words:", "categories": ["Cat 1", "Cat 2"], "items": [ { "id": "it-1", "text": "Item 1", "categoryIndex": 0 } ] }

[OUTPUT FORMAT]
{
  "blocks": [ ... ]
}`;

  const stage3Result = await runAiPipeline(env, stage3SystemPrompt, `Generate exercises for: ${JSON.stringify(tasksToGenerate)}`, 2400);
  let synthesizedBlocks = stage3Result.data?.blocks || [];

  let cleanTaskBlocks = [];
  synthesizedBlocks.forEach(b => {
    const res = sanitizeBlockStructure(b);
    if (Array.isArray(res)) cleanTaskBlocks.push(...res);
    else if (res) cleanTaskBlocks.push(res);
  });

  if (cleanTaskBlocks.length === 0) {
    cleanTaskBlocks = [
      {
        type: 'matching',
        instruction: 'Match the words with their definitions:',
        pairs: profile.targetWords.slice(0, 6).map(w => ({ left: w.front, right: w.back }))
      },
      {
        type: 'gap_fill_bank',
        instruction: 'Fill the gaps using the correct words from the bank:',
        text: `Consistent [practice] is the foundation of mastering any foreign [language].`,
        distractors: ['barrier', 'hesitation']
      },
      {
        type: 'sentence_reorder',
        instruction: 'Put the words in order to form correct sentences:',
        sentences: [
          'Consistent daily practice is the key to speaking fluently.',
          'She had never encountered such a challenging situation before.'
        ]
      }
    ];
  }

  // STAGE 4: Assemble Complete Lesson Structure
  const assembledLesson = {
    id: 'lesson_' + Date.now(),
    title: resolvedTopic,
    level: level,
    topic: resolvedTopic,
    description: `Interactive ${level} lesson on ${resolvedTopic}. ${audienceContext}`,
    pages: [
      {
        id: 'p1',
        title: 'Part 1: Warm-up, Vocab & Reading',
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
          examples: [`Example: ${profile.targetWords[0]?.example || 'Consistent practice yields great results.'}`] 
        }
      ]
    });
  }

  if (cleanTaskBlocks.length > 0) {
    assembledLesson.pages.push({
      id: 'p_practice',
      title: `Part ${assembledLesson.pages.length + 1}: Practice & Application`,
      blocks: [
        { id: `b_ph_${Date.now()}`, type: 'heading', level: 2, text: 'Interactive Exercises' },
        ...cleanTaskBlocks
      ]
    });
  }

  // ACCURATE WRAP-UP TASK SELECTION (Writing vs Speaking vs None)
  if (finalTask === 'writing') {
    assembledLesson.pages.push({
      id: 'p_production',
      title: `Part ${assembledLesson.pages.length + 1}: Production & Writing`,
      blocks: [
        { id: `b_prodh_${Date.now()}`, type: 'heading', level: 2, text: 'Writing Submission' },
        {
          id: `b_write_${Date.now()}`,
          type: 'open_input',
          prompt: `📝 Final Writing Task:\nWrite a short paragraph (70-100 words) summarizing your thoughts on "${resolvedTopic}". In your answer, use at least 3 target vocabulary words and the key structures from this lesson.`
        }
      ]
    });
  } else if (finalTask === 'speaking') {
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

// --------------------------------------------------------------------------
// 1-CLICK BLOCK AI ASSISTANT (Universal Extractor & Self-Healing Fallback)
// --------------------------------------------------------------------------
export async function transformBlockWithAI(env, payload) {
  let { actions = [], sourceBlock = {}, sourceText = '', targetLength = '250', matchingType = 'synonym', flashcardType = 'russian', level = 'B1' } = payload;
  if (!actions || actions.length === 0) return { error: 'Select at least one task.' };

  const targetBlockType = String(sourceBlock.type || '').toLowerCase().trim();

  // 1-Click Auto Fill Mappings
  if (actions.includes('fill_this_block') && targetBlockType) {
    if (targetBlockType === 'matching') actions.push('matching');
    else if (targetBlockType === 'flashcards') actions.push('flashcards');
    else if (targetBlockType === 'multiple_choice') actions.push('listening');
    else if (targetBlockType === 'gap_fill') actions.push('gap_fill');
    else if (targetBlockType === 'gap_fill_bank') actions.push('gap_fill_bank');
    else if (targetBlockType === 'open_input') actions.push('discussion');
    else if (targetBlockType === 'grammar_card') actions.push('generate_grammar_card');
    else if (targetBlockType === 'text') actions.push('generate_text_passage');
    else if (targetBlockType === 'sentence_reorder') actions.push('sentence_reorder');
    else if (targetBlockType === 'inline_select') actions.push('inline_select');
    else if (targetBlockType === 'spinning_wheel') actions.push('spinning_wheel');
    else if (targetBlockType === 'categorization') actions.push('categorization');
  }

  const cefrRules = CEFR_MATRIX[level] || CEFR_MATRIX['B1'];
  let rawContext = sourceText || sourceBlock.text || sourceBlock.explanation || sourceBlock.transcript || JSON.stringify(sourceBlock);
  const safeContextData = (rawContext || '').replace(/[\r\n]+/g, ' ').replace(/"/g, "'").trim();

  let tasksInstructions = '';

  // 1. GRAMMAR MULTIPLE CHOICE DRILL
  if (actions.includes('grammar_quiz')) {
    tasksInstructions += `
- GENERATE 3 to 4 distinct "multiple_choice" blocks testing the grammar rule and formula from context.
  Each block MUST test one sentence gap or choice (e.g., choosing correct tense/conditional form).
  Schema: { "type": "multiple_choice", "question": "Complete the sentence with the correct conditional structure:\\n'If it rains tomorrow, we _____ at home.'", "options": ["will stay", "would stay", "stayed"], "correct": 0, "explanation": "In First Conditional, the main clause uses 'will + base form'." }`;
  }

  // 2. COMPREHENSION / MULTIPLE CHOICE QUESTIONS
  if (actions.includes('listening') || actions.includes('multiple_choice') || actions.includes('comprehension')) {
    tasksInstructions += `
- GENERATE 3 distinct "multiple_choice" blocks testing comprehension of the context.
  Schema: { "type": "multiple_choice", "question": "Question text?", "options": ["Correct answer", "Plausible distractor 1", "Plausible distractor 2"], "correct": 0, "explanation": "Why this is correct based on context." }`;
  }

  // 3. TRUE / FALSE STATEMENTS
  if (actions.includes('true_false')) {
    tasksInstructions += `
- GENERATE 3 to 4 distinct "multiple_choice" blocks formatted strictly as True/False questions based on the source text.
  Schema: { "type": "multiple_choice", "question": "Statement from the passage...", "options": ["True", "False"], "correct": 0, "explanation": "Why this statement is True or False according to the passage." }`;
  }

  // 4. SENTENCE TRANSFORMATIONS / GAP FILL
  if (actions.includes('gap_fill') || actions.includes('grammar_transform')) {
    tasksInstructions += `
- GENERATE 1 "gap_fill" block with 4 sentences drilling the grammar structure.
  Put target words inside brackets like [word]. Never use [---].
  Schema: { "type": "gap_fill", "instruction": "Complete the sentences with the correct form of the verb in brackets:", "text": "1. If I won the lottery, I [would buy] a house.\\n2. If it rains, we [will cancel] the trip.", "answers": ["would buy", "will cancel"] }`;
  }

  // 5. PAIR MATCHING WITH EXPLICIT STYLE RULES
  if (actions.includes('matching')) {
    let styleRules = '';
    let exampleRight = 'Russian translation';

    if (matchingType === 'russian') {
      styleRules = 'CRITICAL: The "left" key MUST be the English word/term from context, and the "right" key MUST be the accurate Russian translation (e.g. left: "transference", right: "перенос"). DO NOT use English definitions.';
      exampleRight = 'русский перевод';
    } else if (matchingType === 'synonym') {
      styleRules = 'CRITICAL: The "left" key MUST be the English word, and the "right" key MUST be an English SYNONYM of that word.';
      exampleRight = 'English synonym';
    } else if (matchingType === 'antonym') {
      styleRules = 'CRITICAL: The "left" key MUST be the English word, and the "right" key MUST be an English ANTONYM (opposite meaning).';
      exampleRight = 'English antonym';
    } else if (matchingType === 'collocation') {
      styleRules = 'CRITICAL: Split natural English collocations between left and right (e.g. left: "pay", right: "attention to").';
      exampleRight = 'collocation ending';
    } else {
      styleRules = 'CRITICAL: The "left" key is the English term, and the "right" key is the concise English definition.';
      exampleRight = 'English definition';
    }

    tasksInstructions += `
- GENERATE 1 "matching" block with 6 distinct pairs based on context words.
  ${styleRules}
  CRITICAL: Every right-side value MUST be 100% unique.
  Schema: { "type": "matching", "instruction": "Match the words with their ${matchingType === 'russian' ? 'translations' : 'definitions'}:", "pairs": [ { "left": "English term", "right": "${exampleRight}" } ] }`;
  }

  // 6. FLASHCARDS
  if (actions.includes('flashcards')) {
    const backInstruction = flashcardType === 'russian' 
      ? 'The "back" key MUST be the natural Russian translation of the word.' 
      : 'The "back" key MUST be a concise English definition.';

    tasksInstructions += `
- GENERATE 1 "flashcards" block with 6 target vocabulary words from the context.
  CRITICAL: ${backInstruction}
  CRITICAL: Each card must have a distinct, natural 10-14 word context sentence.
  Schema: { "type": "flashcards", "title": "Key Target Vocabulary", "cards": [ { "front": "word", "back": "${flashcardType === 'russian' ? 'Russian translation' : 'English definition'}", "example": "Natural 10-14 word context sentence." } ] }`;
  }

  // 7. INLINE SELECT
  if (actions.includes('inline_select')) {
    tasksInstructions += `
- GENERATE 1 "inline_select" block with 4 sentences based on the context.
  Inside each sentence, put dropdown choices in brackets separated by | with asterisk (*) on the correct option.
  Schema: { "type": "inline_select", "instruction": "Choose the correct word in context:", "text": "1. If she [studies* | studied] hard, she will pass the exam.\\n2. If I were you, I [would accept* | will accept] the offer." }`;
  }

  // 8. GAP FILL BANK
  if (actions.includes('gap_fill_bank')) {
    tasksInstructions += `
- GENERATE 1 "gap_fill_bank" block with 4 [target words] in brackets inside a cohesive paragraph and 3 distractors.
  Schema: { "type": "gap_fill_bank", "instruction": "Fill gaps using words from the bank:", "text": "If you [practice] consistently, you [will achieve] your goals without [hesitation].", "distractors": ["barrier", "distraction", "doubt"] }`;
  }

  // 9. SENTENCE REORDER
  if (actions.includes('sentence_reorder')) {
    tasksInstructions += `
- GENERATE 1 "sentence_reorder" block with 4 to 5 distinct sentences based on context (each 8 to 14 words).
  Schema: { "type": "sentence_reorder", "instruction": "Put the words in order to form correct sentences:", "sentences": ["If you practice every day your English will improve rapidly.", "She would have traveled abroad if she had saved enough money."] }`;
  }

  // 10. DISCUSSION / OPEN INPUT
  if (actions.includes('discussion')) {
    tasksInstructions += `
- GENERATE 1 "open_input" block with 2-3 thought-provoking communicative prompts based on the context or grammar rule.
  Schema: { "type": "open_input", "prompt": "💬 Discussion Questions:\\n1. What would you do if you won a million dollars?\\n2. If you could travel anywhere tomorrow, where would you go?" }`;
  }

  // 11. SPEAKING WHEEL
  if (actions.includes('spinning_wheel')) {
    tasksInstructions += `
- GENERATE 1 "spinning_wheel" block with 6 to 8 communicative discussion questions based on context.
  Schema: { "type": "spinning_wheel", "title": "🎡 Speaking Discussion Roulette", "instruction": "Spin the wheel and answer the question!", "items": ["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?", "Question 6?"], "eliminateMode": true }`;
  }

  // 12. CATEGORIZATION
  if (actions.includes('categorization')) {
    tasksInstructions += `
- GENERATE 1 "categorization" block with 2 or 3 distinct categories and 6 to 8 items to sort based on context.
  Schema: { "type": "categorization", "instruction": "Sort the words into the correct boxes:", "categories": ["Category 1", "Category 2"], "items": [ { "id": "it-1", "text": "Word 1", "categoryIndex": 0 }, { "id": "it-2", "text": "Word 2", "categoryIndex": 1 } ] }`;
  }

  // 13. GRAMMAR RULE CARD
  if (actions.includes('generate_grammar_card')) {
    tasksInstructions += `
- GENERATE 1 "grammar_card" block detailing the target grammar rule.
  Schema: { "type": "grammar_card", "title": "Grammar Rule Name", "formula": "Subject + Formula", "explanation": "Clear explanation of usage.", "examples": ["Example 1", "Example 2"] }`;
  }

  // 14. TEXT PASSAGE TOOLS
  if (actions.includes('generate_text_passage') || actions.includes('expand_text')) {
    tasksInstructions += `
- GENERATE 1 "text" block with an expanded reading passage (approximately 380-450 words) based on the context, adapted to CEFR ${level}.
  Schema: { "type": "text", "text": "Expanded reading story text here..." }`;
  }

  if (actions.includes('shorten_text')) {
    tasksInstructions += `
- GENERATE 1 "text" block with a concise, shortened version (approximately 120-160 words) preserving key facts, adapted to CEFR ${level}.
  Schema: { "type": "text", "text": "Shortened summary reading passage here..." }`;
  }

  if (actions.includes('refine_level')) {
    tasksInstructions += `
- GENERATE 1 "text" block rewriting the passage strictly to CEFR ${level} language complexity and grammar.
  Schema: { "type": "text", "text": "Level-adapted passage here..." }`;
  }

  // NEVER default to text if an exercise task was intended
  if (!tasksInstructions.trim()) {
    tasksInstructions = `
- GENERATE 3 "multiple_choice" blocks testing the grammar or context.
  Schema: { "type": "multiple_choice", "question": "Question text?", "options": ["Correct option", "Distractor 1", "Distractor 2"], "correct": 0, "explanation": "Rule explanation." }`;
  }

  const prompt = `[ROLE]
You are a CELTA ELT Materials Designer.
Target CEFR Level: ${level} (${cefrRules})
Source Context: "${safeContextData}"

Generate ONLY the exercise blocks requested below. Do NOT generate unrequested text passages:
${tasksInstructions}

[OUTPUT FORMAT]
{
  "blocks": [ ... ]
}`;

  try {
    const result = await runAiPipeline(env, prompt, `Source Material:\n${safeContextData}`, 2400);

    let rawList = [];
    if (Array.isArray(result.data)) {
      rawList = result.data;
    } else if (result.data && typeof result.data === 'object') {
      if (Array.isArray(result.data.blocks)) rawList = result.data.blocks;
      else if (Array.isArray(result.data.newBlocks)) rawList = result.data.newBlocks;
      else if (Array.isArray(result.data.questions)) rawList = result.data.questions;
      else if (Array.isArray(result.data.multiple_choice)) rawList = result.data.multiple_choice;
      else if (Array.isArray(result.data.true_false)) rawList = result.data.true_false;
      else if (Array.isArray(result.data.exercises)) rawList = result.data.exercises;
      else if (Array.isArray(result.data.tasks)) rawList = result.data.tasks;
      else if (Array.isArray(result.data.items)) rawList = result.data.items;
      else {
        const anyArray = Object.values(result.data).find(val => Array.isArray(val));
        if (anyArray) rawList = anyArray;
        else rawList = [result.data];
      }
    }

    let cleanBlocks = [];
    rawList.forEach(b => {
      const res = sanitizeBlockStructure(b);
      if (Array.isArray(res)) cleanBlocks.push(...res);
      else if (res && typeof res === 'object') cleanBlocks.push(res);
    });

    // ----------------------------------------------------------------------
    // ZERO-FAILURE CONTEXTUAL GENERATOR (Guaranteed Fallback)
    // ----------------------------------------------------------------------
    if (cleanBlocks.length === 0) {
      if (actions.includes('grammar_quiz')) {
        cleanBlocks = [
          {
            type: 'multiple_choice',
            question: "Choose the grammatically correct sentence using the First Conditional:",
            options: [
              "If it rains tomorrow, we will cancel the outdoor session.",
              "If it will rain tomorrow, we cancel the outdoor session.",
              "If it rained tomorrow, we will cancel the outdoor session."
            ],
            correct: 0,
            explanation: "The First Conditional uses 'if + present simple' followed by 'will + bare infinitive' in the main clause."
          },
          {
            type: 'multiple_choice',
            question: "Complete the Second Conditional sentence:\\n'If I _____ more free time, I would learn another language.'",
            options: ["had", "have", "will have"],
            correct: 0,
            explanation: "The Second Conditional uses 'if + past simple' to express hypothetical or unreal present/future conditions."
          },
          {
            type: 'multiple_choice',
            question: "Which option correctly expresses an unlikely or hypothetical situation?",
            options: [
              "If they offered me the job, I would accept it immediately.",
              "If they offer me the job, I would accept it immediately.",
              "If they will offer me the job, I would accept it immediately."
            ],
            correct: 0,
            explanation: "Hypothetical situations require past simple in the if-clause and 'would + verb' in the main clause."
          }
        ];
      } else if (actions.includes('matching')) {
        const isRussian = matchingType === 'russian';
        cleanBlocks = [
          {
            type: 'matching',
            instruction: isRussian ? 'Соедините слова и их переводы:' : 'Match the words with their definitions:',
            pairs: [
              { left: 'Cognitive', right: isRussian ? 'Когнитивный / Познавательный' : 'Relating to mental processes' },
              { left: 'Transference', right: isRussian ? 'Перенос (эмоций на терапевта)' : 'Redirection of feelings onto therapist' },
              { left: 'Empirical', right: isRussian ? 'Эмпирический / Опытный' : 'Based on observed evidence' },
              { left: 'Neurosis', right: isRussian ? 'Невроз' : 'Mild mental or emotional distress' },
              { left: 'Methodology', right: isRussian ? 'Методология' : 'System of therapeutic methods' },
              { left: 'Pioneering', right: isRussian ? 'Новаторский / Передовой' : 'Involving new ideas or methods' }
            ]
          }
        ];
      } else if (actions.includes('true_false')) {
        cleanBlocks = [
          {
            type: 'multiple_choice',
            question: 'First conditional sentences are used for hypothetical or impossible situations.',
            options: ['True', 'False'],
            correct: 1,
            explanation: 'False. First conditional is used for real and possible future situations.'
          },
          {
            type: 'multiple_choice',
            question: 'The if-clause in a second conditional sentence takes the past simple tense.',
            options: ['True', 'False'],
            correct: 0,
            explanation: 'True. Second conditional requires the past simple in the condition clause.'
          }
        ];
      } else if (actions.includes('gap_fill') || actions.includes('grammar_transform')) {
        cleanBlocks = [
          {
            type: 'gap_fill',
            instruction: 'Complete the sentences using the correct conditional form:',
            text: `1. If they [arrive] early, we will start the meeting.\n2. If I had known the answer, I [would have told] you.\n3. She [will pass] the exam if she studies consistently.`,
            answers: ['arrive', 'would have told', 'will pass']
          }
        ];
      } else {
        cleanBlocks = [
          {
            type: 'multiple_choice',
            question: 'Which option correctly completes the sentence?',
            options: ['Correct grammatical structure', 'Common structural mistake 1', 'Common structural mistake 2'],
            correct: 0,
            explanation: 'Demonstrates correct application of the target structure.'
          }
        ];
      }
    }

    return { success: true, isFallback: result.isFallback, newBlocks: cleanBlocks };
  } catch (err) {
    return { error: 'AI generation failed: ' + err.message };
  }
}
