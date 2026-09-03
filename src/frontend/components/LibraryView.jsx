import React, { useState, useEffect, useRef } from 'react';

export const LibraryView = ({ lessons = [], loading, onOpenLesson, onCreateNew, onDeleteLesson, onViewSubmissions, onEditLesson }) => {
  const fileInputRef = useRef(null);
  const [folders, setFolders] = useState([]);
  const [activeFolder, setActiveFolder] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch Folders from API
  const fetchFolders = async () => {
    try {
      const res = await fetch('/api/folders');
      if (res.ok) {
        const data = await res.json();
        setFolders(Array.isArray(data) ? data : []);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  const handleAddFolder = async () => {
    const name = prompt('Введите название новой папки (например: B2 Speaking Group):');
    if (!name?.trim()) return;

    try {
      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() })
      });
      if (res.ok) {
        fetchFolders();
        setActiveFolder(name.trim());
      }
    } catch (e) {}
  };

  // Instant responsive client-side filtering
  const filteredLessons = lessons.filter(l => {
    const matchFolder = !activeFolder || l.folder_name === activeFolder;
    const matchLevel = !filterLevel || l.level === filterLevel;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch = !q || 
      (l.title && l.title.toLowerCase().includes(q)) || 
      (l.topic && l.topic.toLowerCase().includes(q)) || 
      (l.description && l.description.toLowerCase().includes(q));

    return matchFolder && matchLevel && matchSearch;
  });

  const handleExportLesson = async (lessonSummary, e) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/lessons/${lessonSummary.id}`);
      const fullLessonData = await res.json();
      
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(fullLessonData, null, 2))}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `${(lessonSummary.title || 'lesson').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      alert('Ошибка экспорта: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER WITH CTAS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Библиотека уроков</h1>
          <p className="text-slate-500 text-xs mt-1">Интерактивные учебные модули и управление группами</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={e => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = async event => {
                try {
                  const imported = JSON.parse(event.target.result);
                  const password = localStorage.getItem('teacher_pass') || 'teacher123';
                  await fetch('/api/lessons', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-teacher-password': password },
                    body: JSON.stringify({ ...imported, id: 'lesson-' + Date.now(), title: `${imported.title} (Import)` })
                  });
                  window.location.reload();
                } catch (err) { alert('Ошибка импорта'); }
              };
              reader.readAsText(file);
            }}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition cursor-pointer"
          >
            📥 Импорт JSON
          </button>
          <button
            onClick={onCreateNew}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-xs transition shadow-md cursor-pointer"
          >
            + Новый урок
          </button>
        </div>
      </div>

      {/* FOLDER PILL TABS */}
      <div className="flex gap-2 flex-wrap items-center">
        <button
          onClick={() => setActiveFolder('')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
            activeFolder === '' 
              ? 'bg-indigo-600 text-white shadow-2xs' 
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Все ({lessons.length})
        </button>

        {folders.map(f => (
          <button
            key={f.id}
            onClick={() => setActiveFolder(f.name)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
              activeFolder === f.name 
                ? 'bg-indigo-600 text-white shadow-2xs' 
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            📁 {f.name}
          </button>
        ))}

        <button
          onClick={handleAddFolder}
          className="px-3.5 py-1.5 rounded-full border border-dashed border-slate-300 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 text-xs font-bold transition cursor-pointer"
        >
          + Папка
        </button>
      </div>

      {/* SEARCH & LEVEL FILTER BAR */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={filterLevel}
          onChange={e => setFilterLevel(e.target.value)}
          className="px-4 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs shrink-0"
        >
          <option value="">Все уровни</option>
          <option>A1</option><option>A2</option><option>B1</option><option>B2</option><option>C1</option><option>C2</option>
        </select>

        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Поиск по названию, теме, грамматике..."
          className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-indigo-600 rounded-2xl text-xs font-medium text-slate-900 outline-none shadow-2xs"
        />
      </div>

      {/* LESSON CARDS GRID */}
      {loading ? (
        <div className="text-center py-20 text-slate-400 font-medium">Загрузка из Cloudflare D1...</div>
      ) : filteredLessons.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <span className="text-4xl block">📚</span>
          <p className="font-extrabold text-slate-700">Уроки не найдены</p>
          <p className="text-slate-400 text-xs">Попробуйте изменить параметры поиска или создайте новый урок.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredLessons.map(l => (
            <div
              key={l.id}
              className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-indigo-200 transition duration-200 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-extrabold text-[11px] rounded-full uppercase tracking-wider">
                    {l.level || 'B1'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button onClick={e => handleExportLesson(l, e)} className="px-2.5 py-1 text-slate-500 hover:text-slate-900 text-xs font-bold cursor-pointer">
                      💾 Экспорт
                    </button>
                    <button onClick={() => onEditLesson(l)} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer">
                      ✏️ Правка
                    </button>
                    <button onClick={() => onViewSubmissions(l)} className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl cursor-pointer">
                      📊 ДЗ
                    </button>
                    <button onClick={e => onDeleteLesson(l.id, e)} className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer">
                      🗑️
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 leading-snug">{l.title}</h3>
                  <p className="text-slate-500 text-xs mt-1.5 line-clamp-2 leading-relaxed">{l.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <button
                  onClick={() => onOpenLesson(l.id)}
                  className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl text-xs transition shadow-xs cursor-pointer"
                >
                  Провести урок ➔
                </button>
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/?homework=${l.id}`;
                    navigator.clipboard.writeText(url);
                    alert('🔗 Ссылка на ДЗ скопирована!');
                  }}
                  className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition cursor-pointer"
                >
                  Ссылка на ДЗ 🏠
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
