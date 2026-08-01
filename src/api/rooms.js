import { ensureTables } from '../db/schema.js';

export async function updateRoomState(env, roomId, pageIdx, answers) {
  await ensureTables(env);
  const nowUnix = Math.floor(Date.now() / 1000);
  await env.DB.prepare(`
    INSERT INTO room_states (room_id, page_idx, student_answers, updated_at) VALUES (?, ?, ?, ?)
    ON CONFLICT(room_id) DO UPDATE SET page_idx = excluded.page_idx, student_answers = excluded.student_answers, updated_at = excluded.updated_at
  `).bind(roomId, pageIdx, JSON.stringify(answers), nowUnix).run();
  return { success: true };
}

export async function getRoomState(env, roomId) {
  const row = await env.DB.prepare("SELECT page_idx, student_answers, updated_at FROM room_states WHERE room_id = ?").bind(roomId).first();
  if (!row) return { page_idx: 0, student_answers: {}, isOnline: false };
  const nowUnix = Math.floor(Date.now() / 1000);
  const isOnline = (nowUnix - (Number(row.updated_at) || 0)) < 8;
  return { page_idx: row.page_idx, student_answers: JSON.parse(row.student_answers || "{}"), isOnline };
}
