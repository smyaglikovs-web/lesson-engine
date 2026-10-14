import React, { useState, useEffect } from 'react';

export const DictionaryView = ({ onLaunchTrainer, onBack }) => {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('flashcards'); // 'flashcards' | 'list'
  const [flippedMap, setFlippedMap] = useState({});

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
    if (e) e.stopPropagation();
    try {
      await fetch(`/api/dictionary/${id}`, { method: 'DELETE' });
      setWords(prev => prev.filter(w => w.id !== id));
    } catch (e) {}
  };

  const handleCardToggle = (id) => {
    setFlippedMap(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const speakText = (text, lang = 'en-US') => {
    if ('speechSynthesis' in window && text) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
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
    <div className="space-y-6 max-w-5xl mx-auto w-full min-w-0">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">⭐</span>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Мой Личный Словарь
            </h2>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Слова, сохраненные с уроков. Нажмите на карточку для переворота или 🔊 для аудио.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-2xl text-xs hover:bg-slate-50 cursor-pointer"
            >
              ← Назад
            </button>
          )}

          {/* VIEW MODE TOGGLE */}
          <div className="flex p-1 bg-slate-100 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode('flashcards')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'flashcards' ? 'bg-white text-indigo-700 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🎴 Карточки
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'list' ? 'bg-white text-indigo-700 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              📋 Список
            </button>
          </div>

          <button
            type="button"
            disabled={words.length === 0}
            onClick={handleStartTrainer}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white font-extrabold rounded-2xl text-xs shadow-md transition disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
          >
            <span>⚡ Vocab Trainer ({words.length})</span>
          </button>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-2">
        <span className="text-slate-400 pl-2">🔍</span>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по сохраненным словам и переводам..."
          className="w-full text-xs font-medium text-slate-800 outline-none bg-transparent"
        />
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400 font-bold">Загрузка вашего словаря...</div>
      ) : filteredWords.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <span className="text-4xl block">📖</span>
          <p className="font-extrabold text-slate-700">Словарь пуст</p>
          <p className="text-slate-400 text-xs max-w-sm mx-auto">
            Нажимайте звездочку (⭐) на карточках в любом уроке, и слова сразу сохранятся сюда!
          </p>
        </div>
      ) : viewMode === 'flashcards' ? (
        /* 1. INTERACTIVE 3D FLIP FLASHCARDS (THE SAME AS IN LESSONS) */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredWords.map((item) => {
            const isFlipped = Boolean(flippedMap[item.id]);
            const targetText = isFlipped ? (item.translation || 'Перевод') : item.word;

            return (
              <div
                key={item.id}
                tabIndex={0}
                role="button"
                onClick={() => handleCardToggle(item.id)}
                className="min-h-[180px] rounded-3xl p-5 flex flex-col justify-between transition-all duration-300 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-indigo-500/40 shadow-xs hover:shadow-md hover:-translate-y-0.5 border relative"
                style={{
                  backgroundColor: isFlipped ? '#4f46e5' : '#ffffff',
                  borderColor: isFlipped ? '#4338ca' : '#e2e8f0',
                  color: isFlipped ? '#ffffff' : '#0f172a'
                }}
              >
                {/* TOP BAR */}
                <div className="w-full flex justify-between items-center text-xs">
                  <span className={`font-extrabold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-md ${
                    isFlipped ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {isFlipped ? 'Перевод' : 'Слово'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      title="Прослушать произношение"
                      onClick={(e) => {
                        e.stopPropagation();
                        speakText(item.word);
                      }}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition cursor-pointer text-sm ${
                        isFlipped 
                          ? 'bg-indigo-700/80 hover:bg-indigo-600 text-white' 
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                      }`}
                    >
                      🔊
                    </button>
                    <button
                      type="button"
                      title="Удалить из словаря"
                      onClick={(e) => handleDeleteWord(item.id, e)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition cursor-pointer text-xs font-bold ${
                        isFlipped 
                          ? 'bg-indigo-700/80 hover:bg-rose-500 text-white' 
                          : 'bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200'
                      }`}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* WORD / TRANSLATION */}
                <div className="my-auto py-3 text-center px-1">
                  <p className="text-lg sm:text-xl font-extrabold leading-snug tracking-tight break-words">
                    {targetText}
                  </p>
                </div>

                {/* EXAMPLE CONTEXT */}
                {item.example ? (
                  <div className={`text-[11px] leading-relaxed pt-2 border-t ${
                    isFlipped ? 'border-indigo-400/40 text-indigo-100' : 'border-slate-100 text-slate-500'
                  }`}>
                    <p className="italic font-medium line-clamp-2">
                      "{item.example}"
                    </p>
                  </div>
                ) : (
                  <div className="h-1"></div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* 2. COMPACT TABLE/LIST VIEW */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filteredWords.map((item) => (
              <div key={item.id} className="p-4 hover:bg-slate-50 transition flex justify-between items-center gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <strong className="text-slate-900 text-sm font-extrabold">{item.word}</strong>
                    <button
                      type="button"
                      onClick={() => speakText(item.word)}
                      className="text-slate-400 hover:text-indigo-600 text-xs cursor-pointer"
                    >
                      🔊
                    </button>
                    <span className="text-slate-300">➔</span>
                    <span className="text-indigo-700 font-bold text-xs">{item.translation}</span>
                  </div>
                  {item.example && (
                    <p className="text-[11px] text-slate-500 italic">"{item.example}"</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={(e) => handleDeleteWord(item.id, e)}
                  className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
