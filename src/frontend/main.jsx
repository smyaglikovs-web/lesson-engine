import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

function App() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Load lessons from Cloudflare D1
  const loadLessons = () => {
    setLoading(true);
    fetch('/api/lessons')
      .then(res => res.json())
      .then(data => { 
        if (Array.isArray(data)) setLessons(data); 
        setLoading(false); 
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadLessons();
  }, []);

  // Create a Demo Interactive Lesson
  const createDemoLesson = async () => {
    setCreating(true);
    const sampleLesson = {
      id: 'demo-lesson-1',
      title: 'English Lesson: Travel & Holidays',
      level: 'B1',
      topic: 'Travel',
      description: 'Learn vocabulary for airport, hotels, and holiday activities with interactive quizzes.',
      blocks: [
        { id: 'b1', type: 'heading', level: 1, text: '✈️ Travel & Holidays' },
        { id: 'b2', type: 'text', text: 'Welcome to this interactive lesson! Watch the vocabulary and test your knowledge below.' },
        {
          id: 'b3',
          type: 'grammar_card',
          title: 'Present Perfect for Travel Experience',
          formula: 'Subject + have/has + Past Participle (V3)',
          explanation: 'Use Present Perfect when talking about life experiences without stating the exact time.',
          examples: ['I have visited Paris twice.', 'She has never flown in a helicopter.']
        },
        {
          id: 'b4',
          type: 'multiple_choice',
          question: 'Which sentence is grammatically correct?',
          options: [
            'I have go to London last year.',
            'I have been to London twice.',
            'I was been to London.'
          ],
          correct: 1,
          explanation: 'Use "have been" to describe places you have visited in your life.'
        },
        {
          id: 'b5',
          type: 'gap_fill',
          instruction: 'Fill in the gap:',
          text: 'She has already [booked] her hotel room for summer.',
          answers: ['booked']
        },
        {
          id: 'b6',
          type: 'matching',
          instruction: 'Match words with their meanings:',
          pairs: [
            { left: 'Boarding pass', right: 'Document to get on a plane' },
            { left: 'Luggage', right: 'Bags and suitcases' },
            { left: 'Passport control', right: 'Place where identity is checked' }
          ]
        }
      ]
    };

    try {
      const res = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sampleLesson)
      });
      const data = await res.json();
      if (data.success) {
        alert('🎉 Demo lesson created successfully!');
        loadLessons();
      } else {
        alert('Error creating lesson: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Failed to connect to API: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-8">
      <header className="max-w-4xl mx-auto flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">L</div>
          <h1 className="text-xl font-bold">Lesson Engine</h1>
        </div>
        <button
          onClick={createDemoLesson}
          disabled={creating}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow transition disabled:opacity-50"
        >
          {creating ? 'Creating...' : '➕ Add Demo Lesson'}
        </button>
      </header>

      <main className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Облачная библиотека уроков</h2>
        {loading ? (
          <p className="text-slate-400">Загрузка из Cloudflare D1...</p>
        ) : lessons.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border text-center shadow-sm">
            <p className="text-slate-600 mb-4">Пока нет уроков в вашей базе данных D1.</p>
            <button
              onClick={createDemoLesson}
              disabled={creating}
              className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl shadow hover:bg-indigo-700 transition"
            >
              Создать первый демо-урок
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lessons.map(l => (
              <div key={l.id} className="bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition">
                <div className="flex justify-between items-center mb-2">
                  <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full uppercase">{l.level || 'A2'}</span>
                  <span className="text-xs text-slate-400">{l.topic || 'General'}</span>
                </div>
                <h3 className="font-bold text-lg text-slate-800">{l.title}</h3>
                <p className="text-slate-500 text-sm mt-1">{l.description}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
