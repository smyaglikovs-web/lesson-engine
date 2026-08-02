// INDESTRUCTIBLE MULTI-PROVIDER AI SYNERGY ENGINE WITH STRICT BLOCK TYPE LOCKING

export const CEFR_MATRIX = {
  'A1': 'Target Grammar: Present Simple, to be, there is/are, articles. Target Vocabulary: Everyday basics. Sentences: Short (5-10 words).',
  'A2': 'Target Grammar: Past Simple, Present Continuous for future, Comparatives. Target Vocabulary: Daily routines, travel, hobbies.',
  'B1': 'Target Grammar: Past Continuous, Conditionals 1 & 2, Passive Voice, Present Perfect. Target Vocabulary: Work, feelings, media.',
  'B2': 'Target Grammar: Conditionals 3, Future Perfect, Past Modals, Wish/If only. Target Vocabulary: Abstract concepts, idioms.',
  'C1': 'Target Grammar: Inversion, Cleft sentences, Advanced Passive, Advanced Modals. Target Vocabulary: Academic, subtle nuances.'
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

// SANITIZES & ENFORCES PRIMITIVES (PREVENTS [object Object])
export function sanitizeBlockStructure(b) {
  if (!b || typeof b !== 'object') return [b];

  let type = String(b.type || 'text').toLowerCase().trim();
  if (type === 'header' || type === 'title') type = 'heading';
  if (type === 'paragraph' || type === 'reading' || type === 'article') type = 'text';
  if (type === 'quiz' || type === 'question' || type === 'true_false') type = 'multiple_choice';
  if (type === 'vocab' || type === 'words') type = 'flashcards';
  if (type === 'rule' || type === 'grammar') type = 'grammar_card';

  b.type = type;

  if (b.type === 'multiple_choice' && Array.isArray(b.options)) {
    let statementObjects = [];

    b.options.forEach(opt => {
      let parsedOpt = null;
      if (typeof opt === 'string' && opt.trim().startsWith('{')) {
        try { parsedOpt = JSON.parse(opt); } catch(e) {}
      } else if (typeof opt === 'object' && opt !== null) {
        parsedOpt = opt;
      }
      if (parsedOpt && (parsedOpt.statement || parsedOpt.question)) {
        statementObjects.push(parsedOpt);
      }
    });

    if (statementObjects.length > 0) {
      return statementObjects.map((sObj, idx) => ({
        type: 'multiple_choice',
        id: `${b.id || 'tf'}-${idx}-${Date.now()}`,
        question: sObj.statement || sObj.question || `Statement ${idx + 1}`,
        options: Array.isArray(sObj.answers) ? sObj.answers : (Array.isArray(sObj.options) ? sObj.options : ['True', 'False']),
        correct: typeof sObj.correct === 'number' ? sObj.correct : 0,
        explanation: sObj.explanation || ''
      }));
    }

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

  return [b];
}

// ULTRA-RESILIENT JSON PARSER WITH AUTO-REPAIR
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

// MULTI-PROVIDER AI SYNERGY CASCADE
export async function runAiPipeline(env, systemPrompt, userContent, maxTokens = 3500, topic = '', level = 'B1') {
  
  // TIER 1: GROQ API
  if (env.GROQ_API_KEY && env.GROQ_API_KEY.trim().length > 5) {
    const groqKey = env.GROQ_API_KEY.trim();
    const groqModels = ['llama-3.3-70b-versatile', 'deepseek-r1-distill-llama-70b', 'llama-3.1-8b-instant'];

    for (const model of groqModels) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
            temperature: 0.2,
            response_format: { type: 'json_object' }
          })
        });

        if (res.ok) {
          const data = await res.json();
          const content = data?.choices?.[0]?.message?.content;
          const parsed = cleanAndParseJson(content, topic, level);
          if (parsed) return parsed;
        }
      } catch (e) {}
    }
  }

  // TIER 2: OPENROUTER API
  if (env.OPENROUTER_API_KEY && env.OPENROUTER_API_KEY.trim().length > 5) {
    const freeModels = ['deepseek/deepseek-r1:free', 'qwen/qwen-2.5-72b-instruct:free', 'meta-llama/llama-3.3-70b-instruct:free'];
    for (const model of freeModels) {
      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.OPENROUTER_API_KEY.trim()}`
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userContent }]
          })
        });

        if (res.ok) {
          const data = await res.json();
          const content = data?.choices?.[0]?.message?.content;
          const parsed = cleanAndParseJson(content, topic, level);
          if (parsed) return parsed;
        }
      } catch (e) {}
    }
  }

  // TIER 3: GEMINI API
  if (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim().length > 5) {
    const apiKey = env.GEMINI_API_KEY.trim();
    const gUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    try {
      const gRes = await fetch(gUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: userContent }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
        })
      });

      if (gRes.ok) {
        const gData = await gRes.json();
        const gText = gData?.candidates?.[0]?.content?.parts?.[0]?.text;
        const gParsed = cleanAndParseJson(gText, topic, level);
        if (gParsed) return gParsed;
      }
    } catch (eG) {}
  }

  // TIER 4: WORKERS AI
  if (env.AI) {
    const cfModels = ['@cf/meta/llama-3.1-8b-instruct', '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b', '@cf/meta/llama-3.1-70b-instruct'];
    for (const cfModel of cfModels) {
      try {
        const resCf = await env.AI.run(cfModel, {
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userContent }],
          temperature: 0.2,
          max_tokens: maxTokens
        });

        const rawCf = resCf?.response || resCf?.choices?.[0]?.message?.content;
        const parsedCf = cleanAndParseJson(rawCf, topic, level);
        if (parsedCf) return parsedCf;
      } catch (eCf) {}
    }
  }

  return createFallbackLesson(topic, level);
}

function createFallbackLesson(topic = 'General Practice', level = 'B1') {
  return {
    title: `${topic} (${level})`,
    level: level,
    topic: topic,
    description: `Interactive ${level} Practice Lesson on ${topic}`,
    pages: [
      {
        id: 'p1',
        title: 'Part 1: Vocabulary & Lead-in',
        blocks: [
          { id: 'b1', type: 'heading', level: 1, text: `${topic} Practice` },
          { id: 'b2', type: 'open_input', prompt: `What do you know or think about ${topic}?` },
          { id: 'b3', type: 'flashcards', title: 'Target Vocabulary', cards: [
            { front: 'Key Concept', back: 'Основное понятие', example: `Understanding ${topic} is important.` },
            { front: 'Practice', back: 'Практика', example: 'We need to practice every day.' }
          ]},
          { id: 'b4', type: 'text', text: `${topic} is a widely discussed subject in English learning. Studying this topic helps improve reading comprehension, vocabulary retention, and natural conversation skills. In this lesson, we will explore key concepts, practice relevant grammar structures, and apply them in interactive tasks.` }
        ]
      },
      {
        id: 'p2',
        title: 'Part 2: Comprehension & Grammar',
        blocks: [
          { id: 'b5', type: 'grammar_card', title: `Grammar Focus for ${level}`, formula: 'Subject + Verb + Object', explanation: `Target structures used when talking about ${topic}.`, examples: [`I am studying ${topic} today.`] },
          { id: 'b6', type: 'multiple_choice', question: `Which option best relates to ${topic}?`, options: ['Option A', 'Option B', 'Option C'], correct: 0, explanation: 'Option A is correct based on context.' }
        ]
      },
      {
        id: 'p3',
        title: 'Part 3: Production & Practice',
        blocks: [
          { id: 'b7', type: 'open_input', prompt: `Write 3 sentences about your personal experience with ${topic}:` },
          { id: 'b8', type: 'gap_fill', instruction: 'Complete the sentence:', text: `I am studying [${topic}] today.`, answers: [topic] }
        ]
      }
    ]
  };
}

async function fetchLyricsForSong(title = '') {
  try {
    const clean = title.replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').replace(/official video/gi, '').replace(/music video/gi, '').replace(/official/gi, '').trim();
    const parts = clean.split('-');
    if (parts.length >= 2) {
      const artist = parts[0].trim();
      const song = parts[1].trim();
      const res = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(song)}`, { headers: BROWSER_HEADERS });
      if (res.ok) {
        const data = await res.json();
        if (data.lyrics && data.lyrics.length > 50) return data.lyrics.slice(0, 3500);
      }
    }
  } catch(e) {}
  return null;
}

export async function fetchYouTubeTranscriptNative(videoUrl, env = {}) {
  try {
    const videoId = getYouTubeId(videoUrl);
    if (!videoId) return null;

    let title = '';
    let transcriptText = '';
    const apiKey = env.YOUTUBE_API_KEY || '';

    if (apiKey) {
      try {
        const apiRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`);
        if (apiRes.ok) {
          const apiData = await apiRes.json();
          if (apiData.items && apiData.items.length > 0) title = apiData.items[0].snippet?.title || '';
        }
      } catch(e) {}
    }

    if (!title) {
      try {
        const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`, { headers: BROWSER_HEADERS });
        if (oembedRes.ok) {
          const odata = await oembedRes.json();
          title = odata.title || '';
        }
      } catch(e) {}
    }

    try {
      const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, { headers: BROWSER_HEADERS });
      if (pageRes.ok) {
        const html = await pageRes.text();
        const captionRegex = /"captionTracks":\s*(\[.*?\])/;
        const match = html.match(captionRegex);

        if (match && match[1]) {
          const captionTracks = JSON.parse(match[1]);
          const track = captionTracks.find(t => t.languageCode && t.languageCode.startsWith('en')) || captionTracks[0];

          if (track && track.baseUrl) {
            const subRes = await fetch(track.baseUrl, { headers: BROWSER_HEADERS });
            if (subRes.ok) {
              const xml = await subRes.text();
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
              if (fullText.length > 50) transcriptText = fullText.slice(0, 3500);
            }
          }
        }
      }
    } catch(e) {}

    if (!transcriptText) {
      const timedTextUrls = [
        `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&kind=asr`,
        `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en`,
        `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en-US&kind=asr`
      ];

      for (const ttUrl of timedTextUrls) {
        if (transcriptText) break;
        try {
          const res = await fetch(ttUrl, { headers: BROWSER_HEADERS });
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
                  .trim();
                if (decodedText) fullText += decodedText + ' ';
              }
              fullText = fullText.replace(/\s+/g, ' ').trim();
              if (fullText.length > 50) transcriptText = fullText.slice(0, 3500);
            }
          }
        } catch(e) {}
      }
    }

    if (!transcriptText && title) {
      const songLyrics = await fetchLyricsForSong(title);
      if (songLyrics) transcriptText = songLyrics;
    }

    return { title, transcript: transcriptText, videoId };
  } catch (e) {
    return null;
  }
}

export async function generateFullLessonWithAI(env, payload) {
  const { text = '', level = 'B1', topic = 'General English' } = payload;
  const cefrRules = CEFR_MATRIX[level] || CEFR_MATRIX['B1'];

  const systemPrompt = `You are a CELTA ELT Methodologist. Generate a 5-PAGE interactive English lesson in JSON strictly matching CEFR level ${level}.

BLOCK KEYS: "heading", "text", "open_input", "flashcards", "multiple_choice", "matching", "grammar_card", "gap_fill_bank", "gap_fill".

MANDATORY READING TEXT RULE:
- On Page 1, write a complete, rich, 220-word educational reading story passage matching CEFR Level ${level}. DO NOT write short 1-sentence or 2-sentence summaries!

RETURN ONLY VALID JSON MATCHING THIS TEMPLATE:
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
        { "type": "open_input", "prompt": "What do you know about ${topic}?" },
        { "type": "flashcards", "title": "Vocabulary", "cards": [ { "front": "word", "back": "translation", "example": "sentence" } ] },
        { "type": "text", "text": "Write a full 220-word educational story passage about ${topic} strictly for CEFR Level ${level}..." }
      ]
    },
    {
      "id": "p2",
      "title": "Part 2: Comprehension",
      "blocks": [
        { "type": "multiple_choice", "question": "Question?", "options": ["Option A", "Option B", "Option C"], "correct": 0, "explanation": "Reason" },
        { "type": "matching", "instruction": "Match pairs:", "pairs": [ { "left": "Fact", "right": "Detail" } ] }
      ]
    },
    {
      "id": "p3",
      "title": "Part 3: Grammar",
      "blocks": [
        { "type": "grammar_card", "title": "Grammar Rule", "formula": "Formula", "explanation": "Explanation", "examples": ["Example"] }
      ]
    },
    {
      "id": "p4",
      "title": "Part 4: Practice",
      "blocks": [
        { "type": "gap_fill_bank", "instruction": "Fill gaps:", "text": "Paragraph with [answers].", "distractors": ["fake"] },
        { "type": "gap_fill", "instruction": "Complete:", "text": "1. Sentence [word1].", "answers": ["word1"] }
      ]
    },
    {
      "id": "p5",
      "title": "Part 5: Production",
      "blocks": [
        { "type": "open_input", "prompt": "Discussion question?" }
      ]
    }
  ]
}`;

  const userPrompt = `Topic: ${topic}\nMaterial: ${text || 'Create topic story'}`;

  try {
    const parsedJson = await runAiPipeline(env, systemPrompt, userPrompt, 3500, topic, level);
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

// CONTEXTUAL SINGLE BLOCK ASSISTANT WITH STRICT TARGET BLOCK TYPE LOCKING
export async function transformBlockWithAI(env, payload) {
  let { actions = [], sourceBlock = {}, sourceText = '', targetLength = '250', matchingType = 'synonym', flashcardType = 'russian', level = 'B1' } = payload;
  if (actions.length === 0) return { error: 'Выберите задание.' };

  const targetBlockType = String(sourceBlock.type || '').toLowerCase().trim();

  // STRICT TARGET TYPE LOCK: If "fill_this_block" is requested, lock the task to the exact block type!
  if (actions.includes('fill_this_block') && targetBlockType) {
    if (targetBlockType === 'flashcards') actions.push('flashcards');
    else if (targetBlockType === 'multiple_choice') actions.push('listening');
    else if (targetBlockType === 'gap_fill') actions.push('gap_fill');
    else if (targetBlockType === 'gap_fill_bank') actions.push('gap_fill_bank');
    else if (targetBlockType === 'matching') actions.push('matching');
    else if (targetBlockType === 'open_input') actions.push('discussion');
    else if (targetBlockType === 'grammar_card') actions.push('generate_grammar_card');
    else if (targetBlockType === 'text') actions.push('generate_text_passage');
  }

  const cefrRules = CEFR_MATRIX[level] || CEFR_MATRIX['B1'];
  let rawContext = sourceText || sourceBlock.text || sourceBlock.explanation || sourceBlock.transcript || JSON.stringify(sourceBlock);
  const safeContextData = (rawContext || '').replace(/[\r\n]+/g, ' ').replace(/"/g, "'").trim();

  const isGrammarContext = safeContextData.toLowerCase().includes('grammar rule') || sourceBlock.type === 'grammar_card';

  if (actions.includes('generate_text_passage')) {
    const textSystemPrompt = `You are a master ELT Materials Writer. Write an engaging, educational reading story/passage on the topic provided for CEFR Level ${level} (~${targetLength} words).\nCEFR Level ${level} Target: ${cefrRules}\nRETURN ONLY A VALID JSON OBJECT WITH A "text" PROPERTY:\n{ "text": "Full educational reading story passage..." }`;
    try {
      const parsedObj = await runAiPipeline(env, textSystemPrompt, `Topic/Hint: ${safeContextData}`, 3000);
      const textVal = parsedObj.text || (Array.isArray(parsedObj) ? parsedObj[0]?.text : JSON.stringify(parsedObj));
      return { success: true, newBlocks: [{ type: 'text', text: textVal }] };
    } catch (e) {
      return { error: 'Failed to generate text passage: ' + e.message };
    }
  }

  if (actions.includes('generate_grammar_card')) {
    const grammarSystemPrompt = `Generate a Grammar Card JSON array object for CEFR Level ${level}:\n[ { "type": "grammar_card", "title": "${safeContextData}", "formula": "Subject + Verb", "explanation": "Rule explanation", "examples": ["Example 1", "Example 2"] } ]`;
    try {
      const fallbackParsed = await runAiPipeline(env, grammarSystemPrompt, `Grammar Topic: ${safeContextData}`, 1500);
      const rawList = Array.isArray(fallbackParsed) ? fallbackParsed : [fallbackParsed];
      let cleanBlocks = [];
      rawList.forEach(b => {
        const res = sanitizeBlockStructure(b);
        if (Array.isArray(res)) cleanBlocks.push(...res);
        else cleanBlocks.push(res);
      });
      return { success: true, newBlocks: cleanBlocks };
    } catch (e) {
      return { error: 'Failed to generate grammar card: ' + e.message };
    }
  }

  if (actions.includes('expand_text') || actions.includes('shorten_text') || actions.includes('refine_level')) {
    let textInstruction = `Expand this text into a detailed, rich, 350-400 word educational story passage matching CEFR Level ${level}.`;
    if (actions.includes('shorten_text')) textInstruction = `Shorten this text into a concise, clear summary (~150 words) matching CEFR Level ${level}.`;
    else if (actions.includes('refine_level')) textInstruction = `Rewrite this reading text strictly adapting vocabulary and grammar structures to CEFR Level ${level}.`;

    const textSystemPrompt = `You are an expert ELT Materials Writer. ${textInstruction}\nCEFR Level ${level} Target: ${cefrRules}\nRETURN ONLY A VALID JSON OBJECT WITH A "text" PROPERTY:\n{ "text": "Full rewritten reading story text..." }`;

    try {
      const parsedObj = await runAiPipeline(env, textSystemPrompt, `Original Text:\n${safeContextData}`, 3000);
      const newStoryText = parsedObj.text || (Array.isArray(parsedObj) ? parsedObj[0]?.text : JSON.stringify(parsedObj));
      return { success: true, newBlocks: [{ type: 'text', text: newStoryText }] };
    } catch (e) {
      return { error: 'Failed to refine text: ' + e.message };
    }
  }

  let taskInstructions = '';
  if (actions.includes('true_false')) {
    taskInstructions += `- Generate 4-5 separate "multiple_choice" blocks for True/False questions based on context. Each block must have "question" as a statement, and "options": ["True", "False", "Not Stated"].\n`;
  }
  if (actions.includes('listening') || (actions.includes('fill_this_block') && targetBlockType === 'multiple_choice')) {
    taskInstructions += `- Generate 1 "multiple_choice" block with 4 comprehension questions based on context. "options" MUST be an array of simple text strings like ["Option A", "Option B", "Option C"].\n`;
  }
  if (actions.includes('flashcards') || (actions.includes('fill_this_block') && targetBlockType === 'flashcards')) {
    taskInstructions += `- Generate 1 "flashcards" block with 6 target vocabulary words from context.\n`;
  }
  if (actions.includes('gap_fill') || actions.includes('grammar_transform') || (actions.includes('fill_this_block') && targetBlockType === 'gap_fill')) {
    taskInstructions += `- Generate 1 "gap_fill" block with 4 sentences separated by newlines \\n, putting target grammar/words in brackets [word]. Example: "1. Yesterday she [went] to the store.\\n2. They [bought] a car."\n`;
  }
  if (actions.includes('gap_fill_bank') || (actions.includes('fill_this_block') && targetBlockType === 'gap_fill_bank')) {
    taskInstructions += `- Generate 1 "gap_fill_bank" block with text containing [answers] in brackets and 3 distractors.\n`;
  }
  if (actions.includes('matching') || (actions.includes('fill_this_block') && targetBlockType === 'matching')) {
    taskInstructions += `- Generate 1 "matching" block with 6 pairs [{ left, right }] configured as "${matchingType}".\n`;
  }
  if (actions.includes('discussion') || (actions.includes('fill_this_block') && targetBlockType === 'open_input')) {
    taskInstructions += `- Generate 1 "open_input" block with 3 speaking discussion prompts.\n`;
  }
  if (actions.includes('grammar_quiz')) {
    taskInstructions += `- Generate 1 "multiple_choice" block with 4 questions testing the grammar rule: "${safeContextData}". "options" MUST be an array of simple text strings! Write real questions testing correct grammar usage vs distractors!\n`;
  }

  let grammarPromptAddon = '';
  if (isGrammarContext) {
    grammarPromptAddon = `\nCRITICAL RULE FOR GRAMMAR CONTEXT: The source context is a Grammar Presentation Rule (${safeContextData}). ALL generated exercise questions, option choices, and gap-fill sentences MUST specifically test and drill this target grammar rule!
- For "multiple_choice": Write questions asking for the correct grammar form. "options" MUST be an array of simple text strings like ["Option A", "Option B", "Option C"].
- For "gap_fill": Write sentences with bracketed target verb/grammar forms.
- For "matching": Create target verb form or collocation pairs (e.g. Left: "go", Right: "went").
- DO NOT return generic placeholders!`;
  }

  const systemPrompt = `You are an expert ELT Materials Designer. Generate ONLY the requested exercise block(s) for CEFR Level ${level} based on context.${grammarPromptAddon}

STRICT RULE FOR MULTIPLE CHOICE OPTIONS:
- "options" MUST be an array of plain text strings like ["True", "False"] or ["Option A", "Option B", "Option C"]. DO NOT output objects inside "options"!

RETURN VALID JSON ARRAY OF REQUESTED BLOCK OBJECTS:
[ { "type": "${targetBlockType || 'multiple_choice'}", "question": "Statement text...", "options": ["Option A", "Option B", "Option C"], "correct": 0, "explanation": "Reason..." } ]\n${taskInstructions}`;

  try {
    const parsedBlocks = await runAiPipeline(env, systemPrompt, `Source Context:\n${safeContextData}`, 2500);
    const rawList = Array.isArray(parsedBlocks) ? parsedBlocks : [parsedBlocks];
    
    let cleanBlocks = [];
    rawList.forEach(b => {
      const res = sanitizeBlockStructure(b);
      if (Array.isArray(res)) cleanBlocks.push(...res);
      else cleanBlocks.push(res);
    });

    return { success: true, newBlocks: cleanBlocks };
  } catch (err) {
    return { error: 'AI transformation failed: ' + err.message };
  }
}
