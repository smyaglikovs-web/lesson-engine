import React, { useState, useEffect } from 'react';
import { TeacherHeader } from './components/TeacherHeader.jsx';
import { TeacherAuthModal } from './components/TeacherAuthModal.jsx';
import { LibraryView } from './components/LibraryView.jsx';
import { CreateLessonView } from './components/CreateLessonView.jsx';
import { AIPromptsView } from './components/AIPromptsView.jsx';
import { RoomView } from './components/RoomView.jsx';
import { SubmissionsModal } from './components/SubmissionsModal.jsx';

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

  const getAuthPassword = () => {
    return localStorage.getItem('teacher_pass') || 'teacher123';
  };

  const fetchLessons = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/lessons');
      const data = await res.json();
      if (Array.isArray(data)) setLessons(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const authSaved = localStorage.getItem('teacher_auth') === 'true';
    if (authSaved) {
      setIsAuthenticated(true);
      setIsTeacher(true);
      fetchLessons();
    }

    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    const roleParam = params.get('role');
    const hwParam = params.get('homework');

    if (hwParam) {
      setIsTeacher(false);
      openLesson(hwParam, false, false);
      return;
    }

    if (roomParam) {
      const teacher = roleParam === 'teacher' && authSaved;
      setIsTeacher(teacher);
      openLesson(roomParam, false, teacher);
      return;
    }

    setIsTeacher(true);
  }, []);

  const handleTeacherLogin = async (passwordInput) => {
    try {
      const res = await fetch('/api/teacher/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput })
      });
      if (res.ok) {
        localStorage.setItem('teacher_auth', 'true');
        localStorage.setItem('teacher_pass', passwordInput);
        setIsAuthenticated(true);
        setIsTeacher(true);
        setLoginError(false);
        fetchLessons();
      } else {
        setLoginError(true);
      }
    } catch(e) {
      setLoginError(true);
    }
  };

  const handleTeacherLogout = () => {
    localStorage.removeItem('teacher_auth');
    localStorage.removeItem('teacher_pass');
    setIsAuthenticated(false);
  };

  const openLesson = async (lessonId, navigate = true, teacherRole = true) => {
    try {
      const res = await fetch(`/api/lessons/${lessonId}`);
      const data = await res.json();
      setActiveLesson(data);
      setRoomId(lessonId);
      setView('room');
      if (navigate) {
        window.history.pushState({}, '', `/?room=${lessonId}&role=teacher`);
        setIsTeacher(true);
      } else {
        setIsTeacher(teacherRole);
      }
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
        headers: { 
          'Content-Type': 'application/json',
          'x-teacher-password': getAuthPassword()
        },
        body: JSON.stringify(newLesson)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('🎉 Урок успешно сохранен в D1!');
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
        headers: { 'x-teacher-password': getAuthPassword() }
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
      {isTeacher && isAuthenticated && <TeacherHeader view={view} setView={setView} onLogout={handleTeacherLogout} />}

      <main className="max-w-6xl mx-auto px-4 py-8">
        {isTeacher && !isAuthenticated && view !== 'room' && <TeacherAuthModal onLogin={handleTeacherLogin} loginError={loginError} />}

        {view === 'library' && isTeacher && isAuthenticated && (
          <LibraryView
            lessons={lessons}
            loading={loading}
            onOpenLesson={openLesson}
            onCreateNew={handleCreateNew}
            onEditLesson={handleEditLesson}
            onDeleteLesson={handleDeleteLesson}
            onViewSubmissions={(l) => setViewSubmissionsLesson(l)}
          />
        )}

        {view === 'create' && isTeacher && isAuthenticated && (
          <CreateLessonView initialLesson={editingLesson} onSaveLesson={handleSaveLesson} onCancel={() => { setEditingLesson(null); setView('library'); }} />
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
