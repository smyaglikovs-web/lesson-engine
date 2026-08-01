function getYouTubeId(url = '') {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = String(url).match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9'
};

// Clean WebVTT / Subtitle text into plain sentences
function parseVttToText(vttText = '') {
  return vttText
    .replace(/^WEBVTT.*/gi, '')
    .replace(/Kind:.*/gi, '')
    .replace(/Language:.*/gi, '')
    .replace(/\d{2}:\d{2}:\d{2}\.\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}\.\d{3}.*/g, '')
    .replace(/\d{2}:\d{2}\.\d{3}\s*-->\s*\d{2}:\d{2}\.\d{3}.*/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Resilient JSON extractor for Cloudflare Workers AI LLM outputs
function parseAIJson(responseText) {
  if (!responseText) return null;
  let clean = responseText.trim();
  
  const codeBlockMatch = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch) {
    clean = codeBlockMatch[1].trim();
  } else {
    const firstBrace = clean.search(/[{\[]/);
    const lastBrace = Math.max(clean.lastIndexOf('}'), clean.lastIndexOf(']'));
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      clean = clean.substring(firstBrace, lastBrace + 1);
    }
  }

  try {
    return JSON.parse(clean);
  } catch (err) {
    try {
      let fixed = '';
      let inString = false;
      for (let i = 0; i < clean.length; i++) {
        const c = clean.charAt(i);
        const code = clean.charCodeAt(i);
        if (c === '"' && (i === 0 || clean.charAt(i - 1) !== '\\')) {
          inString = !inString;
          fixed += c;
        } else if (inString && (code === 10 || code === 13)) {
          fixed += '\\n';
        } else {
          fixed += c;
        }
      }
      return JSON.parse(fixed);
    } catch (e) {
      return null;
    }
  }
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

// MULTI-PROVIDER HIGH-AVAILABILITY SUBTITLE EXTRACTOR
export async function fetchYouTubeTranscriptNative(videoUrl) {
  try {
    const videoId = getYouTubeId(videoUrl);
    if (!videoId) return null;

    let title = '';
    let transcriptText = '';

    // Step 1: Fetch Title via oEmbed
    try {
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`, { headers: BROWSER_HEADERS });
      if (oembedRes.ok) {
        const odata = await oembedRes.json();
        title = odata.title || '';
      }
    } catch(e) {}

    // Step 2: Query YouTube Track List to find exact lang & kind (ASR vs Manual)
    try {
      const listRes = await fetch(`https://www.youtube.com/api/timedtext?type=list&v=${videoId}`, { headers: BROWSER_HEADERS });
      if (listRes.ok) {
        const listXml = await listRes.text();
        const trackMatches = listXml.match(/<track[^>]+>/gi) || [];
        const tracks = [];

        for (const tTag of trackMatches) {
          const langMatch = tTag.match(/lang_code="([^"]+)"/);
          const kindMatch = tTag.match(/kind="([^"]+)"/);
          const nameMatch = tTag.match(/name="([^"]+)"/);
          if (langMatch) {
            tracks.push({
              lang: langMatch[1],
              kind: kindMatch ? kindMatch[1] : '',
              name: nameMatch ? nameMatch[1] : ''
            });
          }
        }

        const englishTrack = tracks.find(t => t.lang.startsWith('en') && !t.kind) || 
                             tracks.find(t => t.lang.startsWith('en')) || 
                             tracks[0];

        if (englishTrack) {
          let trackUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${englishTrack.lang}`;
          if (englishTrack.kind) trackUrl += `&kind=${englishTrack.kind}`;
          if (englishTrack.name) trackUrl += `&name=${encodeURIComponent(englishTrack.name)}`;

          const subRes = await fetch(trackUrl, { headers: BROWSER_HEADERS });
          if (subRes.ok) {
            const xml = await subRes.text();
            const clean = xml
              .replace(/<text[^>]*>/g, ' ')
              .replace(/<\/text>/g, ' ')
              .replace(/<[^>]+>/g, '')
              .replace(/&amp;/g, '&')
              .replace(/&#39;/g, "'")
              .replace(/&quot;/g, '"')
              .replace(/\s+/g, ' ')
              .trim();

            if (clean.length > 50) {
              transcriptText = clean.slice(0, 3500);
            }
          }
        }
      }
    } catch(e) {}

    // Step 3: Direct Fallbacks (Testing auto-generated kind=asr specifically)
    if (!transcriptText) {
      const fallbackUrls = [
        `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&kind=asr`,
        `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en`,
        `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en-US&kind=asr`,
        `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=srv3`
      ];

      for (const ttUrl of fallbackUrls) {
        if (transcriptText) break;
        try {
          const res = await fetch(ttUrl, { headers: BROWSER_HEADERS });
          if (res.ok) {
            const text = await res.text();
            if (text && text.length > 100) {
              const clean = text
                .replace(/<[^>]+>/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&#39;/g, "'")
                .replace(/&quot;/g, '"')
                .replace(/\s+/g, ' ')
                .trim();

              if (clean.length > 50) {
                transcriptText = clean.slice(0, 3500);
                break;
              }
            }
          }
        } catch(e) {}
      }
    }

    // Step 4: Open Piped Mirror Fallbacks
    if (!transcriptText) {
      const pipedInstances = [
        'https://pipedapi.kavin.rocks',
        'https://api.piped.privacydev.net',
        'https://pipedapi.tokhmi.xyz'
      ];

      for (const instance of pipedInstances) {
        if (transcriptText) break;
        try {
          const res = await fetch(`${instance}/streams/${videoId}`, { headers: BROWSER_HEADERS });
          if (res.ok) {
            const data = await res.json();
            if (!title && data.title) title = data.title;
            const subtitles = data.subtitles || [];
            const englishSub = subtitles.find(s => s.code === 'en' || s.code === 'en-US' || s.name?.toLowerCase().includes('english')) || subtitles[0];

            if (englishSub && englishSub.url) {
              const subRes = await fetch(englishSub.url);
              if (subRes.ok) {
                const rawSub = await subRes.text();
                const clean = parseVttToText(rawSub);
                if (clean.length > 50) {
                  transcriptText = clean.slice(0, 3500);
                  break;
                }
              }
            }
          }
        } catch(e) {}
      }
    }

    // Step 5: Song Lyrics Fallback
    if (!transcriptText && title) {
      const songLyrics = await fetchLyricsForSong(title);
      if (songLyrics) transcriptText = songLyrics;
    }

    return { title, transcript: transcriptText, videoId };
  } catch (e) {
    return null;
  }
}

export async function transformBlockWithAI(env, payload) {
  const { actions = [], sourceBlock, level = 'B1' } = payload;

  if (actions.length === 0) {
    return { error: 'Выберите хотя бы одно задание.' };
  }

  let videoDetailsText = '';
  if (sourceBlock.type === 'video' && sourceBlock.url) {
    const ytData = await fetchYouTubeTranscriptNative(sourceBlock.url);
    if (ytData) {
      if (ytData.title) sourceBlock.title = ytData.title;
      if (ytData.transcript) {
        videoDetailsText = `SPOKEN VIDEO TRANSCRIPT / CONTENT:\n"${ytData.transcript}"`;
      } else if (ytData.title) {
        videoDetailsText = `VIDEO TITLE & TOPIC:\n"${ytData.title}"`;
      }
    }
  }

  let sourceTextContent = '';

  if (sourceBlock.type === 'video') {
    const videoTitle = sourceBlock.title || 'Educational Video';
    const transcript = sourceBlock.transcript || videoDetailsText || '';

    if (transcript.length > 50) {
      sourceTextContent = `VIDEO TITLE: "${videoTitle}"\n\nSPOKEN VIDEO TRANSCRIPT:\n"${transcript}"`;
    } else {
      sourceTextContent = `VIDEO TITLE & TOPIC: "${videoTitle}"\n\nNOTE: Create educational comprehension and vocabulary questions based on the topic "${videoTitle}".`;
    }
  } else if (sourceBlock.type === 'text') {
    sourceTextContent = sourceBlock.text || '';
  } else if (sourceBlock.type === 'flashcards') {
    sourceTextContent = (sourceBlock.cards || []).map(c => `${c.front} = ${c.back}`).join('\n');
  } else {
    sourceTextContent = sourceBlock.text || sourceBlock.prompt || sourceBlock.title || '';
  }

  const taskInstructions = [];

  if (actions.includes('listening') || actions.includes('true_false') || actions.includes('quiz')) {
    taskInstructions.push(`- COMPREHENSION QUIZ: 4-5 multiple-choice questions testing educational understanding of the topic/content. Format: { "type": "multiple_choice", "question": "Question?", "options": ["Option A", "Option B", "Option C"], "correct": 0, "explanation": "Why" }`);
  }
  if (actions.includes('flashcards')) {
    taskInstructions.push(`- FLASHCARDS: 6-8 key vocabulary words with Russian translation and example sentence. Format: { "type": "flashcards", "title": "Key Vocabulary", "lang": "en-US", "cards": [{ "front": "Word", "back": "Перевод", "example": "Sentence" }] }`);
  }
  if (actions.includes('gap_fill')) {
    taskInstructions.push(`- GAP FILL: 5 sentences testing vocabulary: { "type": "gap_fill", "instruction": "Fill the gaps:", "text": "Sentence [answer] here.", "answers": ["answer"] }`);
  }
  if (actions.includes('gap_fill_bank')) {
    taskInstructions.push(`- WORD BANK GAP FILL: Sentences with words in [brackets] plus 2 distractors: { "type": "gap_fill_bank", "instruction": "🧩 Заполните пропуски:", "text": "Sentence [word1] and [word2].", "distractors": ["fake1", "fake2"] }`);
  }
  if (actions.includes('matching')) {
    taskInstructions.push(`- MATCHING: 6 pairs: { "type": "matching", "instruction": "Match pairs:", "pairs": [{ "left": "Word", "right": "Match" }] }`);
  }
  if (actions.includes('discussion')) {
    taskInstructions.push(`- DISCUSSION: 3 questions: { "type": "open_input", "prompt": "Discussion question?", "placeholder": "Your answer..." }`);
  }

  if (taskInstructions.length === 0) {
    taskInstructions.push(`- PRACTICE TASK: 3 discussion questions: { "type": "open_input", "prompt": "Practice question?" }`);
  }

  const systemPrompt = `Ты — ведущий методист английского языка высшей квалификации.
Твоя задача — создать СТРОГО УКАЗАННЫЕ ИНТЕРАКТИВНЫЕ БЛОКИ ДЛЯ ОБУЧЕНИЯ АНГЛИЙСКОМУ ЯЗЫКУ.
Уровень языка: ${level}.

КРИТИЧЕСКИ ВАЖНЫЕ ПРАВИЛА:
1. Задавай вопросы ИСКЛЮЧИТЕЛЬНО по учебному содержанию темы/видео/текста.
2. КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО задавать мета-вопросы о коде, ID видео, названии файлов или системных данных!

ТРЕБУЕМЫЕ БЛОКИ:
${taskInstructions.join('\n')}

ВЕРНИ СТРОГО ЧИСТЫЙ JSON МАССИВ БЛОКОВ (без \`\`\`json):
{
  "blocks": [
    /* созданные учебные блоки */
  ]
}`;

  const userPrompt = `ИСХОДНЫЙ УЧЕБНЫЙ МАТЕРИАЛ:\n${sourceTextContent}`;

  try {
    const aiResponse = await env.AI.run('@cf/meta/llama-3.1-70b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 3500,
      temperature: 0.3
    });

    const parsedData = parseAIJson(aiResponse.response || "");
    if (!parsedData) {
      return { error: 'AI generated invalid response format.' };
    }

    const newBlocks = Array.isArray(parsedData.blocks) ? parsedData.blocks : [parsedData];
    return { success: true, newBlocks };
  } catch (err) {
    return { error: 'AI error: ' + err.message };
  }
}

export async function generateFullLessonWithAI(env, payload) {
  const { text = '', level = 'B1', topic = 'General English' } = payload;

  const systemPrompt = `Ты — ведущий методист английского языка.
Создай ПОЛНЫЙ ИНТЕРАКТИВНЫЙ УРОК по теме "${topic}" (Уровень ${level}) в формате JSON.

Структура урока должна содержать 3-4 страницы ("pages"), каждая с блоками ("blocks"):
- Заголовки (heading)
- Текст истории/правила (text)
- Карточки лексики (flashcards)
- Выбор ответа (multiple_choice)
- Пропуски в тексте (gap_fill_bank или gap_fill)
- Сопоставление пар (matching)
- Вопросы для обсуждения (open_input)

ВЕРНИ СТРОГО ЧИСТЫЙ JSON УРОКА:
{
  "title": "...",
  "level": "${level}",
  "topic": "${topic}",
  "description": "...",
  "pages": [
    {
      "id": "p1",
      "title": "Часть 1: Введение",
      "blocks": [ ... ]
    }
  ]
}`;

  const userPrompt = text ? `МАТЕРИАЛЫ УРОКА:\n${text}` : `Тема урока: ${topic}`;

  try {
    const aiResponse = await env.AI.run('@cf/meta/llama-3.1-70b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 4000,
      temperature: 0.3
    });

    const parsedLesson = parseAIJson(aiResponse.response || "");
    if (!parsedLesson) {
      return { error: 'AI generation failed to produce valid JSON.' };
    }

    return { success: true, jsonText: JSON.stringify(parsedLesson, null, 2) };
  } catch (err) {
    return { error: 'AI generation error: ' + err.message };
  }
}
