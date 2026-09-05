import React from 'react';

export const BuilderPalette = ({ onAddBlock }) => (
  <div className="lg:col-span-1 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-4 h-fit sticky top-20 select-none">
    {/* PALETTE HEADER */}
    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
      <div className="flex items-center gap-2">
        <span className="w-7 h-7 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-sm shadow-2xs">
          🧩
        </span>
        <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">Палитра Lego</h3>
      </div>
      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
        19 блоков
      </span>
    </div>

    {/* SECTION 1: ANCHORS (COMPACT 2-COLUMN GRID) */}
    <div className="space-y-2">
      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
        📖 Материалы (Anchors)
      </span>
      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={() => onAddBlock('heading')}
          className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-indigo-50 hover:border-indigo-300 text-left transition cursor-pointer flex flex-col justify-between group shadow-2xs h-16"
        >
          <span className="text-base group-hover:scale-110 transition">📝</span>
          <span className="text-[11px] font-bold text-slate-800 group-hover:text-indigo-700 truncate w-full">Заголовок</span>
        </button>

        <button
          type="button"
          onClick={() => onAddBlock('text')}
          className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-indigo-50 hover:border-indigo-300 text-left transition cursor-pointer flex flex-col justify-between group shadow-2xs h-16"
        >
          <span className="text-base group-hover:scale-110 transition">📄</span>
          <span className="text-[11px] font-bold text-slate-800 group-hover:text-indigo-700 truncate w-full">Текст / Статья</span>
        </button>

        <button
          type="button"
          onClick={() => onAddBlock('grammar_card')}
          className="p-2.5 rounded-xl border border-indigo-200/80 bg-indigo-50/60 hover:bg-indigo-100 hover:border-indigo-400 text-left transition cursor-pointer flex flex-col justify-between group shadow-2xs h-16"
        >
          <span className="text-base group-hover:scale-110 transition">📘</span>
          <span className="text-[11px] font-extrabold text-indigo-950 truncate w-full">Грамматика</span>
        </button>

        <button
          type="button"
          onClick={() => onAddBlock('link')}
          className="p-2.5 rounded-xl border border-blue-200/80 bg-blue-50/60 hover:bg-blue-100 hover:border-blue-400 text-left transition cursor-pointer flex flex-col justify-between group shadow-2xs h-16"
        >
          <span className="text-base group-hover:scale-110 transition">🔗</span>
          <span className="text-[11px] font-bold text-blue-950 truncate w-full">Веб-ссылка</span>
        </button>

        <button
          type="button"
          onClick={() => onAddBlock('teacher_notes')}
          className="p-2.5 rounded-xl border border-amber-200/80 bg-amber-50/60 hover:bg-amber-100 hover:border-amber-400 text-left transition cursor-pointer flex flex-col justify-between group shadow-2xs h-16"
        >
          <span className="text-base group-hover:scale-110 transition">👨‍🏫</span>
          <span className="text-[11px] font-bold text-amber-950 truncate w-full">Заметки</span>
        </button>

        <button
          type="button"
          onClick={() => onAddBlock('image')}
          className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-indigo-50 hover:border-indigo-300 text-left transition cursor-pointer flex flex-col justify-between group shadow-2xs h-16"
        >
          <span className="text-base group-hover:scale-110 transition">🖼️</span>
          <span className="text-[11px] font-bold text-slate-800 group-hover:text-indigo-700 truncate w-full">Картинки AI</span>
        </button>

        <button
          type="button"
          onClick={() => onAddBlock('audio')}
          className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-indigo-50 hover:border-indigo-300 text-left transition cursor-pointer flex flex-col justify-between group shadow-2xs h-16"
        >
          <span className="text-base group-hover:scale-110 transition">🎧</span>
          <span className="text-[11px] font-bold text-slate-800 group-hover:text-indigo-700 truncate w-full">Аудио Подкаст</span>
        </button>

        <button
          type="button"
          onClick={() => onAddBlock('video')}
          className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-indigo-50 hover:border-indigo-300 text-left transition cursor-pointer flex flex-col justify-between group shadow-2xs h-16"
        >
          <span className="text-base group-hover:scale-110 transition">🎥</span>
          <span className="text-[11px] font-bold text-slate-800 group-hover:text-indigo-700 truncate w-full">YouTube Видео</span>
        </button>
      </div>
    </div>

    {/* SECTION 2: INTERACTIVE PRACTICE (COMPACT 2-COLUMN GRID) */}
    <div className="space-y-2 pt-2 border-t border-slate-100">
      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
        🧩 Упражнения (Practice)
      </span>
      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={() => onAddBlock('flashcards')}
          className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-indigo-50 hover:border-indigo-300 text-left transition cursor-pointer flex flex-col justify-between group shadow-2xs h-16"
        >
          <span className="text-base group-hover:scale-110 transition">🎴</span>
          <span className="text-[11px] font-bold text-slate-800 group-hover:text-indigo-700 truncate w-full">Флешкарты</span>
        </button>

        <button
          type="button"
          onClick={() => onAddBlock('inline_select')}
          className="p-2.5 rounded-xl border border-indigo-200/80 bg-indigo-50/50 hover:bg-indigo-100 hover:border-indigo-300 text-left transition cursor-pointer flex flex-col justify-between group shadow-2xs h-16"
        >
          <span className="text-base group-hover:scale-110 transition">🔽</span>
          <span className="text-[11px] font-bold text-indigo-900 truncate w-full">Inline выбор</span>
        </button>

        <button
          type="button"
          onClick={() => onAddBlock('spinning_wheel')}
          className="p-2.5 rounded-xl border border-purple-200/80 bg-purple-50/60 hover:bg-purple-100 hover:border-purple-300 text-left transition cursor-pointer flex flex-col justify-between group shadow-2xs h-16"
        >
          <span className="text-base group-hover:scale-110 transition">🎡</span>
          <span className="text-[11px] font-bold text-purple-900 truncate w-full">Колесо вопросов</span>
        </button>

        <button
          type="button"
          onClick={() => onAddBlock('matching')}
          className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-indigo-50 hover:border-indigo-300 text-left transition cursor-pointer flex flex-col justify-between group shadow-2xs h-16"
        >
          <span className="text-base group-hover:scale-110 transition">🔗</span>
          <span className="text-[11px] font-bold text-slate-800 group-hover:text-indigo-700 truncate w-full">Пары (Match)</span>
        </button>

        <button
          type="button"
          onClick={() => onAddBlock('multiple_choice')}
          className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-indigo-50 hover:border-indigo-300 text-left transition cursor-pointer flex flex-col justify-between group shadow-2xs h-16"
        >
          <span className="text-base group-hover:scale-110 transition">❓</span>
          <span className="text-[11px] font-bold text-slate-800 group-hover:text-indigo-700 truncate w-full">Multiple Choice</span>
        </button>

        <button
          type="button"
          onClick={() => onAddBlock('true_false')}
          className="p-2.5 rounded-xl border border-indigo-200/80 bg-indigo-50/50 hover:bg-indigo-100 hover:border-indigo-300 text-left transition cursor-pointer flex flex-col justify-between group shadow-2xs h-16"
        >
          <span className="text-base group-hover:scale-110 transition">⚖️</span>
          <span className="text-[11px] font-bold text-indigo-900 truncate w-full">True / False</span>
        </button>

        <button
          type="button"
          onClick={() => onAddBlock('gap_fill')}
          className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-indigo-50 hover:border-indigo-300 text-left transition cursor-pointer flex flex-col justify-between group shadow-2xs h-16"
        >
          <span className="text-base group-hover:scale-110 transition">✏️</span>
          <span className="text-[11px] font-bold text-slate-800 group-hover:text-indigo-700 truncate w-full">Пропуски (Ввод)</span>
        </button>

        <button
          type="button"
          onClick={() => onAddBlock('gap_fill_bank')}
          className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-indigo-50 hover:border-indigo-300 text-left transition cursor-pointer flex flex-col justify-between group shadow-2xs h-16"
        >
          <span className="text-base group-hover:scale-110 transition">🧩</span>
          <span className="text-[11px] font-bold text-slate-800 group-hover:text-indigo-700 truncate w-full">Банк Слов</span>
        </button>

        <button
          type="button"
          onClick={() => onAddBlock('sentence_reorder')}
          className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-indigo-50 hover:border-indigo-300 text-left transition cursor-pointer flex flex-col justify-between group shadow-2xs h-16"
        >
          <span className="text-base group-hover:scale-110 transition">🔤</span>
          <span className="text-[11px] font-bold text-slate-800 group-hover:text-indigo-700 truncate w-full">Сборка фраз</span>
        </button>

        <button
          type="button"
          onClick={() => onAddBlock('categorization')}
          className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-indigo-50 hover:border-indigo-300 text-left transition cursor-pointer flex flex-col justify-between group shadow-2xs h-16"
        >
          <span className="text-base group-hover:scale-110 transition">📦</span>
          <span className="text-[11px] font-bold text-slate-800 group-hover:text-indigo-700 truncate w-full">Сортировка</span>
        </button>
      </div>

      {/* FULL-WIDTH BUTTON FOR ESSAY / OPEN WRITING */}
      <button
        type="button"
        onClick={() => onAddBlock('open_input')}
        className="w-full p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-indigo-50 hover:border-indigo-300 text-left transition cursor-pointer flex items-center justify-between group shadow-2xs mt-1.5"
      >
        <div className="flex items-center gap-2">
          <span className="text-base group-hover:scale-110 transition">💬</span>
          <span className="text-[11px] font-bold text-slate-800 group-hover:text-indigo-700">Письменный / Устный вопрос</span>
        </div>
        <span className="text-xs text-slate-400 group-hover:text-indigo-600 font-bold">+</span>
      </button>
    </div>
  </div>
);
