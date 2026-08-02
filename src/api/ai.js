// INDESTRUCTIBLE MULTI-PROVIDER AI SYNERGY ENGINE
// (GROQ [Llama 3.3 / DeepSeek R1] -> OPENROUTER [Qwen 2.5 / DeepSeek] -> GEMINI -> WORKERS AI -> LOCAL)

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

// ULTRA-RESILIENT JSON PARSER WITH AUTO-REPAIR
export function cleanAndParseJson(rawText, topic = '', level = 'B1') {
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
  
  // TIER 1: GROQ API (Llama 3.3 70B & DeepSeek R1 70B - Fast 14.4k RPD)
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
          if (parsed) {
            console.log(`Generated using Groq model: ${model}`);
            return parsed;
          }
        } else {
          console.warn(`Groq model ${model} HTTP status: ${res.status}`);
        }
      } catch (e) {
        console.warn(`Groq call failed for ${model}:`, e.message);
      }
    }
  }

  // TIER 2: OPENROUTER API (DeepSeek R1 Free & Qwen 2.5 72B Free)
  if (env.OPENROUTER_API_KEY && env.OPENROUTER_API_KEY.trim().length > 5) {
    const freeModels = [
      'deepseek/deepseek-r1:free',
      'qwen/qwen-2.5-72b-instruct:free',
      'meta-llama/llama-3.3-70b-instruct:free'
    ];

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
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userContent }
            ]
          })
        });

        if (res.ok) {
          const data = await res.json();
          const content = data?.choices?.[0]?.message?.content;
          const parsed = cleanAndParseJson(content, topic, level);
          if (parsed) {
            console.log(`Generated using OpenRouter model: ${model}`);
            return parsed;
          }
        }
      } catch (e) {
        console.warn(`OpenRouter model ${model} failed:`, e.message);
      }
    }
  }

  // TIER 3: GEMINI API (SKIP INSTANTLY ON 429 RATE LIMIT)
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
        if (gParsed) {
          console.log('Generated using Gemini 1.5 Flash');
          return gParsed;
        }
      } else if (gRes.status === 429) {
        console.warn('Gemini 429 Rate Limit hit. Bypassing Gemini to Workers AI.');
      }
    } catch (eG) {
      console.warn('Gemini API call failed:', eG.message);
    }
  }

  // TIER 4: CLOUDFLARE WORKERS AI (NATIVE DIRECT FALLBACK)
  if (env.AI) {
    const cfModels = [
      '@cf/meta/llama-3.1-8b-instruct',
      '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b',
      '@cf/meta/llama-3.1-70b-instruct'
    ];

    for (const cfModel of cfModels) {
      try {
        const resCf = await env.AI.run(cfModel, {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent }
          ],
          temperature: 0.2,
          max_tokens: maxTokens
        });

        const rawCf = resCf?.response || resCf?.choices?.[0]?.message?.content;
        const parsedCf = cleanAndParseJson(rawCf, topic, level);
        if (parsedCf) {
          console.log(`Generated using Workers AI model: ${cfModel}`);
          return parsedCf;
        }
      } catch (eCf) {
        console.warn(`Workers AI model ${cfModel} failed:`, eCf.message);
      }
    }
  }

  // TIER 5: GUARANTEED LOCAL FALLBACK
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
          { id: 'b4', type: 'text', text: `Welcome to this interactive lesson on ${topic}. Read through all parts and complete the interactive exercises.` }
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
        if (data.lyrics && data.lyrics.length > 50) {
          return data.lyrics.slice(0, 3500);
        }
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
          if (apiData.items && apiData.items.length > 0) {
            title = apiData.items[0].snippet?.title || '';
          }
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
        { "type": "text", "text": "Short reading passage..." }
      ]
    },
    {
      "id": "p2",
      "title": "Part 2: Comprehension",
      "blocks": [
        { "type": "multiple_choice", "question": "Question?", "options": ["A", "B", "C"], "correct": 0, "explanation": "Reason" },
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
    return { success: true, jsonText: JSON.stringify(parsedJson, null, 2) };
  } catch (err) {
    return { success: true, jsonText: JSON.stringify(createFallbackLesson(topic, level), null, 2) };
  }
}

export async function transformBlockWithAI(env, payload) {
  const { actions = [], sourceBlock = {}, sourceText = '', targetLength = '250', matchingType = 'synonym', flashcardType = 'russian', level = 'B1' } = payload;
  if (actions.length === 0) return { error: 'Выберите задание.' };

  const cefrRules = CEFR_MATRIX[level] || CEFR_MATRIX['B1'];
  let rawContext = sourceText || sourceBlock.text || sourceBlock.explanation || sourceBlock.transcript || JSON.stringify(sourceBlock);
  const safeContextData = (rawContext || '').replace(/[\r\n]+/g, ' ').replace(/"/g, "'").trim();

  if (actions.includes('generate_text_passage')) {
    const textSystemPrompt = `Write a reading passage on the topic for CEFR Level ${level} (~${targetLength} words). Return JSON object with "text": { "text": "story..." }`;
    try {
      const parsedBlocks = await runAiPipeline(env, textSystemPrompt, `Topic: ${safeContextData}`, 3000);
      const textVal = parsedBlocks.text || (Array.isArray(parsedBlocks) ? parsedBlocks[0]?.text : JSON.stringify(parsedBlocks));
      return { success: true, newBlocks: [{ type: 'text', text: textVal }] };
    } catch (e) {
      return { error: 'Failed: ' + e.message };
    }
  }

  if (actions.includes('generate_grammar_card')) {
    const grammarSystemPrompt = `Generate a Grammar Card object for ${level}: [{ "type": "grammar_card", "title": "${safeContextData}", "formula": "...", "explanation": "...", "examples": ["..."] }]`;
    try {
      const fallbackParsed = await runAiPipeline(env, grammarSystemPrompt, `Topic: ${safeContextData}`, 1500);
      return { success: true, newBlocks: Array.isArray(fallbackParsed) ? fallbackParsed : [fallbackParsed] };
    } catch (e) {
      return { error: 'Failed: ' + e.message };
    }
  }

  let taskInstructions = '';
  if (actions.includes('listening')) taskInstructions += `- Generate 1 "multiple_choice" block with 4 questions.\n`;
  if (actions.includes('flashcards')) taskInstructions += `- Generate 1 "flashcards" block with 6 target vocabulary words.\n`;
  if (actions.includes('true_false')) taskInstructions += `- Generate 1 "multiple_choice" block with 4 True/False questions.\n`;
  if (actions.includes('gap_fill')) taskInstructions += `- Generate 1 "gap_fill" block with 4 sentences containing [word].\n`;
  if (actions.includes('matching')) taskInstructions += `- Generate 1 "matching" block with 6 pairs.\n`;
  if (actions.includes('discussion')) taskInstructions += `- Generate 1 "open_input" block with 3 questions.\n`;

  const systemPrompt = `Generate requested exercise block(s) for CEFR Level ${level} based on context. Return JSON Array.\n${taskInstructions}`;

  try {
    const parsedBlocks = await runAiPipeline(env, systemPrompt, `Context: ${safeContextData}`, 2500);
    return { success: true, newBlocks: Array.isArray(parsedBlocks) ? parsedBlocks : [parsedBlocks] };
  } catch (err) {
    return { error: 'AI transformation failed: ' + err.message };
  }
}
