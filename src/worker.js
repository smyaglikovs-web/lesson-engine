import { ensureTables } from './db/schema.js';
import { 
  getLessons, 
  saveLesson, 
  getSingleLesson, 
  deleteLesson,
  getFolders,
  createFolder,
  deleteFolder 
} from './api/lessons.js';
import { authenticateTeacher, isRequestAuthorized, checkRateLimit } from './api/auth.js';
import { 
  generateFullLessonWithAI, 
  transformBlockWithAI, 
  fetchYouTubeTranscriptNative, 
  evaluateOpenInputWithAI,
  generatePodcastAudioWithAI,
  scanDocumentAndBuildLesson
} from './api/ai.js';
import { submitHomework, getHomeworkSubmissions, getStudentsDirectory } from './api/homework.js';
import { 
  createRoomSession, 
  getRoomState, 
  updateTeacherBroadcast, 
  recordStudentPresence, 
  saveStudentAnswer,
  resetRoomState
} from './api/rooms.js';

const JSON_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-teacher-password',
  'Content-Type': 'application/json; charset=utf-8'
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

// ---------------------------------------------------------------------------
// NATIVE WEB CRYPTO & ROBUST BASE64URL HELPERS (WITH AUTO-PADDING)
// ---------------------------------------------------------------------------
function base64UrlEncode(str) {
  return btoa(str).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecode(str) {
  let b64 = (str || '').replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4 !== 0) {
    b64 += '=';
  }
  return atob(b64);
}

async function hashPassword(password, salt = 'lesson-engine-salt-2026') {
  const enc = new TextEncoder();
  const data = enc.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function createToken(payload, secret = 'lesson-engine-jwt-secret-key-2026') {
  const header = { alg: 'HS256', typ: 'JWT' };
  const unsigned = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(unescape(encodeURIComponent(JSON.stringify(payload))))}`;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(unsigned));
  const sigB64 = base64UrlEncode(String.fromCharCode(...new Uint8Array(sig)));
  return `${unsigned}.${sigB64}`;
}

async function verifyToken(token, secret = 'lesson-engine-jwt-secret-key-2026') {
  try {
    const [h, p, s] = (token || '').split('.');
    if (!h || !p || !s) return null;
    const unsigned = `${h}.${p}`;
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const rawSig = Uint8Array.from(base64UrlDecode(s), c => c.charCodeAt(0));
    const valid = await crypto.subtle.verify('HMAC', key, rawSig, enc.encode(unsigned));
    if (!valid) return null;
    return JSON.parse(decodeURIComponent(escape(base64UrlDecode(p))));
  } catch (e) {
    console.error('verifyToken error:', e);
    return null;
  }
}

async function ensureMultiplayerTables(env) {
  if (!env.DB) return;
  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        role TEXT NOT NULL CHECK(role IN ('teacher', 'student', 'admin')),
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at INTEGER DEFAULT (cast(strftime('%s','now') as int))
      );
    `).run();

    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS dictionary (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        word TEXT NOT NULL,
        translation TEXT,
        example TEXT,
        next_review_date INTEGER,
        created_at INTEGER DEFAULT (cast(strftime('%s','now') as int))
      );
    `).run();

    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS room_shared_answers (
        room_id TEXT NOT NULL,
        block_id TEXT NOT NULL,
        answer_json TEXT NOT NULL,
        updated_at INTEGER DEFAULT (cast(strftime('%s','now') as int)),
        PRIMARY KEY (room_id, block_id)
      );
    `).run();

    try {
      await env.DB.prepare("ALTER TABLE lessons ADD COLUMN teacher_id TEXT").run();
    } catch (err) {}
  } catch (e) {
    console.error('Auto migration notice:', e);
  }
}

// DYNAMIC HELPER TO FIND STUDENTS BELONGING TO A SPECIFIC TEACHER
async function getTeacherStudentNames(env, teacherId) {
  if (!env.DB || !teacherId) return [];

  try {
    const tablesRes = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    const tableNames = (tablesRes.results || []).map(t => t.name);

    let subTable = null;
    for (const candidate of ['homework', 'submissions', 'homework_submissions']) {
      if (tableNames.includes(candidate)) {
        subTable = candidate;
        break;
      }
    }

    if (!subTable) return [];

    const colsRes = await env.DB.prepare(`PRAGMA table_info(${subTable})`).all();
    const colNames = (colsRes.results || []).map(c => c.name);

    const studentCol = colNames.includes('student_name') ? 'student_name' : (colNames.includes('studentName') ? 'studentName' : null);
    const lessonCol = colNames.includes('lesson_id') ? 'lesson_id' : (colNames.includes('lessonId') ? 'lessonId' : null);

    if (!studentCol || !lessonCol) return [];

    const query = `
      SELECT DISTINCT ${studentCol} as student_name
      FROM ${subTable}
      WHERE ${lessonCol} IN (SELECT id FROM lessons WHERE teacher_id = ?)
    `;
    const { results } = await env.DB.prepare(query).bind(teacherId).all();
    return (results || []).map(r => r.student_name).filter(Boolean);
  } catch (err) {
    console.error('getTeacherStudentNames error:', err);
    return [];
  }
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: JSON_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const clientIp = request.headers.get('cf-connecting-ip') || '127.0.0.1';

    // 1. SPA FALLBACK FOR DIRECT PAGE VISITS
    if (!path.startsWith('/api/')) {
      if (env.ASSETS) {
        const assetResponse = await env.ASSETS.fetch(request);
        if (assetResponse.status === 404) {
          const indexRequest = new Request(new URL('/', request.url), request);
          return env.ASSETS.fetch(indexRequest);
        }
        return assetResponse;
      }
    }

    try {
      await ensureTables(env);
      await ensureMultiplayerTables(env);

      // AUTH: REGISTRATION & LOGIN
      if (path === '/api/auth/register' && method === 'POST') {
        const { email, password, name, role = 'student' } = await request.json();
        if (!email || !password || !name) {
          return jsonResponse({ error: 'Пожалуйста, заполните все поля' }, 400);
        }

        const cleanEmail = email.trim().toLowerCase();
        const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(cleanEmail).first();
        if (existing) {
          return jsonResponse({ error: 'Пользователь с таким email уже зарегистрирован' }, 400);
        }

        const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const passHash = await hashPassword(password);
        const userRole = role === 'teacher' ? 'teacher' : 'student';

        await env.DB.prepare(
          'INSERT INTO users (id, role, email, password_hash, name) VALUES (?, ?, ?, ?, ?)'
        ).bind(userId, userRole, cleanEmail, passHash, name.trim()).run();

        const userPayload = { id: userId, email: cleanEmail, name: name.trim(), role: userRole, isMaster: false };
        const token = await createToken(userPayload);

        return jsonResponse({ success: true, token, user: userPayload });
      }

      if (path === '/api/auth/login' && method === 'POST') {
        const { email, password, role } = await request.json();
        if (!email || !password) {
          return jsonResponse({ error: 'Введите email и пароль' }, 400);
        }

        const cleanEmail = email.trim().toLowerCase();
        const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(cleanEmail).first();
        if (!user) {
          return jsonResponse({ error: 'Неверный email или пароль' }, 401);
        }

        const passHash = await hashPassword(password);
        if (passHash !== user.password_hash) {
          return jsonResponse({ error: 'Неверный email или пароль' }, 401);
        }

        let userRole = user.role;
        if (role && (role === 'teacher' || role === 'student')) {
          userRole = role;
          if (role !== user.role && user.role !== 'admin') {
            await env.DB.prepare('UPDATE users SET role = ? WHERE id = ?').bind(userRole, user.id).run().catch(() => {});
          }
        }

        const isMaster = userRole === 'admin' || user.role === 'admin';
        const userPayload = { id: user.id, email: user.email, name: user.name, role: userRole, isMaster };
        const token = await createToken(userPayload);

        return jsonResponse({ success: true, token, user: userPayload });
      }

      if (path === '/api/auth/me' && method === 'GET') {
        const authHeader = request.headers.get('Authorization') || '';
        const token = authHeader.replace(/^Bearer\s+/i, '');
        const verified = await verifyToken(token);
        if (!verified) return jsonResponse({ error: 'Unauthorized' }, 401);
        return jsonResponse({ success: true, user: verified });
      }

      // MASTER PASSWORD LOGIN: GRANTS PERMANENT OWNER / MASTER ACCESS TO ALL LESSONS & STUDENTS
      if (path === '/api/teacher/login' && method === 'POST') {
        const body = await request.json();
        const res = await authenticateTeacher(env, body.password);
        if (res.success) {
          const masterUser = { 
            id: 'master_owner', 
            role: 'admin', 
            isMaster: true, 
            name: 'Владелец (Master)' 
          };
          const masterToken = await createToken(masterUser);
          return jsonResponse({ success: true, token: masterToken, user: masterUser });
        }
        return jsonResponse({ error: 'Invalid password' }, 401);
      }

      // RESOLVE USER CONTEXT & MASTER STATUS
      const authHeader = request.headers.get('Authorization') || '';
      const token = authHeader.replace(/^Bearer\s+/i, '');
      const userContext = await verifyToken(token);
      
      const isMasterUser = Boolean(userContext?.isMaster || userContext?.role === 'admin' || (await isRequestAuthorized(request, env)));
      const isTeacherRole = Boolean(userContext?.role === 'teacher' || isMasterUser);
      const isTeacherAuthorized = isTeacherRole;

      // PERSONAL DICTIONARY
      if (path === '/api/dictionary' && method === 'GET') {
        const studentId = url.searchParams.get('studentId') || '';
        let stmt;
        if (studentId) {
          stmt = env.DB.prepare('SELECT * FROM dictionary WHERE student_id = ? ORDER BY created_at DESC').bind(studentId);
        } else {
          stmt = env.DB.prepare('SELECT * FROM dictionary ORDER BY created_at DESC LIMIT 100');
        }
        const { results } = await stmt.all();
        return jsonResponse(results || []);
      }

      if (path === '/api/dictionary/add' && method === 'POST') {
        const { studentId = 'guest', word, translation, example = '' } = await request.json();
        if (!word) return jsonResponse({ error: 'Word is required' }, 400);

        const dictId = `dict_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await env.DB.prepare(`
          INSERT INTO dictionary (id, student_id, word, translation, example)
          VALUES (?, ?, ?, ?, ?)
        `).bind(dictId, studentId, word.trim(), translation || '', example || '').run();

        return jsonResponse({ success: true, id: dictId });
      }

      if (path.startsWith('/api/dictionary/') && method === 'DELETE') {
        const dictId = path.split('/')[3];
        await env.DB.prepare('DELETE FROM dictionary WHERE id = ?').bind(dictId).run();
        return jsonResponse({ success: true });
      }

      // STUDENT HOMEWORK HISTORY
      if (path === '/api/student/history' && method === 'GET') {
        const studentName = url.searchParams.get('studentName') || '';
        if (!studentName) return jsonResponse([]);

        const { results } = await env.DB.prepare(`
          SELECT h.*, l.title as lesson_title, l.level as lesson_level
          FROM homework h
          LEFT JOIN lessons l ON h.lesson_id = l.id
          WHERE h.student_name = ?
          ORDER BY h.created_at DESC
        `).bind(studentName).all();

        return jsonResponse(results || []);
      }

      // AI ENDPOINTS
      if (path.startsWith('/api/ai/')) {
        const rateCheck = checkRateLimit(clientIp, 25, 60000);
        if (!rateCheck.allowed) {
          return jsonResponse({ error: `Слишком много запросов. Подождите ${rateCheck.resetInSeconds} сек.` }, 429);
        }

        if (path === '/api/ai/generate' && method === 'POST') {
          const payload = await request.json();
          const res = await generateFullLessonWithAI(env, payload);
          return res.error ? jsonResponse({ error: res.error }, 500) : jsonResponse(res);
        }

        if (path === '/api/ai/transform-block' && method === 'POST') {
          const payload = await request.json();
          const res = await transformBlockWithAI(env, payload);
          return res.error ? jsonResponse({ error: res.error }, 500) : jsonResponse(res);
        }

        if (path === '/api/ai/generate-podcast' && method === 'POST') {
          const payload = await request.json();
          const res = await generatePodcastAudioWithAI(env, payload);
          return res.error ? jsonResponse({ error: res.error }, 500) : jsonResponse(res);
        }

        if (path === '/api/ai/scan-doc' && method === 'POST') {
          const payload = await request.json();
          const res = await scanDocumentAndBuildLesson(env, payload);
          return res.error ? jsonResponse({ error: res.error }, 500) : jsonResponse(res);
        }
      }

      if (path === '/api/homework/evaluate-open-input' && method === 'POST') {
        const rateCheck = checkRateLimit(clientIp, 20, 60000);
        if (!rateCheck.allowed) {
          return jsonResponse({ error: `Лимит исчерпан. Подождите ${rateCheck.resetInSeconds} сек.` }, 429);
        }
        const payload = await request.json();
        const evaluation = await evaluateOpenInputWithAI(env, payload);
        return jsonResponse(evaluation);
      }

      if (path === '/api/youtube/transcript' && method === 'POST') {
        const { url: ytUrl } = await request.json();
        if (!ytUrl) return jsonResponse({ error: 'No URL provided' }, 400);

        const data = await fetchYouTubeTranscriptNative(ytUrl);
        if (data && (data.transcript || data.title)) {
          return jsonResponse({ success: true, transcript: data.transcript, title: data.title });
        }
        return jsonResponse({ success: false, message: 'Subtitles not found.' });
      }

      // FOLDERS
      if (path === '/api/folders' && method === 'GET') {
        const list = await getFolders(env);
        return jsonResponse(list);
      }

      // ---------------------------------------------------------------------
      // LESSONS SCOPE:
      // MASTER (OWNER) GETS ALL 48 LESSONS BY DEFAULT!
      // ONLY REGULAR TEACHERS (LIKE PEDRO) ARE FILTERED BY TEACHER_ID.
      // ---------------------------------------------------------------------
      if (path === '/api/lessons' && method === 'GET') {
        if (!isTeacherAuthorized) return jsonResponse({ error: 'Доступ запрещен: требуется вход преподавателя' }, 403);
        const level = url.searchParams.get('level') || '';
        const folder = url.searchParams.get('folder') || '';
        const search = url.searchParams.get('search') || '';
        const scope = url.searchParams.get('scope') || '';

        let list = await getLessons(env, { level, folder, search });

        // ONLY filter if this is an explicitly regular teacher (not Master)
        const isRegularTeacher = userContext && userContext.role === 'teacher' && !userContext.isMaster && userContext.id !== 'master_owner';

        if (isRegularTeacher && userContext?.id) {
          try {
            const { results } = await env.DB.prepare(
              "SELECT id FROM lessons WHERE teacher_id = ?"
            ).bind(userContext.id).all();
            const allowedIds = new Set((results || []).map(r => r.id));
            list = (list || []).filter(l => allowedIds.has(l.id));
          } catch (e) {
            list = [];
          }
        } else if (isMasterUser && scope === 'my') {
          // If Master specifically clicked "Мои личные уроки"
          try {
            const { results } = await env.DB.prepare(
              "SELECT id FROM lessons WHERE teacher_id = 'master_owner' OR teacher_id IS NULL"
            ).all();
            const masterIds = new Set((results || []).map(r => r.id));
            list = (list || []).filter(l => masterIds.has(l.id));
          } catch (e) {}
        }
        // Otherwise: Return ALL 48 lessons!

        return jsonResponse(list || []);
      }

      if (path.startsWith('/api/lessons/') && method === 'GET') {
        const id = path.split('/')[3];
        const lesson = await getSingleLesson(env, id);
        return lesson ? jsonResponse(lesson) : jsonResponse({ error: 'Lesson not found' }, 404);
      }

      // SAVE LESSON
      if (path === '/api/lessons' && method === 'POST') {
        if (!isTeacherAuthorized) return jsonResponse({ error: 'Доступ запрещен: требуется вход' }, 403);
        const lesson = await request.json();
        
        const ownerId = isMasterUser ? 'master_owner' : (userContext?.id || 'master_owner');
        lesson.teacher_id = ownerId;

        const res = await saveLesson(env, lesson);

        if (env.DB && lesson.id) {
          await env.DB.prepare("UPDATE lessons SET teacher_id = ? WHERE id = ?")
            .bind(ownerId, lesson.id)
            .run()
            .catch(() => {});
        }

        return res.error ? jsonResponse({ error: res.error }, 400) : jsonResponse(res);
      }

      if (path.startsWith('/api/lessons/') && method === 'DELETE') {
        if (!isTeacherAuthorized) return jsonResponse({ error: 'Доступ запрещен: требуется вход' }, 403);
        const id = path.split('/')[3];
        const res = await deleteLesson(env, id);
        return res.error ? jsonResponse({ error: res.error }, 400) : jsonResponse(res);
      }

      if (path === '/api/folders' && method === 'POST') {
        if (!isTeacherAuthorized) return jsonResponse({ error: 'Доступ запрещен: требуется вход' }, 403);
        const { name } = await request.json();
        const res = await createFolder(env, name);
        return res.error ? jsonResponse({ error: res.error }, 400) : jsonResponse(res);
      }

      if (path.startsWith('/api/folders/') && method === 'DELETE') {
        if (!isTeacherAuthorized) return jsonResponse({ error: 'Доступ запрещен: требуется вход' }, 403);
        const folderId = path.split('/')[3];
        const res = await deleteFolder(env, folderId);
        return jsonResponse(res);
      }

      // STUDENTS DIRECTORY
      if (path === '/api/students' && method === 'GET') {
        if (!isTeacherAuthorized) return jsonResponse({ error: 'Доступ запрещен: требуется вход' }, 403);
        const allStudents = await getStudentsDirectory(env);

        // ONLY filter for regular teachers! Master sees all 15 students.
        const isRegularTeacher = userContext && userContext.role === 'teacher' && !userContext.isMaster && userContext.id !== 'master_owner';
        
        if (isRegularTeacher && userContext?.id) {
          try {
            const allowedNames = await getTeacherStudentNames(env, userContext.id);
            if (!allowedNames || allowedNames.length === 0) {
              return jsonResponse([]);
            }
            const nameSet = new Set(allowedNames);
            const filteredStudents = (allStudents || []).filter(s => nameSet.has(s.name));
            return jsonResponse(filteredStudents);
          } catch (err) {
            return jsonResponse([]);
          }
        }

        // Master sees all students!
        return jsonResponse(allStudents || []);
      }

      if (path.startsWith('/api/homework/') && method === 'GET') {
        if (!isTeacherAuthorized) return jsonResponse({ error: 'Доступ запрещен: требуется вход' }, 403);
        const lessonId = path.split('/')[3];

        const isRegularTeacher = userContext && userContext.role === 'teacher' && !userContext.isMaster;
        if (isRegularTeacher && userContext?.id) {
          try {
            const lesson = await env.DB.prepare("SELECT teacher_id FROM lessons WHERE id = ?").bind(lessonId).first();
            if (lesson && lesson.teacher_id && lesson.teacher_id !== userContext.id && lesson.teacher_id !== 'master_owner') {
              return jsonResponse({ error: 'Доступ запрещен к чужому уроку' }, 403);
            }
          } catch (e) {}
        }

        const list = await getHomeworkSubmissions(env, lessonId);
        return jsonResponse(list);
      }

      if (path === '/api/homework/submit' && method === 'POST') {
        const payload = await request.json();
        const res = await submitHomework(env, payload);
        return jsonResponse(res);
      }

      // ROOM SESSION ENDPOINTS
      if (path === '/api/rooms/create' && method === 'POST') {
        if (!isTeacherAuthorized) return jsonResponse({ error: 'Доступ запрещен: требуется вход преподавателя' }, 403);
        const { lessonId } = await request.json();
        if (!lessonId) return jsonResponse({ error: 'Lesson ID is required' }, 400);
        const res = await createRoomSession(env, lessonId);
        return jsonResponse(res);
      }

      if (path.match(/\/api\/rooms\/[^/]+\/state$/) && method === 'GET') {
        const roomId = path.split('/')[3];
        const state = await getRoomState(env, roomId);

        if (env.DB && state) {
          try {
            const { results } = await env.DB.prepare(
              'SELECT block_id, answer_json FROM room_shared_answers WHERE room_id = ?'
            ).bind(roomId).all();

            const shared = {};
            (results || []).forEach(r => {
              try {
                shared[r.block_id] = JSON.parse(r.answer_json);
              } catch (e) {}
            });
            state.sharedAnswers = shared;
          } catch (e) {
            console.error('Shared state error:', e);
          }
        }

        return jsonResponse(state);
      }

      if (path.match(/\/api\/rooms\/[^/]+\/broadcast$/) && method === 'POST') {
        if (!isTeacherAuthorized) return jsonResponse({ error: 'Доступ запрещен: требуется вход преподавателя' }, 403);
        const roomId = path.split('/')[3];
        const payload = await request.json();
        const res = await updateTeacherBroadcast(env, roomId, payload);
        return jsonResponse(res);
      }

      if (path.match(/\/api\/rooms\/[^/]+\/reset$/) && method === 'POST') {
        if (!isTeacherAuthorized) return jsonResponse({ error: 'Доступ запрещен: требуется вход преподавателя' }, 403);
        const roomId = path.split('/')[3];
        if (env.DB) {
          await env.DB.prepare('DELETE FROM room_shared_answers WHERE room_id = ?').bind(roomId).run().catch(() => {});
        }
        const res = await resetRoomState(env, roomId);
        return jsonResponse(res);
      }

      if (path.match(/\/api\/rooms\/[^/]+\/heartbeat$/) && method === 'POST') {
        const roomId = path.split('/')[3];
        const { studentId, studentName } = await request.json();
        const res = await recordStudentPresence(env, roomId, studentId, studentName);
        return jsonResponse(res);
      }

      if (path.match(/\/api\/rooms\/[^/]+\/answer$/) && method === 'POST') {
        const roomId = path.split('/')[3];
        const { studentId, blockId, answer } = await request.json();

        if (env.DB && blockId) {
          try {
            await env.DB.prepare(`
              INSERT INTO room_shared_answers (room_id, block_id, answer_json, updated_at)
              VALUES (?, ?, ?, cast(strftime('%s','now') as int))
              ON CONFLICT(room_id, block_id) DO UPDATE SET
                answer_json = excluded.answer_json,
                updated_at = excluded.updated_at
            `).bind(roomId, blockId, JSON.stringify(answer)).run();
          } catch (e) {
            console.error('Error saving shared answer:', e);
          }
        }

        const res = await saveStudentAnswer(env, roomId, studentId || 'teacher', blockId, answer);
        return jsonResponse(res || { success: true });
      }

      if (!path.startsWith('/api/') && env.ASSETS) {
        return env.ASSETS.fetch(request);
      }

      return jsonResponse({ error: 'Endpoint not found: ' + path }, 404);
    } catch (err) {
      console.error('Worker Router Error:', err);
      return jsonResponse({ error: err.message || 'Internal Server Error' }, 500);
    }
  }
};
