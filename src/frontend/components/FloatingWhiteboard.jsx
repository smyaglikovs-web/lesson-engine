import React, { useState, useRef, useEffect, useCallback } from 'react';

const MARKER_COLORS = [
  { id: 'black', hex: '#0f172a', name: 'Черный' },
  { id: 'blue', hex: '#2563eb', name: 'Синий' },
  { id: 'red', hex: '#dc2626', name: 'Красный' },
  { id: 'green', hex: '#16a34a', name: 'Зеленый' }
];

export const FloatingWhiteboard = ({
  isTeacher = false,
  whiteboardState = {},
  onUpdate,
  onClose
}) => {
  const [minimized, setMinimized] = useState(false);
  const [mode, setMode] = useState(whiteboardState?.mode || 'draw'); // 'draw' | 'text'
  const [activeColor, setActiveColor] = useState(whiteboardState?.color || '#0f172a');
  const [isEraser, setIsEraser] = useState(false);
  const [noteText, setNoteText] = useState(whiteboardState?.text || '');

  // Draggable floating coordinates
  const [position, setPosition] = useState({ x: 24, y: 120 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

  // Canvas drawing ref & state
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef({ x: 0, y: 0 });

  // Sync state from server when received
  useEffect(() => {
    if (whiteboardState?.mode && whiteboardState.mode !== mode) {
      setMode(whiteboardState.mode);
    }
    if (whiteboardState?.text !== undefined && whiteboardState.text !== noteText) {
      setNoteText(whiteboardState.text);
    }
    if (whiteboardState?.drawing && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = whiteboardState.drawing;
    }
  }, [whiteboardState]);

  // Handle window dragging via Pointer Events (Touch & Mouse compatible)
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

    const maxX = Math.max(0, (window.innerWidth || 800) - 340);
    const maxY = Math.max(0, (window.innerHeight || 600) - 320);

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

  // Canvas drawing logic
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
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
    ctx.arc(coords.x, coords.y, isEraser ? 8 : 2, 0, 2 * Math.PI);
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
    ctx.lineWidth = isEraser ? 16 : 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    lastPointRef.current = coords;
  };

  const stopDrawing = () => {
    if (!isDrawingRef.current || !isTeacher) return;
    isDrawingRef.current = false;

    // Export drawing snapshot and broadcast to room
    if (canvasRef.current && onUpdate) {
      const dataUrl = canvasRef.current.toDataURL('image/png', 0.85);
      onUpdate({
        mode,
        drawing: dataUrl,
        text: noteText,
        color: activeColor,
        isOpen: true
      });
    }
  };

  const handleClearCanvas = () => {
    if (!isTeacher || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (onUpdate) {
      onUpdate({
        mode,
        drawing: '',
        text: noteText,
        color: activeColor,
        isOpen: true
      });
    }
  };

  const handleTextChange = (e) => {
    const val = e.target.value;
    setNoteText(val);
    if (isTeacher && onUpdate) {
      onUpdate({
        mode,
        drawing: canvasRef.current ? canvasRef.current.toDataURL('image/png', 0.85) : '',
        text: val,
        color: activeColor,
        isOpen: true
      });
    }
  };

  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    if (isTeacher && onUpdate) {
      onUpdate({
        mode: newMode,
        drawing: canvasRef.current ? canvasRef.current.toDataURL('image/png', 0.85) : '',
        text: noteText,
        color: activeColor,
        isOpen: true
      });
    }
  };

  // IF MINIMIZED TO FLOATING PILL
  if (minimized) {
    return (
      <div
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
        className="fixed z-50 animate-fade-in select-none"
      >
        <button
          type="button"
          onClick={() => setMinimized(false)}
          className="px-3.5 py-2 bg-amber-400 hover:bg-amber-500 text-amber-950 font-extrabold text-xs rounded-2xl shadow-xl flex items-center gap-1.5 border-2 border-amber-300 transition cursor-pointer"
        >
          <span>📌</span>
          <span>Заметки & Маркеры</span>
        </button>
      </div>
    );
  }

  return (
    <div
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      className="fixed z-50 w-80 bg-amber-50/95 backdrop-blur-md rounded-3xl border-2 border-amber-300 shadow-2xl overflow-hidden flex flex-col transition-shadow animate-fade-in select-none"
    >
      {/* DRAGGABLE HEADER TITLE BAR */}
      <div
        onPointerDown={handlePointerDownHeader}
        onPointerMove={handlePointerMoveHeader}
        onPointerUp={handlePointerUpHeader}
        className="bg-amber-200/90 px-3.5 py-2.5 flex items-center justify-between cursor-grab active:cursor-grabbing border-b border-amber-300/80"
        title="Потяните, чтобы переместить доску по экрану"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-sm">📌</span>
          <span className="font-extrabold text-xs text-amber-950 uppercase tracking-wider">
            {isTeacher ? 'Доска учителя (Sync)' : 'Заметки учителя'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMinimized(true)}
            className="w-6 h-6 rounded-lg bg-amber-300/70 hover:bg-amber-300 text-amber-950 font-extrabold text-xs flex items-center justify-center transition cursor-pointer"
            title="Свернуть"
          >
            _
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 rounded-lg bg-amber-300/70 hover:bg-rose-400 text-amber-950 hover:text-white font-extrabold text-xs flex items-center justify-center transition cursor-pointer"
            title="Закрыть"
          >
            ✕
          </button>
        </div>
      </div>

      {/* MODE TABS (DRAW VS TEXT NOTE) */}
      <div className="px-3 pt-2 pb-1 flex gap-1 bg-amber-100/50 border-b border-amber-200/80">
        <button
          type="button"
          onClick={() => handleModeSwitch('draw')}
          className={`flex-1 py-1 rounded-xl text-[11px] font-extrabold transition cursor-pointer flex items-center justify-center gap-1 ${
            mode === 'draw' ? 'bg-white text-indigo-900 shadow-2xs border border-amber-200' : 'text-amber-800 hover:bg-amber-200/50'
          }`}
        >
          <span>🎨</span>
          <span>Маркеры</span>
        </button>

        <button
          type="button"
          onClick={() => handleModeSwitch('text')}
          className={`flex-1 py-1 rounded-xl text-[11px] font-extrabold transition cursor-pointer flex items-center justify-center gap-1 ${
            mode === 'text' ? 'bg-white text-indigo-900 shadow-2xs border border-amber-200' : 'text-amber-800 hover:bg-amber-200/50'
          }`}
        >
          <span>📝</span>
          <span>Чит-лист</span>
        </button>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="p-3">
        {mode === 'draw' ? (
          <div className="space-y-2">
            {/* 4 MARKER COLORS & TOOLBAR (TEACHER ONLY) */}
            {isTeacher && (
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-1.5">
                  {MARKER_COLORS.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { setActiveColor(c.hex); setIsEraser(false); }}
                      style={{ backgroundColor: c.hex }}
                      className={`w-5 h-5 rounded-full transition cursor-pointer ${
                        !isEraser && activeColor === c.hex
                          ? 'ring-2 ring-amber-500 ring-offset-2 scale-110'
                          : 'opacity-80 hover:opacity-100'
                      }`}
                      title={c.name}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => setIsEraser(!isEraser)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                      isEraser ? 'bg-amber-300 border-amber-400 text-amber-950 font-extrabold' : 'bg-white border-amber-200 text-amber-900'
                    }`}
                  >
                    🧹 Ластик
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleClearCanvas}
                  className="text-[10px] font-extrabold text-rose-600 hover:text-rose-800 bg-white px-2 py-0.5 rounded-lg border border-rose-200 transition cursor-pointer"
                >
                  Очистить
                </button>
              </div>
            )}

            {/* WHITEBOARD CANVAS */}
            <div className="w-full h-44 bg-white rounded-2xl border border-amber-200 shadow-inner overflow-hidden relative touch-none">
              <canvas
                ref={canvasRef}
                width={300}
                height={176}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className={`w-full h-full block ${isTeacher ? 'cursor-crosshair' : 'cursor-default'}`}
              />
              {!isTeacher && (
                <div className="absolute bottom-1 right-2 text-[9px] text-slate-400 bg-white/80 px-1 rounded">
                  Только чтение
                </div>
              )}
            </div>
          </div>
        ) : (
          /* TEXT NOTE / CHEATLIST */
          <div className="space-y-1.5">
            <textarea
              rows="7"
              value={noteText}
              disabled={!isTeacher}
              onChange={handleTextChange}
              placeholder={isTeacher ? "Записывайте ключевые правила, новые фразы или ошибки для разбора..." : "Здесь появятся заметки учителя..."}
              className="w-full p-2.5 bg-white border border-amber-200 rounded-2xl text-xs font-sans text-slate-800 outline-none leading-relaxed shadow-inner"
            ></textarea>
          </div>
        )}
      </div>

      <div className="px-3 pb-2 text-[10px] text-amber-800/80 font-medium text-center">
        {isTeacher ? '✨ Авто-синхронизация с экраном ученика' : '👁️ Заметки синхронизируются с учителем'}
      </div>
    </div>
  );
};
