import { ensureTables } from '../db/schema.js';

export function normalizeBlockType(rawType) {
  let t = String(rawType || 'text').toLowerCase().trim();
  if (t === 'header' || t === 'title' || t === 'h1' || t === 'h2' || t === 'h3') return 'heading';
  if (t === 'paragraph' || t === 'reading' || t === 'article' || t === 'content' || t === 'story') return 'text';
  if (t === 'quiz' || t === 'question' || t === 'true_false' || t === 'mc' || t === 'multiple-choice') return 'multiple_choice';
  if (t === 'vocab' || t === 'words' || t === 'flashcard' || t === 'cards') return 'flashcards';
  if (t === 'prompt' || t === 'speaking' || t === 'discussion' || t === 'question_input') return 'open_input';
  if (t === 'rule' || t === 'grammar' || t === 'grammar-card' || t === 'grammarcard') return 'grammar_card';
  if (t === 'gapfill' || t === 'gap-fill' || t === 'fill_gap') return 'gap_fill';
  if (t === 'gapfill_bank' || t === 'gap-fill-bank' || t === 'word_bank' || t === 'wordbank' || t === 'drag-and-drop') return 'gap_fill_bank';
  if (t === 'reorder' || t === 'reorder_sentence' || t === 'sentence-reorder' || t === 'unscramble') return 'sentence_reorder';
  if (t === 'categories' || t === 'bucket') return 'categorization';
  if (t === 'inline' || t === 'inline_select' || t === 'dropdown_select' || t === 'select_gap' || t === 'drop_down') return 'inline_select';
  if (t === 'wheel' || t === 'roulette' || t === 'spinning_wheel') return 'spinning_wheel';
  if (t === 'notes' || t === 'teacher_notes' || t === 'teacher-notes') return 'teacher_notes';
  return t;
}

export function sanitizeBlocks(blocksArray) {
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

export async function getLessons(env, filters = {}) {
  await ensureTables(env);
  const { level = '', folder = '', search = '' } = filters;

  let query = "SELECT id, title, level, topic, description, folder_name, created_at FROM lessons WHERE 1=1";
  const params = [];

  if (level) {
    query += " AND level = ?";
    params.push(level);
  }
  if (folder) {
    query += " AND folder_name = ?";
    params.push(folder);
  }
  if (search) {
    query += " AND (title LIKE ? OR topic LIKE ? OR description LIKE ?)";
    const wildcard = `%${search}%`;
    params.push(wildcard, wildcard, wildcard);
  }

  query += " ORDER BY created_at DESC";

  const stmt = env.DB.prepare(query);
  const { results } = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();

  return results || [];
}

export async function getFolders(env) {
  await ensureTables(env);
  const { results } = await env.DB.prepare("SELECT id, name, created_at FROM folders ORDER BY name ASC").all();
  return results || [];
}

export async function createFolder(env, name) {
  await ensureTables(env);
  const cleanName = (name || '').trim();
  if (!cleanName) return { error: 'Folder name is required' };

  const id = 'fld_' + Date.now();
  try {
    await env.DB.prepare("INSERT INTO folders (id, name) VALUES (?, ?)").bind(id, cleanName).run();
    return { success: true, id, name: cleanName };
  } catch (e) {
    return { error: 'Папка с таким названием уже существует' };
  }
}

export async function deleteFolder(env, folderId) {
  await ensureTables(env);
  await env.DB.prepare("DELETE FROM folders WHERE id = ?").bind(folderId).run();
  return { success: true };
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

  await env.DB.prepare(`
    INSERT INTO lessons (id, author_id, folder_name, title, level, topic, description, data) 
    VALUES (?, 'teacher', ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET 
      folder_name = excluded.folder_name,
      title = excluded.title, 
      level = excluded.level, 
      topic = excluded.topic, 
      description = excluded.description, 
      data = excluded.data
  `).bind(
    id,
    lesson.folder_name || '',
    lesson.title || 'Untitled', 
    lesson.level || 'B1', 
    lesson.topic || 'General', 
    lesson.description || '', 
    jsonString
  ).run();

  return { success: true, id };
}

export async function getSingleLesson(env, lessonId) {
  await ensureTables(env);
  const row = await env.DB.prepare(
    "SELECT data, title, level, topic, description, folder_name FROM lessons WHERE id = ?"
  ).bind(lessonId).first();

  if (!row) return null;

  let parsed = null;
  if (row.data) {
    try {
      parsed = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
    } catch (e) {}
  }

  if (!parsed || typeof parsed !== 'object') {
    parsed = {
      id: lessonId,
      title: row.title || 'Untitled Lesson',
      level: row.level || 'B1',
      topic: row.topic || 'General',
      folder_name: row.folder_name || '',
      description: row.description || '',
      pages: [{ id: 'p1', title: 'Part 1', blocks: [] }]
    };
  }

  let rawPages = parsed.pages;
  let pages = [];

  if (Array.isArray(rawPages) && rawPages.length > 0) {
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
  } else {
    pages = [{ id: 'p1', title: row.topic || 'Part 1', blocks: [] }];
  }

  return {
    id: lessonId,
    title: parsed.title || row.title || 'Untitled Lesson',
    level: parsed.level || row.level || 'B1',
    topic: parsed.topic || row.topic || 'General',
    folder_name: parsed.folder_name || row.folder_name || '',
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

  // Cascading cleanup
  await env.DB.batch([
    env.DB.prepare("DELETE FROM homework_submissions WHERE lesson_id = ?").bind(lessonId),
    env.DB.prepare("DELETE FROM room_states WHERE room_id = ? OR lesson_id = ?").bind(lessonId, lessonId),
    env.DB.prepare("DELETE FROM lessons WHERE id = ?").bind(lessonId)
  ]);

  return { success: true };
}
