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
// NATIVE WEB CRYPTO HELPERS (ZERO EXTERNAL DEPENDENCIES)
// ---------------------------------------------------------------------------
async function hashPassword(password, salt = 'lesson-engine-salt-2026') {
  const enc = new TextEncoder();
  const data = enc.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function createToken(payload, secret = 'lesson-engine-jwt-secret-key-2026') {
  const header = { alg: 'HS256', typ: 'JWT' };
  const enc = new TextEncoder();
  const b64 = (obj) => btoa(unescape(encodeURIComponent(JSON.stringify(obj)))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const unsigned = `${b64(header)}.${b64(payload)}`;

  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(unsigned));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
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
    const rawSig = Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    const valid = await crypto.subtle.verify('HMAC', key, rawSig, enc.encode(unsigned));
    if (!valid) return null;
    return JSON.parse(decodeURIComponent(escape(atob(p.replace(/-/g, '+').replace(/_/g, '/')))));
  } catch (e) {
    return null;
  }
}

// Ensure modern multi-account tables exist automatically in D1
async function ensureMultiplayerTables(env) {
  if (!env.DB) return;
  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        role TEXT NOT NULL CHECK(role IN ('teacher', 'student')),
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
  } catch (e) {
    console.error('Auto migration notice:', e);
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

    try {
      await ensureTables(env);
      await ensureMultiplayerTables(env);

      // ---------------------------------------------------------------------
      // 1. UNIFIED AUTHENTICATION (STUDENT & TEACHER REGISTRATION & LOGIN)
      // ---------------------------------------------------------------------
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

        const userPayload = { id: userId, email: cleanEmail, name: name.trim(), role: userRole };
        const token = await createToken(userPayload);

        return jsonResponse({ success: true, token, user: userPayload });
      }

      if (path === '/api/auth/login' && method === 'POST') {
        const { email, password } = await request.json();
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

        const userPayload = { id: user.id, email: user.email, name: user.name, role: user.role };
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

      // BACKWARD-COMPATIBLE TEACHER LOGIN (PRESERVES EXISTING SETUP)
      if (path === '/api/teacher/login' && method === 'POST') {
        const body = await request.json();
        const res = await authenticateTeacher(env, body.password);
        return res.success ? jsonResponse(res) : jsonResponse({ error: 'Invalid password' }, 401);
      }

      // ---------------------------------------------------------------------
      // 2. PERSONAL DICTIONARY (FLASHCARD WORD SAVER)
      // ---------------------------------------------------------------------
      if (path === '/api/dictionary' && method === 'GET') {
        const studentId = url.searchParams.get('studentId') || '';
        let query = 'SELECT * FROM dictionary';
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

      // ---------------------------------------------------------------------
      // 3. STUDENT HOMEWORK HISTORY
      // ---------------------------------------------------------------------
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

      // ---------------------------------------------------------------------
      // 4. EXISTING TEACHER AUTHORIZATION CHECK
      // ---------------------------------------------------------------------
      const isTeacherAuthorized = await isRequestAuthorized(request, env);

      // AI ENDPOINTS (RATE LIMITED)
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

      // FOLDERS & LESSONS (READ)
      if (path === '/api/folders' && method === 'GET') {
        const list = await getFolders(env);
        return jsonResponse(list);
      }

      if (path === '/api/lessons' && method === 'GET') {
        const level = url.searchParams.get('level') || '';
        const folder = url.searchParams.get('folder') || '';
        const search = url.searchParams.get('search') || '';
        const list = await getLessons(env, { level, folder, search });
        return jsonResponse(list);
      }

      if (path.startsWith('/api/lessons/') && method === 'GET') {
        const id = path.split('/')[3];
        const lesson = await getSingleLesson(env, id);
        return lesson ? jsonResponse(lesson) : jsonResponse({ error: 'Lesson not found' }, 404);
      }

      // TEACHER-PROTECTED MUTATING ENDPOINTS (JWT SECURED)
      if (path === '/api/lessons' && method === 'POST') {
        if (!isTeacherAuthorized) return jsonResponse({ error: 'Доступ запрещен: требуется вход' }, 403);
        const lesson = await request.json();
        const res = await saveLesson(env, lesson);
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

      if (path === '/api/students' && method === 'GET') {
        if (!isTeacherAuthorized) return jsonResponse({ error: 'Доступ запрещен: требуется вход' }, 403);
        const students = await getStudentsDirectory(env);
        return jsonResponse(students);
      }

      if (path.startsWith('/api/homework/') && method === 'GET') {
        if (!isTeacherAuthorized) return jsonResponse({ error: 'Доступ запрещен: требуется вход' }, 403);
        const lessonId = path.split('/')[3];
        const list = await getHomeworkSubmissions(env, lessonId);
        return jsonResponse(list);
      }

      // PUBLIC HOMEWORK SUBMISSION
      if (path === '/api/homework/submit' && method === 'POST') {
        const payload = await request.json();
        const res = await submitHomework(env, payload);
        return jsonResponse(res);
      }

      // CLASSROOM ROOM SESSION ENDPOINTS
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
        const res = await saveStudentAnswer(env, roomId, studentId, blockId, answer);
        return jsonResponse(res);
      }

      return jsonResponse({ error: 'Endpoint not found: ' + path }, 404);
    } catch (err) {
      console.error('Worker Router Error:', err);
      return jsonResponse({ error: err.message || 'Internal Server Error' }, 500);
    }
  }
};
