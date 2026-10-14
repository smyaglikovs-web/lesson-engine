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
import { DictionaryView } from './components/DictionaryView.jsx';
import { StudentDashboard } from './components/StudentDashboard.jsx';
import { generateVocabLesson } from './utils/vocabParser.js';

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

  const handleTeacherLogout = () => {
    localStorage.removeItem('teacher_jwt');
    setIsAuthenticated(false);
    setIsTeacher(false);
    setView('student_dashboard');
  };

  const fetchLessons = async () => {
    try {
      const res = await fetch('/api/lessons', { headers: getAuthHeaders() });
      if (res.status === 401 || res.status === 403) {
        handleTeacherLogout();
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
    const token = localStorage.getItem('teacher_jwt');
    if (token) {
      setIsAuthenticated(true);
      setIsTeacher(true);
      fetchLessons();
    } else {
      setLoading(false);
    }

    const processUrlParams = () => {
      const params = new URLSearchParams(window.location.search);
      const sessionParam = params.get('session');
      const roomParam = params.get('room');
      const roleParam = params.get('role');
      const hwParam = params.get('homework');
      const trainerParam = params.get('trainer');
      const studentParam = params.get('student');

      const activeRoomId = sessionParam || roomParam;

      if (studentParam) {
        setIsTeacher(false);
        setView('student_dashboard');
        return true;
      }

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
        const teacher = roleParam === 'teacher' && !!token;
        setIsTeacher(teacher);
        openRoomSession(activeRoomId, teacher);
        return true;
      }
      
      return false;
    };

    const isInSpecialView = processUrlParams();
    if (!isInSpecialView) {
      if (token) {
        setIsTeacher(true);
        setView('library');
      } else {
        setIsTeacher(false);
        setView('student_dashboard');
      }
    }

    const handlePopState = () => {
      const isHandled = processUrlParams();
      if (!isHandled) {
        setRoomId('');
        setActiveLesson(null);
        setView(token ? 'library' : 'student_dashboard');
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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

  // Launch Vocab Trainer from Dictionary Words
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
      {/* TEACHER HEADER */}
      {isTeacher && isAuthenticated && view !== 'room' && (
        <TeacherHeader view={view} setView={setView} onLogout={handleTeacherLogout} />
      )}

      {/* NON-TEACHER QUICK SWITCH LINK */}
      {!isAuthenticated && view !== 'room' && (
        <div className="w-full bg-slate-100 border-b border-slate-200 py-1.5 px-4 text-right">
          {view === 'teacher_login' ? (
            <button
              onClick={() => setView('student_dashboard')}
              className="text-xs font-bold text-slate-600 hover:text-indigo-600"
            >
              🧑‍🎓 Перейти в кабинет ученика ➔
            </button>
          ) : (
            <button
              onClick={() => setView('teacher_login')}
              className="text-xs font-bold text-slate-500 hover:text-indigo-600"
            >
              🔑 Вход для преподавателя
            </button>
          )}
        </div>
      )}

      <main className={view === 'room' ? 'w-full' : 'max-w-6xl mx-auto px-4 py-8'}>
        {/* TEACHER LOGIN MODAL */}
        {view === 'teacher_login' && !isAuthenticated && (
          <TeacherAuthModal onLogin={handleTeacherLogin} loginError={loginError} />
        )}

        {/* STUDENT DASHBOARD (DEFAULT VIEW FOR STUDENTS) */}
        {view === 'student_dashboard' && !isAuthenticated && (
          <StudentDashboard
            onOpenLesson={(id) => openLesson(id, true, false)}
            onLaunchVocabTrainer={handleLaunchTrainerFromDictionary}
            onLogout={() => {
              const newName = prompt('Введите ваше имя:', 'Ученик');
              if (newName) {
                localStorage.setItem('ls_student_name', newName.trim());
                window.location.reload();
              }
            }}
          />
        )}

        {/* DICTIONARY VIEW FOR TEACHERS */}
        {view === 'dictionary' && isTeacher && isAuthenticated && (
          <DictionaryView 
            onLaunchTrainer={handleLaunchTrainerFromDictionary} 
            onBack={() => setView('library')} 
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

        {/* ACTIVE CLASSROOM / TRAINER ROOM */}
        {view === 'room' && activeLesson && (
          <RoomView
            activeLesson={activeLesson}
            roomId={roomId}
            isTeacher={isTeacher}
            onExitRoom={() => { 
              window.history.pushState({}, '', '/'); 
              setView(isAuthenticated ? 'library' : 'student_dashboard'); 
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
