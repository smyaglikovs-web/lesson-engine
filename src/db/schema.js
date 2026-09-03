let tablesInitialized = false;

export async function ensureTables(env) {
  if (!env || !env.DB || tablesInitialized) return;

  try {
    // 1. Create Base Tables
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS lessons (
        id TEXT PRIMARY KEY, 
        title TEXT, 
        level TEXT, 
        topic TEXT, 
        description TEXT, 
        data TEXT, 
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `).run();

    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS folders (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE,
        author_id TEXT DEFAULT 'teacher',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `).run();

    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS room_states (
        room_id TEXT PRIMARY KEY, 
        lesson_id TEXT,
        page_idx INTEGER DEFAULT 0, 
        state_data TEXT,
        updated_at INTEGER DEFAULT (unixepoch())
      );
    `).run();

    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS homework_submissions (
        id TEXT PRIMARY KEY, 
        lesson_id TEXT, 
        student_name TEXT, 
        score INTEGER, 
        total_questions INTEGER, 
        answers TEXT, 
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `).run();

    // 2. Safely Alter Columns (Guarded against duplicates)
    try { await env.DB.prepare(`ALTER TABLE lessons ADD COLUMN folder_name TEXT DEFAULT ''`).run(); } catch(e) {}
    try { await env.DB.prepare(`ALTER TABLE lessons ADD COLUMN author_id TEXT DEFAULT 'teacher'`).run(); } catch(e) {}
    try { await env.DB.prepare(`ALTER TABLE room_states ADD COLUMN lesson_id TEXT`).run(); } catch(e) {}
    try { await env.DB.prepare(`ALTER TABLE room_states ADD COLUMN state_data TEXT`).run(); } catch(e) {}

    // 3. Safely Create Indexes (Only after columns exist)
    try { await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_lessons_level ON lessons(level)`).run(); } catch(e) {}
    try { await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_lessons_folder ON lessons(folder_name)`).run(); } catch(e) {}
    try { await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_submissions_lesson ON homework_submissions(lesson_id)`).run(); } catch(e) {}
    try { await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_submissions_student ON homework_submissions(student_name)`).run(); } catch(e) {}

    tablesInitialized = true;
  } catch (e) { 
    console.error("DB Schema Init Error:", e); 
  }
}
