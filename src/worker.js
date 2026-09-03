import { ensureTables } from './db/schema.js';
import { verifyTeacherLogin, getLessons, saveLesson, getSingleLesson, deleteLesson } from './api/lessons.js';
import { generateFullLessonWithAI, transformBlockWithAI, fetchYouTubeTranscriptNative } from './api/ai.js';
import { submitHomework, getHomeworkSubmissions } from './api/homework.js';
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
  'Access-Control-Allow-Headers': 'Content-Type, x-teacher-password',
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

    try {
      await ensureTables(env);

      // AUTH
      if (path === '/api/teacher/login' && method === 'POST') {
        const body = await request.json();
        const res = await verifyTeacherLogin(env, body.password);
        return res.success ? jsonResponse({ success: true }) : jsonResponse({ error: 'Invalid password' }, 401);
      }

      // AI & TRANSCRIPTS
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

      if (path === '/api/youtube/transcript' && method === 'POST') {
        const { url: ytUrl } = await request.json();
        if (!ytUrl) return jsonResponse({ error: 'No URL provided' }, 400);

        const data = await fetchYouTubeTranscriptNative(ytUrl);
        if (data && (data.transcript || data.title)) {
          return jsonResponse({ success: true, transcript: data.transcript, title: data.title });
        }
        return jsonResponse({ success: false, message: 'Subtitles not found.' });
      }

      // LESSONS
      if (path === '/api/lessons' && method === 'GET') {
        const list = await getLessons(env);
        return jsonResponse(list);
      }

      if (path.startsWith('/api/lessons/') && method === 'GET') {
        const id = path.split('/')[3];
        const lesson = await getSingleLesson(env, id);
        return lesson ? jsonResponse(lesson) : jsonResponse({ error: 'Lesson not found' }, 404);
      }

      if (path === '/api/lessons' && method === 'POST') {
        const password = request.headers.get('x-teacher-password');
        const lesson = await request.json();
        const res = await saveLesson(env, lesson, password);
        return res.error ? jsonResponse({ error: res.error }, 403) : jsonResponse(res);
      }

      if (path.startsWith('/api/lessons/') && method === 'DELETE') {
        const id = path.split('/')[3];
        const password = request.headers.get('x-teacher-password');
        const res = await deleteLesson(env, id, password);
        return res.error ? jsonResponse({ error: res.error }, 403) : jsonResponse(res);
      }

      // HOMEWORK
      if (path === '/api/homework/submit' && method === 'POST') {
        const payload = await request.json();
        const res = await submitHomework(env, payload);
        return jsonResponse(res);
      }

      if (path.startsWith('/api/homework/') && method === 'GET') {
        const lessonId = path.split('/')[3];
        const password = request.headers.get('x-teacher-password');
        const list = await getHomeworkSubmissions(env, lessonId, password);
        return jsonResponse(list);
      }

      // ROOMS & REAL-TIME SESSIONS
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
