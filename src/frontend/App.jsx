import React, { useState, useEffect } from 'react';
import { TeacherHeader } from './components/TeacherHeader.jsx';
import { TeacherAuthModal } from './components/TeacherAuthModal.jsx';
import { LibraryView } from './components/LibraryView.jsx';
import { StudentsView } from './components/StudentsView.jsx';
import { CreateLessonView } from './components/CreateLessonView.jsx';
import { AIPromptsView } from './components/AIPromptsView.jsx';
import { RoomView } from './components/RoomView.jsx';
import { SubmissionsModal } from './components/SubmissionsModal.jsx';
import { VocabTrainerView } from './components/VocabTrainerView.jsx';

export default function App() {
  const [view, setView] = useState('library');
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);

  const [isTeacher, setIsTeacher] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState(false);

  const [roomId, setRoomId] = useState('');
  const [viewSubmissionsLesson, setViewSubmissionsLesson] = useState(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('teacher_jwt');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  const fetchLessons = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/lessons');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setLessons(data);
      }
    } catch (e) {
      console.error("Could not fetch lessons:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('teacher_jwt');
    if (token) {
      setIsAuthenticated(true);
      setIsTeacher(true);
      fetchLessons();
    }

    const params = new URLSearchParams(window.location.search);
    const sessionParam = params.get('session');
    const roomParam = params.get('room');
    const roleParam = params.get('role');
    const hwParam = params.get('homework');
    const trainerParam = params.get('trainer');

    const activeRoomId = sessionParam || roomParam;

    if (trainerParam) {
      setIsTeacher(false);
      openLesson(trainerParam, false, false);
      return;
    }

    if (hwParam) {
      setIsTeacher(false);
      openLesson(hwParam, false, false);
      return;
    }

    if (activeRoomId) {
      const teacher = roleParam === 'teacher' && !!token;
      setIsTeacher(teacher);
      openRoomSession(activeRoomId, teacher);
      return;
    }

    setIsTeacher(true);
  }, []);

  // Strict Server-Side Authentication
  const handleTeacherLogin = async (passwordInput) => {
    const clean = (passwordInput || '').trim();
    if (!clean) return;

    try {
      const res = await fetch('/api/teacher/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: clean })
      });
      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem('teacher_jwt', data.token);
        setIsAuthenticated(true);
        setIsTeacher(true);
        setLoginError(false);
        fetchLessons();
      } else {
        setLoginError(true);
      }
    } catch (e) {
      setLoginError(true);
    }
  };

  const handleTeacherLogout = () => {
    localStorage.removeItem('teacher_jwt');
    setIsAuthenticated(false);
  };

  const handleLaunchClassroom = async (lessonId) => {
    try {
      const res = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ lessonId })
      });
      const data = await res.json();
      if (data.sessionId) {
        window.history.pushState({}, '', `/?room=${data.sessionId}&role=teacher`);
        openRoomSession(data.sessionId, true);
      }
    } catch (e) {
      alert('Ошибка запуска сессии');
    }
  };

  const openRoomSession = async (targetRoomId, teacherRole = true) => {
    try {
      const stateRes = await fetch(`/api/rooms/${targetRoomId}/state`);
      const stateData = await stateRes.json();
      const targetLessonId = stateData.lessonId || targetRoomId;

      const lessonRes = await fetch(`/api/lessons/${targetLessonId}`);
      const lessonData = await lessonRes.json();

      setActiveLesson(lessonData);
      setRoomId(targetRoomId);
      setIsTeacher(teacherRole);
      setView('room');
    } catch (e) {
      openLesson(targetRoomId, false, teacherRole);
    }
  };

  const openLesson = async (lessonId, navigate = true, teacherRole = true) => {
    try {
      const res = await fetch(`/api/lessons/${lessonId}`);
      const data = await res.json();
      setActiveLesson(data);
      setRoomId(lessonId);
      setView('room');
      setIsTeacher(teacherRole);
    } catch (e) {
      alert('Ошибка загрузки урока');
    }
  };

  const handleEditLesson = async (lessonSummary) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/lessons/${lessonSummary.id}`);
      const fullLessonData = await res.json();
      setEditingLesson(fullLessonData);
      setView('create');
    } catch (e) {
      alert('Ошибка загрузки содержимого урока');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingLesson(null);
    setView('create');
  };

  const handleSaveLesson = async (newLesson) => {
    try {
      const res = await fetch('/api/lessons', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newLesson)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('🎉 Урок успешно сохранен!');
        setEditingLesson(null);
        fetchLessons();
        setView('library');
      } else {
        alert('Ошибка: ' + (data.error || 'Доступ запрещен'));
      }
    } catch (e) {
      alert('Ошибка сохранения');
    }
  };

  const handleDeleteLesson = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Вы уверены, что хотите удалить этот урок из базы данных?')) return;
    try {
      const res = await fetch('/api/lessons/' + id, { 
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok && data.success) fetchLessons();
      else alert('Ошибка: ' + (data.error || 'Доступ запрещен'));
    } catch (err) {
      alert('Ошибка удаления');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {isTeacher && isAuthenticated && view !== 'room' && (
        <TeacherHeader view={view} setView={setView} onLogout={handleTeacherLogout} />
      )}

      <main className="max-w-6xl mx-auto px-4 py-8">
        {isTeacher && !isAuthenticated && view !== 'room' && (
          <TeacherAuthModal onLogin={handleTeacherLogin} loginError={loginError} />
        )}

        {view === 'library' && isTeacher && isAuthenticated && (
          <LibraryView
            lessons={lessons}
            loading={loading}
            onOpenLesson={handleLaunchClassroom}
            onCreateNew={handleCreateNew}
            onEditLesson={handleEditLesson}
            onDeleteLesson={handleDeleteLesson}
            onViewSubmissions={l => setViewSubmissionsLesson(l)}
          />
        )}

        {view === 'students' && isTeacher && isAuthenticated && (
          <StudentsView />
        )}

        {view === 'vocab' && isTeacher && isAuthenticated && (
          <VocabTrainerView
            onSaveLesson={handleSaveLesson}
            onCancel={() => setView('library')}
          />
        )}

        {view === 'create' && isTeacher && isAuthenticated && (
          <CreateLessonView 
            initialLesson={editingLesson} 
            onSaveLesson={handleSaveLesson} 
            onCancel={() => { setEditingLesson(null); setView('library'); }} 
          />
        )}

        {view === 'prompts' && isTeacher && isAuthenticated && <AIPromptsView />}

        {view === 'room' && activeLesson && (
          <RoomView
            activeLesson={activeLesson}
            roomId={roomId}
            isTeacher={isTeacher}
            onExitRoom={() => { window.history.pushState({}, '', '/'); setView('library'); }}
          />
        )}

        {viewSubmissionsLesson && isTeacher && isAuthenticated && (
          <SubmissionsModal lesson={viewSubmissionsLesson} onClose={() => setViewSubmissionsLesson(null)} />
        )}
      </main>
    </div>
  );
}
