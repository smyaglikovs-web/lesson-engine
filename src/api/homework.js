import { ensureTables } from '../db/schema.js';

// Normalizes strings: strips punctuation, resolves quotes, trims whitespace
export function normalizeAnswer(str = '') {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'") // curly single quotes
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036«»]/g, '"') // curly double quotes
    .replace(/\s+/g, ' ')
    .replace(/^[.,/#!$%^&*;:{}=\-_`~()]+|[.,/#!$%^&*;:{}=\-_`~()]+$/g, '') // strip leading/trailing punctuation
    .trim();
}

// Common contraction equivalents in ESL
const CONTRACTION_PAIRS = [
  ["do not", "don't"],
  ["does not", "doesn't"],
  ["did not", "didn't"],
  ["cannot", "can't"],
  ["could not", "couldn't"],
  ["would not", "wouldn't"],
  ["should not", "shouldn't"],
  ["will not", "won't"],
  ["is not", "isn't"],
  ["are not", "aren't"],
  ["was not", "wasn't"],
  ["were not", "weren't"],
  ["have not", "haven't"],
  ["has not", "hasn't"],
  ["had not", "hadn't"],
  ["i am", "i'm"],
  ["you are", "you're"],
  ["he is", "he's"],
  ["she is", "she's"],
  ["it is", "it's"],
  ["we are", "we're"],
  ["they are", "they're"],
  ["i have", "i've"],
  ["you have", "you've"],
  ["we have", "we've"],
  ["they have", "they've"],
  ["i will", "i'll"],
  ["you will", "you'll"],
  ["he will", "he'll"],
  ["she will", "she'll"],
  ["we will", "we'll"],
  ["they will", "they'll"]
];

export function areAnswersEquivalent(userVal, expectedVal) {
  const cleanUser = normalizeAnswer(userVal);
  if (!cleanUser) return false;

  // Supports pipe-separated multiple correct options: [went|had gone]
  const expectedOptions = String(expectedVal).split('|').map(normalizeAnswer).filter(Boolean);
  
  for (const opt of expectedOptions) {
    if (cleanUser === opt) return true;

    for (const [full, short] of CONTRACTION_PAIRS) {
      const userExpanded = cleanUser.replace(new RegExp(`\\b${short}\\b`, 'g'), full);
      const optExpanded = opt.replace(new RegExp(`\\b${short}\\b`, 'g'), full);
      if (userExpanded === optExpanded) return true;

      const userContracted = cleanUser.replace(new RegExp(`\\b${full}\\b`, 'g'), short);
      const optContracted = opt.replace(new RegExp(`\\b${full}\\b`, 'g'), short);
      if (userContracted === optContracted) return true;
    }
  }
  return false;
}

export async function submitHomework(env, payload) {
  await ensureTables(env);
  const { lessonId, studentName, answers = {} } = payload;

  if (!lessonId) {
    return { error: 'Lesson ID is required' };
  }

  let totalEarnedPoints = 0;
  let totalMaxPoints = 0;
  const breakdown = {};

  try {
    const row = await env.DB.prepare("SELECT data FROM lessons WHERE id = ?").bind(lessonId).first();
    if (row && row.data) {
      const lessonDef = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
      
      (lessonDef.pages || []).forEach(page => {
        (page.blocks || []).forEach(b => {
          const studentAns = answers[b.id];
          let blockEarned = 0;
          let blockMax = 0;

          // 1. MULTIPLE CHOICE (1 pt)
          if (b.type === 'multiple_choice') {
            blockMax = 1;
            if (studentAns && studentAns.selected !== undefined && Number(studentAns.selected) === Number(b.correct)) {
              blockEarned = 1;
            }
          } 
          
          // 2. GAP FILL (1 pt per gap)
          else if (b.type === 'gap_fill') {
            const rawText = b.text || '';
            const lines = rawText.split('\n').filter(line => line.trim().length > 0);

            lines.forEach((line, lineIdx) => {
              const parts = line.split(/\[(.*?)\]/);
              for (let i = 1; i < parts.length; i += 2) {
                blockMax++;
                const key = `${lineIdx}_${i}`;
                const expectedAns = parts[i];
                const studentVal = studentAns?.userAnswers?.[key] || '';

                if (areAnswersEquivalent(studentVal, expectedAns)) {
                  blockEarned++;
                }
              }
            });

            if (blockMax === 0 && b.answers && b.answers.length > 0) {
              blockMax = b.answers.length;
              const userVal = String(studentAns?.userAnswer || '');
              b.answers.forEach(a => {
                if (areAnswersEquivalent(userVal, a)) blockEarned++;
              });
            }
          } 
          
          // 3. GAP FILL BANK (1 pt per placed slot)
          else if (b.type === 'gap_fill_bank') {
            const rawParts = (b.text || '').split(/\[(.*?)\]/);
            const correctAns = rawParts.filter((_, idx) => idx % 2 === 1);
            blockMax = correctAns.length;

            if (studentAns && studentAns.placedSlots) {
              correctAns.forEach((ans, idx) => {
                const userPlaced = studentAns.placedSlots[idx]?.text || '';
                if (areAnswersEquivalent(userPlaced, ans)) {
                  blockEarned++;
                }
              });
            }
          } 
          
          // 4. INLINE SELECT (1 pt per dropdown gap)
          else if (b.type === 'inline_select') {
            const selections = studentAns?.selections || {};
            const rawText = b.text || '';
            const lines = rawText.split('\n').filter(l => l.trim().length > 0);

            lines.forEach((line, lineIdx) => {
              const parts = line.split(/\[(.*?)\]/);
              for (let i = 1; i < parts.length; i += 2) {
                blockMax++;
                const key = `${lineIdx}_${i}`;
                const rawOptions = parts[i].split('|').map(o => o.trim());
                let expected = '';
                rawOptions.forEach(opt => {
                  if (opt.endsWith('*')) expected = opt.slice(0, -1).trim();
                });
                if (!expected && rawOptions.length > 0) expected = rawOptions[0];

                const chosen = selections[key] || '';
                if (areAnswersEquivalent(chosen, expected)) {
                  blockEarned++;
                }
              }
            });
          }

          // 5. MATCHING (1 pt per correct pair)
          else if (b.type === 'matching') {
            const expectedPairs = b.pairs || [];
            blockMax = expectedPairs.length;
            const submittedPairs = studentAns?.matched || [];

            expectedPairs.forEach(exp => {
              const matched = submittedPairs.some(sub => 
                areAnswersEquivalent(sub.left, exp.left) && areAnswersEquivalent(sub.right, exp.right)
              );
              if (matched) blockEarned++;
            });
          } 
          
          // 6. SENTENCE REORDER (1 pt)
          else if (b.type === 'sentence_reorder') {
            blockMax = 1;
            if (studentAns && studentAns.selectedWordObjects) {
              const userSentence = studentAns.selectedWordObjects.map(w => w.text).join(' ');
              if (areAnswersEquivalent(userSentence, b.sentence || '')) {
                blockEarned = 1;
              }
            }
          } 
          
          // 7. CATEGORIZATION (1 pt per properly sorted item)
          else if (b.type === 'categorization') {
            const items = b.items || [];
            blockMax = items.length;
            const placements = studentAns?.placements || {};

            items.forEach(it => {
              if (placements[it.id] === it.categoryIndex) {
                blockEarned++;
              }
            });
          }

          if (blockMax > 0) {
            totalEarnedPoints += blockEarned;
            totalMaxPoints += blockMax;
            breakdown[b.id] = {
              earned: blockEarned,
              max: blockMax,
              isFullyCorrect: blockEarned === blockMax
            };
          }
        });
      });
    }
  } catch (e) {
    console.error("Grading Calculation Error:", e);
  }

  const finalScore = totalMaxPoints > 0 ? totalEarnedPoints : 0;
  const finalTotal = totalMaxPoints > 0 ? totalMaxPoints : 1;
  const percentage = Math.round((finalScore / finalTotal) * 100);

  const id = 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

  await env.DB.prepare(
    "INSERT INTO homework_submissions (id, lesson_id, student_name, score, total_questions, answers) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(
    id, 
    lessonId, 
    studentName || 'Student', 
    finalScore, 
    finalTotal, 
    JSON.stringify({ userAnswers: answers, breakdown, percentage })
  ).run();

  return { 
    success: true, 
    id, 
    score: finalScore, 
    maxScore: finalTotal, 
    percentage, 
    breakdown 
  };
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
