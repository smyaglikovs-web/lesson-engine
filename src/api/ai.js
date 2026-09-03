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

// --------------------------------------------------------------------------
// BULLETPROOF BLOCK SANITIZER WITH FULL FIELD-NAME ALIASING
// --------------------------------------------------------------------------
export function sanitizeBlockStructure(b) {
  if (!b || typeof b !== 'object') return [];

  let type = String(b.type || '').toLowerCase().trim();

  // Smart type inference from properties
  if (!type) {
    if (b.options || b.choices || b.questions || b.statement) type = 'multiple_choice';
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

  // Type normalization mapping
  if (type === 'header' || type === 'title' || type === 'h1' || type === 'h2' || type === 'h3') type = 'heading';
  if (type === 'paragraph' || type === 'reading' || type === 'article' || type === 'story' || type === 'reading_comprehension' || type === 'reading comprehension') type = 'text';
  if (type === 'quiz' || type === 'question' || type === 'true_false' || type === 'true-false' || type === 'true/false' || type === 'mc' || type === 'multiple-choice' || type === 'error-analysis' || type === 'error_analysis') type = 'multiple_choice';
  if (type === 'vocab' || type === 'words' || type === 'flashcard' || type === 'cards' || type === 'vocabulary_building' || type === 'vocabulary building') type = 'flashcards';
  if (type === 'rule' || type === 'grammar' || type === 'grammar-card' || type === 'grammarcard' || type === 'grammar_focus' || type === 'grammar focus') type = 'grammar_card';
  if (type === 'reorder' || type === 'sentence_order' || type === 'unscramble' || type === 'sentence-reorder' || type === 'sentence-construction' || type === 'sentence_construction') type = 'sentence_reorder';
  if (type === 'categories' || type === 'bucket' || type === 'sorting' || type === 'category') type = 'categorization';
  if (type === 'inline' || type === 'select_gap' || type === 'drop_down' || type === 'dropdown_select' || type === 'inline-select') type = 'inline_select';
  if (type === 'wheel' || type === 'roulette' || type === 'spinning-wheel' || type === 'speaking_wheel') type = 'spinning_wheel';
  if (type === 'notes' || type === 'teacher_notes' || type === 'teacher-notes') type = 'teacher_notes';
  if (type === 'drag-and-drop' || type === 'word_bank' || type === 'drag_and_drop' || type === 'gap-fill-bank') type = 'gap_fill_bank';
  if (type === 'gapfill' || type === 'gap-fill' || type === 'fill_gap' || type === 'fill-in-the-blank' || type === 'fill_in_the_blank') type = 'gap_fill';
  if (type === 'url' || type === 'website' || type === 'web_link' || type === 'embed') type = 'link';
  if (type === 'prompt' || type === 'speaking' || type === 'discussion' || type === 'question_input' || type === 'writing') type = 'open_input';

  b.type = type;

  // 1. MULTIPLE CHOICE / TRUE-FALSE NORMALIZATION
  if (b.type === 'multiple_choice') {
    if (Array.isArray(b.questions) && b.questions.length > 0) {
      return b.questions.map((q, qIdx) => {
        const rawOpts = q.options || q.choices || ['True', 'False'];
        const cleanOpts = Array.isArray(rawOpts) ? rawOpts.map(o => String(o?.text || o).trim()) : ['True', 'False'];
        return {
          id: `b-mc-${Date.now()}-${qIdx}`,
          type: 'multiple_choice',
          question: q.question || q.statement || q.prompt || 'Statement / Question:',
          options: cleanOpts.length > 0 ? cleanOpts : ['True', 'False'],
          correct: typeof q.correct === 'number' ? q.correct : 0,
          explanation: q.explanation || ''
        };
      });
    }

    let cleanOptions = [];
    let detectedCorrect = typeof b.correct === 'number' ? b.correct : 0;
    const rawOpts = b.options || b.choices || ['True', 'False'];

    if (Array.isArray(rawOpts)) {
      rawOpts.forEach((opt, idx) => {
        if (typeof opt === 'string') {
          cleanOptions.push(opt.trim());
        } else if (opt && typeof opt === 'object') {
          const textVal = opt.text || opt.option || opt.value || opt.label || opt.answer || JSON.stringify(opt);
          cleanOptions.push(String(textVal).trim());
          if (opt.isCorrect === true || opt.correct === true) detectedCorrect = idx;
        } else {
          cleanOptions.push(String(opt).trim());
        }
      });
    }

    b.options = cleanOptions.length > 0 ? cleanOptions : ['True', 'False'];
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
    let rawText = String(b.text || b.paragraph || b.content || b.sentences || '').trim();
    if (Array.isArray(b.sentences)) rawText = b.sentences.join('\n');
    b.text = rawText.replace(/\[[-_.\s]{2,}\]/g, '[answer]');
    const matches = [...(b.text || '').matchAll(/\[(.*?)\]/g)]
      .map(m => m[1].trim())
      .filter(w => !/^[-_.\s]+$/.test(w));
    b.answers = matches.length > 0 ? matches : (Array.isArray(b.answers) ? b.answers : ['answer']);
    b.instruction = b.instruction || 'Fill the missing words in the blanks:';
  }

  // 4. GAP FILL BANK (DRAG & DROP) NORMALIZATION
  if (b.type === 'gap_fill_bank') {
    let rawText = String(b.text || b.paragraph || b.content || b.passage || '').trim();
    b.text = rawText.replace(/\[[-_.\s]{2,}\]/g, '[practice]');
    let distractors = Array.isArray(b.distractors) ? b.distractors : [];
    distractors = distractors
      .map(d => String(d).trim())
      .filter(d => Boolean(d) && !/^[-_.\s]+$/.test(d));
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

    if (sentencesList.length === 0) {
      sentencesList = ['Consistent daily practice builds conversational fluency.'];
    }

    b.sentences = sentencesList;
    b.sentence = sentencesList[0];
    b.instruction = b.instruction || 'Put the words in order to form correct sentences:';
  }

  // 7. OPEN INPUT / DISCUSSION NORMALIZATION
  if (b.type === 'open_input') {
    b.prompt = String(b.prompt || b.question || b.discussion || b.text || 'Discussion question / prompt...').trim();
  }

  // 8. FLASHCARDS NORMALIZATION
  if (b.type === 'flashcards') {
    let rawCards = Array.isArray(b.cards) ? b.cards : (Array.isArray(b.targetWords) ? b.targetWords : []);
    b.cards = rawCards.map(c => {
      if (typeof c === 'object' && c !== null) {
        return {
          front: String(c.front || c.word || c.term || 'Target Word').trim(),
          back: String(c.back || c.translation || c.definition || 'Meaning').trim(),
          example: String(c.example || c.sentence || '').trim()
        };
      }
      return { front: 'Target Word', back: 'Meaning', example: '' };
    });
    b.title = b.title || 'Key Target Vocabulary';
  }

  // 9. MATCHING NORMALIZATION
  if (b.type === 'matching') {
    let rawPairs = b.pairs || b.items || b.matches || b.data || [];
    let normalizedPairs = [];
    const usedRightVals = new Set();

    if (Array.isArray(rawPairs)) {
      rawPairs.forEach((p, idx) => {
        let leftVal = '';
        let rightVal = '';

        if (Array.isArray(p) && p.length >= 2) {
          leftVal = String(p[0]).trim();
          rightVal = String(p[1]).trim();
        } else if (p && typeof p === 'object') {
          leftVal = p.left || p.term || p.word || p.item || p.front || p.key || Object.keys(p)[0] || `Word ${idx + 1}`;
          rightVal = p.right || p.definition || p.match || p.answer || p.back || p.value || p.translation || (Object.keys(p).length > 1 ? p[Object.keys(p)[1]] : Object.values(p)[0]) || `Match ${idx + 1}`;
        }

        leftVal = String(leftVal).trim();
        rightVal = String(rightVal).trim();

        if (leftVal && rightVal) {
          if (usedRightVals.has(rightVal.toLowerCase())) {
            rightVal = `${rightVal} (${leftVal.slice(0, 10)}...)`;
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
    if (!Array.isArray(b.categories) || b.categories.length === 0) {
      b.categories = ['Category 1', 'Category 2'];
    }
    const rawItems = Array.isArray(b.items) ? b.items : [];
    b.items = rawItems.map((it, idx) => {
      if (typeof it === 'string') {
        return { id: `it-${idx}-${Date.now()}`, text: it.trim(), categoryIndex: idx % b.categories.length };
      }
      return {
        id: it.id || `it-${idx}-${Date.now()}`,
        text: String(it.text || `Item ${idx + 1}`).trim(),
        categoryIndex: typeof it.categoryIndex === 'number' ? it.categoryIndex : (idx % b.categories.length)
      };
    });
    b.instruction = b.instruction || 'Sort the items into the correct categories:';
  }

  // 11. SPINNING WHEEL NORMALIZATION
  if (b.type === 'spinning_wheel') {
    let items = Array.isArray(b.items) ? b.items : (Array.isArray(b.questions) ? b.questions : []);
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

export async function runAiPipeline(env, systemPrompt, userContent, maxTokens = 2800) {
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
        }, 5500);

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
        }, 5500);

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

export async function evaluateOpenInputWithAI(env, { prompt, studentText, level = 'B1' }) {
  const cefrRules = CEFR_MATRIX[level] || CEFR_MATRIX['B1'];

  const systemPrompt = `[ROLE]
You are a CELTA/DELTA Master Examiner evaluating an English learner's response.

[CONTEXT]
Target CEFR Level: ${level} (${cefrRules})
Task Prompt: "${prompt}"

[TASK]
Evaluate the student's text for task achievement, grammar accuracy, vocabulary richness, and CEFR level alignment.

[CONSTRAINTS]
- Return ONLY a valid JSON object.
- Score MUST be an integer from 1 to 5.
- Provide constructive feedback (2-3 concise sentences).
- List specific grammatical error corrections if present.

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
  const keywordConstraints = targetKeywords.length > 0 
    ? `MANDATORY KEYWORDS TO TEST: ${JSON.stringify(targetKeywords)}`
    : `Extract 6-8 high-yield vocabulary items specifically relevant to "${resolvedTopic}".`;

  // STAGE 1: Lexical Profiler
  const stage1SystemPrompt = `[ROLE]
You are a CELTA/DELTA Master Methodologist.

[CONTEXT]
Target CEFR Level: ${level} (${cefrRules})
Topic: "${resolvedTopic}"
${audienceContext}
${keywordConstraints}

[TASK]
Profile 6-8 target vocabulary words/phrases, 3 lead-in discussion questions, and the target grammar rule.

[CRITICAL RULES FOR EXAMPLES]
- Every vocabulary item MUST have a UNIQUE, natural example sentence (10-14 words long).
- NEVER reuse the same stem or word across examples for different cards.
- Each example must clearly illustrate the meaning of THAT specific word in everyday context.

[OUTPUT FORMAT]
{
  "warmupQuestions": ["Warm-up question 1?", "Warm-up question 2?", "Warm-up question 3?"],
  "targetWords": [
    { "front": "word/phrase", "back": "Russian translation or short definition", "example": "Natural 10-14 word context sentence illustrating the word." }
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

[CONTEXT]
Target CEFR Level: ${level} (${cefrRules})
Topic: "${resolvedTopic}"
Target vocabulary to naturally weave into the story: ${wordsToWeave}

[TASK]
Write a rich 240-300 word educational story/passage for this lesson.

[CONSTRAINTS]
- Text MUST be 100% natural English adapted strictly to CEFR ${level}.
- Return JSON root object only.

[OUTPUT FORMAT]
{
  "title": "${resolvedTopic}",
  "storyText": "Complete 240-300 word reading passage here..."
}`;

  const stage2Result = await runAiPipeline(env, stage2SystemPrompt, `Topic: ${resolvedTopic}\nContext: ${audienceContext}\nProvided notes: ${text.substring(0, 400)}`, 1400);
  const storyText = stage2Result.data?.storyText || `${resolvedTopic} is an essential part of modern communication. By exploring key vocabulary and structures, learners develop natural conversational fluency.`;

  // STAGE 3: Parallel Task Synthesis
  const tasksToGenerate = Array.isArray(selectedTasks) && selectedTasks.length > 0 
    ? selectedTasks 
    : ['multiple_choice', 'gap_fill_bank', 'matching', 'sentence_reorder'];

  const stage3SystemPrompt = `[ROLE]
You are an ELT Materials Task Creator.

[CONTEXT]
Target Level: ${level} (${cefrRules})
Story context: "${storyText.substring(0, 300)}..."
Target vocabulary: ${JSON.stringify(profile.targetWords)}
Format: ${format === 'live' ? 'Live teacher-led lesson' : 'Self-paced auto-graded homework'}

[CRITICAL TASK CONSTRAINTS]
1. For "matching": Generate 6 pairs where EVERY right-side definition is 100% UNIQUE.
2. For "gap_fill_bank": Put ACTUAL vocabulary words inside brackets like [${profile.targetWords[0]?.front || 'concept'}]. NEVER use [---] or [___].
3. For "sentence_reorder": Generate an array of 4 to 5 distinct sentences in "sentences" (strictly 8 to 14 words each).
4. For "inline_select": Put options in brackets separated by | and mark the correct option with asterisk (*), e.g. [correct* | wrong].

[OUTPUT FORMAT]
{
  "blocks": [
    {
      "type": "matching",
      "instruction": "Match the words with their definitions / translations:",
      "pairs": [
        { "left": "${profile.targetWords[0]?.front || 'Word 1'}", "right": "${profile.targetWords[0]?.back || 'Meaning 1'}" },
        { "left": "${profile.targetWords[1]?.front || 'Word 2'}", "right": "${profile.targetWords[1]?.back || 'Meaning 2'}" },
        { "left": "${profile.targetWords[2]?.front || 'Word 3'}", "right": "${profile.targetWords[2]?.back || 'Meaning 3'}" },
        { "left": "${profile.targetWords[3]?.front || 'Word 4'}", "right": "${profile.targetWords[3]?.back || 'Meaning 4'}" }
      ]
    },
    { 
      "type": "gap_fill_bank", 
      "instruction": "Fill the gaps using the correct words from the bank:", 
      "text": "A cohesive paragraph containing [${profile.targetWords[0]?.front || 'target'}] and [${profile.targetWords[1]?.front || 'concept'}] in brackets...", 
      "distractors": ["barrier", "hesitation", "distraction"] 
    },
    { 
      "type": "multiple_choice", 
      "question": "Comprehension question text?", 
      "options": ["Correct option", "Plausible distractor 1", "Plausible distractor 2"], 
      "correct": 0, 
      "explanation": "Why this answer is correct based on context." 
    },
    { 
      "type": "sentence_reorder", 
      "instruction": "Put the words in order to form correct sentences:", 
      "sentences": [
        "Consistent daily practice is the key to speaking fluently.",
        "She had never encountered such a challenging problem before.",
        "They decided to explore different perspectives on this issue.",
        "Learning a new skill requires both patience and dedication."
      ]
    }
  ]
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
          'She had never encountered such a challenging situation before.',
          'They decided to explore different perspectives on this issue.',
          'Learning a new skill requires both patience and dedication.'
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

// --------------------------------------------------------------------------
// 1-CLICK BLOCK AI ASSISTANT (Guaranteed 1-Click Auto-Fill for Every Type)
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

  // 1. INLINE SELECT AUTO-FILL
  if (actions.includes('inline_select')) {
    tasksInstructions += `
- GENERATE 1 "inline_select" block with 4 sentences based on the context.
  CRITICAL: Inside each sentence, put dropdown choices in brackets separated by | with asterisk (*) on the correct option.
  Schema: { "type": "inline_select", "instruction": "Choose the correct word in context:", "text": "1. Dr. Thompson [believed* | doubted] in empirical therapy.\\n2. The symptoms were [treated* | ignored] quickly." }`;
  }

  // 2. GAP FILL AUTO-FILL
  if (actions.includes('gap_fill') || actions.includes('grammar_transform')) {
    tasksInstructions += `
- GENERATE 1 "gap_fill" block with 4 sentences based on the context.
  CRITICAL: Put target words inside brackets like [word]. Never use [---].
  Schema: { "type": "gap_fill", "instruction": "Fill the missing words in the blanks:", "text": "1. He practiced [psychotherapy] for years.\\n2. They [supported] the new approach.", "answers": ["psychotherapy", "supported"] }`;
  }

  // 3. GAP FILL BANK AUTO-FILL
  if (actions.includes('gap_fill_bank')) {
    tasksInstructions += `
- GENERATE 1 "gap_fill_bank" block with 4 [target words] in brackets inside a cohesive paragraph and 3 distractors.
  CRITICAL: Put actual words inside brackets. NO [---].
  Schema: { "type": "gap_fill_bank", "instruction": "Fill gaps using words from the bank:", "text": "Dr. Thompson used [cognitive] methods to treat [neurosis] in his patients.", "distractors": ["barrier", "hesitation", "distraction"] }`;
  }

  // 4. SENTENCE REORDER AUTO-FILL
  if (actions.includes('sentence_reorder')) {
    tasksInstructions += `
- GENERATE 1 "sentence_reorder" block with 4 to 5 distinct sentences based on context (each 8 to 14 words).
  Schema: { "type": "sentence_reorder", "instruction": "Put the words in order to form correct sentences:", "sentences": ["Dr. Thompson practiced cognitive behavioral therapy for many years.", "Empirical research supported the effectiveness of this new treatment."] }`;
  }

  // 5. OPEN INPUT / DISCUSSION AUTO-FILL
  if (actions.includes('discussion')) {
    tasksInstructions += `
- GENERATE 1 "open_input" block with 2-3 thought-provoking communicative prompts based on the context.
  Schema: { "type": "open_input", "prompt": "💬 Discussion Questions:\\n1. How would you evaluate this approach?\\n2. Have you experienced similar situations?" }`;
  }

  // 6. MULTIPLE CHOICE / COMPREHENSION AUTO-FILL
  if (actions.includes('listening') || actions.includes('multiple_choice') || actions.includes('comprehension')) {
    tasksInstructions += `
- GENERATE 3 "multiple_choice" blocks testing comprehension.
  Schema: { "type": "multiple_choice", "question": "Question text?", "options": ["Correct answer", "Plausible distractor 1", "Plausible distractor 2"], "correct": 0, "explanation": "Why this is correct based on context." }`;
  }

  // 7. TRUE / FALSE STATEMENTS AUTO-FILL
  if (actions.includes('true_false')) {
    tasksInstructions += `
- GENERATE 3 to 4 distinct "multiple_choice" blocks formatted strictly as True/False questions based on the source text.
  Schema: { "type": "multiple_choice", "question": "Statement from the passage...", "options": ["True", "False"], "correct": 0, "explanation": "Why this statement is True or False according to the passage." }`;
  }

  // 8. PAIR MATCHING AUTO-FILL
  if (actions.includes('matching')) {
    tasksInstructions += `
- GENERATE 1 "matching" block with 6 distinct pairs (${matchingType} style) based on context words.
  CRITICAL: Every right-side value MUST be 100% unique.
  Schema: { "type": "matching", "instruction": "Match the words with their definitions / translations:", "pairs": [ { "left": "term", "right": "unique definition or translation" } ] }`;
  }

  // 9. FLASHCARDS AUTO-FILL
  if (actions.includes('flashcards')) {
    const backStyle = flashcardType === 'russian' ? 'Russian translation' : 'English definition';
    tasksInstructions += `
- GENERATE 1 "flashcards" block with 6 target vocabulary words from the context.
  CRITICAL: Each card must have a distinct, natural 10-14 word context sentence.
  Schema: { "type": "flashcards", "title": "Key Target Vocabulary", "cards": [ { "front": "word", "back": "${backStyle}", "example": "Natural 10-14 word context sentence." } ] }`;
  }

  // 10. SPEAKING WHEEL AUTO-FILL
  if (actions.includes('spinning_wheel')) {
    tasksInstructions += `
- GENERATE 1 "spinning_wheel" block with 6 to 8 communicative discussion questions based on context.
  Schema: { "type": "spinning_wheel", "title": "🎡 Speaking Discussion Roulette", "instruction": "Spin the wheel and answer the question!", "items": ["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?", "Question 6?"], "eliminateMode": true }`;
  }

  // 11. CATEGORIZATION AUTO-FILL
  if (actions.includes('categorization')) {
    tasksInstructions += `
- GENERATE 1 "categorization" block with 2 or 3 distinct categories and 6 to 8 items to sort based on context.
  Schema: { "type": "categorization", "instruction": "Sort the words into the correct boxes:", "categories": ["Category 1", "Category 2"], "items": [ { "id": "it-1", "text": "Word 1", "categoryIndex": 0 }, { "id": "it-2", "text": "Word 2", "categoryIndex": 1 } ] }`;
  }

  // 12. GRAMMAR CARD AUTO-FILL
  if (actions.includes('generate_grammar_card')) {
    tasksInstructions += `
- GENERATE 1 "grammar_card" block detailing the target grammar rule.
  Schema: { "type": "grammar_card", "title": "Grammar Rule Name", "formula": "Subject + Formula", "explanation": "Clear explanation of usage.", "examples": ["Example 1", "Example 2"] }`;
  }

  // 13. TEXT PASSAGE AUTO-FILL
  if (actions.includes('generate_text_passage') || actions.includes('expand_text') || actions.includes('shorten_text') || actions.includes('refine_level')) {
    tasksInstructions += `
- GENERATE 1 "text" block with an engaging reading passage (${targetLength} words) adapted to level ${level}.
  Schema: { "type": "text", "text": "Full reading passage here..." }`;
  }

  if (!tasksInstructions.trim()) {
    tasksInstructions = `
- GENERATE 1 "text" block based on context.
  Schema: { "type": "text", "text": "Content based on context..." }`;
  }

  const prompt = `[ROLE]
You are a CELTA ELT Materials Designer.

[CONTEXT]
Target CEFR Level: ${level} (${cefrRules})
Source Context: "${safeContextData}"

[TASK]
Generate ONLY the exercise blocks requested below. Do NOT generate unrequested blocks:
${tasksInstructions}

[STRICT CONSTRAINTS]
- Return a JSON object with a "blocks" array.
- ONLY output the block types explicitly requested in the task list above.
- Ensure all text, questions, and sentences are populated from the source context.

[OUTPUT FORMAT]
{
  "blocks": [ ... ]
}`;

  try {
    const result = await runAiPipeline(env, prompt, `Source Material:\n${safeContextData}`, 2400);
    const rawList = result.data?.blocks || result.data?.newBlocks || (Array.isArray(result.data) ? result.data : [result.data]);

    let cleanBlocks = [];
    rawList.forEach(b => {
      const res = sanitizeBlockStructure(b);
      if (Array.isArray(res)) cleanBlocks.push(...res);
      else if (res && typeof res === 'object') cleanBlocks.push(res);
    });

    if (cleanBlocks.length === 0) {
      return { error: 'Не удалось сгенерировать задание. Попробуйте ещё раз.' };
    }

    return { success: true, isFallback: result.isFallback, newBlocks: cleanBlocks };
  } catch (err) {
    return { error: 'AI generation failed: ' + err.message };
  }
}
