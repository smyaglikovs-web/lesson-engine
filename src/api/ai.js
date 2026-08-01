function getYouTubeId(url = '') {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = String(url).match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

const HEADERS = {
  'User-Agent': 'com.google.android.youtube/17.36.37 (Linux; U; Android 11; en_US)',
  'Accept-Language': 'en-US,en;q=0.9'
};

// Resilient JSON extractor for AI LLM outputs
function parseAIJson(responseText) {
  if (!responseText) return null;
  
  let clean = responseText.trim();
  
  // Extract content inside ```json ... ``` code blocks
  const codeBlockMatch = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch) {
    clean = codeBlockMatch[1].trim();
  } else {
    // Extract JSON object or array bounds
    const firstBrace = clean.search(/[{\[]/);
    const lastBrace = Math.max(clean.lastIndexOf('}'), clean.lastIndexOf(']'));
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      clean = clean.substring(firstBrace, lastBrace + 1);
    }
  }

  try {
    return JSON.parse(clean);
  } catch (err) {
    // Fallback parser for unescaped newlines inside strings
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
      console.error("JSON Parse Error:", e, "Raw text:", responseText);
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
      const res = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(song)}`, { headers: HEADERS });
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

// RELIABLE YOUTUBE INNERTUBE CAPTION EXTRACTOR (Cloudflare Worker Compatible)
export async function fetchYouTubeTranscriptNative(videoUrl) {
  try {
    const videoId = getYouTubeId(videoUrl);
    if (!videoId) return null;

    let title = '';
    let transcriptText = '';

    // Step 1: Fetch Video Title via oEmbed (No Cloudflare Block)
    try {
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
      if (oembedRes.ok) {
        const odata = await oembedRes.json();
        title = odata.title || '';
      }
    } catch(e) {}

    // Step 2: Fetch Captions via YouTube InnerTube API (Android Client)
    try {
      const innertubeRes = await fetch('https://www.youtube.com/youtubei/v1/player', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'com.google.android.youtube/17.36.37 (Linux; U; Android 11; en_US)'
        },
        body: JSON.stringify({
          context: {
            client: {
              clientName: 'ANDROID',
              clientVersion: '17.36.37',
              hl: 'en',
              gl: 'US'
            }
          },
          videoId: videoId
        })
      });

      if (innertubeRes.ok) {
        const playerResponse = await innertubeRes.json();
        if (!title && playerResponse.videoDetails?.title) {
          title = playerResponse.videoDetails.title;
        }

        const captionTracks = playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
        
        // Prioritize English track or fallback to first available
        const track = captionTracks.find(t => t.languageCode === 'en' || t.languageCode === 'en-US') || captionTracks[0];

        if (track && track.baseUrl) {
          const xmlRes = await fetch(track.baseUrl, { headers: HEADERS });
          if (xmlRes.ok) {
            const xml = await xmlRes.text();
            const cleanText = xml
              .replace(/<text[^>]*>/g, ' ')
              .replace(/<\/text>/g, ' ')
              .replace(/<[^>]+>/g, '')
              .replace(/&amp;/g, '&')
              .replace(/&#39;/g, "'")
              .replace(/&quot;/g, '"')
              .replace(/\s+/g, ' ')
              .trim();

            if (cleanText.length > 50) {
              transcriptText = cleanText.slice(0, 3500);
            }
          }
        }
      }
    } catch(e) {
      console.error("InnerTube API Error:", e);
    }

    // Step 3: Direct TimedText API Fallback
    if (!transcriptText) {
      const ttUrls = [
        `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en`,
        `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&kind=asr`,
        `https://subtitles-youtube.vercel.app/api/tr?v=${videoId}`
      ];

      for (const ttUrl of ttUrls) {
        if (transcriptText) break;
        try {
          const res = await fetch(ttUrl, { headers: HEADERS });
          if (res.ok) {
            const xml = await res.text();
            if (xml && (xml.includes('<text') || xml.length > 100)) {
              const cleanText = xml.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
              if (cleanText.length > 50) {
                transcriptText = cleanText.slice(0, 3500);
                break;
              }
            }
          }
        } catch(e) {}
      }
    }

    // Step 4: Song Lyrics Fallback for Music Videos
    if (!transcriptText && title) {
      const songLyrics = await fetchLyricsForSong(title);
      if (songLyrics) transcriptText = songLyrics;
    }

    return { title, transcript: transcriptText, videoId };
  } catch (e) {
    console.error("YouTube Fetch Exception:", e);
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
