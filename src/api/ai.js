function getYouTubeId(url = '') {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

async function fetchLyricsForSong(title = '') {
  try {
    const clean = title.replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').replace(/official video/gi, '').replace(/music video/gi, '').replace(/official/gi, '').trim();
    const parts = clean.split('-');
    if (parts.length >= 2) {
      const artist = parts[0].trim();
      const song = parts[1].trim();
      const res = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(song)}`);
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

async function fetchYouTubeTranscriptAndMetadata(url) {
  try {
    const videoId = getYouTubeId(url);
    if (!videoId) return null;

    let title = '';
    try {
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
      if (oembedRes.ok) {
        const odata = await oembedRes.json();
        title = odata.title || '';
      }
    } catch(e) {}

    let transcriptText = '';
    try {
      const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });
      if (pageRes.ok) {
        const html = await pageRes.text();
        const captionMatch = html.match(/"captionTracks":\s*(\[.*?\])/);
        if (captionMatch) {
          const tracks = JSON.parse(captionMatch[1]);
          const enTrack = tracks.find(t => t.languageCode === 'en' || t.languageCode?.startsWith('en')) || tracks[0];
          if (enTrack && enTrack.baseUrl) {
            const subRes = await fetch(enTrack.baseUrl);
            if (subRes.ok) {
              const xmlText = await subRes.text();
              transcriptText = xmlText.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim().slice(0, 3500);
            }
          }
        }
      }
    } catch(e) {}

    if (!transcriptText && title) {
      const songLyrics = await fetchLyricsForSong(title);
      if (songLyrics) {
        transcriptText = songLyrics;
      }
    }

    return { title, transcript: transcriptText };
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
    const ytData = await fetchYouTubeTranscriptAndMetadata(sourceBlock.url);
    if (ytData) {
      if (ytData.title) sourceBlock.title = ytData.title;
      if (ytData.transcript) {
        videoDetailsText = `SPOKEN VIDEO TRANSCRIPT / LYRICS:\n"${ytData.transcript}"`;
      } else if (ytData.title) {
        videoDetailsText = `VIDEO TITLE & SONG TOPIC:\n"${ytData.title}"`;
      }
    }
  }

  const taskInstructions = [];

  // FULL INTERACTIVE TASK GENERATION FOR ANY BLOCK TYPE
  if (actions.includes('listening')) {
    taskInstructions.push(`- COMPREHENSION QUIZ: 4-5 quiz questions based on content. Format: { "type": "multiple_choice", "question": "Question?", "options": ["Option A", "Option B", "Option C"], "correct": 0, "explanation": "Why" }`);
  }
  if (actions.includes('flashcards')) {
    taskInstructions.push(`- FLASHCARDS: 6-8 key vocabulary words with Russian translation and example sentence. Format: { "type": "flashcards", "title": "Target Vocabulary", "lang": "en-US", "cards": [{ "front": "Word", "back": "Перевод", "example": "Sentence" }] }`);
  }
  if (actions.includes('true_false')) {
    taskInstructions.push(`- TRUE/FALSE QUIZ: 4 true/false questions based on content. Format: { "type": "multiple_choice", "question": "Statement...", "options": ["True", "False"], "correct": 0, "explanation": "Why" }`);
  }
  if (actions.includes('gap_fill')) {
    taskInstructions.push(`- GAP FILL (KEYBOARD): 5 sentences testing key words in format 'Sentence [answer] here.': { "type": "gap_fill", "instruction": "Fill the gaps:", "text": "Sentence [answer] here.", "answers": ["answer"] }`);
  }
  if (actions.includes('gap_fill_bank')) {
    taskInstructions.push(`- WORD BANK GAP FILL: Sentences with 4-5 key words in [brackets] plus 2-3 distractor words: { "type": "gap_fill_bank", "instruction": "🧩 Заполните пропуски словами из банка:", "text": "Sentence [word1] and [word2].", "distractors": ["fake1", "fake2"] }`);
  }
  if (actions.includes('matching')) {
    taskInstructions.push(`- MATCHING: 6 pairs of synonyms or translations: { "type": "matching", "instruction": "Match the pairs:", "pairs": [{ "left": "Word", "right": "Match" }] }`);
  }
  if (actions.includes('discussion')) {
    taskInstructions.push(`- DISCUSSION: 3 speaking discussion questions: { "type": "open_input", "prompt": "Discussion question?", "placeholder": "Your answer..." }`);
  }

  if (taskInstructions.length === 0) {
    taskInstructions.push(`- PRACTICE TASK: 3 discussion questions: { "type": "open_input", "prompt": "Practice question?" }`);
  }

  const systemPrompt = `Ты — ведущий методист английского языка.
Создай СТРОГО УКАЗАННЫЕ ИНТЕРАКТИВНЫЕ БЛОКИ на основе предоставленного материала.
Уровень языка: ${level}.

ТРЕБУЕМЫЕ БЛОКИ ДЛЯ СОЗДАНИЯ:
${taskInstructions.join('\n')}

ВЕРНИ СТРОГО ЧИСТЫЙ JSON МАССИВ БЛОКОВ (без \`\`\`json):
{
  "blocks": [
    /* созданные блоки */
  ]
}`;

  const userPrompt = `СОДЕРЖАНИЕ ИСХОДНОГО БЛОКА:\n${JSON.stringify(sourceBlock)}\n\n${videoDetailsText}`;

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
