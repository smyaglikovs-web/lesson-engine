import { ensureTables } from '../db/schema.js';

export async function updateRoomState(env, roomId, pageIdx, answers) {
  await ensureTables(env);
  const nowUnix = Math.floor(Date.now() / 1000);
  await env.DB.prepare(`
    INSERT INTO room_states (room_id, page_idx, student_answers, updated_at) 
    VALUES (?, ?, ?, ?)
    ON CONFLICT(room_id) DO UPDATE SET 
      page_idx = excluded.page_idx, 
      student_answers = excluded.student_answers, 
      updated_at = excluded.updated_at
  `).bind(roomId, pageIdx, JSON.stringify(answers), nowUnix).run();
  return { success: true };
}

export async function recordStudentHeartbeat(env, roomId) {
  await ensureTables(env);
  const nowUnix = Math.floor(Date.now() / 1000);
  await env.DB.prepare(`
    INSERT INTO room_states (room_id, page_idx, student_answers, last_student_seen, updated_at)
    VALUES (?, 0, '{}', ?, ?)
    ON CONFLICT(room_id) DO UPDATE SET 
      last_student_seen = excluded.last_student_seen
  `).bind(roomId, nowUnix, nowUnix).run();
  return { success: true };
}

export async function getRoomState(env, roomId) {
  await ensureTables(env);
  const row = await env.DB.prepare(
    "SELECT page_idx, student_answers, last_student_seen, updated_at FROM room_states WHERE room_id = ?"
  ).bind(roomId).first();

  if (!row) return { page_idx: 0, student_answers: {}, isOnline: false };
  const nowUnix = Math.floor(Date.now() / 1000);
  const lastSeen = Number(row.last_student_seen) || 0;
  const isOnline = (nowUnix - lastSeen) < 10;
  
  return { 
    page_idx: row.page_idx || 0, 
    student_answers: JSON.parse(row.student_answers || "{}"), 
    isOnline 
  };
}
