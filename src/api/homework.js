import { ensureTables } from '../db/schema.js';

export async function submitHomework(env, payload) {
  await ensureTables(env);
  const { lessonId, studentName, score: clientScore = 0, totalQuestions: clientTotal = 0, answers = {} } = payload;

  let score = 0;
  let totalQuestions = 0;

  try {
    const row = await env.DB.prepare("SELECT data FROM lessons WHERE id = ?").bind(lessonId).first();
    if (row && row.data) {
      const lessonDef = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
      (lessonDef.pages || []).forEach(page => {
        (page.blocks || []).forEach(b => {
          const studentAns = answers[b.id];

          if (b.type === 'multiple_choice') {
            totalQuestions++;
            if (studentAns && studentAns.selected !== undefined && Number(studentAns.selected) === Number(b.correct)) {
              score++;
            }
          } else if (b.type === 'gap_fill') {
            totalQuestions++;
            if (studentAns && studentAns.userAnswer) {
              const userVal = String(studentAns.userAnswer).trim().toLowerCase();
              if (b.answers?.some(a => String(a).trim().toLowerCase() === userVal)) score++;
            }
          } else if (b.type === 'gap_fill_bank') {
            totalQuestions++;
            if (studentAns && studentAns.placedSlots) {
              const rawParts = (b.text || '').split(/\[(.*?)\]/);
              const correctAns = rawParts.filter((_, idx) => idx % 2 === 1);
              let allCorrect = correctAns.length > 0;
              correctAns.forEach((ans, idx) => {
                if (studentAns.placedSlots[idx]?.text?.trim().toLowerCase() !== ans.trim().toLowerCase()) {
                  allCorrect = false;
                }
              });
              if (allCorrect && correctAns.length > 0) score++;
            }
          } else if (b.type === 'matching') {
            totalQuestions++;
            if (studentAns && studentAns.matched) {
              if (Array.isArray(studentAns.matched) && studentAns.matched.length === (b.pairs?.length || 0)) score++;
            }
          } else if (b.type === 'sentence_reorder') {
            totalQuestions++;
            if (studentAns && studentAns.selectedWordObjects) {
              const userSentence = studentAns.selectedWordObjects.map(w => w.text).join(' ');
              if (userSentence.trim().toLowerCase() === (b.sentence || '').trim().toLowerCase()) score++;
            }
          } else if (b.type === 'categorization') {
            totalQuestions++;
            if (studentAns && studentAns.placements) {
              let allCorrect = (b.items || []).length > 0;
              (b.items || []).forEach(it => {
                if (studentAns.placements[it.id] !== it.categoryIndex) allCorrect = false;
              });
              if (allCorrect) score++;
            }
          }
        });
      });
    }
  } catch(e) {
    console.error("Server Grading Error:", e);
  }

  // Fallback to client calculated score if server total is 0
  const finalScore = totalQuestions > 0 ? score : clientScore;
  const finalTotal = totalQuestions > 0 ? totalQuestions : clientTotal;

  const id = 'sub-' + Date.now();
  await env.DB.prepare(
    "INSERT INTO homework_submissions (id, lesson_id, student_name, score, total_questions, answers) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(id, lessonId, studentName || 'Аноним', finalScore, finalTotal, JSON.stringify(answers)).run();

  return { success: true, id, score: finalScore, totalQuestions: finalTotal };
}

export async function getHomeworkSubmissions(env, lessonId, password) {
  await ensureTables(env);
  const clean = (password || '').trim();
  const expectedPass = env.TEACHER_PASSWORD || 'teacher123';
  if (clean !== expectedPass) return [];
  const { results } = await env.DB.prepare(
    "SELECT id, student_name, score, total_questions, answers, created_at FROM homework_submissions WHERE lesson_id = ? ORDER BY created_at DESC"
  ).bind(lessonId).all();
  return results || [];
}
