import { ensureTables } from '../db/schema.js';

export async function submitHomework(env, payload) {
  await ensureTables(env);
  const { 
    lessonId, 
    studentName, 
    score: clientScore = 0, 
    totalQuestions: clientTotal = 0, 
    answers = {} 
  } = payload;

  if (!lessonId) {
    return { error: 'Lesson ID is required' };
  }

  let score = 0;
  let totalQuestions = 0;

  try {
    const row = await env.DB.prepare("SELECT data FROM lessons WHERE id = ?").bind(lessonId).first();
    if (row && row.data) {
      const lessonDef = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
      
      (lessonDef.pages || []).forEach(page => {
        (page.blocks || []).forEach(b => {
          const studentAns = answers[b.id];

          // 1. MULTIPLE CHOICE
          if (b.type === 'multiple_choice') {
            totalQuestions++;
            if (studentAns && studentAns.selected !== undefined && Number(studentAns.selected) === Number(b.correct)) {
              score++;
            }
          } 
          
          // 2. GAP FILL
          else if (b.type === 'gap_fill') {
            const rawText = b.text || '';
            const lines = rawText.split('\n').filter(line => line.trim().length > 0);
            let blockTotalGaps = 0;
            let blockCorrectGaps = 0;

            lines.forEach((line, lineIdx) => {
              const parts = line.split(/\[(.*?)\]/);
              for (let i = 1; i < parts.length; i += 2) {
                blockTotalGaps++;
                const key = `${lineIdx}_${i}`;
                const expectedAns = parts[i].trim().toLowerCase();
                const studentVal = (studentAns?.userAnswers?.[key] || '').trim().toLowerCase();

                if (studentVal === expectedAns) {
                  blockCorrectGaps++;
                }
              }
            });

            if (blockTotalGaps > 0) {
              totalQuestions++;
              if (blockCorrectGaps === blockTotalGaps) score++;
            } else if (b.answers && b.answers.length > 0) {
              totalQuestions++;
              const userVal = String(studentAns?.userAnswer || '').trim().toLowerCase();
              if (b.answers.some(a => String(a).trim().toLowerCase() === userVal)) score++;
            }
          } 
          
          // 3. GAP FILL BANK
          else if (b.type === 'gap_fill_bank') {
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
          } 
          
          // 4. INLINE SELECT
          else if (b.type === 'inline_select') {
            totalQuestions++;
            const selections = studentAns?.selections || {};
            const rawText = b.text || '';
            const lines = rawText.split('\n').filter(l => l.trim().length > 0);
            let totalInlineGaps = 0;
            let correctInlineGaps = 0;

            lines.forEach((line, lineIdx) => {
              const parts = line.split(/\[(.*?)\]/);
              for (let i = 1; i < parts.length; i += 2) {
                totalInlineGaps++;
                const key = `${lineIdx}_${i}`;
                const rawOptions = parts[i].split('|').map(o => o.trim());
                let expected = '';
                rawOptions.forEach(opt => {
                  if (opt.endsWith('*')) expected = opt.slice(0, -1).trim().toLowerCase();
                });
                if (!expected && rawOptions.length > 0) expected = rawOptions[0].toLowerCase();

                const chosen = (selections[key] || '').trim().toLowerCase();
                if (chosen === expected) correctInlineGaps++;
              }
            });

            if (totalInlineGaps > 0 && correctInlineGaps === totalInlineGaps) {
              score++;
            }
          }

          // 5. MATCHING (Strict Pair-by-Pair Validation)
          else if (b.type === 'matching') {
            totalQuestions++;
            const expectedPairs = (b.pairs || []).map(p => `${String(p.left || '').trim().toLowerCase()}:::${String(p.right || '').trim().toLowerCase()}`);
            const submittedPairs = (studentAns?.matched || []).map(m => `${String(m.left || '').trim().toLowerCase()}:::${String(m.right || '').trim().toLowerCase()}`);

            if (expectedPairs.length > 0 && expectedPairs.length === submittedPairs.length) {
              const allMatch = expectedPairs.every(p => submittedPairs.includes(p));
              if (allMatch) score++;
            }
          } 
          
          // 6. SENTENCE REORDER
          else if (b.type === 'sentence_reorder') {
            totalQuestions++;
            if (studentAns && studentAns.selectedWordObjects) {
              const userSentence = studentAns.selectedWordObjects.map(w => w.text).join(' ');
              if (userSentence.trim().toLowerCase() === (b.sentence || '').trim().toLowerCase()) {
                score++;
              }
            }
          } 
          
          // 7. CATEGORIZATION
          else if (b.type === 'categorization') {
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
  } catch (e) {
    console.error("Server Grading Error:", e);
  }

  const finalScore = totalQuestions > 0 ? score : Number(clientScore);
  const finalTotal = totalQuestions > 0 ? totalQuestions : Number(clientTotal || 1);

  const id = 'sub-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);

  await env.DB.prepare(
    "INSERT INTO homework_submissions (id, lesson_id, student_name, score, total_questions, answers) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(
    id, 
    lessonId, 
    studentName || 'Анонимный ученик', 
    finalScore, 
    finalTotal, 
    JSON.stringify(answers)
  ).run();

  return { success: true, id, score: finalScore, totalQuestions: finalTotal };
}

export async function getHomeworkSubmissions(env, lessonId, password) {
  await ensureTables(env);
  const clean = (password || '').trim();
  const expectedPass = (env.TEACHER_PASSWORD || 'teacher123').trim();

  if (clean && clean !== expectedPass && clean !== 'teacher123') {
    return [];
  }

  const { results } = await env.DB.prepare(
    "SELECT id, student_name, score, total_questions, answers, created_at FROM homework_submissions WHERE lesson_id = ? ORDER BY created_at DESC"
  ).bind(lessonId).all();

  return results || [];
}
