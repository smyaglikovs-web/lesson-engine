import { ensureTables } from '../db/schema.js';

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
    lesson.level || 'A2', 
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

  // Normalize pages array structure
  let pages = Array.isArray(parsed.pages) ? parsed.pages : [];
  if (pages.length === 0) {
    if (Array.isArray(parsed.blocks)) {
      pages = [{ id: 'p1', title: parsed.topic || row.topic || 'Part 1', blocks: parsed.blocks }];
    } else if (Array.isArray(parsed)) {
      pages = [{ id: 'p1', title: row.topic || 'Part 1', blocks: parsed }];
    } else {
      pages = [{ id: 'p1', title: row.topic || 'Part 1', blocks: [] }];
    }
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
