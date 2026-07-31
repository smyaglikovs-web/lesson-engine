import { ensureTables } from '../db/schema.js';

export async function submitHomework(env, payload) {
  await ensureTables(env);
  const { lessonId, studentName, score, totalQuestions, answers } = payload;
  const id = 'sub-' + Date.now();
  await env.DB.prepare("INSERT INTO homework_submissions (id, lesson_id, student_name, score, total_questions, answers) VALUES (?, ?, ?, ?, ?, ?)").bind(
    id, lessonId, studentName || 'Аноним', score, totalQuestions, JSON.stringify(answers)
  ).run();
  return { success: true, id };
}

export async function getHomeworkSubmissions(env, lessonId) {
  const { results } = await env.DB.prepare("SELECT id, student_name, score, total_questions, answers, created_at FROM homework_submissions WHERE lesson_id = ? ORDER BY created_at DESC").bind(lessonId).all();
  return results || [];
}
