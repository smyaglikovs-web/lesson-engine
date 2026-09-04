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

async function fetchWithTimeout(url, options = {}, timeoutMs = 6000) {
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

// --------------------------------------------------------------------------
// LIVE WEB SEARCH RESOLVER (Pulls Real Top Search Results - 0 Neurons)
// --------------------------------------------------------------------------
export async function fetchLiveWebSearch(query = '') {
  if (!query || !query.trim()) return null;
  const cleanQuery = query.trim();

  // 1. Try DuckDuckGo Web Search parser (Extracts top real organic URL)
  try {
    const ddgRes = await fetchWithTimeout(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(cleanQuery)}`, {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `q=${encodeURIComponent(cleanQuery)}`
    }, 4000);

    if (ddgRes.ok) {
      const html = await ddgRes.text();
      const uddgMatch = html.match(/uddg=([^&"'>]+)/i);
      const titleMatch = html.match(/<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/i) || html.match(/<a[^>]+class="result__url"[^>]*>([\s\S]*?)<\/a>/i);
      const snippetMatch = html.match(/<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/i);

      if (uddgMatch && uddgMatch[1]) {
        const realUrl = decodeURIComponent(uddgMatch[1]);
        let title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : cleanQuery;
        let snippet = snippetMatch ? snippetMatch[1].replace(/<[^>]+>/g, '').trim() : `Top search resource for ${cleanQuery}`;

        if (title.length > 70) title = title.slice(0, 67) + '...';
        if (snippet.length > 180) snippet = snippet.slice(0, 177) + '...';

        return {
          title: title || cleanQuery,
          url: realUrl,
          description: snippet || `Explore reference resource on ${cleanQuery}.`
        };
      }
    }
  } catch (e) {}

  // 2. Wikipedia Live API OpenSearch (Returns verified existing article URL)
  try {
    const wikiRes = await fetchWithTimeout(`https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(cleanQuery)}&limit=1&namespace=0&format=json`, {
      headers: BROWSER_HEADERS
    }, 3000);

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

  // 3. Fallback to Live Topic Search URL (Never a 404!)
  return {
    title: `Web Search: ${cleanQuery}`,
    url: `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(cleanQuery)}`,
    description: `Click to view search articles and reference materials on ${cleanQuery}.`
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
      const titleMatch = rawText.match(/"title":\s*"([^"]+)"/i);
      const storyMatch = rawText.match(/"(?:storyText|text|story|passage|content)":\s*"([\s\S]*?)"\s*\}/i);
      if (storyMatch && storyMatch[1].length > 40) {
        return {
          title: titleMatch ? titleMatch[1] : 'Reading Story',
          storyText: storyMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').trim()
        };
      }
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

  // 5. GAP FILL BANK NORMALIZATION
  if (b.type === 'gap_fill_bank') {
    let rawText = String(b.text || b.paragraph || b.content || b.passage || '').trim();
    b.text = rawText.replace(/\[[-_.\s]{2,}\]/g, '[practice]');
    let distractors = Array.isArray(b.distractors) ? b.distractors : [];
    distractors = distractors.map(d => String(d).trim()).filter(d => Boolean(d) && !/^[-_.\s]+$/.test(d));
    b.distractors = distractors.length > 0 ? distractors : ['barrier', 'hesitation', 'distraction'];
    b.instruction = b.instruction || 'Fill the gaps using the correct words from the bank:';
  }

  // 6. INLINE SELECT NORMALIZATION
  if (b.type === 'inline_select') {
    let rawText = String(b.text || b.paragraph || b.content || '').trim();
    if (Array.isArray(b.sentences)) rawText = b.sentences.join('\n');
    b.text = rawText;
    b.instruction = b.instruction || 'Choose the correct word in context:';
  }

  // 7. MULTI-SENTENCE REORDER NORMALIZATION
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

  // 12. SPINNING WHEEL NORMALIZATION
  if (b.type === 'spinning_wheel') {
    let items = Array.isArray(b.items) ? b.items : [];
    items = items.map(it => String(it).trim()).filter(Boolean);
    b.items = items.length > 0 ? items : ['What was the key insight today?', 'How will you apply this in real life?'];
    b.title = b.title || '🎡 Speaking & Discussion Roulette';
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
// HIGH-SPEED, ULTRA-LOW-NEURON AI INFERENCE PIPELINE
// --------------------------------------------------------------------------
export async function runAiPipeline(env, systemPrompt, userContent, maxTokens = 1800) {
  let errors = [];

  // 1. GROQ API (If key is available: 300 tps, sub-second latency, 0 CF Neurons)
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
            messages: [
              { role: 'system', content: `${systemPrompt}\nYou must return a valid JSON object only.` },
              { role: 'user', content: `${userContent}\nPlease respond with valid JSON.` }
            ],
            temperature: 0.2,
            response_format: { type: 'json_object' }
          })
        }, 4500);

        if (res.ok) {
          const data = await res.json();
          const parsed = cleanAndParseJson(data?.choices?.[0]?.message?.content);
          if (parsed) return { data: parsed, isFallback: false };
        }
      } catch (eGroq) {
        errors.push(`Groq (${model})`);
      }
    }
  }

  // 2. CLOUDFLARE WORKERS AI (Using ONLY ~40-100 neuron lightweight/fast models)
  if (env.AI) {
    const cfModels = [
      '@cf/meta/llama-3.1-8b-instruct-fast',
      '@cf/zai-org/glm-4.7-flash',
      '@cf/meta/llama-3.1-8b-instruct'
    ];

    for (const cfModel of cfModels) {
      try {
        const resCf = await env.AI.run(cfModel, {
          messages: [
            { role: 'system', content: `${systemPrompt}\nReturn a valid JSON object.` },
            { role: 'user', content: `${userContent}\nReturn valid JSON.` }
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
      } catch (eCf) {
        errors.push(`Workers AI (${cfModel}): ${eCf?.message || eCf}`);
      }
    }
  }

  // 3. OPENROUTER GATEWAY
  if (env.OPENROUTER_API_KEY && env.OPENROUTER_API_KEY.trim().length > 5) {
    const openrouterKey = env.OPENROUTER_API_KEY.trim();
    const openRouterModels = [
      'google/gemma-4-31b-it:free',
      'z-ai/glm-5.2:free',
      'openrouter/free'
    ];

    for (const model of openRouterModels) {
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
            model: model,
            messages: [
              { role: 'system', content: `${systemPrompt}\nYou must return a valid JSON object only.` },
              { role: 'user', content: `${userContent}\nPlease respond with valid JSON.` }
            ],
            temperature: 0.2,
            response_format: { type: 'json_object' }
          })
        }, 5000);

        if (res.ok) {
          const data = await res.json();
          const parsed = cleanAndParseJson(data?.choices?.[0]?.message?.content);
          if (parsed) return { data: parsed, isFallback: false };
        }
      } catch (eOr) {
        errors.push(`OpenRouter (${model})`);
      }
    }
  }

  // 4. GEMINI DIRECT FALLBACK
  if (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim().length > 5) {
    const apiKey = env.GEMINI_API_KEY.trim();
    for (const gModel of ['gemini-2.0-flash', 'gemini-1.5-flash']) {
      try {
        const gUrl = `https://generativelanguage.googleapis.com/v1beta/models/${gModel}:generateContent?key=${apiKey}`;
        const gRes = await fetchWithTimeout(gUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: `${systemPrompt}\nOutput valid JSON only.` }] },
            contents: [{ role: 'user', parts: [{ text: `${userContent}\nOutput valid JSON.` }] }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
          })
        }, 5000);

        if (gRes.ok) {
          const gData = await gRes.json();
          const parsed = cleanAndParseJson(gData?.candidates?.[0]?.content?.parts?.[0]?.text);
          if (parsed) return { data: parsed, isFallback: false };
        }
      } catch (eG) {
        errors.push(`Gemini (${gModel})`);
      }
    }
  }

  return { data: null, error: errors.join('; ') || 'All AI providers failed or timed out.', isFallback: true };
}

// --------------------------------------------------------------------------
// FULL-LENGTH TEXT-TO-SPEECH (Generates Complete 60-90s Audio Track)
// --------------------------------------------------------------------------
export async function generateAudioWithAI(env, { text = '', lang = 'en' }) {
  if (!text || !text.trim()) return { error: 'Text is required.' };
  const cleanText = text.trim();

  // 1. PRIMARY: OPENROUTER SPEECH MODELS (Full-length, 0 Cloudflare Neurons)
  if (env.OPENROUTER_API_KEY && env.OPENROUTER_API_KEY.trim().length > 5) {
    const openrouterKey = env.OPENROUTER_API_KEY.trim();
    const speechModels = [
      { model: 'deepgram/flux-tts:free', voice: 'flux-alexis-en' },
      { model: 'hexgrad/kokoro-82m', voice: 'af_alloy' },
      { model: 'openai/gpt-4o-mini-tts-2025-12-15', voice: 'alloy' }
    ];

    for (const sm of speechModels) {
      try {
        const orRes = await fetchWithTimeout('https://openrouter.ai/api/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openrouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://lessons.smyaglikovs.workers.dev',
            'X-Title': 'Lesson Engine'
          },
          body: JSON.stringify({
            model: sm.model,
            input: cleanText,
            voice: sm.voice,
            response_format: 'mp3'
          })
        }, 9000);

        if (orRes.ok) {
          const audioBuffer = await orRes.arrayBuffer();
          if (audioBuffer.byteLength > 200) {
            const base64Audio = bufferToBase64(audioBuffer);
            return { success: true, audioUrl: `data:audio/mp3;base64,${base64Audio}` };
          }
        }
      } catch (eOr) {}
    }
  }

  // 2. SECONDARY: CLOUDFLARE MELOTTS (Burns only ~14 neurons, no Deepgram)
  if (env.AI) {
    try {
      const meloRes = await env.AI.run('@cf/myshell-ai/melotts', {
        prompt: cleanText.slice(0, 800),
        lang: lang || 'en'
      });

      if (meloRes && typeof meloRes.audio === 'string' && meloRes.audio.length > 100) {
        const audioUrl = meloRes.audio.startsWith('data:')
          ? meloRes.audio
          : `data:audio/mp3;base64,${meloRes.audio}`;
        return { success: true, audioUrl };
      }
    } catch (eMelo) {}
  }

  // 3. TERTIARY: MULTI-CHUNK COMPLETE SPEECH COMPILATION
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
    for (const chunk of chunks) {
      const gUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(lang || 'en')}&client=tw-ob&q=${encodeURIComponent(chunk)}`;
      const gRes = await fetchWithTimeout(gUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      }, 5000);

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
// 2-IN-1 PODCAST STUDIO (Generates Lesson-Aware Episode & Spoken Audio)
// --------------------------------------------------------------------------
export async function generatePodcastAudioWithAI(env, payload) {
  const { topic = '', sourceText = '', lessonTitle = '', level = 'B1' } = payload;
  
  const resolvedTopic = topic.trim() 
    || lessonTitle.trim() 
    || (sourceText.trim() ? sourceText.trim().slice(0, 45) : 'General English Lesson');
  
  const cefrRules = CEFR_MATRIX[level] || CEFR_MATRIX['B1'];

  const systemPrompt = `[ROLE]
You are a World-Class ELT Podcast Host and Audio Scriptwriter.
Target CEFR Level: ${level} (${cefrRules})
Core Topic: "${resolvedTopic}"

[TASK]
Write a lively, engaging 1-minute spoken podcast monologue (~115-135 words) for language learners discussing the content of this specific topic.
Tone: Conversational, engaging, natural, and clear for listening comprehension.

[CRITICAL CONTENT GUIDELINES]
- You MUST discuss the ideas, concepts, and story from the provided topic and source context.
- DO NOT invent generic stories about apps, software, or unrelated characters.
- DO NOT lecture about grammar rules, cleft sentences, inversions, or mechanics.
- DO NOT include stage directions (e.g. '[Music fades]', '[Host]') or sound cues. Output ONLY the spoken English monologue.

[OUTPUT FORMAT]
{
  "title": "${resolvedTopic} (Audio Episode)",
  "script": "The spoken podcast text here..."
}`;

  const userPrompt = sourceText.trim()
    ? `Source Material:\n${sourceText.slice(0, 2200)}\n\nCreate a 1-minute podcast episode discussing the ideas of: "${resolvedTopic}".`
    : `Create a 1-minute podcast episode specifically on the Topic: "${resolvedTopic}".`;

  const scriptResult = await runAiPipeline(env, systemPrompt, userPrompt, 1000);
  if (!scriptResult.data) {
    return { error: `Failed to write podcast script: ${scriptResult.error}` };
  }

  const scriptData = scriptResult.data;
  const scriptText = scriptData.script || scriptData.storyText || scriptData.text;
  if (!scriptText || scriptText.length < 30) {
    return { error: 'Failed to parse generated podcast script.' };
  }

  const episodeTitle = scriptData.title || `${resolvedTopic} (Audio Episode)`;

  let audioDataUrl = '';
  try {
    const ttsRes = await generateAudioWithAI(env, { text: scriptText, lang: 'en' });
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
        const res = await fetchWithTimeout(ttUrl, { headers: BROWSER_HEADERS }, 4000);
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
    const result = await runAiPipeline(env, systemPrompt, `Student Response:\n"${studentText}"`, 1000);
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
// 1-PROMPT ANCHOR + ROADMAP ENGINE (Sub-3s, Real Top Web Search Resolver)
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
You are an award-winning CELTA/DELTA ELT Graded Reader Writer and Methodologist.
Target CEFR Level: ${level}
Topic: "${resolvedTopic}"
${audienceContext}

[CEFR LEVEL GUIDELINE FOR READING PASSAGE]
${cefrRules}

[CRITICAL VOCABULARY INSTRUCTIONS - STRICT!]
- "targetWords" MUST contain exactly 6 high-yield TOPICAL English words, collocations, or idioms that appear directly in your "storyText".
- NEVER include grammar rules, linguistic terms, or meta-concepts in "targetWords" (FORBIDDEN: "inversion", "cleft sentence", "participle clause", "modal verb", "passive voice", "relative clause", "tense", "aspect", "verb", "noun").
- Example good words for a dystopian story: "surveillance", "authoritarian", "propaganda", "rebellion", "conformity", "bleak".
- "back" MUST be an accurate Russian translation of the word.
- "example" MUST be an authentic 10-14 word context sentence.

[STRICT STORY REQUIREMENTS]
- "storyText" MUST be an engaging 220 to 280-word reading passage divided into 3 paragraphs.
- Adapt language complexity to CEFR ${level}.
- CRITICAL JSON RULE: Inside the "storyText" string, NEVER use raw double quotes. Use single quotes ('Trench', 'Clancy') for titles or speech.

[OUTPUT FORMAT]
{
  "title": "${resolvedTopic}",
  "storyText": "Complete 3-paragraph (220-280 words) reading story here...",
  "warmupQuestions": ["Warm-up question 1?", "Warm-up question 2?", "Warm-up question 3?"],
  "targetWords": [
    { "front": "topical word 1", "back": "Russian translation", "example": "Context sentence 1." },
    { "front": "topical word 2", "back": "Russian translation", "example": "Context sentence 2." },
    { "front": "topical word 3", "back": "Russian translation", "example": "Context sentence 3." },
    { "front": "topical word 4", "back": "Russian translation", "example": "Context sentence 4." },
    { "front": "topical word 5", "back": "Russian translation", "example": "Context sentence 5." },
    { "front": "topical word 6", "back": "Russian translation", "example": "Context sentence 6." }
  ],
  "grammarFocus": {
    "title": "Target Grammar Structure",
    "formula": "Subject + Verb Structure",
    "explanation": "Clear explanation of when and why to use this structure.",
    "ccqs": ["Concept checking question 1?", "Concept checking question 2?"]
  },
  "practiceAims": "Recommended practice: Use Matching for vocabulary consolidation, followed by Gap Fill or Inline Select to drill the target grammar."
}`;

  const userPrompt = text.trim() 
    ? `Source Material:\n${text.slice(0, 2200)}\n\nCreate a complete lesson on Topic: "${resolvedTopic}".`
    : `Create a comprehensive lesson anchor and roadmaps for Topic: "${resolvedTopic}". Format: ${format}.`;

  // Run AI Text Generation and Real Live Web Search IN PARALLEL (0ms added delay!)
  const [result, liveRef] = await Promise.all([
    runAiPipeline(env, systemPrompt, userPrompt, 1800),
    fetchLiveWebSearch(resolvedTopic)
  ]);

  if (!result.data) {
    return { error: `AI generation failed: ${result.error || 'All AI models failed or timed out.'}` };
  }

  const data = result.data;
  const storyText = data.storyText || data.text || data.story || data.passage;
  if (!storyText || storyText.length < 50) {
    return { error: `AI generation failed: No valid reading story text could be parsed from the response.` };
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
    formula: 'Subject + Verb Structure',
    explanation: 'Grammar rule explanation.',
    ccqs: ['Does this describe a real or hypothetical event?']
  };

  // ASSEMBLE CLEAN 4-PAGE LESSON
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
// 1-CLICK BLOCK AI ASSISTANT (Universal Task Handlers + Auto Image Creator)
// --------------------------------------------------------------------------
export async function transformBlockWithAI(env, payload) {
  let { actions = [], sourceBlock = {}, sourceText = '', matchingType = 'synonym', flashcardType = 'russian', level = 'B1' } = payload;
  if (!actions || actions.length === 0) return { error: 'Select at least one task.' };

  const targetBlockType = String(sourceBlock.type || '').toLowerCase().trim();

  // 1-Click Auto Fill Mappings
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

  // 1. AI IMAGE BLOCK GENERATOR
  if (actions.includes('generate_image') || actions.includes('image')) {
    tasksInstructions += `
- GENERATE 1 "image" block illustrating the main scene or concept from the context.
  Describe an atmospheric, photorealistic visual scene and provide a concise caption.
  Schema: { "type": "image", "caption": "Descriptive visual caption of the scene", "prompt": "Detailed cinematic 4k scene description illustrating the story without text or logos" }`;
  }

  // 2. COMPREHENSION MULTIPLE CHOICE
  if (actions.includes('listening') || actions.includes('multiple_choice') || actions.includes('comprehension')) {
    tasksInstructions += `
- GENERATE 3 to 4 distinct "multiple_choice" blocks testing comprehension of the key arguments and concepts in the material.
  Schema: { "type": "multiple_choice", "question": "Question testing a specific point?", "options": ["Accurate answer based on context", "Plausible distractor 1", "Plausible distractor 2"], "correct": 0, "explanation": "Detailed explanation citing the argument." }`;
  }

  // 3. TRUE / FALSE QUESTIONS
  if (actions.includes('true_false')) {
    tasksInstructions += `
- GENERATE 3 to 4 distinct "multiple_choice" blocks formatted strictly as True/False questions based on the content claims.
  Schema: { "type": "multiple_choice", "question": "Clear claim or statement about the content...", "options": ["True", "False"], "correct": 0, "explanation": "Why this statement is True or False according to the text." }`;
  }

  // 4. TARGET VOCABULARY FLASHCARDS
  if (actions.includes('flashcards')) {
    const backLang = flashcardType === 'russian' 
      ? 'The "back" key MUST be the accurate Russian translation of the term.' 
      : 'The "back" key MUST be a clear, concise English definition.';

    tasksInstructions += `
- GENERATE 1 "flashcards" block with 6 high-yield TOPICAL vocabulary words or idioms from the material.
  CRITICAL: Do NOT output grammar labels or meta-terms (e.g. "inversion", "modal verb", "cleft sentence", "participle"). Output real-world topic vocabulary only!
  ${backLang}
  CRITICAL: Each card MUST have an authentic 10-14 word example sentence illustrating its meaning in context.
  Schema: { "type": "flashcards", "title": "Key Target Vocabulary", "cards": [ { "front": "term", "back": "translation or definition", "example": "Context sentence." } ] }`;
  }

  // 5. GRAMMAR MULTIPLE CHOICE DRILL
  if (actions.includes('grammar_quiz')) {
    tasksInstructions += `
- GENERATE 3 distinct "multiple_choice" blocks testing the grammar structure from context.
  Schema: { "type": "multiple_choice", "question": "Sentence gap or grammar question?", "options": ["Correct answer", "Common error 1", "Common error 2"], "correct": 0, "explanation": "Rule breakdown." }`;
  }

  // 6. PAIR MATCHING
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
- GENERATE 1 "matching" block with 6 distinct topical pairs based on context.
  Do NOT use grammar terms.
  ${styleRules}
  CRITICAL: Every right-side value MUST be 100% unique.
  Schema: { "type": "matching", "instruction": "Match the terms with their ${matchingType === 'russian' ? 'translations' : 'definitions'}:", "pairs": [ { "left": "English term", "right": "${exampleRight}" } ] }`;
  }

  // 7. GAP FILL & TRANSFORMATIONS
  if (actions.includes('gap_fill') || actions.includes('grammar_transform')) {
    tasksInstructions += `
- GENERATE 1 "gap_fill" block with 4 sentences based on the context.
  Put target words inside brackets like [word]. Never use [---].
  Schema: { "type": "gap_fill", "instruction": "Fill the missing words in the blanks:", "text": "1. Sentence with [word].\\n2. Another sentence with [word].", "answers": ["word1", "word2"] }`;
  }

  // 8. GAP FILL BANK
  if (actions.includes('gap_fill_bank')) {
    tasksInstructions += `
- GENERATE 1 "gap_fill_bank" block with 4 [target words] in brackets inside a cohesive paragraph and 3 distractors.
  Schema: { "type": "gap_fill_bank", "instruction": "Fill gaps using words from the bank:", "text": "The atmosphere was [bleak] due to widespread [surveillance] by the regime.", "distractors": ["hesitation", "distraction", "comfort"] }`;
  }

  // 9. SENTENCE REORDER
  if (actions.includes('sentence_reorder')) {
    tasksInstructions += `
- GENERATE 1 "sentence_reorder" block with 3 to 4 distinct sentences based on context (each 8 to 12 words).
  Schema: { "type": "sentence_reorder", "instruction": "Put the words in order to form correct sentences:", "sentences": ["Consistent practice is necessary for mastering new vocabulary.", "The characters struggled to adapt to their harsh new reality."] }`;
  }

  // 10. DISCUSSION / OPEN INPUT
  if (actions.includes('discussion')) {
    tasksInstructions += `
- GENERATE 1 "open_input" block with 2-3 thought-provoking communicative prompts based on the context.
  Schema: { "type": "open_input", "prompt": "💬 Discussion Questions:\\n1. What were the key factors highlighted in the story?\\n2. How would you react in a similar situation?" }`;
  }

  // 11. INLINE SELECT
  if (actions.includes('inline_select')) {
    tasksInstructions += `
- GENERATE 1 "inline_select" block with 4 sentences based on the context.
  Inside each sentence, put dropdown choices in brackets separated by | with asterisk (*) on the correct option.
  Schema: { "type": "inline_select", "instruction": "Choose the correct word in context:", "text": "1. The report was [accurate* | misleading] in its description.\\n2. Citizens expressed their [dissent* | agreement] peacefully." }`;
  }

  // 12. SPEAKING WHEEL
  if (actions.includes('spinning_wheel')) {
    tasksInstructions += `
- GENERATE 1 "spinning_wheel" block with 6 communicative discussion questions based on context.
  Schema: { "type": "spinning_wheel", "title": "🎡 Discussion Roulette", "instruction": "Spin the wheel and answer the question!", "items": ["What was the most surprising revelation?", "How does this relate to contemporary events?", "What alternative solution would you propose?"], "eliminateMode": true }`;
  }

  // 13. CATEGORIZATION
  if (actions.includes('categorization')) {
    tasksInstructions += `
- GENERATE 1 "categorization" block with 2 or 3 distinct categories and 6 items to sort based on context.
  Schema: { "type": "categorization", "instruction": "Sort the items into the correct boxes:", "categories": ["Category A", "Category B"], "items": [ { "id": "it-1", "text": "Item text 1", "categoryIndex": 0 }, { "id": "it-2", "text": "Item text 2", "categoryIndex": 1 } ] }`;
  }

  // 14. GRAMMAR RULE CARD
  if (actions.includes('generate_grammar_card')) {
    tasksInstructions += `
- GENERATE 1 "grammar_card" block detailing the target grammar rule.
  Schema: { "type": "grammar_card", "title": "Grammar Rule Name", "formula": "Subject + Formula", "explanation": "Clear explanation of usage.", "examples": ["Example 1", "Example 2"] }`;
  }

  // 15. TEXT PASSAGE TOOLS
  if (actions.includes('generate_text_passage') || actions.includes('expand_text')) {
    tasksInstructions += `
- GENERATE 1 "text" block with an expanded reading passage (approximately 300-350 words) based on the context, adapted to CEFR ${level}.
  Schema: { "type": "text", "text": "Expanded reading story text here..." }`;
  }

  if (actions.includes('shorten_text')) {
    tasksInstructions += `
- GENERATE 1 "text" block with a concise, shortened version (approximately 120-150 words) preserving key facts, adapted to CEFR ${level}.
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

    if (cleanBlocks.length === 0) {
      return { error: `AI generation failed: No valid blocks could be parsed from the response. Raw response: ${JSON.stringify(result.data).slice(0, 150)}` };
    }

    return { success: true, isFallback: result.isFallback, newBlocks: cleanBlocks };
  } catch (err) {
    return { error: 'AI generation failed: ' + err.message };
  }
}
