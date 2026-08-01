import { getLessons, saveLesson, getSingleLesson, deleteLesson, verifyTeacherLogin } from './api/lessons.js';
import { updateRoomState, getRoomState } from './api/rooms.js';
import { submitHomework, getHomeworkSubmissions } from './api/homework.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    const json = (data, status = 200) => 
      new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

    const getTeacherPassword = () => request.headers.get('x-teacher-password') || '';

    try {
      // Teacher Auth API
      if (path === '/api/teacher/login' && method === 'POST') {
        const { password } = await request.json();
        const res = await verifyTeacherLogin(env, password);
        return json(res, res.success ? 200 : 401);
      }

      // Lessons API
      if (path === '/api/lessons' && method === 'GET') return json(await getLessons(env));
      if (path === '/api/lessons' && method === 'POST') {
        const res = await saveLesson(env, await request.json(), getTeacherPassword());
        return json(res, res.error ? 401 : 200);
      }
      if (path.startsWith('/api/lessons/') && method === 'GET') {
        const data = await getSingleLesson(env, path.split('/api/lessons/')[1]);
        return data ? new Response(data, { headers: { "Content-Type": "application/json" } }) : json({ error: "Not found" }, 404);
      }
      if (path.startsWith('/api/lessons/') && method === 'DELETE') {
        const res = await deleteLesson(env, path.split('/api/lessons/')[1], getTeacherPassword());
        return json(res, res.error ? 401 : 200);
      }

      // Realtime Rooms API
      if (path.startsWith('/api/rooms/') && path.endsWith('/state') && method === 'POST') {
        const roomId = path.split('/api/rooms/')[1].replace('/state', '');
        const body = await request.json();
        return json(await updateRoomState(env, roomId, body.pageIdx, body.answers));
      }
      if (path.startsWith('/api/rooms/') && path.endsWith('/state') && method === 'GET') {
        const roomId = path.split('/api/rooms/')[1].replace('/state', '');
        return json(await getRoomState(env, roomId));
      }

      // Homework API (Auto Graded on Server)
      if (path === '/api/homework/submit' && method === 'POST') return json(await submitHomework(env, await request.json()));
      if (path.startsWith('/api/homework/') && method === 'GET') return json(await getHomeworkSubmissions(env, path.split('/api/homework/')[1], getTeacherPassword()));

      return env.ASSETS.fetch(request);

    } catch (err) {
      return json({ error: err.message }, 500);
    }
  }
};
