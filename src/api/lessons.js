import { ensureTables } from '../db/schema.js';

function normalizeBlockType(rawType) {
  let t = String(rawType || 'text').toLowerCase().trim();
  if (t === 'header' || t === 'title' || t === 'h1' || t === 'h2' || t === 'h3') return 'heading';
  if (t === 'paragraph' || t === 'reading' || t === 'article' || t === 'content' || t === 'story') return 'text';
  if (t === 'quiz' || t === 'question' || t === 'true_false' || t === 'mc' || t === 'multiple-choice') return 'multiple_choice';
  if (t === 'vocab' || t === 'words' || t === 'flashcard' || t === 'cards') return 'flashcards';
  if (t === 'prompt' || t === 'speaking' || t === 'discussion' || t === 'question_input') return 'open_input';
  if (t === 'rule' || t === 'grammar' || t === 'grammar-card' || t === 'grammarcard') return 'grammar_card';
  if (t === 'gapfill' || t === 'gap-fill' || t === 'fill_gap') return 'gap_fill';
  if (t === 'gapfill_bank' || t === 'gap-fill-bank' || t === 'word_bank' || t === 'wordbank') return 'gap_fill_bank';
  if (t === 'reorder' || t === 'reorder_sentence' || t === 'sentence-reorder') return 'sentence_reorder';
  if (t === 'categories' || t === 'bucket') return 'categorization';
  return t;
}

function sanitizeBlocks(blocksArray) {
  if (!Array.isArray(blocksArray)) return [];
  return blocksArray.map((b, idx) => {
    if (!b || typeof b !== 'object') {
      return { id: `b-${idx}`, type: 'text', text: '' };
    }
    return {
      ...b,
      id: b.id || `b-${idx}-${Date.now()}`,
      type: normalizeBlockType(b.type)
    };
  });
}

export async function verifyTeacherLogin(env, password) {
  const clean = (password || '').trim();
  const expectedPass = env.TEACHER_PASSWORD || 'teacher123';
  return { success: clean === expectedPass };
}

export async function getLessons(env) {
  await ensureTables(env);
  const { results } = await env.DB.prepare(
    "SELECT id, title, level, topic, description, created_at FROM lessons ORDER BY created_at DESC"
  ).all();
  return results || [];
}

export async function saveLesson(env, lesson, password) {
  await ensureTables(env);
  const cleanPass = (password || '').trim();
  const expectedPass = env.TEACHER_PASSWORD || 'teacher123';
  if (cleanPass !== expectedPass) {
    return { error: "Неверный пароль учителя!" };
  }

  const id = lesson.id || 'lesson-' + Date.now();
  const jsonString = JSON.stringify(lesson);

  await env.DB.prepare(
    "INSERT OR REPLACE INTO lessons (id, title, level, topic, description, data) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(
    id, 
    lesson.title || 'Untitled', 
    lesson.level || 'B1', 
    lesson.topic || 'General', 
    lesson.description || '', 
    jsonString
  ).run();

  return { success: true, id };
}

// BULLETPROOF LESSON RETRIEVAL & NORMALIZATION (READS BOTH 'data' AND 'pages_json')
export async function getSingleLesson(env, lessonId) {
  await ensureTables(env);
  const row = await env.DB.prepare(
    "SELECT data, pages_json, title, level, topic, description FROM lessons WHERE id = ?"
  ).bind(lessonId).first();

  if (!row) return null;

  let rawData = row.data || row.pages_json;
  let parsed = null;

  if (rawData) {
    try {
      parsed = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
    } catch(e) {}
  }

  if (!parsed || typeof parsed !== 'object') {
    parsed = {
      id: lessonId,
      title: row.title || 'Untitled Lesson',
      level: row.level || 'B1',
      topic: row.topic || 'General',
      description: row.description || '',
      pages: [{ id: 'p1', title: 'Part 1', blocks: [] }]
    };
  }

  // Handle pages array normalization
  let rawPages = parsed.pages;
  let pages = [];

  if (Array.isArray(rawPages) && rawPages.length > 0) {
    // If rawPages is actually a flat array of block objects
    if (rawPages[0] && rawPages[0].type && !Array.isArray(rawPages[0].blocks)) {
      pages = [{ id: 'p1', title: parsed.topic || row.topic || 'Part 1', blocks: sanitizeBlocks(rawPages) }];
    } else {
      pages = rawPages.map((p, idx) => ({
        id: p.id || `p${idx + 1}`,
        title: p.title || `Part ${idx + 1}`,
        blocks: sanitizeBlocks(p.blocks || p.items || [])
      }));
    }
  } else if (Array.isArray(parsed.blocks) && parsed.blocks.length > 0) {
    pages = [{ id: 'p1', title: parsed.topic || row.topic || 'Part 1', blocks: sanitizeBlocks(parsed.blocks) }];
  } else if (Array.isArray(parsed)) {
    pages = [{ id: 'p1', title: row.topic || 'Part 1', blocks: sanitizeBlocks(parsed) }];
  } else {
    pages = [{ id: 'p1', title: row.topic || 'Part 1', blocks: [] }];
  }

  return {
    id: lessonId,
    title: parsed.title || row.title || 'Untitled Lesson',
    level: parsed.level || row.level || 'B1',
    topic: parsed.topic || row.topic || 'General',
    description: parsed.description || row.description || '',
    pages: pages
  };
}

export async function deleteLesson(env, lessonId, password) {
  await ensureTables(env);
  const clean = (password || '').trim();
  const expectedPass = env.TEACHER_PASSWORD || 'teacher123';
  if (clean !== expectedPass) {
    return { error: "Неверный пароль учителя!" };
  }

  await env.DB.prepare("DELETE FROM lessons WHERE id = ?").bind(lessonId).run();
  return { success: true };
}
