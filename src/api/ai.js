// FULL CELTA/DELTA METHODOLOGY PIPELINE & BULLETPROOF MULTI-TIER AI CASCADE

export const CEFR_MATRIX = {
  'A1': 'Target Grammar: Present Simple, to be, there is/are, will/going to, Past Simple of be, articles (a/an/the), personal pronouns, modals (can/must). Target Vocabulary: Basic A1 core everyday vocabulary. Sentence Structure: Short, direct sentences (5-10 words).',
  'A2': 'Target Grammar: Past Simple (regular/irregular), Present Continuous for future, Comparatives/Superlatives, some/any/much/many, modals (should/have to), want/like + to-infinitive or gerund. Target Vocabulary: Daily routines, hobbies, travel, shopping. Sentence Structure: Simple compound sentences with and/but/because.',
  'B1': 'Target Grammar: Past Continuous, Past Perfect, Conditionals 1 & 2, Passive Voice, Reported Speech, Relative Clauses (who/which/that), Present Perfect vs Past Simple, will/should/might. Target Vocabulary: Intermediate work, feelings, environment, education, media. Sentence Structure: Varied clause structures.',
  'B2': 'Target Grammar: Conditionals 3 & Mixed Conditionals, Future Perfect & Future Continuous, Past Modals (should have/could have), Non-defining relative clauses, wish/if only, Gerund vs Infinitive nuances. Target Vocabulary: Upper-intermediate abstract concepts, business, tech, subtle idioms. Sentence Structure: Complex with linking devices (however, despite, nevertheless).',
  'C1': 'Target Grammar: Inversion (Not only did..., Hardly had I...), Inversion in Conditionals (Had I known...), Cleft sentences (It was X that...), Advanced Passive, Past Perfect Continuous, Advanced Past Modals. Target Vocabulary: Advanced C1 academic, sophisticated idioms, subtle nuances. Sentence Structure: Sophisticated, highly varied narrative prose.'
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

// ULTRA-RESILIENT JSON PARSER WITH AUTO-REPAIR FOR TRUNCATED LLM OUTPUTS
export function cleanAndParseJson(rawText) {
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

  // Attempt 1: Standard JSON parse
  try {
    return JSON.parse(clean);
  } catch (e1) {
    // Attempt 2: Escape unescaped raw newlines & control chars inside quotes
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
      // Attempt 3: Structural bracket & string termination repair
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

      // Strip trailing commas before closing brackets
      repaired = repaired.replace(/,\s*([\}\]])/g, '$1');

      try {
        return JSON.parse(repaired);
      } catch (e3) {
        console.warn('JSON Repair failed:', e3.message);
        return null;
      }
    }
  }
}

// BULLETPROOF CASCADE AI PIPELINE (GEMINI API REST -> WORKERS AI ACTIVE MODELS)
export async function runAiPipeline(env, systemPrompt, userContent, maxTokens = 3800) {
  // 1. TIER 1: GOOGLE AI STUDIO (GEMINI REST API WITH QUERY PARAM AUTH & SYSTEM INSTRUCTION)
  if (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim().length > 5) {
    const apiKey = env.GEMINI_API_KEY.trim();
    const geminiModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

    for (const gModel of geminiModels) {
      try {
        const gUrl = `https://generativelanguage.googleapis.com/v1beta/models/${gModel}:generateContent?key=${apiKey}`;
        const gRes = await fetch(gUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemPrompt }]
            },
            contents: [
              {
                role: 'user',
                parts: [{ text: userContent }]
              }
            ],
            generationConfig: { 
              responseMimeType: 'application/json', 
              temperature: 0.2,
              maxOutputTokens: maxTokens
            }
          })
        });

        if (gRes.ok) {
          const gData = await gRes.json();
          const gRawText = gData?.candidates?.[0]?.content?.parts?.[0]?.text;
          const gParsed = cleanAndParseJson(gRawText);
          if (gParsed) {
            console.log(`Successfully generated lesson using Gemini model: ${gModel}`);
            return gParsed;
          }
        } else {
          const errText = await gRes.text();
          console.warn(`Gemini ${gModel} returned HTTP ${gRes.status}:`, errText.substring(0, 200));
        }
      } catch (eG) {
        console.warn(`Gemini API call for ${gModel} failed:`, eG.message);
      }
    }
  }

  // 2. TIER 2: CLOUDFLARE WORKERS AI ACTIVE VERIFIED MODELS
  if (env.AI) {
    const cfModels = [
      '@cf/meta/llama-3.1-8b-instruct',
      '@cf/meta/llama-3.1-70b-instruct',
      '@cf/meta/llama-3-8b-instruct',
      '@cf/mistralai/mistral-7b-instruct-v0.2'
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
        const parsedCf = cleanAndParseJson(rawCf);
        if (parsedCf) {
          console.log(`Successfully generated lesson using Workers AI model: ${cfModel}`);
          return parsedCf;
        }
      } catch (eCf) {
        console.warn(`Workers AI model ${cfModel} failed:`, eCf.message);
      }
    }
  }

  throw new Error('AI Generation failed on all cascade tiers. Please check your Gemini API key or try again.');
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

// HIGH-PERFORMANCE NATIVE YOUTUBE TRANSCRIPT SCRAPER
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

// FULL 5-PAGE CELTA/DELTA PPP LESSON GENERATOR
export async function generateFullLessonWithAI(env, payload) {
  const { text = '', level = 'B1', topic = 'General English' } = payload;
  const cefrRules = CEFR_MATRIX[level] || CEFR_MATRIX['B1'];

  const systemPrompt = `You are a world-class CELTA/DELTA ELT Methodologist. Generate a complete 5-PAGE interactive English lesson in JSON strictly matching CEFR level ${level}.

STRICT BLOCK TYPE NAMES (USE ONLY THESE EXACT KEYS):
- "heading": { "type": "heading", "level": 1, "text": "Title" }
- "text": { "type": "text", "text": "Full reading passage story..." }
- "open_input": { "type": "open_input", "prompt": "Question text?" }
- "flashcards": { "type": "flashcards", "title": "Vocab", "cards": [ { "front": "word", "back": "translation", "example": "sentence" } ] }
- "multiple_choice": { "type": "multiple_choice", "question": "Question?", "options": ["A", "B", "C"], "correct": 0, "explanation": "Reason" }
- "matching": { "type": "matching", "instruction": "Match pairs:", "pairs": [ { "left": "word", "right": "match" } ] }
- "grammar_card": { "type": "grammar_card", "title": "Rule Title", "formula": "Formula", "explanation": "Explanation", "examples": ["Ex 1"] }
- "gap_fill_bank": { "type": "gap_fill_bank", "instruction": "Fill gaps:", "text": "Story with [answers] in brackets.", "distractors": ["fake1"] }
- "gap_fill": { "type": "gap_fill", "instruction": "Transform:", "text": "Sentence 1 with [answer].\\nSentence 2 with [answer].", "answers": ["answer1", "answer2"] }

STRICT QUOTE RULE:
- Use single quotes (') for quotes or speech inside text values. NO unescaped double quotes!
- 100% Target Language Policy: All instructions, questions, texts MUST be in English.
- CEFR Level ${level} Target: ${cefrRules}

RETURN ONLY VALID JSON MATCHING THIS EXACT TEMPLATE:
{
  "title": "${topic}",
  "level": "${level}",
  "topic": "${topic}",
  "description": "Interactive CEFR ${level} Lesson on ${topic}",
  "pages": [
    {
      "id": "p1",
      "title": "Part 1: Lead-in & Reading",
      "blocks": [
        { "type": "heading", "level": 1, "text": "${topic}" },
        { "type": "open_input", "prompt": "What do you know about ${topic}?" },
        { "type": "flashcards", "title": "Key Vocabulary", "cards": [ { "front": "word", "back": "translation", "example": "sentence" } ] },
        { "type": "text", "text": "Write a complete 180-word reading passage about ${topic} for CEFR Level ${level}..." }
      ]
    },
    {
      "id": "p2",
      "title": "Part 2: Text Comprehension",
      "blocks": [
        { "type": "multiple_choice", "question": "Main idea of the reading passage?", "options": ["Option A", "Option B", "Option C"], "correct": 0, "explanation": "Explanation" },
        { "type": "matching", "instruction": "Match facts from the reading passage:", "pairs": [ { "left": "Fact", "right": "Detail" } ] },
        { "type": "multiple_choice", "question": "True or False question?", "options": ["True", "False", "Not Stated"], "correct": 0, "explanation": "Explanation" }
      ]
    },
    {
      "id": "p3",
      "title": "Part 3: Grammar Presentation",
      "blocks": [
        { "type": "grammar_card", "title": "Target Grammar Rule for ${level}", "formula": "Formula", "explanation": "Explanation", "examples": ["Example 1"] },
        { "type": "matching", "instruction": "Match collocations:", "pairs": [ { "left": "Word", "right": "Preposition" } ] }
      ]
    },
    {
      "id": "p4",
      "title": "Part 4: Practice & Transformation",
      "blocks": [
        { "type": "gap_fill_bank", "instruction": "Fill gaps:", "text": "Paragraph with [answers] in brackets.", "distractors": ["extra1"] },
        { "type": "gap_fill", "instruction": "Complete the sentences:", "text": "1. First sentence with [word1].\\n2. Second sentence with [word2].", "answers": ["word1", "word2"] }
      ]
    },
    {
      "id": "p5",
      "title": "Part 5: Production & Homework",
      "blocks": [
        { "type": "open_input", "prompt": "Speaking discussion question on ${topic}?" },
        { "type": "open_input", "prompt": "Writing / roleplay prompt?" },
        { "type": "gap_fill", "instruction": "Homework practice:", "text": "1. Homework sentence [word1].\\n2. Homework sentence [word2].", "answers": ["word1", "word2"] }
      ]
    }
  ]
}`;

  const userPrompt = `Topic: ${topic}\nMaterial/Context: ${text || 'Create a topic-based story.'}`;

  try {
    const parsedJson = await runAiPipeline(env, systemPrompt, userPrompt, 3500);
    return { success: true, jsonText: JSON.stringify(parsedJson, null, 2) };
  } catch (err) {
    return { error: 'AI generation error: ' + err.message };
  }
}

// CONTEXTUAL SINGLE BLOCK ASSISTANT
export async function transformBlockWithAI(env, payload) {
  const {
    actions = [],
    sourceBlock = {},
    sourceText = '',
    targetLength = '250',
    matchingType = 'synonym',
    flashcardType = 'russian',
    level = 'B1'
  } = payload;

  if (actions.length === 0) {
    return { error: 'Выберите хотя бы одно задание.' };
  }

  const cefrRules = CEFR_MATRIX[level] || CEFR_MATRIX['B1'];

  let rawContext = '';
  if (sourceBlock.type === 'grammar_card') {
    rawContext = `Grammar Topic: ${sourceBlock.title || ''} | Formula: ${sourceBlock.formula || ''} | Explanation: ${sourceBlock.explanation || ''} | Examples: ${(sourceBlock.examples || []).join('; ')}`;
  } else if (sourceBlock.type === 'video' && sourceBlock.url) {
    const ytData = await fetchYouTubeTranscriptNative(sourceBlock.url, env);
    if (ytData && ytData.transcript) {
      rawContext = `Video Title: ${ytData.title || sourceBlock.title}\nTranscript: ${ytData.transcript}`;
    } else {
      rawContext = `Video Title: ${sourceBlock.title || 'Educational Video'}`;
    }
  } else {
    rawContext = sourceText || sourceBlock.text || sourceBlock.explanation || sourceBlock.transcript || JSON.stringify(sourceBlock);
  }

  const safeContextData = (rawContext || '').replace(/[\r\n]+/g, ' ').replace(/"/g, "'").trim();

  if (actions.includes('generate_text_passage')) {
    const textSystemPrompt = `You are a master ELT Materials Writer. Write an engaging, educational reading story/passage on the topic provided for CEFR Level ${level}.

Target Length: ~${targetLength} words.
CEFR Level ${level} Target: ${cefrRules}
STRICT QUOTE RULE: Use single quotes (') for quotes or speech inside text.
RETURN ONLY A VALID JSON ARRAY CONTAINING A SINGLE TEXT BLOCK OBJECT:
[
  {
    "type": "text",
    "text": "Full educational reading passage story written strictly for CEFR Level ${level}..."
  }
]`;

    try {
      const parsedBlocks = await runAiPipeline(env, textSystemPrompt, `Topic/Hint for Reading Text: ${safeContextData}`, 3000);
      const newStoryText = Array.isArray(parsedBlocks) ? (parsedBlocks[0]?.text || JSON.stringify(parsedBlocks[0])) : (parsedBlocks.text || JSON.stringify(parsedBlocks));
      return { success: true, newBlocks: [{ type: 'text', text: newStoryText }] };
    } catch (e) {
      return { error: 'Failed to generate text passage: ' + e.message };
    }
  }

  if (actions.includes('generate_grammar_card')) {
    const grammarSystemPrompt = `You are a master ELT Methodologist. Generate a comprehensive Grammar Presentation Card for the grammar topic provided for CEFR Level ${level}.

CEFR Level ${level} Target: ${cefrRules}
STRICT QUOTE RULE: Use single quotes (') for quotes or speech inside text strings.
RETURN ONLY A VALID JSON ARRAY CONTAINING A SINGLE GRAMMAR_CARD BLOCK OBJECT:
[
  {
    "type": "grammar_card",
    "title": "${safeContextData}",
    "formula": "Rule Formula (e.g. Subject + had + V3 + would have + V3)",
    "explanation": "Clear CEFR Level ${level} explanation of when and how to use this grammar rule.",
    "examples": [ "Example sentence 1.", "Example sentence 2.", "Example sentence 3." ]
  }
]`;

    try {
      const fallbackParsed = await runAiPipeline(env, grammarSystemPrompt, `Grammar Topic Name: ${safeContextData}`, 1500);
      return { success: true, newBlocks: Array.isArray(fallbackParsed) ? fallbackParsed : [fallbackParsed] };
    } catch (e) {
      return { error: 'Failed to generate grammar card: ' + e.message };
    }
  }

  if (actions.includes('expand_text') || actions.includes('shorten_text') || actions.includes('refine_level')) {
    let textInstruction = 'Expand this reading passage into a richer, longer, more detailed story (350-450 words) with CEFR Level ' + level + ' vocabulary.';
    
    if (actions.includes('shorten_text')) {
      textInstruction = 'Shorten this reading passage into a concise summary (~150 words) matching CEFR Level ' + level + '.';
    } else if (actions.includes('refine_level')) {
      textInstruction = 'Rewrite this reading passage strictly adapting grammar and vocabulary to CEFR Level ' + level + '.';
    }

    const textSystemPrompt = `You are a master ELT Materials Writer. ${textInstruction}\nCEFR Level ${level} Target: ${cefrRules}\nSTRICT QUOTE RULE: Use single quotes (') for quotes inside text.\nRETURN ONLY A VALID JSON OBJECT WITH "text":\n{ "text": "Full rewritten reading story text here..." }`;

    try {
      const parsedObj = await runAiPipeline(env, textSystemPrompt, `Original Text:\n${safeContextData}`, 3000);
      const newStoryText = parsedObj.text || (Array.isArray(parsedObj) ? parsedObj[0]?.text : JSON.stringify(parsedObj));
      return { success: true, newBlocks: [{ type: 'text', text: newStoryText }] };
    } catch (e) {
      return { error: 'Failed to refine text: ' + e.message };
    }
  }

  let taskInstructions = '';
  if (actions.includes('listening')) {
    taskInstructions += `- Generate 1 "multiple_choice" block with 4 comprehension questions based on context. Template:\n[ { "type": "multiple_choice", "question": "Question 1?", "options": ["Option A", "Option B", "Option C"], "correct": 0, "explanation": "Reason" } ]\n`;
  }
  if (actions.includes('flashcards')) {
    taskInstructions += `- Generate 1 "flashcards" block with 6 target vocabulary words from context. Template:\n[ { "type": "flashcards", "title": "Key Vocabulary", "cards": [ { "front": "word", "back": "${flashcardType === 'russian' ? 'Russian translation' : 'English definition'}", "example": "sentence" } ] } ]\n`;
  }
  if (actions.includes('true_false')) {
    taskInstructions += `- Generate 1 "multiple_choice" block with 4 True/False questions based on context. Template:\n[ { "type": "multiple_choice", "question": "True or False?", "options": ["True", "False", "Not Stated"], "correct": 0, "explanation": "Reason" } ]\n`;
  }
  if (actions.includes('gap_fill') || actions.includes('grammar_transform')) {
    taskInstructions += `- Generate 1 "gap_fill" block with 4 separate sentences, separated by newlines \\n, putting target words in brackets [word]. Template:\n[ { "type": "gap_fill", "instruction": "Complete the sentences using correct form:", "text": "1. Sentence one with [word1].\\n2. Sentence two with [word2].\\n3. Sentence three with [word3].", "answers": ["word1", "word2", "word3"] } ]\n`;
  }
  if (actions.includes('gap_fill_bank')) {
    taskInstructions += `- Generate 1 "gap_fill_bank" block with text containing [answers] in brackets and 3 distractors.\n`;
  }
  if (actions.includes('matching')) {
    taskInstructions += `- Generate 1 "matching" block with 6 pairs [{ left, right }] configured as "${matchingType}".\n`;
  }
  if (actions.includes('discussion')) {
    taskInstructions += `- Generate 1 "open_input" block with 3 speaking discussion prompts.\n`;
  }
  if (actions.includes('grammar_quiz')) {
    taskInstructions += `- Generate 1 "multiple_choice" block with 4 questions testing the grammar rule: "${safeContextData}". Template:\n[ { "type": "multiple_choice", "question": "Which sentence correctly uses the grammar rule?", "options": ["Option A", "Option B", "Option C"], "correct": 0, "explanation": "Reason" } ]\n`;
  }
  if (actions.includes('fill_this_block')) {
    taskInstructions += `- Generate 1 100% full, non-empty block of type "${sourceBlock.type}".\n`;
  }

  const systemPrompt = `You are an expert ELT Materials Designer. Your task is to generate ONLY the requested exercise block(s) for CEFR Level ${level} based DIRECTLY on the provided source context.

STRICT RULES:
1. ONLY generate the specific block(s) requested below. Do NOT generate any unrequested extra blocks!
2. All exercise items MUST be 100% full and populated with rich English content based on context.
3. For "gap_fill" blocks, write all sentences inside the single "text" property separated by newlines \\n with target words in brackets [word].
4. Use single quotes (') inside string values. No unescaped double quotes!
5. 100% English target language policy (except Russian translations if explicitly requested).
6. CEFR Level ${level} Target: ${cefrRules}

REQUESTED EXERCISE TASK(S) TO GENERATE:
${taskInstructions}

RETURN ONLY A VALID JSON ARRAY OF THE REQUESTED BLOCK OBJECT(S) (e.g. gap_fill, multiple_choice, flashcards, matching, open_input):
[ { "type": "gap_fill", "instruction": "...", "text": "...", "answers": [...] } ]`;

  const userContent = `CEFR Level: ${level}\nSource Context:\n${safeContextData}`;

  try {
    const parsedBlocks = await runAiPipeline(env, systemPrompt, userContent, 2500);
    return { success: true, newBlocks: Array.isArray(parsedBlocks) ? parsedBlocks : [parsedBlocks] };
  } catch (err) {
    return { error: 'AI transformation failed: ' + err.message };
  }
}
