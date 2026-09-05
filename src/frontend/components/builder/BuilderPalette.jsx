import React from 'react';

export const BuilderPalette = ({ onAddBlock }) => {
  const handleDragStart = (e, type) => {
    e.dataTransfer.setData('new-block-type', `palette:${type}`);
    e.dataTransfer.setData('text/plain', `palette:${type}`);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const renderTile = (type, icon, label, customStyle = '') => (
    <button
      key={type}
      type="button"
      draggable
      onDragStart={(e) => handleDragStart(e, type)}
      onClick={() => onAddBlock(type)}
      className={`p-2.5 rounded-xl border text-left transition cursor-grab active:cursor-grabbing flex flex-col justify-between group shadow-2xs h-16 select-none ${
        customStyle || 'border-slate-200/80 bg-slate-50/70 hover:bg-indigo-50 hover:border-indigo-300'
      }`}
      title="Нажмите, чтобы добавить в конец, или перетащите прямо между карточками!"
    >
      <div className="flex justify-between items-center w-full">
        <span className="text-base group-hover:scale-110 transition">{icon}</span>
        <span className="text-[10px] text-slate-300 group-hover:text-indigo-400 font-mono opacity-60">⠿</span>
      </div>
      <span className="text-[11px] font-bold text-slate-800 group-hover:text-indigo-700 truncate w-full">
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

      {/* SECTION 1: ANCHORS (COMPACT DRAGGABLE 2-COLUMN GRID) */}
      <div className="space-y-2">
        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
          📖 Материалы (Anchors)
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {renderTile('heading', '📝', 'Заголовок')}
          {renderTile('text', '📄', 'Текст / Статья')}
          {renderTile('grammar_card', '📘', 'Грамматика', 'border-indigo-200/80 bg-indigo-50/60 hover:bg-indigo-100 hover:border-indigo-400')}
          {renderTile('link', '🔗', 'Веб-ссылка', 'border-blue-200/80 bg-blue-50/60 hover:bg-blue-100 hover:border-blue-400')}
          {renderTile('teacher_notes', '👨‍🏫', 'Заметки', 'border-amber-200/80 bg-amber-50/60 hover:bg-amber-100 hover:border-amber-400')}
          {renderTile('image', '🖼️', 'Картинки AI')}
          {renderTile('audio', '🎧', 'Аудио Подкаст')}
          {renderTile('video', '🎥', 'YouTube')}
        </div>
      </div>

      {/* SECTION 2: INTERACTIVE PRACTICE (COMPACT DRAGGABLE 2-COLUMN GRID) */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
          🧩 Упражнения (Practice)
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {renderTile('flashcards', '🎴', 'Флешкарты')}
          {renderTile('inline_select', '🔽', 'Inline выбор', 'border-indigo-200/80 bg-indigo-50/50 hover:bg-indigo-100 hover:border-indigo-300')}
          {renderTile('spinning_wheel', '🎡', 'Колесо вопросов', 'border-purple-200/80 bg-purple-50/60 hover:bg-purple-100 hover:border-purple-300')}
          {renderTile('matching', '🔗', 'Пары (Match)')}
          {renderTile('multiple_choice', '❓', 'Multiple Choice')}
          {renderTile('true_false', '⚖️', 'True / False', 'border-indigo-200/80 bg-indigo-50/50 hover:bg-indigo-100 hover:border-indigo-300')}
          {renderTile('gap_fill', '✏️', 'Пропуски (Ввод)')}
          {renderTile('gap_fill_bank', '🧩', 'Банк Слов')}
          {renderTile('sentence_reorder', '🔤', 'Сборка фраз')}
          {renderTile('categorization', '📦', 'Сортировка')}
        </div>

        {/* FULL-WIDTH DRAGGABLE TILE FOR OPEN INPUT */}
        <button
          type="button"
          draggable
          onDragStart={(e) => handleDragStart(e, 'open_input')}
          onClick={() => onAddBlock('open_input')}
          className="w-full p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-indigo-50 hover:border-indigo-300 text-left transition cursor-grab active:cursor-grabbing flex items-center justify-between group shadow-2xs mt-1.5"
          title="Нажмите или перетащите блок размышления"
        >
          <div className="flex items-center gap-2">
            <span className="text-base group-hover:scale-110 transition">💬</span>
            <span className="text-[11px] font-bold text-slate-800 group-hover:text-indigo-700">Письменный / Устный вопрос</span>
          </div>
          <span className="text-xs text-slate-400 group-hover:text-indigo-600 font-mono">⠿</span>
        </button>
      </div>
    </div>
  );
};
