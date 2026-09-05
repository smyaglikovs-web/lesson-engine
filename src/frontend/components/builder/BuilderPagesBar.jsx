import React, { useState } from 'react';

export const BuilderPagesBar = ({
  pages = [],
  activePageIndex = 0,
  setActivePageIndex,
  onAddPage,
  onDeletePage,
  onUpdatePageTitle,
  onReorderPages
}) => {
  const [draggedPageIdx, setDraggedPageIdx] = useState(null);
  const [dragOverPageIdx, setDragOverPageIdx] = useState(null);
  const [dragActiveHandle, setDragActiveHandle] = useState(false);

  const handleDragStart = (e, idx) => {
    e.dataTransfer.setData('page-tab-idx', String(idx));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedPageIdx(idx);
  };

  const handleDragEnd = () => {
    setDraggedPageIdx(null);
    setDragOverPageIdx(null);
    setDragActiveHandle(false);
  };

  const handleDrop = (e, targetIdx) => {
    e.preventDefault();
    setDragOverPageIdx(null);
    setDragActiveHandle(false);

    const fromIdxStr = e.dataTransfer.getData('page-tab-idx');
    if (fromIdxStr !== undefined && fromIdxStr !== null && fromIdxStr !== '') {
      const fromIdx = Number(fromIdxStr);
      if (fromIdx !== targetIdx && onReorderPages) {
        onReorderPages(fromIdx, targetIdx);
      }
    }
  };

  return (
    <div className="bg-white p-2.5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between gap-2 overflow-x-auto w-full min-w-0 select-none">
      
      {/* HORIZONTAL DRAGGABLE TABS STRIP */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2 shrink-0 hidden sm:inline">
          Страницы:
        </span>

        {pages.map((p, idx) => {
          const isActive = activePageIndex === idx;
          const isDragging = draggedPageIdx === idx;
          const isDragOver = dragOverPageIdx === idx && draggedPageIdx !== idx;

          if (isActive) {
            return (
              <div
                key={p.id || idx}
                draggable={dragActiveHandle}
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => { e.preventDefault(); setDragOverPageIdx(idx); }}
                onDragLeave={() => { if (dragOverPageIdx === idx) setDragOverPageIdx(null); }}
                onDrop={(e) => handleDrop(e, idx)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white shadow-xs shrink-0 transition-all ${
                  isDragging ? 'opacity-40 scale-95' : ''
                } ${isDragOver ? 'ring-2 ring-indigo-400 ring-offset-2 scale-102' : ''}`}
              >
                {/* DEDICATED GRAB HANDLE FOR ACTIVE TAB */}
                <span
                  onMouseDown={() => setDragActiveHandle(true)}
                  onMouseUp={() => setDragActiveHandle(false)}
                  className="cursor-grab active:cursor-grabbing text-indigo-200 hover:text-white font-extrabold text-[11px] flex items-center gap-0.5 select-none"
                  title="Потяните для изменения порядка страниц"
                >
                  <span>#{idx + 1}</span>
                  <span className="text-[10px] opacity-70">⠿</span>
                </span>

                {/* INLINE TITLE INPUT */}
                <input
                  type="text"
                  value={p.title || ''}
                  onChange={(e) => onUpdatePageTitle(e.target.value)}
                  placeholder={`Часть ${idx + 1}...`}
                  className="bg-transparent text-white font-extrabold text-xs outline-none border-b border-indigo-400/80 focus:border-white px-1 py-0.5 min-w-[110px] max-w-[180px] transition"
                  title="Нажмите, чтобы изменить название страницы"
                />

                {pages.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onDeletePage(idx)}
                    className="p-1 text-indigo-200 hover:text-white hover:bg-indigo-700/60 rounded-lg text-xs font-bold transition cursor-pointer ml-0.5"
                    title="Удалить эту страницу"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          }

          return (
            <button
              key={p.id || idx}
              type="button"
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => { e.preventDefault(); setDragOverPageIdx(idx); }}
              onDragLeave={() => { if (dragOverPageIdx === idx) setDragOverPageIdx(null); }}
              onDrop={(e) => handleDrop(e, idx)}
              onClick={() => setActivePageIndex(idx)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 shrink-0 cursor-grab active:cursor-grabbing flex items-center gap-1.5 ${
                isDragging ? 'opacity-40 scale-95' : ''
              } ${isDragOver ? 'ring-2 ring-indigo-500 ring-offset-2 scale-102 bg-indigo-50 border-indigo-300' : ''}`}
              title="Нажмите, чтобы открыть страницу, или потяните для изменения порядка"
            >
              <span className="text-slate-400 font-bold text-[10px]">#{idx + 1}</span>
              <span className="truncate max-w-[130px]">{p.title || `Часть ${idx + 1}`}</span>
              <span className="text-[10px] text-slate-300 opacity-60 font-mono">⠿</span>
            </button>
          );
        })}

        {/* ADD NEW PAGE BUTTON */}
        <button
          type="button"
          onClick={onAddPage}
          className="px-3 py-2 rounded-xl text-xs font-extrabold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition cursor-pointer shrink-0 flex items-center gap-1"
        >
          <span>+</span>
          <span>Добавить</span>
        </button>
      </div>

      {/* RIGHT SIDE PAGE COUNTER */}
      <div className="hidden md:flex items-center gap-2 pr-2 shrink-0">
        <span className="text-[11px] font-bold text-slate-400">
          Страница <strong className="text-indigo-600">{activePageIndex + 1}</strong> из {pages.length}
        </span>
      </div>
    </div>
  );
};
