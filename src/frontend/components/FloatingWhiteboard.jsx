import React, { useState, useRef, useEffect } from 'react';

const MARKER_COLORS = [
  { id: 'black', hex: '#0f172a', name: 'Черный' },
  { id: 'blue', hex: '#2563eb', name: 'Синий' },
  { id: 'red', hex: '#dc2626', name: 'Красный' },
  { id: 'green', hex: '#16a34a', name: 'Зеленый' }
];

const NOTE_THEMES = [
  { 
    id: 0, 
    name: 'Желтый', 
    icon: '🟡', 
    bg: 'bg-amber-100', 
    border: 'border-amber-300', 
    headerBg: 'bg-amber-200/90', 
    textCol: 'text-amber-950',
    lineColor: 'rgba(180, 83, 9, 0.09)',
    foldGrad: 'linear-gradient(225deg, rgba(217,119,6,0.3) 0%, rgba(254,243,199,0.95) 50%, #fef3c7 100%)'
  },
  { 
    id: 1, 
    name: 'Розовый', 
    icon: '🌸', 
    bg: 'bg-pink-100', 
    border: 'border-pink-300', 
    headerBg: 'bg-pink-200/90', 
    textCol: 'text-pink-950',
    lineColor: 'rgba(190, 24, 93, 0.09)',
    foldGrad: 'linear-gradient(225deg, rgba(219,39,119,0.3) 0%, rgba(252,231,243,0.95) 50%, #fce7f3 100%)'
  },
  { 
    id: 2, 
    name: 'Голубой', 
    icon: '🩵', 
    bg: 'bg-sky-100', 
    border: 'border-sky-300', 
    headerBg: 'bg-sky-200/90', 
    textCol: 'text-sky-950',
    lineColor: 'rgba(2, 132, 199, 0.09)',
    foldGrad: 'linear-gradient(225deg, rgba(2,132,199,0.3) 0%, rgba(224,242,254,0.95) 50%, #e0f2fe 100%)'
  }
];

export const FloatingWhiteboard = ({
  isTeacher = false,
  whiteboardState = {},
  onUpdate,
  onClose
}) => {
  const [minimized, setMinimized] = useState(false);
  const [activeNoteIdx, setActiveNoteIdx] = useState(whiteboardState?.activeNoteIdx || 0);

  // Store 3 independent notes
  const [notes, setNotes] = useState(() => {
    if (Array.isArray(whiteboardState?.notes) && whiteboardState.notes.length === 3) {
      return whiteboardState.notes;
    }
    return [
      { drawing: whiteboardState?.drawing || '', text: whiteboardState?.text || '', mode: whiteboardState?.mode || 'draw' },
      { drawing: '', text: '', mode: 'draw' },
      { drawing: '', text: '', mode: 'draw' }
    ];
  });

  const [activeColor, setActiveColor] = useState('#0f172a');
  const [isEraser, setIsEraser] = useState(false);
  const [lineWidth, setLineWidth] = useState(3.5);
  const [publishSuccess, setPublishSuccess] = useState(false);

  // Position coordinates for dragging
  const [position, setPosition] = useState({ x: 20, y: 100 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

  // Canvas drawing references
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef({ x: 0, y: 0 });

  const currentTheme = NOTE_THEMES[activeNoteIdx] || NOTE_THEMES[0];
  const currentNote = notes[activeNoteIdx] || notes[0];

  const restoreCanvasFromDataUrl = (dataUrl) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (dataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = dataUrl;
    }
  };

  useEffect(() => {
    if (currentNote.drawing) {
      restoreCanvasFromDataUrl(currentNote.drawing);
    } else if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }, [activeNoteIdx]);

  // Sync state received from teacher (on student's side)
  useEffect(() => {
    if (!isTeacher && whiteboardState?.notes) {
      setNotes(whiteboardState.notes);
      if (whiteboardState.activeNoteIdx !== undefined) {
        setActiveNoteIdx(whiteboardState.activeNoteIdx);
      }
      const remoteNote = whiteboardState.notes[whiteboardState.activeNoteIdx || 0];
      if (remoteNote?.drawing) {
        restoreCanvasFromDataUrl(remoteNote.drawing);
      }
    }
  }, [whiteboardState, isTeacher]);

  // Window dragging via Pointer Events
  const handlePointerDownHeader = (e) => {
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y
    };
    e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerMoveHeader = (e) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;

    const maxX = Math.max(0, (window.innerWidth || 800) - 360);
    const maxY = Math.max(0, (window.innerHeight || 600) - 400);

    setPosition({
      x: Math.min(maxX, Math.max(10, dragStartRef.current.posX + deltaX)),
      y: Math.min(maxY, Math.max(70, dragStartRef.current.posY + deltaY))
    });
  };

  const handlePointerUpHeader = (e) => {
    isDraggingRef.current = false;
    try {
      e.target.releasePointerCapture(e.pointerId);
    } catch (err) {}
  };

  // Pixel-perfect coordinate calculation with display-to-canvas ratio scaling
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0]?.clientX) || 0;
    const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0]?.clientY) || 0;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    if (!isTeacher) return;
    isDrawingRef.current = true;
    const coords = getCanvasCoords(e);
    lastPointRef.current = coords;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(coords.x, coords.y, isEraser ? 10 : lineWidth / 2, 0, 2 * Math.PI);
    ctx.fillStyle = isEraser ? '#ffffff' : activeColor;
    ctx.fill();
  };

  const draw = (e) => {
    if (!isDrawingRef.current || !isTeacher) return;
    const coords = getCanvasCoords(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.strokeStyle = isEraser ? '#ffffff' : activeColor;
    ctx.lineWidth = isEraser ? 22 : lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    lastPointRef.current = coords;
  };

  const stopDrawing = () => {
    if (!isDrawingRef.current || !isTeacher) return;
    isDrawingRef.current = false;

    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png', 0.85);
      setNotes(prev => {
        const updated = [...prev];
        updated[activeNoteIdx] = { ...updated[activeNoteIdx], drawing: dataUrl };
        return updated;
      });
    }
  };

  const handleClearCanvas = () => {
    if (!isTeacher || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    setNotes(prev => {
      const updated = [...prev];
      updated[activeNoteIdx] = { ...updated[activeNoteIdx], drawing: '' };
      return updated;
    });
  };

  const handleTextChange = (val) => {
    setNotes(prev => {
      const updated = [...prev];
      updated[activeNoteIdx] = { ...updated[activeNoteIdx], text: val };
      return updated;
    });
  };

  const handleSwitchNoteTab = (newIdx) => {
    if (canvasRef.current && isTeacher) {
      const currentData = canvasRef.current.toDataURL('image/png', 0.85);
      notes[activeNoteIdx].drawing = currentData;
    }
    setActiveNoteIdx(newIdx);
  };

  // 🚀 PUBLISH WITH TIMESTAMP (PREVENTS ACCIDENTAL RE-OPENING ON STUDENT POLLS)
  const handlePublishToStudent = () => {
    if (!isTeacher || !onUpdate) return;
    
    let currentDrawing = currentNote.drawing;
    if (canvasRef.current) {
      currentDrawing = canvasRef.current.toDataURL('image/png', 0.85);
      notes[activeNoteIdx].drawing = currentDrawing;
    }

    onUpdate({
      isOpen: true,
      publishedAt: Date.now(),
      activeNoteIdx,
      notes,
      drawing: currentDrawing,
      text: currentNote.text,
      mode: currentNote.mode || 'draw',
      color: activeColor
    });

    setPublishSuccess(true);
    setTimeout(() => setPublishSuccess(false), 2000);
  };

  // MINIMIZED FLOATING PILL
  if (minimized) {
    return (
      <div
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
        className="fixed z-50 animate-fade-in select-none"
      >
        <button
          type="button"
          onClick={() => setMinimized(false)}
          className={`px-4 py-2 ${currentTheme.bg} hover:brightness-95 text-slate-900 font-extrabold text-xs rounded-2xl shadow-xl flex items-center gap-2 border-2 ${currentTheme.border} transition cursor-pointer`}
        >
          <span>📌</span>
          <span>Заметка #{activeNoteIdx + 1} {currentTheme.icon}</span>
        </button>
      </div>
    );
  }

  return (
    <div
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      className="fixed z-50 w-84 sm:w-92 flex flex-col items-center animate-fade-in select-none drop-shadow-2xl"
    >
      {/* 1. TOP TABS: SWITCH BETWEEN 3 POST-IT COLOR NOTES */}
      <div className="flex items-center gap-1 mb-1 self-start pl-2">
        {NOTE_THEMES.map((theme, i) => (
          <button
            key={theme.id}
            type="button"
            onClick={() => handleSwitchNoteTab(i)}
            className={`px-3 py-1 rounded-t-xl text-xs font-extrabold transition cursor-pointer border-t-2 border-x-2 ${
              activeNoteIdx === i 
                ? `${theme.bg} ${theme.border} ${theme.textCol} shadow-xs` 
                : 'bg-white/80 border-slate-200 text-slate-500 hover:bg-white'
            }`}
          >
            <span>{theme.icon}</span>
            <span className="ml-1 text-[11px]">#{i + 1}</span>
          </button>
        ))}
      </div>

      {/* 2. REALISTIC SQUARE POST-IT NOTE WITH 3D TOP-RIGHT FOLDED CORNER */}
      <div
        className={`relative w-full aspect-square ${currentTheme.bg} rounded-b-3xl rounded-tl-3xl border-2 ${currentTheme.border} shadow-xl flex flex-col justify-between overflow-hidden`}
        style={{
          boxShadow: '0 15px 35px -5px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.04)'
        }}
      >
        {/* 📐 3D FOLDED CORNER IN THE TOP-RIGHT */}
        <div
          className="absolute top-0 right-0 w-8 h-8 pointer-events-none z-20"
          style={{
            background: currentTheme.foldGrad,
            borderBottomLeftRadius: '10px',
            boxShadow: '-3px 3px 6px rgba(0,0,0,0.18)'
          }}
        />

        {/* DRAGGABLE HEADER TITLE BAR */}
        <div
          onPointerDown={handlePointerDownHeader}
          onPointerMove={handlePointerMoveHeader}
          onPointerUp={handlePointerUpHeader}
          className={`${currentTheme.headerBg} px-3.5 py-2 flex items-center justify-between cursor-grab active:cursor-grabbing border-b border-black/5 pr-10`}
          title="Потяните для перемещения записки по экрану"
        >
          <div className="flex items-center gap-1.5">
            <span className="text-xs">📌</span>
            <span className={`font-extrabold text-[11px] ${currentTheme.textCol} uppercase tracking-wider`}>
              {isTeacher ? `Заметка #${activeNoteIdx + 1} (${currentTheme.name})` : `Заметки учителя`}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMinimized(true)}
              className="w-5 h-5 rounded-md bg-black/10 hover:bg-black/20 text-slate-800 font-bold text-xs flex items-center justify-center cursor-pointer transition"
              title="Свернуть"
            >
              _
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-5 h-5 rounded-md bg-black/10 hover:bg-rose-500 hover:text-white text-slate-800 font-bold text-xs flex items-center justify-center cursor-pointer transition"
              title="Закрыть"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 3. SQUARE WRITING / DRAWING SURFACE WITH RULED MEMO LINES */}
        <div
          className="flex-1 w-full relative touch-none overflow-hidden"
          style={{
            backgroundImage: `repeating-linear-gradient(transparent, transparent 23px, ${currentTheme.lineColor} 24px)`
          }}
        >
          {currentNote.mode === 'text' ? (
            /* TEXT CHEAT-SHEET MODE */
            <textarea
              rows="9"
              value={currentNote.text}
              disabled={!isTeacher}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder={isTeacher ? "Записывайте правила, лексику или подсказки для ученика..." : "Здесь появятся заметки учителя..."}
              className="w-full h-full p-4 bg-transparent text-slate-900 font-serif text-sm outline-none leading-6 resize-none"
            ></textarea>
          ) : (
            /* FREEHAND STYLUS & MOUSE CANVAS */
            <canvas
              ref={canvasRef}
              width={340}
              height={260}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className={`w-full h-full block ${isTeacher ? 'cursor-crosshair' : 'cursor-default'}`}
            />
          )}

          {!isTeacher && (
            <div className="absolute bottom-2 right-3 text-[10px] font-bold text-slate-400 bg-white/70 px-2 py-0.5 rounded-md">
              Синхронизировано с учителем ✓
            </div>
          )}
        </div>
      </div>

      {/* 4. EXTERNAL BOTTOM TOOLBAR */}
      {isTeacher && (
        <div className="w-full mt-2 bg-white/95 backdrop-blur-md p-2.5 rounded-2xl border border-slate-200/90 shadow-lg flex flex-col gap-2">
          
          {/* TOP ROW: 4 MARKERS, ERASER, CLEAR & MODE SWITCH */}
          <div className="flex items-center justify-between gap-1.5 flex-wrap">
            
            {/* 4 MARKER COLORS */}
            <div className="flex items-center gap-1.5">
              {MARKER_COLORS.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => { setActiveColor(c.hex); setIsEraser(false); }}
                  style={{ backgroundColor: c.hex }}
                  className={`w-6 h-6 rounded-full transition cursor-pointer ${
                    !isEraser && activeColor === c.hex
                      ? 'ring-2 ring-indigo-600 ring-offset-2 scale-110'
                      : 'opacity-75 hover:opacity-100'
                  }`}
                  title={c.name}
                />
              ))}

              <button
                type="button"
                onClick={() => setIsEraser(!isEraser)}
                className={`px-2 py-1 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
                  isEraser ? 'bg-indigo-600 border-indigo-600 text-white font-extrabold shadow-2xs' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                🧹 Ластик
              </button>
            </div>

            {/* DRAW VS TEXT TOGGLE */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  const newMode = currentNote.mode === 'text' ? 'draw' : 'text';
                  setNotes(prev => {
                    const upd = [...prev];
                    upd[activeNoteIdx].mode = newMode;
                    return upd;
                  });
                }}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold transition cursor-pointer"
              >
                {currentNote.mode === 'text' ? '🎨 Рисовать' : '📝 Текст'}
              </button>

              <button
                type="button"
                onClick={handleClearCanvas}
                className="p-1 text-slate-400 hover:text-rose-600 text-xs font-bold transition cursor-pointer"
                title="Очистить холст"
              >
                🗑️
              </button>
            </div>
          </div>

          {/* 🚀 DRAFT ➔ PUBLISH / SHARE BUTTON */}
          <button
            type="button"
            onClick={handlePublishToStudent}
            className={`w-full py-2 rounded-xl text-xs font-extrabold shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
              publishSuccess
                ? 'bg-emerald-600 text-white animate-pulse'
                : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white'
            }`}
          >
            <span>{publishSuccess ? '✓ Опубликовано на экране ученика!' : '🚀 Поделиться с учеником (Publish Note)'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
