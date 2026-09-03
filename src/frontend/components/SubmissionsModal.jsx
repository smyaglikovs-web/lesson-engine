import React, { useState, useEffect } from 'react';

export const SubmissionsModal = ({ lesson, onClose }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState(null);

  const getAuthPassword = () => {
    return localStorage.getItem('teacher_pass') || 'teacher123';
  };

  const fetchSubmissions = () => {
    setLoading(true);
    fetch('/api/homework/' + lesson.id, {
      headers: { 'x-teacher-password': getAuthPassword() }
    })
      .then(res => res.json())
      .then(data => { 
        setSubmissions(Array.isArray(data) ? data : []); 
        setLoading(false); 
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchSubmissions();
  }, [lesson.id]);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-100 space-y-6">
        <div className="flex justify-between items-start pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Homework Submissions: {lesson.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Automated partial-credit scoring & results</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer">✕</button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 font-medium">Loading from D1 database...</div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-semibold bg-slate-50/50 rounded-2xl border border-slate-200/80 p-8 space-y-2">
            <span className="text-3xl block mb-2">📋</span>
            <p>No student submissions yet.</p>
          </div>
        ) : selectedSub ? (
          <div className="space-y-4">
            <button onClick={() => setSelectedSub(null)} className="text-xs text-indigo-600 font-extrabold hover:underline cursor-pointer flex items-center gap-1">
              ← Back to submissions list
            </button>

            <div className="bg-indigo-50/80 p-5 rounded-2xl border border-indigo-100 flex justify-between items-center">
              <div>
                <h4 className="font-extrabold text-slate-900 text-lg">{selectedSub.student_name}</h4>
                <p className="text-xs text-slate-500">{new Date(selectedSub.created_at).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <span className="px-3.5 py-1.5 bg-indigo-600 text-white font-extrabold text-xs rounded-full shadow-2xs">
                  {selectedSub.score} / {selectedSub.total_questions} pts ({Math.round((selectedSub.score / (selectedSub.total_questions || 1)) * 100)}%)
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Raw Submitted Data</span>
              <pre className="text-xs font-mono text-slate-800 whitespace-pre-wrap max-h-60 overflow-y-auto">
                {JSON.stringify(JSON.parse(selectedSub.answers || "{}"), null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map(sub => {
              const pct = Math.round((sub.score / (sub.total_questions || 1)) * 100);
              return (
                <div key={sub.id} className="p-4 border border-slate-200/80 rounded-2xl flex justify-between items-center hover:bg-slate-50 transition">
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-base">{sub.student_name}</h4>
                    <p className="text-xs text-slate-400">{new Date(sub.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 font-extrabold text-xs rounded-full ${
                      pct >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {sub.score} / {sub.total_questions} pts ({pct}%)
                    </span>
                    <button onClick={() => setSelectedSub(sub)} className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs rounded-xl transition cursor-pointer">
                      Inspect ➔
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
