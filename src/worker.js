import { ensureTables } from './db/schema.js';
import { verifyTeacherLogin, getLessons, saveLesson, getSingleLesson, deleteLesson } from './api/lessons.js';
import { generateFullLessonWithAI, transformBlockWithAI, fetchYouTubeTranscriptNative } from './api/ai.js';
import { submitHomework, getHomeworkSubmissions } from './api/homework.js';
import { updateRoomState, getRoomState } from './api/rooms.js';

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
      // Lazy schema initialization
      await ensureTables(env);

      // --- AUTH ROUTER ---
      if (path === '/api/teacher/login' && method === 'POST') {
        const body = await request.json();
        const res = await verifyTeacherLogin(env, body.password);
        return res.success ? jsonResponse({ success: true }) : jsonResponse({ error: 'Invalid password' }, 401);
      }

      // --- AI & TRANSCRIPT ROUTER ---
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

        const data = await fetchYouTubeTranscriptNative(ytUrl, env);
        if (data && (data.transcript || data.title)) {
          return jsonResponse({ success: true, transcript: data.transcript, title: data.title });
        }
        return jsonResponse({ success: false, message: 'Subtitles not found. Please paste transcript manually.' });
      }

      // --- LESSON CRUD ROUTER ---
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

      // --- HOMEWORK ROUTER ---
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

      // --- REALTIME ROOM STATE ROUTER ---
      if (path.match(/\/api\/rooms\/[^/]+\/state/) && method === 'GET') {
        const roomId = path.split('/')[3];
        const state = await getRoomState(env, roomId);
        return jsonResponse(state);
      }

      if (path.match(/\/api\/rooms\/[^/]+\/state/) && method === 'POST') {
        const roomId = path.split('/')[3];
        const { pageIdx = 0, answers = {} } = await request.json();
        const res = await updateRoomState(env, roomId, pageIdx, answers);
        return jsonResponse(res);
      }

      return jsonResponse({ error: 'Endpoint not found: ' + path }, 404);

    } catch (err) {
      console.error('Worker Execution Error:', err);
      return jsonResponse({ error: err.message || 'Internal Server Error' }, 500);
    }
  }
};
