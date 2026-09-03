import React, { useState, useEffect } from 'react';

export const StudentsView = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/students');
      if (res.ok) {
        const data = await res.json();
        setStudents(Array.isArray(data) ? data : []);
      }
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const filtered = students.filter(s => 
    !search || s.name.toLowerCase().includes(search.toLowerCase().trim())
  );

  const totalCompletedHw = students.reduce((acc, s) => acc + s.totalSubmissions, 0);
  const overallAvg = students.length > 0 
    ? Math.round(students.reduce((acc, s) => acc + s.accuracyPercentage, 0) / students.length) 
    : 0;

  return (
    <div className="space-y-6">
      {/* HEADER & SUMMARY METRIC CARDS */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Ученики и Прогресс</h1>
        <p className="text-slate-500 text-xs mt-1">Центральный мониторинг успеваемости и выполненных домашних заданий</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Всего учеников</span>
          <p className="text-3xl font-extrabold text-slate-900">{students.length}</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Сдано заданий ДЗ</span>
          <p className="text-3xl font-extrabold text-indigo-600">{totalCompletedHw}</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Средняя точность класса</span>
          <p className="text-3xl font-extrabold text-emerald-600">{overallAvg}%</p>
        </div>
      </div>

      {/* SEARCH INPUT */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-2">
        <span className="text-slate-400 pl-2">🔍</span>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по имени ученика..."
          className="w-full text-xs font-medium text-slate-800 outline-none bg-transparent"
        />
      </div>

      {/* DIRECTORY TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Загрузка данных об учениках...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <span className="text-3xl block">🧑‍🎓</span>
            <p className="font-bold">Ученики пока не отправляли выполненные задания.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="p-4 pl-6">Ученик</th>
                  <th className="p-4">Сдано работ</th>
                  <th className="p-4">Баллы</th>
                  <th className="p-4">Средняя точность</th>
                  <th className="p-4 pr-6">Последняя активность</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-800">
                {filtered.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="p-4 pl-6 font-extrabold text-slate-900 flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                        {s.name.charAt(0).toUpperCase()}
                      </span>
                      <span>{s.name}</span>
                    </td>
                    <td className="p-4">{s.totalSubmissions} работ</td>
                    <td className="p-4">{s.earnedPoints} / {s.possiblePoints} pts</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full font-extrabold text-[11px] ${
                        s.accuracyPercentage >= 80 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {s.accuracyPercentage}%
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-slate-400">{new Date(s.lastActive).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
