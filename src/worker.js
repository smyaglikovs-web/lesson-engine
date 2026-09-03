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
import { generateFullLessonWithAI, transformBlockWithAI, fetchYouTubeTranscriptNative, evaluateOpenInputWithAI } from './api/ai.js';
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

      // AUTH LOGIN (JWT ISSUER)
      if (path === '/api/teacher/login' && method === 'POST') {
        const body = await request.json();
        const res = await authenticateTeacher(env, body.password);
        return res.success ? jsonResponse(res) : jsonResponse({ error: 'Invalid password' }, 401);
      }

      // AI ENDPOINTS (RATE LIMITED)
      if (path.startsWith('/api/ai/')) {
        const rateCheck = checkRateLimit(clientIp, 25, 60000);
        if (!rateCheck.allowed) {
          return jsonResponse({ error: `Слишком много запросов. Пожалуйста, подождите ${rateCheck.resetInSeconds} сек.` }, 429);
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
      }

      // AI OPEN INPUT ESSAY EVALUATION
      if (path === '/api/homework/evaluate-open-input' && method === 'POST') {
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
      const isTeacherAuthorized = await isRequestAuthorized(request, env);

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

      // PUBLIC HOMEWORK & ROOMS
      if (path === '/api/homework/submit' && method === 'POST') {
        const payload = await request.json();
        const res = await submitHomework(env, payload);
        return jsonResponse(res);
      }

      if (path === '/api/rooms/create' && method === 'POST') {
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
        const roomId = path.split('/')[3];
        const payload = await request.json();
        const res = await updateTeacherBroadcast(env, roomId, payload);
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

      if (path.match(/\/api\/rooms\/[^/]+\/reset$/) && method === 'POST') {
        const roomId = path.split('/')[3];
        const res = await resetRoomState(env, roomId);
        return jsonResponse(res);
      }

      return jsonResponse({ error: 'Endpoint not found: ' + path }, 404);
    } catch (err) {
      console.error('Worker Router Error:', err);
      return jsonResponse({ error: err.message || 'Internal Server Error' }, 500);
    }
  }
};
