// GET /api/lessons/lesson-123 — Получить один конкретный урок по ID
export async function onRequestGet(context) {
  const { params, env } = context;
  const lessonId = params.id;

  try {
    const row = await env.DB.prepare(
      "SELECT data FROM lessons WHERE id = ?"
    ).bind(lessonId).first();

    if (!row) {
      return new Response(JSON.stringify({ error: "Lesson not found" }), { status: 404 });
    }

    return new Response(row.data, {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
