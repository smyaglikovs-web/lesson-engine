import { ensureTables } from '../db/schema.js';

export async function submitHomework(env, payload) {
  await ensureTables(env);
  const { lessonId, studentName, answers = {} } = payload;

  let score = 0;
  let totalQuestions = 0;

  try {
    const row = await env.DB.prepare("SELECT data FROM lessons WHERE id = ?").bind(lessonId).first();
    if (row && row.data) {
      const lessonDef = JSON.parse(row.data);
      (lessonDef.pages || []).forEach(page => {
        (page.blocks || []).forEach(b => {
          if (b.type === 'multiple_choice' || b.type === 'gap_fill' || b.type === 'matching') {
            totalQuestions++;
            const studentAns = answers[b.id];

            if (b.type === 'multiple_choice' && studentAns?.selected !== undefined) {
              if (Number(studentAns.selected) === Number(b.correct)) score++;
            }
            if (b.type === 'gap_fill' && studentAns?.userAnswer) {
              const userVal = String(studentAns.userAnswer).trim().toLowerCase();
              if (b.answers?.some(a => String(a).trim().toLowerCase() === userVal)) score++;
            }
            if (b.type === 'matching' && studentAns?.matched) {
              if (Array.isArray(studentAns.matched) && studentAns.matched.length === (b.pairs?.length || 0)) score++;
            }
          }
        });
      });
    }
  } catch(e) {
    console.error("Server Grading Error:", e);
  }

  const id = 'sub-' + Date.now();
  await env.DB.prepare(
    "INSERT INTO homework_submissions (id, lesson_id, student_name, score, total_questions, answers) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(id, lessonId, studentName || 'Аноним', score, totalQuestions, JSON.stringify(answers)).run();

  return { success: true, id, score, totalQuestions };
}

export async function getHomeworkSubmissions(env, lessonId, password) {
  const clean = (password || '').trim();
  const expectedPass = env.TEACHER_PASSWORD || 'teacher123';
  if (clean !== expectedPass) return [];
  const { results } = await env.DB.prepare("SELECT id, student_name, score, total_questions, answers, created_at FROM homework_submissions WHERE lesson_id = ? ORDER BY created_at DESC").bind(lessonId).all();
  return results || [];
}
