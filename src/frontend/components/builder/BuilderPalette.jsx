import React from 'react';

export const BuilderPalette = ({ onAddBlock }) => {
  const handleDragStart = (e, type) => {
    e.dataTransfer.setData('new-block-type', `palette:${type}`);
    e.dataTransfer.setData('text/plain', `palette:${type}`);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const renderTile = (type, icon, label, styleClasses) => (
    <button
      key={type}
      type="button"
      draggable
      onDragStart={(e) => handleDragStart(e, type)}
      onClick={() => onAddBlock(type)}
      className={`p-2.5 rounded-2xl border text-left transition cursor-grab active:cursor-grabbing flex flex-col justify-between group shadow-2xs h-16 select-none ${styleClasses}`}
      title="Нажмите для добавления или перетащите прямо на страницу"
    >
      <div className="flex justify-between items-center w-full">
        <span className="text-base group-hover:scale-110 transition">{icon}</span>
        <span className="text-[10px] text-slate-400 opacity-60 group-hover:opacity-100 font-mono">⠿</span>
      </div>
      <span className="text-[11px] font-extrabold truncate w-full">
        {label}
      </span>
    </button>
  );

  return (
    <div className="lg:col-span-1 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-4 h-fit sticky top-20 select-none">
      {/* PALETTE HEADER WITH HINT */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-sm shadow-2xs">
            🧩
          </span>
          <div>
            <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">Палитра Lego</h3>
            <p className="text-[9px] text-slate-400 font-medium">Кликните или перетащите</p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
          19 блоков
        </span>
      </div>

      {/* SECTION 1: ANCHORS / PRESENTATION MATERIALS (LOGICAL TEACHING FLOW) */}
      <div className="space-y-2">
        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
          📖 Материалы (Anchors)
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {renderTile('heading', '📝', 'Заголовок', 'border-slate-300/80 bg-slate-100/70 hover:bg-slate-200/80 text-slate-800')}
          {renderTile('text', '📄', 'Текст / Статья', 'border-zinc-300/80 bg-zinc-100/70 hover:bg-zinc-200/80 text-zinc-900')}
          {renderTile('grammar_card', '📘', 'Грамматика', 'border-indigo-300/80 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-950')}
          {renderTile('image', '🖼️', 'Картинки AI', 'border-pink-300/80 bg-pink-50/80 hover:bg-pink-100 text-pink-950')}
          {renderTile('audio', '🎧', 'Аудио Подкаст', 'border-purple-300/80 bg-purple-50/80 hover:bg-purple-100 text-purple-950')}
          {renderTile('video', '🎥', 'YouTube Видео', 'border-red-300/80 bg-red-50/80 hover:bg-red-100 text-red-950')}
          {renderTile('link', '🔗', 'Веб-ссылка', 'border-sky-300/80 bg-sky-50/80 hover:bg-sky-100 text-sky-950')}
          {renderTile('teacher_notes', '👨‍🏫', 'Заметки Учителя', 'border-amber-300/80 bg-amber-50/80 hover:bg-amber-100 text-amber-950')}
        </div>
      </div>

      {/* SECTION 2: INTERACTIVE EXERCISES (PEDAGOGICAL PROGRESSION) */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
          🧩 Упражнения (Practice)
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {renderTile('flashcards', '🎴', 'Флешкарты', 'border-rose-300/80 bg-rose-50/80 hover:bg-rose-100 text-rose-950')}
          {renderTile('true_false', '⚖️', 'True / False', 'border-cyan-300/80 bg-cyan-50/80 hover:bg-cyan-100 text-cyan-950')}
          {renderTile('multiple_choice', '❓', 'Тест (Quiz)', 'border-orange-300/80 bg-orange-50/80 hover:bg-orange-100 text-orange-950')}
          {renderTile('matching', '🔗', 'Пары (Match)', 'border-teal-300/80 bg-teal-50/80 hover:bg-teal-100 text-teal-950')}
          {renderTile('inline_select', '🔽', 'Inline выбор', 'border-blue-300/80 bg-blue-50/80 hover:bg-blue-100 text-blue-950')}
          {renderTile('gap_fill', '✏️', 'Пропуски (Ввод)', 'border-lime-300/80 bg-lime-50/80 hover:bg-lime-100 text-lime-950')}
          {renderTile('gap_fill_bank', '🧩', 'Банк Слов', 'border-emerald-300/80 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-950')}
          {renderTile('sentence_reorder', '🔤', 'Сборка фраз', 'border-fuchsia-300/80 bg-fuchsia-50/80 hover:bg-fuchsia-100 text-fuchsia-950')}
          {renderTile('categorization', '📦', 'Сортировка', 'border-amber-300/80 bg-amber-50/80 hover:bg-amber-100 text-amber-950')}
          {renderTile('spinning_wheel', '🎡', 'Колесо вопросов', 'border-purple-300/80 bg-purple-50/80 hover:bg-purple-100 text-purple-950')}
        </div>

        {/* FULL-WIDTH TILE FOR OPEN REFLECTION / ESSAY */}
        <button
          type="button"
          draggable
          onDragStart={(e) => handleDragStart(e, 'open_input')}
          onClick={() => onAddBlock('open_input')}
          className="w-full p-2.5 rounded-2xl border border-emerald-300/80 bg-emerald-50/80 hover:bg-emerald-100 text-left transition cursor-grab active:cursor-grabbing flex items-center justify-between group shadow-2xs mt-1.5"
          title="Нажмите или перетащите блок размышления"
        >
          <div className="flex items-center gap-2">
            <span className="text-base group-hover:scale-110 transition">💬</span>
            <span className="text-[11px] font-extrabold text-emerald-950">Письменный / Устный вопрос</span>
          </div>
          <span className="text-xs text-slate-400 group-hover:text-emerald-700 font-mono">⠿</span>
        </button>
      </div>
    </div>
  );
};
