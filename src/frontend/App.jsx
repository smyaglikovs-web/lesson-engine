import React, { useState, useEffect } from 'react';

export default function App() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/lessons')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setLessons(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-8">
      <header className="max-w-4xl mx-auto flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">L</div>
          <h1 className="text-xl font-bold">Lesson Engine</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Облачная библиотека</h2>
        {loading ? (
          <p className="text-slate-400">Загрузка из D1...</p>
        ) : lessons.length === 0 ? (
          <p className="text-slate-400 bg-white p-6 rounded-2xl border">Пока нет уроков. Начните создавать!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lessons.map(l => (
              <div key={l.id} className="bg-white p-6 rounded-xl border shadow-sm">
                <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full uppercase">{l.level || 'A2'}</span>
                <h3 className="font-bold text-lg mt-2">{l.title}</h3>
                <p className="text-slate-500 text-sm mt-1">{l.description}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
