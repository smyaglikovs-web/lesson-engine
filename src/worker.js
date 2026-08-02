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
      await ensureTables(env);

      // 1. TEACHER AUTH LOGIN
      if (path === '/api/teacher/login' && method === 'POST') {
        const body = await request.json();
        const res = await verifyTeacherLogin(env, body.password);
        if (res.success) return jsonResponse({ success: true });
        return jsonResponse({ error: 'Invalid password' }, 401);
      }

      // 2. FULL AI LESSON GENERATOR
      if (path === '/api/ai/generate' && method === 'POST') {
        const payload = await request.json();
        const res = await generateFullLessonWithAI(env, payload);
        if (res.error) return jsonResponse({ error: res.error }, 500);
        return jsonResponse(res);
      }

      // 3. SINGLE BLOCK & CONTEXTUAL AI ASSISTANT
      if (path === '/api/ai/transform-block' && method === 'POST') {
        const payload = await request.json();
        const res = await transformBlockWithAI(env, payload);
        if (res.error) return jsonResponse({ error: res.error }, 500);
        return jsonResponse(res);
      }

      // 4. YOUTUBE TRANSCRIPT SCRAPER
      if (path === '/api/youtube/transcript' && method === 'POST') {
        const { url: ytUrl } = await request.json();
        if (!ytUrl) return jsonResponse({ error: 'No URL provided' }, 400);

        const data = await fetchYouTubeTranscriptNative(ytUrl, env);
        if (data && (data.transcript || data.title)) {
          return jsonResponse({ success: true, transcript: data.transcript, title: data.title });
        }
        return jsonResponse({ success: false, message: 'Subtitles not found. Please paste transcript manually.' });
      }

      // 5. GET ALL LESSONS
      if (path === '/api/lessons' && method === 'GET') {
        const list = await getLessons(env);
        return jsonResponse(list);
      }

      // 6. GET SINGLE LESSON
      if (path.startsWith('/api/lessons/') && method === 'GET') {
        const id = path.split('/')[3];
        const lesson = await getSingleLesson(env, id);
        if (!lesson) return jsonResponse({ error: 'Lesson not found' }, 404);
        return jsonResponse(lesson);
      }

      // 7. SAVE / UPDATE LESSON (POST) - Password Protected
      if (path === '/api/lessons' && method === 'POST') {
        const password = request.headers.get('x-teacher-password');
        const lesson = await request.json();
        const res = await saveLesson(env, lesson, password);
        if (res.error) return jsonResponse({ error: res.error }, 403);
        return jsonResponse(res);
      }

      // 8. DELETE LESSON - Password Protected
      if (path.startsWith('/api/lessons/') && method === 'DELETE') {
        const id = path.split('/')[3];
        const password = request.headers.get('x-teacher-password');
        const res = await deleteLesson(env, id, password);
        if (res.error) return jsonResponse({ error: res.error }, 403);
        return jsonResponse(res);
      }

      // 9. SUBMIT HOMEWORK
      if (path === '/api/homework/submit' && method === 'POST') {
        const payload = await request.json();
        const res = await submitHomework(env, payload);
        return jsonResponse(res);
      }

      // 10. GET HOMEWORK SUBMISSIONS
      if (path.startsWith('/api/homework/') && method === 'GET') {
        const lessonId = path.split('/')[3];
        const password = request.headers.get('x-teacher-password');
        const list = await getHomeworkSubmissions(env, lessonId, password);
        return jsonResponse(list);
      }

      // 11. REALTIME ROOM STATE SYNC
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
      console.error('Worker Router Error:', err);
      return jsonResponse({ error: err.message || 'Internal Server Error' }, 500);
    }
  }
};
