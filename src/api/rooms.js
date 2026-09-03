import { ensureTables } from '../db/schema.js';

// Default session data structure
function createInitialSessionState(lessonId) {
  return {
    lessonId: lessonId,
    teacherPage: 0,
    broadcastPage: 0,
    notepad: '',
    xp: {},
    participants: {}
  };
}

export async function createRoomSession(env, lessonId) {
  await ensureTables(env);
  const sessionId = 'ses_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const nowUnix = Math.floor(Date.now() / 1000);
  const initialState = createInitialSessionState(lessonId);

  await env.DB.prepare(`
    INSERT INTO room_states (room_id, lesson_id, page_idx, state_data, updated_at)
    VALUES (?, ?, 0, ?, ?)
  `).bind(sessionId, lessonId, JSON.stringify(initialState), nowUnix).run();

  return { success: true, sessionId };
}

export async function getRoomState(env, roomId) {
  await ensureTables(env);
  const row = await env.DB.prepare(
    "SELECT room_id, lesson_id, page_idx, state_data, updated_at FROM room_states WHERE room_id = ?"
  ).bind(roomId).first();

  if (!row) {
    // If not found (e.g. legacy room), initialize fallback
    return {
      roomId,
      lessonId: roomId,
      teacherPage: 0,
      broadcastPage: 0,
      notepad: '',
      xp: {},
      participants: {},
      onlineCount: 0
    };
  }

  let state = null;
  try {
    state = typeof row.state_data === 'string' ? JSON.parse(row.state_data) : row.state_data;
  } catch (e) {}

  if (!state || typeof state !== 'object') {
    state = createInitialSessionState(row.lesson_id || roomId);
  }

  const nowUnix = Math.floor(Date.now() / 1000);
  const activeParticipants = {};
  let onlineCount = 0;

  // Filter and flag participants active in the last 12 seconds
  Object.entries(state.participants || {}).forEach(([id, p]) => {
    const isOnline = (nowUnix - (Number(p.lastSeen) || 0)) < 12;
    if (isOnline) onlineCount++;
    activeParticipants[id] = { ...p, isOnline };
  });

  return {
    roomId: row.room_id,
    lessonId: row.lesson_id || state.lessonId,
    teacherPage: typeof state.teacherPage === 'number' ? state.teacherPage : (row.page_idx || 0),
    broadcastPage: typeof state.broadcastPage === 'number' ? state.broadcastPage : (row.page_idx || 0),
    notepad: state.notepad || '',
    xp: state.xp || {},
    participants: activeParticipants,
    onlineCount
  };
}

export async function updateTeacherBroadcast(env, roomId, payload = {}) {
  await ensureTables(env);
  const nowUnix = Math.floor(Date.now() / 1000);
  const current = await getRoomState(env, roomId);

  const updatedState = {
    ...current,
    teacherPage: payload.teacherPage !== undefined ? payload.teacherPage : current.teacherPage,
    broadcastPage: payload.broadcastPage !== undefined ? payload.broadcastPage : current.broadcastPage,
    notepad: payload.notepad !== undefined ? payload.notepad : current.notepad,
    xp: payload.xp !== undefined ? payload.xp : current.xp
  };

  await env.DB.prepare(`
    INSERT INTO room_states (room_id, lesson_id, page_idx, state_data, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(room_id) DO UPDATE SET 
      page_idx = excluded.page_idx,
      state_data = excluded.state_data,
      updated_at = excluded.updated_at
  `).bind(
    roomId, 
    updatedState.lessonId || roomId, 
    updatedState.broadcastPage, 
    JSON.stringify(updatedState), 
    nowUnix
  ).run();

  return { success: true };
}

export async function recordStudentPresence(env, roomId, studentId, studentName) {
  await ensureTables(env);
  if (!studentId) return { error: 'Student ID is required' };

  const nowUnix = Math.floor(Date.now() / 1000);
  const current = await getRoomState(env, roomId);
  const participants = current.participants || {};

  participants[studentId] = {
    ...(participants[studentId] || { answers: {} }),
    id: studentId,
    name: studentName || participants[studentId]?.name || 'Student',
    lastSeen: nowUnix
  };

  const updatedState = { ...current, participants };

  await env.DB.prepare(`
    INSERT INTO room_states (room_id, lesson_id, page_idx, state_data, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(room_id) DO UPDATE SET 
      state_data = excluded.state_data,
      updated_at = excluded.updated_at
  `).bind(
    roomId, 
    current.lessonId || roomId, 
    current.broadcastPage, 
    JSON.stringify(updatedState), 
    nowUnix
  ).run();

  return { success: true };
}

export async function saveStudentAnswer(env, roomId, studentId, blockId, answerVal) {
  await ensureTables(env);
  if (!studentId || !blockId) return { error: 'Missing parameters' };

  const nowUnix = Math.floor(Date.now() / 1000);
  const current = await getRoomState(env, roomId);
  const participants = current.participants || {};

  const studentData = participants[studentId] || { id: studentId, name: 'Student', answers: {} };
  studentData.answers = { ...(studentData.answers || {}), [blockId]: answerVal };
  studentData.lastSeen = nowUnix;
  participants[studentId] = studentData;

  const updatedState = { ...current, participants };

  await env.DB.prepare(`
    INSERT INTO room_states (room_id, lesson_id, page_idx, state_data, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(room_id) DO UPDATE SET 
      state_data = excluded.state_data,
      updated_at = excluded.updated_at
  `).bind(
    roomId, 
    current.lessonId || roomId, 
    current.broadcastPage, 
    JSON.stringify(updatedState), 
    nowUnix
  ).run();

  return { success: true };
}

export async function resetRoomState(env, roomId) {
  await ensureTables(env);
  const nowUnix = Math.floor(Date.now() / 1000);
  const current = await getRoomState(env, roomId);

  // Clear answers from all participants, reset pages
  const participants = {};
  Object.entries(current.participants || {}).forEach(([id, p]) => {
    participants[id] = { ...p, answers: {} };
  });

  const resetState = {
    ...current,
    teacherPage: 0,
    broadcastPage: 0,
    notepad: '',
    xp: {},
    participants
  };

  await env.DB.prepare(`
    UPDATE room_states 
    SET page_idx = 0, state_data = ?, updated_at = ? 
    WHERE room_id = ?
  `).bind(JSON.stringify(resetState), nowUnix, roomId).run();

  return { success: true };
}
