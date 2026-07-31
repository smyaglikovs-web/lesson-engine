import React, { useState, useEffect } from 'react';
import { BlockRenderer } from './components/BlockRenderer.jsx';

const DEFAULT_NEW_JSON = {
  "title": "B1 Grammar & Video Lesson: Present Continuous",
  "level": "B1",
  "topic": "Грамматика и Видео",
  "description": "Урок с поддержкой видео YouTube, аудио, упражнений и домашнего задания.",
  "pages": [
    {
      "id": "p1",
      "title": "Часть 1: Видео и Правило",
      "blocks": [
        { "id": "b1", "type": "heading", "level": 1, "text": "Present Continuous in English" },
        { "id": "b2", "type": "video", "title": "Посмотрите обучающее видео:", "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
        { "id": "b3", "type": "grammar_card", "title": "Правило образования", "formula": "Subject + am / is / are + Verb-ing", "explanation": "Используется для запланированных действий в будущем.", "examples": ["I am meeting my friends tonight.", "She is flying to London tomorrow."] }
      ]
    }
  ]
};

export default function App() {
  const [view, setView] = useState('library');
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeLessonId, setActiveLessonId] = useState(null);

  useEffect(() => {
    fetch('/api/lessons')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setLessons(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('library')}>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">L</div>
            <span className="font-bold text-slate-900 text-lg">Lesson Engine</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12 text-slate-400">Загрузка из D1...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {lessons.map(l => (
              <div key={l.id} className="bg-white rounded-2xl p-6 border shadow-sm">
                <h3 className="text-xl font-bold text-slate-800 mb-2">{l.title}</h3>
                <p className="text-slate-600 text-sm mb-4">{l.description}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
