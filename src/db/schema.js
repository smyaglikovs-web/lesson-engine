export async function ensureTables(env) {
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
