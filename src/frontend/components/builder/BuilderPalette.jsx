import React from 'react';

export const BuilderPalette = ({ onAddBlock }) => (
  <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 h-fit sticky top-20">
    <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">🛠️ Палитра блоков</h3>
    
    <div className="space-y-1.5 text-xs font-semibold">
      <p className="text-slate-400 text-[10px] uppercase font-bold pt-1">Материалы</p>
      <button onClick={() => onAddBlock('heading')} className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50 border rounded-xl transition flex items-center gap-2">📝 Заголовок</button>
      <button onClick={() => onAddBlock('text')} className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50 border rounded-xl transition flex items-center gap-2">📄 Текст / Статья</button>
      <button onClick={() => onAddBlock('video')} className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50 border rounded-xl transition flex items-center gap-2">🎥 Видео YouTube</button>
      <button onClick={() => onAddBlock('image')} className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50 border rounded-xl transition flex items-center gap-2">🖼️ Картинки / Галерея</button>

      <p className="text-slate-400 text-[10px] uppercase font-bold pt-3">Интерактив</p>
      <button onClick={() => onAddBlock('flashcards')} className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50 border rounded-xl transition flex items-center gap-2">🎴 Флешкарты</button>
      <button onClick={() => onAddBlock('multiple_choice')} className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50 border rounded-xl transition flex items-center gap-2">❓ Тест Multiple Choice</button>
      <button onClick={() => onAddBlock('gap_fill')} className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50 border rounded-xl transition flex items-center gap-2">✏️ Пропуски (Ввод)</button>
      <button onClick={() => onAddBlock('gap_fill_bank')} className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50 border rounded-xl transition flex items-center gap-2">🧩 Пропуски с Банком Слов</button>
      <button onClick={() => onAddBlock('matching')} className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50 border rounded-xl transition flex items-center gap-2">🔗 Сопоставление пар</button>
      <button onClick={() => onAddBlock('open_input')} className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50 border rounded-xl transition flex items-center gap-2">💬 Вопрос для ответа</button>
    </div>
  </div>
);
