import React, { useState, useEffect } from 'react';

export const DictionaryView = ({ onLaunchTrainer, onBack }) => {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchDictionary = async () => {
    setLoading(true);
    try {
      const studentId = localStorage.getItem('ls_student_id') || '';
      const res = await fetch(`/api/dictionary?studentId=${encodeURIComponent(studentId)}`);
      if (res.ok) {
        const data = await res.json();
        setWords(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDictionary();
  }, []);

  const handleDeleteWord = async (id, e) => {
    e.stopPropagation();
    try {
      await fetch(`/api/dictionary/${id}`, { method: 'DELETE' });
      setWords(prev => prev.filter(w => w.id !== id));
    } catch (e) {}
  };

  const filteredWords = words.filter(w => 
    !search || 
    w.word.toLowerCase().includes(search.toLowerCase().trim()) ||
    (w.translation && w.translation.toLowerCase().includes(search.toLowerCase().trim()))
  );

  const handleStartTrainer = () => {
    if (words.length === 0) return;
    if (onLaunchTrainer) {
      onLaunchTrainer(words);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>⭐</span>
            <span>Мой Словарь</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Слова, сохранённые из карточек уроков. Всего сохранëно: {words.length}
          </p>
        </div>

        <div className="flex gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-2xl text-xs hover:bg-slate-50 cursor-pointer"
            >
              ← Назад
            </button>
          )}
          <button
            type="button"
            disabled={words.length === 0}
            onClick={handleStartTrainer}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-white font-extrabold rounded-2xl text-xs shadow-md transition disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
          >
            <span>⚡ Тренировать ({words.length})</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-2">
        <span className="text-slate-400 pl-2">🔍</span>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по словам и переводам..."
          className="w-full text-xs font-medium text-slate-800 outline-none bg-transparent"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 font-bold">Загрузка словаря...</div>
      ) : filteredWords.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <span className="text-4xl block">📖</span>
          <p className="font-extrabold text-slate-700">Словарь пуст</p>
          <p className="text-slate-400 text-xs">
            Нажимайте на звездочку (⭐) на любой карточке в уроках, чтобы добавить слова сюда!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredWords.map((item) => (
            <div
              key={item.id}
              className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-indigo-200 transition flex justify-between items-start gap-2"
            >
              <div className="space-y-1">
                <span className="text-base font-extrabold text-slate-900 block">
                  {item.word}
                </span>
                <span className="text-xs font-bold text-indigo-700 block">
                  {item.translation || '—'}
                </span>
                {item.example && (
                  <p className="text-[11px] text-slate-500 italic mt-1 font-medium">
                    "{item.example}"
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={(e) => handleDeleteWord(item.id, e)}
                className="text-slate-300 hover:text-rose-600 transition p-1 text-sm cursor-pointer"
                title="Удалить из словаря"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
