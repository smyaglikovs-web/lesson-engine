function getYouTubeId(url = '') {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Fetch helper with User-Agent header (Bypasses YouTube 403 blocks!)
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9'
};

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

// DIRECT YOUTUBE TIMEDTEXT + INNERTUBE SUBTITLE EXTRACTOR
export async function fetchYouTubeTranscriptNative(videoUrl) {
  try {
    const videoId = getYouTubeId(videoUrl);
    if (!videoId) return null;

    // 1. Fetch Title via oEmbed
    let title = '';
    try {
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`, { headers: HEADERS });
      if (oembedRes.ok) {
        const odata = await oembedRes.json();
        title = odata.title || '';
      }
    } catch(e) {}

    let transcriptText = '';

    // LAYER 1: YouTube Direct TimedText API (lang=en & kind=asr)
    const ttUrls = [
      `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en`,
      `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&kind=asr`,
      `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en-US`,
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

    // LAYER 2: Android InnerTube Player API
    if (!transcriptText) {
      try {
        const innerRes = await fetch('https://www.youtube.com/youtubei/v1/player', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'com.google.android.youtube/19.08.35 (Linux; U; Android 11; US)'
          },
          body: JSON.stringify({
            context: { client: { clientName: 'ANDROID', clientVersion: '19.08.35' } },
            videoId: videoId
          })
        });

        if (innerRes.ok) {
          const data = await innerRes.json();
          const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
          if (tracks && tracks.length > 0) {
            const enTrack = tracks.find(t => t.languageCode === 'en' || t.languageCode?.startsWith('en')) || tracks[0];
            if (enTrack && enTrack.baseUrl) {
              const subRes = await fetch(enTrack.baseUrl, { headers: HEADERS });
              if (subRes.ok) {
                const xmlText = await subRes.text();
                const cleanText = xmlText.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
                if (cleanText.length > 50) {
                  transcriptText = cleanText.slice(0, 3500);
                }
              }
            }
          }
        }
      } catch(e) {}
    }

    // LAYER 3: Song Lyrics Search API Fallback
    if (!transcriptText && title) {
      const songLyrics = await fetchLyricsForSong(title);
      if (songLyrics) {
        transcriptText = songLyrics;
      }
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
      sourceTextContent = `VIDEO TITLE & TOPIC: "${videoTitle}"\n\nNOTE: Create educational comprehension and vocabulary questions based on the scientific topic "${videoTitle}".`;
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
    taskInstructions.push(`- COMPREHENSION QUIZ: 4-5 multiple-choice questions testing educational understanding of the topic/content (e.g. key concepts, facts, ideas). Format: { "type": "multiple_choice", "question": "Educational Question about the topic?", "options": ["Option A", "Option B", "Option C"], "correct": 0, "explanation": "Why" }`);
  }
  if (actions.includes('flashcards')) {
    taskInstructions.push(`- FLASHCARDS: 6-8 key vocabulary words related to this topic with Russian translation and example sentence. Format: { "type": "flashcards", "title": "Key Vocabulary", "lang": "en-US", "cards": [{ "front": "Word", "back": "Перевод", "example": "Sentence" }] }`);
  }
  if (actions.includes('gap_fill')) {
    taskInstructions.push(`- GAP FILL: 5 sentences testing key vocabulary in format 'Sentence [answer] here.': { "type": "gap_fill", "instruction": "Fill the gaps:", "text": "Sentence [answer] here.", "answers": ["answer"] }`);
  }
  if (actions.includes('gap_fill_bank')) {
    taskInstructions.push(`- WORD BANK GAP FILL: Sentences with key words in [brackets] plus 2 distractor words: { "type": "gap_fill_bank", "instruction": "🧩 Заполните пропуски словами из банка:", "text": "Sentence [word1] and [word2].", "distractors": ["fake1", "fake2"] }`);
  }
  if (actions.includes('matching')) {
    taskInstructions.push(`- MATCHING: 6 pairs of vocabulary words and definitions/translations: { "type": "matching", "instruction": "Match the pairs:", "pairs": [{ "left": "Word", "right": "Match" }] }`);
  }
  if (actions.includes('discussion')) {
    taskInstructions.push(`- DISCUSSION: 3 deep speaking discussion questions on the topic: { "type": "open_input", "prompt": "Discussion question?", "placeholder": "Your answer..." }`);
  }

  if (taskInstructions.length === 0) {
    taskInstructions.push(`- PRACTICE TASK: 3 discussion questions: { "type": "open_input", "prompt": "Practice question?" }`);
  }

  const systemPrompt = `Ты — ведущий методист английского языка высшей квалификации.
Твоя задача — создать СТРОГО УКАЗАННЫЕ ИНТЕРАКТИВНЫЕ БЛОКИ ДЛЯ ОБУЧЕНИЯ АНГЛИЙСКОМУ ЯЗЫКУ.
Уровень языка: ${level}.

КРИТИЧЕСКИ ВАЖНЫЕ ПРАВИЛА:
1. Задавай вопросы ИСКЛЮЧИТЕЛЬНО по учебному содержанию темы/видео/текста (например, про мозг, память, науку, лексику).
2. КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО задавать мета-вопросы о программном коде, ID видео, названии файлов, наличии субтитров или системных данных!

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

    const generatedText = aiResponse.response || "";
    var tb = String.fromCharCode(96, 96, 96);
    var cleanJsonText = generatedText.split(tb + 'json').join('').split(tb).join('').trim();
    const parsedData = JSON.parse(cleanJsonText);

    const newBlocks = Array.isArray(parsedData.blocks) ? parsedData.blocks : [parsedData];
    return { success: true, newBlocks };
  } catch (err) {
    return { error: 'AI error: ' + err.message };
  }
}
