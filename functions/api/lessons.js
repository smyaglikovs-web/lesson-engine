// GET /api/lessons — Получить список всех уроков для библиотеки
export async function onRequestGet(context) {
  const { env } = context;
  try {
    const { results } = await env.DB.prepare(
      "SELECT id, title, level, topic, description, created_at FROM lessons ORDER BY created_at DESC"
    ).all();

    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// POST /api/lessons — Сохранить новый урок в D1
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const lesson = await request.json();
    const id = lesson.id || 'lesson-' + Date.now();

    await env.DB.prepare(
      "INSERT INTO lessons (id, title, level, topic, description, data) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(
      id,
      lesson.title || 'Untitled Lesson',
      lesson.level || 'A2',
      lesson.topic || 'General',
      lesson.description || '',
      JSON.stringify(lesson)
    ).run();

    return new Response(JSON.stringify({ success: true, id }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
