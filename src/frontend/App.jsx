import React, { useState, useEffect } from 'react';
import { TeacherHeader } from './components/TeacherHeader.jsx';
import { StudentHeader } from './components/StudentHeader.jsx';
import { TeacherAuthModal } from './components/TeacherAuthModal.jsx';
import { LibraryView } from './components/LibraryView.jsx';
import { StudentsView } from './components/StudentsView.jsx';
import { CreateLessonView } from './components/CreateLessonView.jsx';
import { AIPromptsView } from './components/AIPromptsView.jsx';
import { RoomView } from './components/RoomView.jsx';
import { SubmissionsModal } from './components/SubmissionsModal.jsx';
import { VocabTrainerView } from './components/VocabTrainerView.jsx';
import { DictionaryView } from './components/DictionaryView.jsx';
import { StudentDashboard } from './components/StudentDashboard.jsx';
import { generateVocabLesson } from './utils/vocabParser.js';

export default function App() {
  const [view, setView] = useState('loading');
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [isTeacher, setIsTeacher] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState(false);

  const [roomId, setRoomId] = useState('');
  const [viewSubmissionsLesson, setViewSubmissionsLesson] = useState(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('teacher_jwt') || localStorage.getItem('auth_jwt');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  const handleLogout = () => {
    localStorage.removeItem('teacher_jwt');
    localStorage.removeItem('auth_jwt');
    setIsAuthenticated(false);
    setIsTeacher(false);
    setCurrentUser(null);
    window.history.pushState({}, '', '/');
    setView('role_select');
  };

  const fetchLessons = async (scope = '') => {
    try {
      const scopeParam = scope ? `?scope=${scope}` : '';
      const res = await fetch(`/api/lessons${scopeParam}`, { headers: getAuthHeaders() });
      if (res.status === 401 || res.status === 403) {
        handleLogout();
        return;
      }
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

  const resolveRoute = (user = currentUser) => {
    const pathname = window.location.pathname.toLowerCase();
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
      const teacher = roleParam === 'teacher' && !!localStorage.getItem('teacher_jwt');
      setIsTeacher(teacher);
      openRoomSession(activeRoomId, teacher);
      return;
    }

    if (pathname.startsWith('/teacher')) {
      const hasTeacherToken = !!localStorage.getItem('teacher_jwt') || user?.role === 'teacher' || user?.isMaster;
      if (hasTeacherToken) {
        setIsTeacher(true);
        setIsAuthenticated(true);
        fetchLessons();
        setView('library');
      } else {
        setIsTeacher(true);
        setIsAuthenticated(false);
        setView('auth_teacher');
      }
      return;
    }

    if (pathname.startsWith('/student')) {
      const hasStudentToken = !!localStorage.getItem('auth_jwt') || user?.role === 'student';
      if (hasStudentToken && user) {
        setIsTeacher(false);
        setIsAuthenticated(true);
        setView('student_dashboard');
      } else {
        setIsTeacher(false);
        setIsAuthenticated(false);
        setView('auth_student');
      }
      return;
    }

    if (user?.role === 'teacher' || user?.isMaster || localStorage.getItem('teacher_jwt')) {
      window.history.replaceState({}, '', '/teacher');
      setIsTeacher(true);
      setIsAuthenticated(true);
      fetchLessons();
      setView('library');
    } else if (user?.role === 'student' || localStorage.getItem('auth_jwt')) {
      window.history.replaceState({}, '', '/student');
      setIsTeacher(false);
      setIsAuthenticated(true);
      setView('student_dashboard');
    } else {
      setView('role_select');
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('auth_jwt') || localStorage.getItem('teacher_jwt');
      let identifiedUser = null;

      if (token) {
        try {
          const res = await fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } });
          if (res.ok) {
            const data = await res.json();
            identifiedUser = data.user;
            setCurrentUser(identifiedUser);
            setIsAuthenticated(true);
          } else if (localStorage.getItem('teacher_jwt')) {
            identifiedUser = { role: 'admin', isMaster: true, name: 'Владелец (Master)' };
            setCurrentUser(identifiedUser);
            setIsAuthenticated(true);
          }
        } catch (e) {
          if (localStorage.getItem('teacher_jwt')) {
            identifiedUser = { role: 'admin', isMaster: true, name: 'Владелец (Master)' };
            setCurrentUser(identifiedUser);
            setIsAuthenticated(true);
          }
        }
      }

      resolveRoute(identifiedUser);
    };

    initAuth();

    const handlePopState = () => {
      resolveRoute();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setLoginError(false);

    if (user.role === 'teacher' || user.isMaster) {
      window.history.pushState({}, '', '/teacher');
      setIsTeacher(true);
      fetchLessons();
      setView('library');
    } else {
      window.history.pushState({}, '', '/student');
      setIsTeacher(false);
      setView('student_dashboard');
    }
  };

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
        localStorage.setItem('auth_jwt', data.token);
        const masterUser = data.user || { role: 'admin', isMaster: true, name: 'Владелец (Master)' };
        setCurrentUser(masterUser);
        setIsAuthenticated(true);
        setIsTeacher(true);
        setLoginError(false);
        fetchLessons();
        window.history.pushState({}, '', '/teacher');
        setView('library');
      } else {
        setLoginError(true);
      }
    } catch (e) {
      setLoginError(true);
    }
  };

  const handleLaunchClassroom = async (lessonId) => {
    try {
      const [createRes, lessonRes] = await Promise.all([
        fetch('/api/rooms/create', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ lessonId })
        }),
        fetch(`/api/lessons/${lessonId}`)
      ]);

      const createData = await createRes.json();
      const lessonData = await lessonRes.json();

      if (createData.sessionId) {
        window.history.pushState({}, '', `/?room=${createData.sessionId}&role=teacher`);
        setActiveLesson(lessonData);
        setRoomId(createData.sessionId);
        setIsTeacher(true);
        setView('room');
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
    try {
      const res = await fetch(`/api/lessons/${lessonSummary.id}`);
      const fullLessonData = await res.json();
      setEditingLesson(fullLessonData);
      setView('create');
    } catch (e) {
      alert('Ошибка загрузки содержимого урока');
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

  const handleLaunchTrainerFromDictionary = (wordsList) => {
    if (!wordsList || wordsList.length === 0) return;
    const generatedLesson = generateVocabLesson('My Saved Vocabulary', 'B2', wordsList);
    setActiveLesson(generatedLesson);
    setRoomId(generatedLesson.id);
    setView('room');
    setIsTeacher(false);
  };

  const isMasterUser = Boolean(currentUser?.isMaster || currentUser?.role === 'admin');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* 1. TEACHER HEADER WITH MASTER BADGE */}
      {isTeacher && isAuthenticated && view !== 'room' && (
        <TeacherHeader 
          view={view} 
          setView={setView} 
          user={currentUser} 
          onLogout={handleLogout} 
        />
      )}

      {/* 2. STUDENT HEADER */}
      {!isTeacher && isAuthenticated && view !== 'room' && (
        <StudentHeader
          user={currentUser}
          onLogout={handleLogout}
          onOpenDictionary={() => setView('dictionary')}
        />
      )}

      <main className={view === 'room' ? 'w-full' : 'max-w-6xl mx-auto px-4 py-8'}>
        
        {/* ROLE SELECTION */}
        {view === 'role_select' && (
          <div className="max-w-md mx-auto my-16 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl text-center space-y-6">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto text-3xl font-extrabold shadow-2xs">
              🎓
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Добро пожаловать в Lesson Engine</h2>
              <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                Выберите ваш профиль для входа в платформу:
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  window.history.pushState({}, '', '/student');
                  setView('auth_student');
                }}
                className="w-full p-4 rounded-2xl border-2 border-indigo-200 hover:border-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 transition text-left flex items-center justify-between cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🧑‍🎓</span>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">Я Ученик</h4>
                    <p className="text-[11px] text-slate-500 font-medium">Мой словарь, задания и вход в класс</p>
                  </div>
                </div>
                <span className="text-indigo-600 font-extrabold text-sm group-hover:translate-x-1 transition">➔</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  window.history.pushState({}, '', '/teacher');
                  setView('auth_teacher');
                }}
                className="w-full p-4 rounded-2xl border-2 border-slate-200 hover:border-indigo-600 bg-white hover:bg-slate-50 transition text-left flex items-center justify-between cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">👨‍🏫</span>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">Я Преподаватель</h4>
                    <p className="text-[11px] text-slate-500 font-medium">Конструктор уроков, библиотека, ученики</p>
                  </div>
                </div>
                <span className="text-slate-400 group-hover:text-indigo-600 font-extrabold text-sm group-hover:translate-x-1 transition">➔</span>
              </button>
            </div>
          </div>
        )}

        {/* STUDENT AUTH */}
        {view === 'auth_student' && (
          <TeacherAuthModal
            initialRole="student"
            onAuthSuccess={handleAuthSuccess}
            onCancel={() => {
              window.history.pushState({}, '', '/');
              setView('role_select');
            }}
          />
        )}

        {/* TEACHER AUTH */}
        {view === 'auth_teacher' && (
          <TeacherAuthModal
            initialRole="teacher"
            onLogin={handleTeacherLogin}
            onAuthSuccess={handleAuthSuccess}
            loginError={loginError}
            onCancel={() => {
              window.history.pushState({}, '', '/');
              setView('role_select');
            }}
          />
        )}

        {/* STUDENT DASHBOARD */}
        {view === 'student_dashboard' && isAuthenticated && (
          <StudentDashboard
            onOpenLesson={(id) => openLesson(id, true, false)}
            onJoinRoom={(targetRoomId) => openRoomSession(targetRoomId, false)}
            onLaunchVocabTrainer={handleLaunchTrainerFromDictionary}
            onLogout={handleLogout}
          />
        )}

        {/* DICTIONARY VIEW */}
        {view === 'dictionary' && (
          <DictionaryView 
            onLaunchTrainer={handleLaunchTrainerFromDictionary} 
            onBack={() => setView(isTeacher ? 'library' : 'student_dashboard')} 
          />
        )}

        {/* TEACHER LIBRARY WITH MASTER FILTER */}
        {view === 'library' && isTeacher && isAuthenticated && (
          <LibraryView
            lessons={lessons}
            loading={loading}
            isMaster={isMasterUser}
            onScopeChange={(scope) => fetchLessons(scope)}
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

        {/* LIVE ROOM */}
        {view === 'room' && activeLesson && (
          <RoomView
            activeLesson={activeLesson}
            roomId={roomId}
            isTeacher={isTeacher}
            onExitRoom={() => { 
              window.history.pushState({}, '', isTeacher ? '/teacher' : '/student'); 
              setView(isTeacher && isAuthenticated ? 'library' : 'student_dashboard'); 
            }}
          />
        )}

        {viewSubmissionsLesson && isTeacher && isAuthenticated && (
          <SubmissionsModal lesson={viewSubmissionsLesson} onClose={() => setViewSubmissionsLesson(null)} />
        )}
      </main>
    </div>
  );
}
