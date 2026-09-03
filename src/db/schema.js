let tablesInitialized = false;

export async function ensureTables(env) {
  if (!env || !env.DB || tablesInitialized) return;

  try {
    await env.DB.batch([
      env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS lessons (
          id TEXT PRIMARY KEY,
          author_id TEXT DEFAULT 'teacher',
          folder_name TEXT DEFAULT '',
          title TEXT, 
          level TEXT, 
          topic TEXT, 
          description TEXT, 
          data TEXT, 
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `),
      env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS folders (
          id TEXT PRIMARY KEY,
          name TEXT UNIQUE,
          author_id TEXT DEFAULT 'teacher',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `),
      env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS room_states (
          room_id TEXT PRIMARY KEY, 
          lesson_id TEXT,
          page_idx INTEGER DEFAULT 0, 
          state_data TEXT,
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
      `),
      // Search and relational performance indexes
      env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_lessons_level ON lessons(level);`),
      env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_lessons_folder ON lessons(folder_name);`),
      env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_submissions_lesson ON homework_submissions(lesson_id);`),
      env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_submissions_student ON homework_submissions(student_name);`)
    ]);

    // Non-destructive migrations for existing databases
    try {
      await env.DB.prepare(`ALTER TABLE lessons ADD COLUMN folder_name TEXT DEFAULT ''`).run();
    } catch (e) {}
    try {
      await env.DB.prepare(`ALTER TABLE lessons ADD COLUMN author_id TEXT DEFAULT 'teacher'`).run();
    } catch (e) {}

    tablesInitialized = true;
  } catch (e) { 
    console.error("DB Schema Init Error:", e); 
  }
}
