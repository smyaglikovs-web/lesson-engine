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
  const [view, setView] = useState('student_dashboard');
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
    setView('student_dashboard');
  };

  const fetchLessons = async () => {
    try {
      const res = await fetch('/api/lessons', { headers: getAuthHeaders() });
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

  useEffect(() => {
    const checkAuthSession = async () => {
      const token = localStorage.getItem('auth_jwt') || localStorage.getItem('teacher_jwt');
      if (token) {
        try {
          const meRes = await fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } });
          if (meRes.ok) {
            const { user } = await meRes.json();
            setCurrentUser(user);
            setIsAuthenticated(true);
            const teacherRole = user.role === 'teacher';
            setIsTeacher(teacherRole);
            if (teacherRole) {
              fetchLessons();
              setView('library');
            } else {
              setView('student_dashboard');
            }
          } else {
            // Legacy teacher token fallback
            setIsAuthenticated(true);
            setIsTeacher(true);
            fetchLessons();
            setView('library');
          }
        } catch (e) {
          setIsAuthenticated(true);
          setIsTeacher(true);
          fetchLessons();
          setView('library');
        }
      } else {
        setLoading(false);
        setView('student_dashboard');
      }
    };

    checkAuthSession();

    const processUrlParams = () => {
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
        return true;
      }

      if (hwParam) {
        setIsTeacher(false);
        openLesson(hwParam, false, false);
        return true;
      }

      if (activeRoomId) {
        const teacher = roleParam === 'teacher' && !!localStorage.getItem('teacher_jwt');
        setIsTeacher(teacher);
        openRoomSession(activeRoomId, teacher);
        return true;
      }
      
      return false;
    };

    processUrlParams();

    const handlePopState = () => {
      const isHandled = processUrlParams();
      if (!isHandled) {
        setRoomId('');
        setActiveLesson(null);
        setView(localStorage.getItem('teacher_jwt') ? 'library' : 'student_dashboard');
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setLoginError(false);

    if (user.role === 'teacher') {
      setIsTeacher(true);
      fetchLessons();
      setView('library');
    } else {
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
        setIsAuthenticated(true);
        setIsTeacher(true);
        setLoginError(false);
        fetchLessons();
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* 1. TEACHER HEADER */}
      {isTeacher && isAuthenticated && view !== 'room' && (
        <TeacherHeader view={view} setView={setView} onLogout={handleLogout} />
      )}

      {/* 2. STUDENT HEADER */}
      {!isTeacher && isAuthenticated && view !== 'room' && (
        <StudentHeader
          user={currentUser}
          onLogout={handleLogout}
          onOpenDictionary={() => setView('dictionary')}
        />
      )}

      {/* 3. VISITOR TOP BAR (WHEN NOT LOGGED IN) */}
      {!isAuthenticated && view !== 'room' && (
        <div className="w-full bg-slate-100 border-b border-slate-200 py-2 px-4 flex justify-between items-center text-xs font-bold text-slate-600">
          <span>Гостевой режим</span>
          {view === 'auth_modal' ? (
            <button onClick={() => setView('student_dashboard')} className="hover:text-indigo-600 cursor-pointer">
              🧑‍🎓 Перейти в кабинет ученика ➔
            </button>
          ) : (
            <button onClick={() => setView('auth_modal')} className="hover:text-indigo-600 cursor-pointer">
              🔑 Вход / Регистрация
            </button>
          )}
        </div>
      )}

      <main className={view === 'room' ? 'w-full' : 'max-w-6xl mx-auto px-4 py-8'}>
        {/* AUTH MODAL */}
        {view === 'auth_modal' && !isAuthenticated && (
          <TeacherAuthModal 
            onLogin={handleTeacherLogin}
            onAuthSuccess={handleAuthSuccess}
            loginError={loginError} 
          />
        )}

        {/* STUDENT DASHBOARD */}
        {view === 'student_dashboard' && (
          <StudentDashboard
            onOpenLesson={(id) => openLesson(id, true, false)}
            onJoinRoom={(targetRoomId) => openRoomSession(targetRoomId, false)}
            onLaunchVocabTrainer={handleLaunchTrainerFromDictionary}
            onLogout={() => setView('auth_modal')}
          />
        )}

        {/* DICTIONARY VIEW */}
        {view === 'dictionary' && (
          <DictionaryView 
            onLaunchTrainer={handleLaunchTrainerFromDictionary} 
            onBack={() => setView(isTeacher ? 'library' : 'student_dashboard')} 
          />
        )}

        {/* TEACHER VIEWS */}
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

        {/* ACTIVE LIVE ROOM */}
        {view === 'room' && activeLesson && (
          <RoomView
            activeLesson={activeLesson}
            roomId={roomId}
            isTeacher={isTeacher}
            onExitRoom={() => { 
              window.history.pushState({}, '', '/'); 
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
