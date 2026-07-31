export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    const json = (data, status = 200) => 
      new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" }
      });

    // Automatically create database tables if they don't exist
    async function ensureTables() {
      try {
        await env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS lessons (
            id TEXT PRIMARY KEY, title TEXT, level TEXT, topic TEXT, description TEXT, data TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `).run();
        await env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS room_states (
            room_id TEXT PRIMARY KEY, page_idx INTEGER DEFAULT 0, student_answers TEXT, updated_at INTEGER DEFAULT (unixepoch())
          );
        `).run();
        await env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS homework_submissions (
            id TEXT PRIMARY KEY, lesson_id TEXT, student_name TEXT, score INTEGER, total_questions INTEGER, answers TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `).run();
      } catch(e) { console.error("DB Init Error:", e); }
    }

    try {
      // --- API ROUTES ---

      if (path === '/api/lessons' && method === 'GET') {
        await ensureTables();
        const { results } = await env.DB.prepare("SELECT id, title, level, topic, description, created_at FROM lessons ORDER BY created_at DESC").all();
        return json(results || []);
      }

      if (path === '/api/lessons' && method === 'POST') {
        await ensureTables();
        const lesson = await request.json();
        const id = lesson.id || 'lesson-' + Date.now();
        await env.DB.prepare("INSERT OR REPLACE INTO lessons (id, title, level, topic, description, data) VALUES (?, ?, ?, ?, ?, ?)").bind(
          id, lesson.title || 'Untitled', lesson.level || 'A2', lesson.topic || 'General', lesson.description || '', JSON.stringify(lesson)
        ).run();
        return json({ success: true, id });
      }

      if (path.startsWith('/api/lessons/') && method === 'GET') {
        const lessonId = path.split('/api/lessons/')[1];
        const row = await env.DB.prepare("SELECT data FROM lessons WHERE id = ?").bind(lessonId).first();
        if (!row) return json({ error: "Lesson not found" }, 404);
        return new Response(row.data, { headers: { "Content-Type": "application/json" } });
      }

      if (path.startsWith('/api/lessons/') && method === 'DELETE') {
        const lessonId = path.split('/api/lessons/')[1];
        await env.DB.prepare("DELETE FROM lessons WHERE id = ?").bind(lessonId).run();
        return json({ success: true });
      }

      if (path.startsWith('/api/rooms/') && path.endsWith('/state') && method === 'POST') {
        await ensureTables();
        const roomId = path.split('/api/rooms/')[1].replace('/state', '');
        const { pageIdx, answers } = await request.json();
        const nowUnix = Math.floor(Date.now() / 1000);
        await env.DB.prepare(`
          INSERT INTO room_states (room_id, page_idx, student_answers, updated_at) VALUES (?, ?, ?, ?)
          ON CONFLICT(room_id) DO UPDATE SET page_idx = excluded.page_idx, student_answers = excluded.student_answers, updated_at = excluded.updated_at
        `).bind(roomId, pageIdx, JSON.stringify(answers), nowUnix).run();
        return json({ success: true });
      }

      if (path.startsWith('/api/rooms/') && path.endsWith('/state') && method === 'GET') {
        const roomId = path.split('/api/rooms/')[1].replace('/state', '');
        const row = await env.DB.prepare("SELECT page_idx, student_answers, updated_at FROM room_states WHERE room_id = ?").bind(roomId).first();
        if (!row) return json({ page_idx: 0, student_answers: {}, isOnline: false });
        const nowUnix = Math.floor(Date.now() / 1000);
        const isOnline = (nowUnix - (Number(row.updated_at) || 0)) < 8;
        return json({ page_idx: row.page_idx, student_answers: JSON.parse(row.student_answers || "{}"), isOnline });
      }

      if (path === '/api/homework/submit' && method === 'POST') {
        await ensureTables();
        const { lessonId, studentName, score, totalQuestions, answers } = await request.json();
        const id = 'sub-' + Date.now();
        await env.DB.prepare("INSERT INTO homework_submissions (id, lesson_id, student_name, score, total_questions, answers) VALUES (?, ?, ?, ?, ?, ?)").bind(
          id, lessonId, studentName || 'Аноним', score, totalQuestions, JSON.stringify(answers)
        ).run();
        return json({ success: true, id });
      }

      if (path.startsWith('/api/homework/') && method === 'GET') {
        const lessonId = path.split('/api/homework/')[1];
        const { results } = await env.DB.prepare("SELECT id, student_name, score, total_questions, answers, created_at FROM homework_submissions WHERE lesson_id = ? ORDER BY created_at DESC").bind(lessonId).all();
        return json(results || []);
      }

      // If it's NOT an API call, serve the HTML page automatically from the public/ folder!
      return env.ASSETS.fetch(request);

    } catch (err) {
      return json({ error: err.message }, 500);
    }
  }
};
