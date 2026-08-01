import { ensureTables } from '../db/schema.js';

export async function verifyTeacherLogin(env, password) {
  const clean = (password || '').trim();
  const expectedPass = env.TEACHER_PASSWORD || 'teacher123';
  return { success: clean === expectedPass };
}

export async function getLessons(env) {
  await ensureTables(env);
  const { results } = await env.DB.prepare("SELECT id, title, level, topic, description, created_at FROM lessons ORDER BY created_at DESC").all();
  return results || [];
}

export async function saveLesson(env, lesson, password) {
  await ensureTables(env);
  const id = lesson.id || 'lesson-' + Date.now();
  await env.DB.prepare("INSERT OR REPLACE INTO lessons (id, title, level, topic, description, data) VALUES (?, ?, ?, ?, ?, ?)").bind(
    id, lesson.title || 'Untitled', lesson.level || 'A2', lesson.topic || 'General', lesson.description || '', JSON.stringify(lesson)
  ).run();
  return { success: true, id };
}

export async function getSingleLesson(env, lessonId) {
  const row = await env.DB.prepare("SELECT data FROM lessons WHERE id = ?").bind(lessonId).first();
  return row ? row.data : null;
}

export async function deleteLesson(env, lessonId, password) {
  const clean = (password || '').trim();
  const expectedPass = env.TEACHER_PASSWORD || 'teacher123';
  if (clean !== expectedPass) return { error: "Неверный пароль учителя!" };
  await env.DB.prepare("DELETE FROM lessons WHERE id = ?").bind(lessonId).run();
  return { success: true };
}
