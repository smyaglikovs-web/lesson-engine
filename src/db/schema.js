let tablesInitialized = false;

export async function ensureTables(env) {
  if (!env || !env.DB || tablesInitialized) return;

  try {
    await env.DB.batch([
      env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS lessons (
          id TEXT PRIMARY KEY, 
          title TEXT, 
          level TEXT, 
          topic TEXT, 
          description TEXT, 
          data TEXT, 
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `),
      env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS room_states (
          room_id TEXT PRIMARY KEY, 
          page_idx INTEGER DEFAULT 0, 
          student_answers TEXT, 
          last_student_seen INTEGER DEFAULT 0,
          updated_at INTEGER DEFAULT (unixepoch())
        );
      `),
      env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS homework_submissions (
          id TEXT PRIMARY KEY, 
          lesson_id TEXT, 
          student_name TEXT, 
          score INTEGER, 
          total_questions INTEGER, 
          answers TEXT, 
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `)
    ]);

    try {
      await env.DB.prepare(`ALTER TABLE room_states ADD COLUMN last_student_seen INTEGER DEFAULT 0`).run();
    } catch (e) {}

    tablesInitialized = true;
  } catch (e) { 
    console.error("DB Schema Init Error:", e); 
  }
}
