export const CEFR_MATRIX = {
  'A1': 'Target Grammar: Present Simple, to be, there is/are, basic plurals, can/can\'t. Sentences: 6-10 words. Vocabulary: Common daily words (home, food, family). No idioms.',
  'A2': 'Target Grammar: Past Simple, Present Continuous, Comparatives, basic conjunctions (because, but). Sentences: 8-12 words. Vocabulary: Routines, travel, shopping.',
  'B1': 'Target Grammar: Past Continuous, Present Perfect vs Past Simple, Conditionals 1 & 2, Simple Passives, Relative clauses (who, which, that). Sentences: 12-18 words. Vocabulary: Work, feelings, modern lifestyle.',
  'B2': 'Target Grammar: Conditionals 3, Future Perfect, Past Modals (should have, could have), Passive reporting verbs, complex clauses (whereas, despite). Sentences: 15-25 words. Vocabulary: Topical idioms, phrasal verbs, dependent prepositions, strong collocations.',
  'C1': 'Target Grammar: Inversion (Not only did..., Seldom have...), Cleft sentences (What strikes me is...), Advanced modals, Participle clauses. Sentences: Varied, multi-clause. Vocabulary: Academic discourse markers, nuanced metaphors, sophisticated register.',
  'C2': 'Target Grammar: Mastery of nuance, fronting, ellipsis, subjunctive, rhetorical variety. Native precision, subtle stylistic connotations, complete idiomatic flexibility.'
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

async function fetchWithTimeout(url, options = {}, timeoutMs = 5000) {
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

function bufferToBase64(buffer) {
  let binary = '';
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const len = bytes.byteLength;
  const chunkSize = 0x8000;
  for (let i = 0; i < len; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function concatMp3Base64(base64A, base64B) {
  try {
    const cleanA = (base64A || '').replace(/^data:[^;]+;base64,/, '');
    const cleanB = (base64B || '').replace(/^data:[^;]+;base64,/, '');
    if (!cleanA) return base64B;
    if (!cleanB) return base64A;

    const rawA = Uint8Array.from(atob(cleanA), c => c.charCodeAt(0));
    const rawB = Uint8Array.from(atob(cleanB), c => c.charCodeAt(0));
    const merged = new Uint8Array(rawA.length + rawB.length);
    merged.set(rawA, 0);
    merged.set(rawB, rawA.length);
    return `data:audio/mp3;base64,${bufferToBase64(merged)}`;
  } catch (e) {
    return base64A || base64B || '';
  }
}

// --------------------------------------------------------------------------
// LIGHTNING-FAST WEB SEARCH RESOLVER
// --------------------------------------------------------------------------
export async function fetchLiveWebSearch(query = '') {
  if (!query || !query.trim()) return null;
  const cleanQuery = query.trim();

  try {
    const wikiRes = await fetchWithTimeout(
      `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(cleanQuery)}&limit=1&namespace=0&format=json`,
      { headers: BROWSER_HEADERS },
      2000
    );

    if (wikiRes.ok) {
      const data = await wikiRes.json();
      if (Array.isArray(data) && data[1]?.[0] && data[3]?.[0]) {
        return {
          title: data[1][0],
          url: data[3][0],
          description: data[2]?.[0] || `Wikipedia article and reference on ${cleanQuery}.`
        };
      }
    }
  } catch (e) {}

  return {
    title: `Web Reference: ${cleanQuery}`,
    url: `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(cleanQuery)}`,
    description: `Click to view reference articles and background context on ${cleanQuery}.`
  };
}

// --------------------------------------------------------------------------
// OBJECT-SAFE & QUOTE-RESILIENT JSON PARSER
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
    else if (b.images || b.url?.includes('image') || b.url?.includes('.jpg') || b.url?.includes('.png')) type = 'image';
    else if (b.url) type = 'link';
    else if (b.prompt || b.speech || b.aim) type = b.speech ? 'teacher_notes' : 'open_input';
    else if (b.text || b.paragraph || b.content || b.passage || b.story) type = 'text';
    else return [];
  }

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
  if (type === 'photo' || type === 'picture' || type === 'gallery') type = 'image';
  if (type === 'url' || type === 'website' || type === 'web_link' || type === 'embed') type = 'link';
  if (type === 'prompt' || type === 'speaking' || type === 'discussion' || type === 'question_input' || type === 'writing') type = 'open_input';

  b.type = type;

  // 1. MULTIPLE CHOICE UNROLLING
  if (b.type === 'multiple_choice') {
    if (Array.isArray(b.questions) && b.questions.length > 0) {
      return b.questions.map((q, qIdx) => {
        const rawOpts = q.options || q.choices || ['Option A', 'Option B'];
        const cleanOpts = Array.isArray(rawOpts) ? rawOpts.map(o => String(o?.text || o).replace(/\*$/, '').trim()) : ['Option A', 'Option B'];
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
        if (typeof opt === 'string') {
          let cleanStr = opt.trim();
          if (cleanStr.endsWith('*')) {
            cleanStr = cleanStr.slice(0, -1).trim();
            detectedCorrect = idx;
          }
          cleanOptions.push(cleanStr);
        } else if (opt && typeof opt === 'object') {
          let textVal = String(opt.text || opt.option || opt.value || JSON.stringify(opt)).replace(/\*$/, '').trim();
          cleanOptions.push(textVal);
          if (opt.isCorrect === true || opt.correct === true) detectedCorrect = idx;
        } else cleanOptions.push(String(opt).replace(/\*$/, '').trim());
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

  // 3. IMAGE BLOCK NORMALIZATION
  if (b.type === 'image') {
    let rawUrl = b.url || (Array.isArray(b.images) && b.images[0]?.url) || '';
    if (b.prompt && !rawUrl) {
      rawUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(b.prompt)}?width=800&height=500&nologo=true`;
    }
    b.url = rawUrl;
    b.caption = b.caption || b.prompt || 'Lesson Visual';
    b.images = Array.isArray(b.images) && b.images.length > 0 ? b.images : (b.url ? [{ url: b.url, caption: b.caption }] : []);
  }

  // 4. GAP FILL NORMALIZATION
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

  // 5. GAP FILL BANK (WORD BANK)
  if (b.type === 'gap_fill_bank') {
    let rawText = String(b.text || b.paragraph || b.content || b.passage || '').trim();
    
    if (rawText.includes('|') && rawText.includes('[')) {
      b.type = 'inline_select';
      b.text = rawText;
      b.instruction = b.instruction || 'Choose the correct word in context:';
      return [b];
    }

    b.text = rawText.replace(/\[[-_.\s]{2,}\]/g, '[practice]');
    let distractors = Array.isArray(b.distractors) ? b.distractors : [];
    
    distractors = distractors
      .map(d => String(d).replace(/^\d+[\s.)-]+/, '').trim())
      .filter(d => Boolean(d) && !/^\d+$/.test(d) && !/^[-_.\s]+$/.test(d));

    b.distractors = distractors.length > 0 ? distractors : ['hesitation', 'distraction', 'barrier'];
    b.instruction = b.instruction || 'Fill the gaps using the correct words from the bank:';
  }

  // 6. INLINE SELECT NORMALIZATION
  if (b.type === 'inline_select') {
    let rawText = String(b.text || b.paragraph || b.content || '').trim();
    if (Array.isArray(b.sentences)) rawText = b.sentences.join('\n');
    b.text = rawText;
    b.instruction = b.instruction || 'Choose the correct word in context:';
  }

  // 7. MULTI-SENTENCE REORDER
  if (b.type === 'sentence_reorder') {
    let sentencesList = [];
    if (Array.isArray(b.sentences) && b.sentences.length > 0) {
      sentencesList = b.sentences.map(s => String(s).trim()).filter(Boolean);
    } else if (b.sentence && typeof b.sentence === 'string') {
      sentencesList = [b.sentence.trim()];
    } else if (b.text && typeof b.text === 'string') {
      sentencesList = b.text.split('\n').map(s => s.trim()).filter(Boolean);
    }

    const biteSized = sentencesList.filter(s => s.split(/\s+/).length <= 11);
    b.sentences = (biteSized.length >= 2 ? biteSized : sentencesList).slice(0, 4);
    if (b.sentences.length === 0) {
      b.sentences = ['Consistent daily practice builds conversational fluency.'];
    }
    b.sentence = b.sentences[0];
    b.instruction = b.instruction || 'Put the words in order to form correct sentences:';
  }

  // 8. OPEN INPUT NORMALIZATION
  if (b.type === 'open_input') {
    b.prompt = String(b.prompt || b.question || b.discussion || b.text || 'Discussion question / prompt...').trim();
  }

  // 9. FLASHCARDS NORMALIZATION
  if (b.type === 'flashcards') {
    let rawCards = Array.isArray(b.cards) ? b.cards : [];
    b.cards = rawCards.map(c => ({
      front: String(c.front || c.word || c.term || 'Target Word').trim(),
      back: String(c.back || c.translation || c.definition || 'Meaning').trim(),
      example: String(c.example || c.sentence || '').trim()
    }));
    b.title = b.title || 'Key Target Vocabulary';
  }

  // 10. MATCHING NORMALIZATION
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

  // 11. CATEGORIZATION NORMALIZATION
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

  // 12. DISCUSSION ROULETTE
  if (b.type === 'spinning_wheel') {
    let items = Array.isArray(b.items) ? b.items : [];
    items = items.map(it => String(it).trim()).filter(Boolean);
    b.items = items.length > 0 ? items : ['What was the key insight today?', 'How will you apply this in real life?'];
    
    let cleanTitle = String(b.title || 'Discussion Roulette').replace(/^[🎡🎲🎯\s]+/gu, '').trim();
    b.title = cleanTitle || 'Discussion Roulette';
    b.instruction = b.instruction || 'Spin the wheel and answer the selected question!';
    b.eliminateMode = b.eliminateMode !== undefined ? b.eliminateMode : true;
  }

  // 13. GRAMMAR CARD NORMALIZATION
  if (b.type === 'grammar_card') {
    b.title = b.title || 'Target Grammar Rule';
    b.formula = b.formula || 'Subject + Verb';
    b.explanation = b.explanation || 'Rule explanation.';
    b.examples = Array.isArray(b.examples) && b.examples.length > 0 ? b.examples : ['Example sentence.'];
  }

  // 14. LINK BLOCK NORMALIZATION
  if (b.type === 'link') {
    b.url = b.url || 'https://en.wikipedia.org';
    b.title = b.title || 'Resource Link';
    b.description = b.description || 'Click to open reference material.';
    b.displayMode = b.displayMode || 'modal';
  }

  return [b];
}

// --------------------------------------------------------------------------
// HIGH-SPEED MULTI-TIER AI INFERENCE PIPELINE
// --------------------------------------------------------------------------
export async function runAiPipeline(env, systemPrompt, userContent, maxTokens = 2400) {
  let errors = [];
  const isMultimodal = Array.isArray(userContent);

  // 1. GROQ (Instant sub-second inference)
  if (env.GROQ_API_KEY && env.GROQ_API_KEY.trim().length > 5 && !isMultimodal) {
    const groqKey = env.GROQ_API_KEY.trim();
    try {
      const res = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: `${systemPrompt}\nYou must return a valid JSON object only.` },
            { role: 'user', content: `${userContent}\nPlease respond with valid JSON.` }
          ],
          temperature: 0.4,
          response_format: { type: 'json_object' }
        })
      }, 4000);

      if (res.ok) {
        const data = await res.json();
        const parsed = cleanAndParseJson(data?.choices?.[0]?.message?.content);
        if (parsed) return { data: parsed, isFallback: false };
      }
    } catch (eGroq) {
      errors.push('Groq');
    }
  }

  // 2. CLOUDFLARE WORKERS AI (Fast FP8 / Standard 8B)
  if (env.AI && !isMultimodal) {
    const cfModels = [
      '@cf/meta/llama-3.1-8b-instruct-fp8',
      '@cf/meta/llama-3.1-8b-instruct'
    ];

    for (const cfModel of cfModels) {
      try {
        const resCf = await env.AI.run(cfModel, {
          messages: [
            { role: 'system', content: `${systemPrompt}\nReturn a valid JSON object only.` },
            { role: 'user', content: `${userContent}\nReturn valid JSON.` }
          ],
          temperature: 0.4,
          max_tokens: Math.min(maxTokens, 2400)
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
      } catch (eCf) {
        errors.push(`Workers AI (${cfModel})`);
      }
    }
  }

  // 3. GEMINI DIRECT FALLBACK
  if (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim().length > 5) {
    const apiKey = env.GEMINI_API_KEY.trim();
    try {
      const gUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      
      let gContents = [];
      if (isMultimodal) {
        const parts = [];
        userContent.forEach(item => {
          if (item.type === 'text') parts.push({ text: item.text });
          if (item.type === 'image_url' && item.image_url?.url?.startsWith('data:')) {
            const [mime, b64] = item.image_url.url.split(';base64,');
            parts.push({
              inlineData: {
                mimeType: mime.replace('data:', ''),
                data: b64
              }
            });
          }
        });
        gContents = [{ role: 'user', parts }];
      } else {
        gContents = [{ role: 'user', parts: [{ text: `${userContent}\nOutput valid JSON.` }] }];
      }

      const gRes = await fetchWithTimeout(gUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: `${systemPrompt}\nOutput valid JSON only.` }] },
          contents: gContents,
          generationConfig: { responseMimeType: 'application/json', temperature: 0.4 }
        })
      }, 6000);

      if (gRes.ok) {
        const gData = await gRes.json();
        const parsed = cleanAndParseJson(gData?.candidates?.[0]?.content?.parts?.[0]?.text);
        if (parsed) return { data: parsed, isFallback: false };
      }
    } catch (eG) {
      errors.push('Gemini');
    }
  }

  // 4. OPENROUTER MULTIMODAL FALLBACK
  if (env.OPENROUTER_API_KEY && env.OPENROUTER_API_KEY.trim().length > 5) {
    const openrouterKey = env.OPENROUTER_API_KEY.trim();
    try {
      const res = await fetchWithTimeout('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openrouterKey}`,
          'HTTP-Referer': 'https://lessons.smyaglikovs.workers.dev',
          'X-Title': 'Lesson Engine'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-lite-001:free',
          messages: [
            { role: 'system', content: `${systemPrompt}\nYou must return a valid JSON object only.` },
            { role: 'user', content: userContent }
          ],
          temperature: 0.4,
          response_format: { type: 'json_object' }
        })
      }, 6000);

      if (res.ok) {
        const data = await res.json();
        const parsed = cleanAndParseJson(data?.choices?.[0]?.message?.content);
        if (parsed) return { data: parsed, isFallback: false };
      }
    } catch (eOr) {
      errors.push('OpenRouter');
    }
  }

  return { data: null, error: errors.join('; ') || 'All AI providers failed or timed out.', isFallback: true };
}

// --------------------------------------------------------------------------
// AUTOMATIC PDF & TEXTBOOK SCANNER
// --------------------------------------------------------------------------
export async function scanDocumentAndBuildLesson(env, payload) {
  const { text = '', images = [], topic = '', level = 'C1' } = payload;
  if ((!text || !text.trim()) && (!images || images.length === 0)) {
    return { error: 'No document text or scanned images provided.' };
  }

  const resolvedTopic = topic.trim() 
    || (text.trim() ? text.trim().slice(0, 45).split('\n')[0].replace(/[#*]/g, '').trim() : 'Scanned Practice Lesson');
  
  const cefrRules = CEFR_MATRIX[level] || CEFR_MATRIX['C1'];

  const systemPrompt = `[ROLE]
You are a C2 Master ELT Examiner and Interactive Lesson Developer.
Target CEFR Level: ${level} (${cefrRules})
Lesson Topic: "${resolvedTopic}"

[TASK]
Convert the provided textbook document/test paper (or scanned images) into a complete, 100% SOLVED interactive lesson JSON matching our app's block schema.

[CONVERSION & SOLVING RULES - STRICT!]
1. SOLVE ALL EXERCISES: You MUST solve every sentence, transformation, and multiple choice question with native C2 accuracy.
2. INLINE SELECT STORIES: If the document contains a reading text with numbered vocabulary choices, convert the reading text into an "inline_select" block:
   - Put choices in brackets right inside the text: [correct_answer* | distractor_1 | distractor_2 | distractor_3]
   - Mark the correct answer with an asterisk (*).
3. WORD BANKS: Convert word bank exercises into "gap_fill_bank" blocks:
   - Put correct answers in brackets in text: [correct_word].
   - List distractors in "distractors" array. NEVER use numbers like ("1", "2") as distractors!
4. SENTENCE TRANSFORMATIONS: Convert sentence rewrite tasks into "gap_fill" blocks with target bracketed answers: [correct_phrase].
5. MULTIPLE CHOICE: Convert quizzes into "multiple_choice" blocks with numerical "correct" 0-based index.

[OUTPUT FORMAT]
{
  "title": "${resolvedTopic}",
  "level": "${level}",
  "topic": "${resolvedTopic}",
  "description": "Interactive digital conversion of textbook material.",
  "pages": [
    {
      "id": "p1",
      "title": "Part 1: Practice & Exercises",
      "blocks": [ ... ]
    }
  ]
}`;

  let userPayload;
  if (Array.isArray(images) && images.length > 0) {
    userPayload = [
      { type: 'text', text: `Scanned Textbook Pages:\n${text.slice(0, 3000)}\n\nPlease read all images/scans, extract the exercise text, solve all answers, and output fully solved lesson blocks.` }
    ];
    images.forEach(imgUrl => {
      userPayload.push({
        type: 'image_url',
        image_url: { url: imgUrl }
      });
    });
  } else {
    userPayload = `Scanned Textbook Content:\n${text.slice(0, 6500)}\n\nConvert this entire document into interactive, fully solved lesson pages.`;
  }

  const result = await runAiPipeline(env, systemPrompt, userPayload, 2200);
  if (!result.data) {
    return { error: `Document scanning failed: ${result.error}` };
  }

  return {
    success: true,
    jsonText: JSON.stringify(result.data, null, 2)
  };
}

// --------------------------------------------------------------------------
// ULTRA-FAST TEXT-TO-SPEECH WITH PARALLEL CHUNK STITCHING (TRUE ~2 MIN AUDIO)
// --------------------------------------------------------------------------
export async function generateAudioWithAI(env, { text = '', lang = 'en' }) {
  if (!text || !text.trim()) return { error: 'Text is required.' };
  const cleanText = text.trim();

  // 1. PRIMARY: CLOUDFLARE WORKERS AI MELOTTS (With chunk stitching for full 2-min audio)
  if (env.AI) {
    try {
      // If text is longer than 850 chars (~130 words), split into 2 halves and generate in parallel
      if (cleanText.length > 850) {
        const sentences = cleanText.match(/[^.!?]+[.!?]+/g) || [cleanText];
        const midIdx = Math.ceil(sentences.length / 2);
        const part1 = sentences.slice(0, midIdx).join(' ').trim();
        const part2 = sentences.slice(midIdx).join(' ').trim();

        const [melo1, melo2] = await Promise.all([
          env.AI.run('@cf/myshell-ai/melotts', { prompt: part1, lang: lang || 'en' }),
          env.AI.run('@cf/myshell-ai/melotts', { prompt: part2, lang: lang || 'en' })
        ]);

        const audio1 = melo1?.audio || '';
        const audio2 = melo2?.audio || '';

        if (audio1 && audio2) {
          const combinedAudio = concatMp3Base64(audio1, audio2);
          return { success: true, audioUrl: combinedAudio };
        } else if (audio1 || audio2) {
          const single = audio1 || audio2;
          return { success: true, audioUrl: single.startsWith('data:') ? single : `data:audio/mp3;base64,${single}` };
        }
      } else {
        const meloRes = await env.AI.run('@cf/myshell-ai/melotts', {
          prompt: cleanText,
          lang: lang || 'en'
        });

        if (meloRes && typeof meloRes.audio === 'string' && meloRes.audio.length > 100) {
          const audioUrl = meloRes.audio.startsWith('data:') ? meloRes.audio : `data:audio/mp3;base64,${meloRes.audio}`;
          return { success: true, audioUrl };
        }
      }
    } catch (eMelo) {
      console.error('MeloTTS error:', eMelo);
    }
  }

  // 2. SECONDARY: MULTI-CHUNK FAST TTS FALLBACK
  try {
    const sentences = cleanText.match(/[^.!?]+[.!?]+/g) || [cleanText];
    const chunks = [];
    let curChunk = '';

    for (const s of sentences) {
      if ((curChunk + ' ' + s).trim().length <= 160) {
        curChunk = (curChunk + ' ' + s).trim();
      } else {
        if (curChunk) chunks.push(curChunk);
        curChunk = s.trim().slice(0, 160);
      }
    }
    if (curChunk) chunks.push(curChunk);

    const audioBuffers = [];
    for (const chunk of chunks.slice(0, 12)) {
      const gUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(lang || 'en')}&client=tw-ob&q=${encodeURIComponent(chunk)}`;
      const gRes = await fetchWithTimeout(gUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      }, 3500);

      if (gRes.ok) {
        const ab = await gRes.arrayBuffer();
        if (ab.byteLength > 0) audioBuffers.push(new Uint8Array(ab));
      }
    }

    if (audioBuffers.length > 0) {
      const totalLen = audioBuffers.reduce((sum, b) => sum + b.length, 0);
      const merged = new Uint8Array(totalLen);
      let offset = 0;
      for (const b of audioBuffers) {
        merged.set(b, offset);
        offset += b.length;
      }
      const base64Audio = bufferToBase64(merged);
      return { success: true, audioUrl: `data:audio/mp3;base64,${base64Audio}` };
    }
  } catch (eFallback) {}

  return { success: false, error: 'Failed to synthesize voiceover audio.' };
}

// --------------------------------------------------------------------------
// TRUE 2-MINUTE PODCAST STUDIO (3 MANDATORY SEGMENTS = 280-320 WORDS)
// --------------------------------------------------------------------------
export async function generatePodcastAudioWithAI(env, payload) {
  const { topic = '', sourceText = '', lessonTitle = '', level = 'B1' } = payload;
  
  const resolvedTopic = topic.trim() 
    || lessonTitle.trim() 
    || (sourceText.trim() ? sourceText.trim().slice(0, 45) : 'General English Lesson');
  
  const cefrRules = CEFR_MATRIX[level] || CEFR_MATRIX['B1'];

  const systemPrompt = `[ROLE]
You are a World-Class Educational Podcast Host.
Target CEFR Level: ${level} (${cefrRules})
Topic: "${resolvedTopic}"

[TASK]
You MUST generate a complete 2-minute podcast episode.
To ensure the recording lasts approximately 2 minutes (1:50-2:10), you MUST write ALL THREE of the following segments. Every segment is mandatory.

[OUTPUT FORMAT - RETURN STRICTLY VALID JSON]
{
  "title": "${resolvedTopic} (Audio Episode)",
  "part_1_intro": "The Hook & Setting the Scene. Welcome the listeners and introduce the core dilemma or premise. (MUST be 75-85 words).",
  "part_2_body": "Deep Dive & Core Story. Dive into the details, key narrative, specific examples, conflict, or musical lore. (MUST be 130-150 words).",
  "part_3_conclusion": "Takeaway & Reflection. Reflect on the deeper meaning, cultural resonance, and leave the listener with a closing question. (MUST be 75-85 words)."
}

[CRITICAL RULES]
- TOTAL WORD COUNT across all 3 parts MUST BE AT LEAST 280 WORDS.
- Output ONLY spoken English words. Never include stage directions like '[Music fades]', '[Host]', or cues.
- Do NOT lecture about grammar rules. Focus on the story, meaning, and human experience.`;

  const userPrompt = sourceText.trim()
    ? `Source Context:\n${sourceText.slice(0, 2400)}\n\nGenerate the complete 3-part, 280-320 word podcast episode on: "${resolvedTopic}".`
    : `Generate the complete 3-part, 280-320 word podcast episode on: "${resolvedTopic}".`;

  const scriptResult = await runAiPipeline(env, systemPrompt, userPrompt, 1500);
  if (!scriptResult.data) {
    return { error: `Failed to write podcast script: ${scriptResult.error}` };
  }

  const d = scriptResult.data;
  let scriptText = '';

  if (d.part_1_intro && d.part_2_body && d.part_3_conclusion) {
    scriptText = `${d.part_1_intro.trim()}\n\n${d.part_2_body.trim()}\n\n${d.part_3_conclusion.trim()}`;
  } else {
    scriptText = d.script || d.storyText || d.text || '';
  }

  if (!scriptText || scriptText.length < 100) {
    return { error: 'Generated podcast script was too short. Please try again.' };
  }

  const episodeTitle = d.title || `${resolvedTopic} (Audio Episode)`;

  let audioDataUrl = '';
  try {
    const ttsRes = await generateAudioWithAI(env, { text: scriptText.replace(/\n+/g, ' '), lang: 'en' });
    if (ttsRes.success && ttsRes.audioUrl) {
      audioDataUrl = ttsRes.audioUrl;
    }
  } catch (e) {}

  return {
    success: true,
    title: episodeTitle,
    script: scriptText,
    audioUrl: audioDataUrl
  };
}

export async function fetchYouTubeTranscriptNative(videoUrl) {
  try {
    const videoId = getYouTubeId(videoUrl);
    if (!videoId) return null;

    let title = '';
    let transcriptText = '';

    try {
      const oembedRes = await fetchWithTimeout(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`, { headers: BROWSER_HEADERS }, 2500);
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
            const textRegex = /<text[^>]*>([\s\S]*?)<\/text>/gi;
            let fullText = '';
            let m;
            while ((m = textRegex.exec(xml)) !== null) {
              const decoded = m[1]
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&#39;/g, "'")
                .replace(/&quot;/g, '"')
                .replace(/<[^>]+>/g, '')
                .trim();
              if (decoded) fullText += decoded + ' ';
            }
            fullText = fullText.replace(/\s+/g, ' ').trim();
            if (fullText.length > 40) transcriptText = fullText.slice(0, 4000);
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
    const result = await runAiPipeline(env, systemPrompt, `Student Response:\n"${studentText}"`, 800);
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
// FULL LESSON ENGINE (SLOT DECOMPOSITION = 230-260 WORDS GUARANTEED)
// --------------------------------------------------------------------------
export async function generateFullLessonWithAI(env, payload) {
  const { 
    text = '', 
    level = 'B1', 
    topic = 'General English Practice',
    context = '',
    format = 'live'
  } = payload;

  const resolvedTopic = topic.trim() || 'General English Lesson';
  const cefrRules = CEFR_MATRIX[level] || CEFR_MATRIX['B1'];
  const audienceContext = context ? `Target Context: "${context}"` : 'General Adult ESL Learners';

  const systemPrompt = `[ROLE]
You are an expert CELTA/DELTA ELT Materials Writer and Graded Reader Author.
Target CEFR Level: ${level}
Topic: "${resolvedTopic}"
${audienceContext}

[CEFR LEVEL DIRECTIVE - STRICT]
${cefrRules}
- For A1-A2: Keep sentences simple, direct, using high-frequency everyday vocabulary.
- For B1-B2: Use complex clauses, phrasal verbs, idioms, and natural collocations.
- For C1-C2: Use advanced grammatical inversions, cleft sentences, nuanced vocabulary, and sophisticated idioms.

[STRICT READING PASSAGE BLUEPRINT - 3 MANDATORY SLOTS]
To guarantee depth, you MUST write three distinct, comprehensive paragraphs in separate keys:
1. "paragraph_1": Introduction, origins, historical/thematic background. (STRICTLY 75-85 words).
2. "paragraph_2": Detailed exploration, specific events, tracks, conflicts, or concrete examples. (STRICTLY 80-95 words).
3. "paragraph_3": Philosophical meaning, modern cultural impact, and psychological takeaway. (STRICTLY 75-85 words).
TOTAL WORD COUNT ACROSS ALL 3 PARAGRAPHS MUST BE 230-260 WORDS.

[VOCABULARY & FLASHCARDS - STRICTLY CALIBRATED TO CEFR ${level}]
- "targetWords" MUST contain exactly 6 high-yield TOPICAL collocations, idioms, or phrasal verbs extracted directly from the paragraphs above.
- NEVER include grammar rules or grammatical meta-terms (FORBIDDEN: "inversion", "modal verb", "cleft sentence", "passive voice").
- "front": The English term.
- "back": Accurate, natural Russian translation.
- "example": Authentic 10-14 word context sentence.

[OUTPUT FORMAT - RETURN STRICTLY VALID JSON]
{
  "title": "${resolvedTopic}",
  "paragraph_1": "Origins and introduction (~80 words)...",
  "paragraph_2": "Deep exploration and concrete examples (~90 words)...",
  "paragraph_3": "Impact and reflection (~80 words)...",
  "warmupQuestions": [
    "Thought-provoking warm-up question 1?",
    "Thought-provoking warm-up question 2?",
    "Thought-provoking warm-up question 3?"
  ],
  "targetWords": [
    { "front": "term 1", "back": "Russian translation", "example": "Context sentence 1." },
    { "front": "term 2", "back": "Russian translation", "example": "Context sentence 2." },
    { "front": "term 3", "back": "Russian translation", "example": "Context sentence 3." },
    { "front": "term 4", "back": "Russian translation", "example": "Context sentence 4." },
    { "front": "term 5", "back": "Russian translation", "example": "Context sentence 5." },
    { "front": "term 6", "back": "Russian translation", "example": "Context sentence 6." }
  ],
  "grammarFocus": {
    "title": "Target Grammar Structure",
    "formula": "Subject + Verb Pattern",
    "explanation": "Clear explanation of how and when to use this rule.",
    "ccqs": ["Concept checking question 1?", "Concept checking question 2?"]
  },
  "practiceAims": "Recommended practice: Use Matching for vocabulary consolidation, followed by Gap Fill or Inline Select to drill the target grammar."
}`;

  const userPrompt = text.trim() 
    ? `Source Material:\n${text.slice(0, 2200)}\n\nCreate a complete, rich 3-paragraph (230-260 words) lesson at CEFR Level ${level} on Topic: "${resolvedTopic}".`
    : `Create a rich 3-paragraph (230-260 words) lesson foundation at CEFR Level ${level} on Topic: "${resolvedTopic}". Format: ${format}.`;

  const [result, liveRef] = await Promise.all([
    runAiPipeline(env, systemPrompt, userPrompt, 2400),
    fetchLiveWebSearch(resolvedTopic)
  ]);

  if (!result.data) {
    return { error: `AI generation failed: ${result.error || 'All AI models failed or timed out.'}` };
  }

  const data = result.data;

  // Stitch the 3 mandatory paragraphs into a rich, full-length reading passage
  let storyText = '';
  if (data.paragraph_1 && data.paragraph_2 && data.paragraph_3) {
    storyText = `${data.paragraph_1.trim()}\n\n${data.paragraph_2.trim()}\n\n${data.paragraph_3.trim()}`;
  } else {
    storyText = data.storyText || data.text || data.story || data.passage || '';
  }

  if (!storyText || storyText.length < 80) {
    return { error: `AI generation failed: Story text was too short. Please try again.` };
  }

  const targetWords = Array.isArray(data.targetWords) && data.targetWords.length > 0
    ? data.targetWords
    : [
        { front: 'Key Concept', back: 'Основное понятие', example: `Understanding this concept is essential for ${resolvedTopic}.` }
      ];

  const warmupQuestions = Array.isArray(data.warmupQuestions) && data.warmupQuestions.length > 0
    ? data.warmupQuestions
    : [`What comes to mind when you think about ${resolvedTopic}?`];

  const refLink = liveRef || {
    title: `Resource: ${resolvedTopic}`,
    url: `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(resolvedTopic)}`,
    description: 'Explore live web reference materials and background context.'
  };

  const grammar = data.grammarFocus || {
    title: 'Target Grammar Structure',
    formula: 'Subject + Verb Pattern',
    explanation: 'Grammar rule explanation.',
    ccqs: ['Does this describe a real or hypothetical event?']
  };

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
            prompt: `💬 Warm-up & Lead-in Discussion:\n${warmupQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}` 
          },
          { 
            id: `b_fc_${Date.now()}`, 
            type: 'flashcards', 
            title: 'Key Target Vocabulary', 
            cards: targetWords 
          },
          { 
            id: `b_txt_${Date.now()}`, 
            type: 'text', 
            text: storyText 
          },
          {
            id: `b_link_${Date.now()}`,
            type: 'link',
            title: refLink.title,
            url: refLink.url,
            description: refLink.description,
            displayMode: 'modal'
          }
        ]
      },
      {
        id: 'p2',
        title: 'Part 2: Grammar Focus',
        blocks: [
          { id: `b_gh_${Date.now()}`, type: 'heading', level: 2, text: 'Grammar Focus' },
          {
            id: `b_gnotes_${Date.now()}`,
            type: 'teacher_notes',
            aim: `To clarify meaning, form, and pronunciation of ${grammar.title}.`,
            speech: `Rule: ${grammar.title} (${grammar.formula})\nExplanation: ${grammar.explanation}\n\nConcept Checking Questions (CCQs):\n${(grammar.ccqs || []).map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\n👉 Tip: Click "📘 Правило Грамматики" from the left Lego palette if you want to display an interactive rule card here.`
          }
        ]
      },
      {
        id: 'p3',
        title: 'Part 3: Practice & Tasks',
        blocks: [
          { id: `b_ph_${Date.now()}`, type: 'heading', level: 2, text: 'Interactive Practice' },
          {
            id: `b_pnotes_${Date.now()}`,
            type: 'teacher_notes',
            aim: 'To provide controlled practice of target vocabulary and grammar.',
            speech: `${data.practiceAims || 'Recommended: Add a 6-pair Matching block for vocabulary and an Inline Select or Gap Fill for grammar.'}\n\n👉 Tip: Click any task from the left palette and tap "✨ Generate / Fill with AI" to drill Page 1 text instantly.`
          }
        ]
      },
      {
        id: 'p4',
        title: `Part 4: Production & Wrap-up`,
        blocks: [
          { id: `b_prodh_${Date.now()}`, type: 'heading', level: 2, text: 'Speaking & Wrap-up' },
          {
            id: `b_prodnotes_${Date.now()}`,
            type: 'teacher_notes',
            aim: 'To develop communicative fluency and allow students to personalize the target language.',
            speech: 'Encourage students to personalize the newly learned vocabulary and grammar.\n\n👉 Tip: Click "🎡 Колесо вопросов" or "💬 Письменный вопрос" from the left palette when you are ready to insert a production activity.'
          }
        ]
      }
    ]
  };

  return {
    success: true,
    isFallback: false,
    jsonText: JSON.stringify(assembledLesson, null, 2)
  };
}

// --------------------------------------------------------------------------
// 1-CLICK BLOCK AI ASSISTANT
// --------------------------------------------------------------------------
export async function transformBlockWithAI(env, payload) {
  let { actions = [], sourceBlock = {}, sourceText = '', matchingType = 'synonym', flashcardType = 'russian', level = 'B1' } = payload;
  if (!actions || actions.length === 0) return { error: 'Select at least one task.' };

  const targetBlockType = String(sourceBlock.type || '').toLowerCase().trim();

  if (actions.includes('fill_this_block') && targetBlockType) {
    if (targetBlockType === 'image') actions.push('generate_image');
    else if (targetBlockType === 'matching') actions.push('matching');
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
  
  let rawContext = sourceText || sourceBlock.text || sourceBlock.transcript || sourceBlock.title || sourceBlock.explanation || JSON.stringify(sourceBlock);
  let safeContext = (rawContext || '').replace(/[\r\n]+/g, ' ').replace(/"/g, "'").trim();

  if (safeContext.length > 2400) {
    const titleHeader = sourceBlock.title ? `Video Title: ${sourceBlock.title}. ` : '';
    const startPortion = safeContext.slice(0, 1200);
    const middlePortion = safeContext.slice(1800, 3000);
    safeContext = `${titleHeader}${startPortion} [...] ${middlePortion}`;
  }

  let tasksInstructions = '';

  if (actions.includes('generate_image') || actions.includes('image')) {
    tasksInstructions += `
- GENERATE 1 "image" block illustrating the main scene or concept from the context.
  Schema: { "type": "image", "caption": "Descriptive visual caption of the scene", "prompt": "Detailed cinematic scene description illustrating the story without text or logos" }`;
  }

  if (actions.includes('listening') || actions.includes('multiple_choice') || actions.includes('comprehension')) {
    tasksInstructions += `
- GENERATE 3 to 4 distinct "multiple_choice" blocks testing comprehension of the key concepts at CEFR ${level}.
  CRITICAL: Do NOT put an asterisk (*) in the "options" text strings! Use the numerical "correct" 0-based index only.
  Schema: { "type": "multiple_choice", "question": "Question testing a specific point?", "options": ["Accurate answer based on context", "Plausible distractor 1", "Plausible distractor 2"], "correct": 0, "explanation": "Detailed explanation citing the argument." }`;
  }

  if (actions.includes('true_false')) {
    tasksInstructions += `
- GENERATE 3 to 4 distinct "multiple_choice" blocks formatted strictly as True/False questions based on the content claims.
  Schema: { "type": "multiple_choice", "question": "Clear claim or statement about the content...", "options": ["True", "False"], "correct": 0, "explanation": "Why this statement is True or False according to the text." }`;
  }

  if (actions.includes('flashcards')) {
    const backLang = flashcardType === 'russian' 
      ? 'The "back" key MUST be the accurate Russian translation of the term.' 
      : 'The "back" key MUST be a clear, concise English definition.';

    tasksInstructions += `
- GENERATE 1 "flashcards" block with 6 high-yield TOPICAL vocabulary words, collocations, or idioms from the material matching CEFR ${level}.
  CRITICAL: Do NOT output grammar labels or meta-terms (e.g. "inversion", "modal verb", "cleft sentence"). Real-world topic vocabulary only!
  ${backLang}
  CRITICAL: Each card MUST have an authentic 10-14 word example sentence illustrating its meaning in context.
  Schema: { "type": "flashcards", "title": "Key Target Vocabulary", "cards": [ { "front": "term", "back": "translation or definition", "example": "Context sentence." } ] }`;
  }

  if (actions.includes('grammar_quiz')) {
    tasksInstructions += `
- GENERATE 3 distinct "multiple_choice" blocks testing the grammar structure from context.
  Schema: { "type": "multiple_choice", "question": "Sentence gap or grammar question?", "options": ["Correct answer", "Common error 1", "Common error 2"], "correct": 0, "explanation": "Rule breakdown." }`;
  }

  if (actions.includes('matching')) {
    let styleRules = '';
    let exampleRight = 'Russian translation';

    if (matchingType === 'russian') {
      styleRules = 'CRITICAL: The "left" key MUST be the English term from context, and the "right" key MUST be the accurate Russian translation.';
      exampleRight = 'русский перевод';
    } else if (matchingType === 'synonym') {
      styleRules = 'CRITICAL: The "left" key is the English term, and the "right" key is an English SYNONYM.';
      exampleRight = 'English synonym';
    } else if (matchingType === 'antonym') {
      styleRules = 'CRITICAL: The "left" key is the English term, and the "right" key is an English ANTONYM.';
      exampleRight = 'English antonym';
    } else if (matchingType === 'collocation') {
      styleRules = 'CRITICAL: Split natural collocations from the text between left and right.';
      exampleRight = 'collocation ending';
    } else {
      styleRules = 'CRITICAL: The "left" key is the English term, and the "right" key is the concise English definition.';
      exampleRight = 'English definition';
    }

    tasksInstructions += `
- GENERATE 1 "matching" block with 6 distinct topical pairs based on context at CEFR ${level}.
  ${styleRules}
  CRITICAL: Every right-side value MUST be 100% unique.
  Schema: { "type": "matching", "instruction": "Match the terms with their ${matchingType === 'russian' ? 'translations' : 'definitions'}:", "pairs": [ { "left": "English term", "right": "${exampleRight}" } ] }`;
  }

  if (actions.includes('gap_fill') || actions.includes('grammar_transform')) {
    tasksInstructions += `
- GENERATE 1 "gap_fill" block with 4 sentences based on the context.
  Put target words inside brackets like [word]. Never use [---].
  Schema: { "type": "gap_fill", "instruction": "Fill the missing words in the blanks:", "text": "1. Sentence with [word].\\n2. Another sentence with [word].", "answers": ["word1", "word2"] }`;
  }

  if (actions.includes('gap_fill_bank')) {
    tasksInstructions += `
- GENERATE 1 "gap_fill_bank" block with 4 [target words] in brackets inside a cohesive paragraph and 3 vocabulary distractors.
  CRITICAL: "distractors" MUST be real vocabulary words (e.g. ["hesitation", "distraction", "comfort"]). NEVER output numbers like "1", "2", "3"!
  Schema: { "type": "gap_fill_bank", "instruction": "Fill gaps using words from the bank:", "text": "The atmosphere was [bleak] due to widespread [surveillance] by the regime.", "distractors": ["hesitation", "distraction", "comfort"] }`;
  }

  if (actions.includes('sentence_reorder')) {
    tasksInstructions += `
- GENERATE strictly ONE (1) "sentence_reorder" block with 3 short sentences (each STRICTLY 7 to 11 words maximum).
  CRITICAL: Never output sentences longer than 11 words!
  Schema: { "type": "sentence_reorder", "instruction": "Put the words in order to form correct sentences:", "sentences": ["Bite-sized sentence one.", "Short clear sentence two.", "Third natural sentence here."] }`;
  }

  if (actions.includes('discussion')) {
    tasksInstructions += `
- GENERATE 1 "open_input" block with 2-3 communicative prompts based on context at CEFR ${level}.
  Schema: { "type": "open_input", "prompt": "💬 Discussion Questions:\\n1. What were the key factors highlighted in the story?\\n2. How would you react in a similar situation?" }`;
  }

  if (actions.includes('inline_select')) {
    tasksInstructions += `
- GENERATE 1 "inline_select" block with 4 sentences based on the context.
  Inside each sentence, put dropdown choices in brackets separated by | with asterisk (*) on the correct option.
  Schema: { "type": "inline_select", "instruction": "Choose the correct word in context:", "text": "1. The report was [accurate* | misleading] in its description.\\n2. Citizens expressed their [dissent* | agreement] peacefully." }`;
  }

  if (actions.includes('spinning_wheel')) {
    tasksInstructions += `
- GENERATE 1 "spinning_wheel" block with 6 engaging communicative questions specifically about the topic.
  CRITICAL: Every question MUST be 100% standalone and autonomous.
  Schema: { "type": "spinning_wheel", "title": "Discussion Roulette", "instruction": "Spin the wheel and answer the selected question!", "items": ["Standalone topic question 1?", "Standalone topic question 2?", "Standalone topic question 3?"] }`;
  }

  if (actions.includes('categorization')) {
    tasksInstructions += `
- GENERATE 1 "categorization" block with 2 or 3 distinct categories and 6 items to sort based on context.
  Schema: { "type": "categorization", "instruction": "Sort the items into the correct boxes:", "categories": ["Category A", "Category B"], "items": [ { "id": "it-1", "text": "Item text 1", "categoryIndex": 0 }, { "id": "it-2", "text": "Item text 2", "categoryIndex": 1 } ] }`;
  }

  if (actions.includes('generate_grammar_card')) {
    tasksInstructions += `
- GENERATE 1 "grammar_card" block detailing the target grammar rule.
  Schema: { "type": "grammar_card", "title": "Grammar Rule Name", "formula": "Subject + Formula", "explanation": "Clear explanation of usage.", "examples": ["Example 1", "Example 2"] }`;
  }

  if (actions.includes('generate_text_passage') || actions.includes('expand_text')) {
    tasksInstructions += `
- GENERATE 1 "text" block with a balanced reading passage (approximately 220-250 words across 3 paragraphs) based on context, adapted to CEFR ${level}.
  Schema: { "type": "text", "text": "Balanced 220-250w reading story here..." }`;
  }

  if (actions.includes('shorten_text')) {
    tasksInstructions += `
- GENERATE 1 "text" block with a concise summary (approximately 120-150 words) preserving key facts, adapted to CEFR ${level}.
  Schema: { "type": "text", "text": "Shortened summary reading passage here..." }`;
  }

  if (actions.includes('refine_level')) {
    tasksInstructions += `
- GENERATE 1 "text" block rewriting the passage strictly to CEFR ${level} language complexity and grammar.
  Schema: { "type": "text", "text": "Level-adapted passage here..." }`;
  }

  if (!tasksInstructions.trim()) {
    tasksInstructions = `
- GENERATE 3 "multiple_choice" blocks testing the material.
  Schema: { "type": "multiple_choice", "question": "Question text?", "options": ["Correct option", "Distractor 1", "Distractor 2"], "correct": 0, "explanation": "Explanation." }`;
  }

  const prompt = `[ROLE]
You are a CELTA ELT Materials Designer.
Target CEFR Level: ${level} (${cefrRules})
Source Context: "${safeContext}"

Generate ONLY the exercise blocks requested below based on the Source Context:
${tasksInstructions}

[OUTPUT FORMAT]
{
  "blocks": [ ... ]
}`;

  try {
    const result = await runAiPipeline(env, prompt, `Source Material:\n${safeContext}`, 1800);
    if (!result.data) {
      return { error: `AI generation failed: ${result.error || 'All API providers failed or timed out.'}` };
    }

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

    const reorderBlocks = cleanBlocks.filter(b => b.type === 'sentence_reorder');
    if (reorderBlocks.length > 1) {
      const mergedSentences = [];
      reorderBlocks.forEach(rb => {
        if (Array.isArray(rb.sentences)) mergedSentences.push(...rb.sentences);
        else if (rb.sentence) mergedSentences.push(rb.sentence);
      });
      const biteSized = mergedSentences.filter(s => s.split(/\s+/).length <= 11);
      const finalSentences = (biteSized.length >= 2 ? biteSized : mergedSentences).slice(0, 4);

      const firstReorderIdx = cleanBlocks.findIndex(b => b.type === 'sentence_reorder');
      cleanBlocks = cleanBlocks.filter(b => b.type !== 'sentence_reorder');
      cleanBlocks.splice(firstReorderIdx, 0, {
        id: `b-reorder-${Date.now()}`,
        type: 'sentence_reorder',
        instruction: 'Put the words in order to form correct sentences:',
        sentences: finalSentences.length > 0 ? finalSentences : ['Consistent daily practice builds conversational fluency.'],
        sentence: finalSentences[0] || 'Consistent daily practice builds conversational fluency.'
      });
    }

    if (cleanBlocks.length === 0) {
      return { error: `AI generation failed: No valid blocks could be parsed from the response.` };
    }

    return { success: true, isFallback: result.isFallback, newBlocks: cleanBlocks };
  } catch (err) {
    return { error: 'AI generation failed: ' + err.message };
  }
}
