import React from 'react';

export const BuilderPalette = ({ onAddBlock }) => (
  <div className="lg:col-span-1 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4 h-fit sticky top-20">
    <div className="flex items-center gap-2">
      <span className="text-xl">🛠️</span>
      <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">Палитра Lego</h3>
    </div>
    
    <div className="space-y-1.5 text-xs font-semibold">
      <p className="text-slate-400 text-[10px] uppercase font-extrabold pt-1">📖 Учебные материалы (Anchors)</p>
      <button 
        type="button"
        onClick={() => onAddBlock('heading')} 
        className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl transition flex items-center gap-2 cursor-pointer font-bold text-slate-700"
      >
        📝 Заголовок
      </button>
      <button 
        type="button"
        onClick={() => onAddBlock('text')} 
        className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl transition flex items-center gap-2 cursor-pointer font-bold text-slate-700"
      >
        📄 Текст / Статья
      </button>
      <button 
        type="button"
        onClick={() => onAddBlock('grammar_card')} 
        className="w-full text-left p-2.5 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 rounded-xl transition flex items-center gap-2 cursor-pointer font-bold shadow-2xs"
      >
        📘 Правило Грамматики
      </button>
      <button 
        type="button"
        onClick={() => onAddBlock('link')} 
        className="w-full text-left p-2.5 bg-blue-50/80 hover:bg-blue-100 border border-blue-200 text-blue-900 rounded-xl transition flex items-center gap-2 cursor-pointer font-bold shadow-2xs"
      >
        🔗 Ссылка / Веб-ресурс
      </button>
      <button 
        type="button"
        onClick={() => onAddBlock('teacher_notes')} 
        className="w-full text-left p-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-xl transition flex items-center gap-2 cursor-pointer font-bold shadow-2xs"
      >
        👨‍🏫 Заметки Учителя
      </button>
      <button 
        type="button"
        onClick={() => onAddBlock('video')} 
        className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl transition flex items-center gap-2 cursor-pointer font-bold text-slate-700"
      >
        🎥 Видео YouTube
      </button>
      <button 
        type="button"
        onClick={() => onAddBlock('audio')} 
        className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl transition flex items-center gap-2 cursor-pointer font-bold text-slate-700"
      >
        🎧 Аудио / Подкаст
      </button>
      <button 
        type="button"
        onClick={() => onAddBlock('image')} 
        className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl transition flex items-center gap-2 cursor-pointer font-bold text-slate-700"
      >
        🖼️ Картинки / Галерея
      </button>

      <p className="text-slate-400 text-[10px] uppercase font-extrabold pt-3">🧩 Интерактивные упражнения</p>
      <button 
        type="button"
        onClick={() => onAddBlock('flashcards')} 
        className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl transition flex items-center gap-2 cursor-pointer font-bold text-slate-700"
      >
        🎴 Флешкарты (Озвучка)
      </button>
      <button 
        type="button"
        onClick={() => onAddBlock('inline_select')} 
        className="w-full text-left p-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 rounded-xl transition flex items-center gap-2 cursor-pointer font-bold shadow-2xs"
      >
        🔽 Вставка из списка (Inline)
      </button>
      <button 
        type="button"
        onClick={() => onAddBlock('spinning_wheel')} 
        className="w-full text-left p-2.5 bg-gradient-to-r from-indigo-50 to-purple-50 hover:opacity-90 border border-purple-200 text-purple-900 rounded-xl transition flex items-center gap-2 cursor-pointer font-bold shadow-2xs"
      >
        🎡 Колесо вопросов
      </button>
      <button 
        type="button"
        onClick={() => onAddBlock('matching')} 
        className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl transition flex items-center gap-2 cursor-pointer font-bold text-slate-700"
      >
        🔗 Сопоставление пар
      </button>
      <button 
        type="button"
        onClick={() => onAddBlock('multiple_choice')} 
        className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl transition flex items-center gap-2 cursor-pointer font-bold text-slate-700"
      >
        ❓ Тест Multiple Choice
      </button>
      <button 
        type="button"
        onClick={() => onAddBlock('true_false')} 
        className="w-full text-left p-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 rounded-xl transition flex items-center gap-2 cursor-pointer font-bold shadow-2xs"
      >
        ⚖️ Правда / Ложь (True / False)
      </button>
      <button 
        type="button"
        onClick={() => onAddBlock('gap_fill')} 
        className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl transition flex items-center gap-2 cursor-pointer font-bold text-slate-700"
      >
        ✏️ Пропуски (Ввод)
      </button>
      <button 
        type="button"
        onClick={() => onAddBlock('gap_fill_bank')} 
        className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl transition flex items-center gap-2 cursor-pointer font-bold text-slate-700"
      >
        🧩 Пропуски с Банком Слов
      </button>
      <button 
        type="button"
        onClick={() => onAddBlock('sentence_reorder')} 
        className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl transition flex items-center gap-2 cursor-pointer font-bold text-slate-700"
      >
        🔤 Собрать предложение
      </button>
      <button 
        type="button"
        onClick={() => onAddBlock('categorization')} 
        className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl transition flex items-center gap-2 cursor-pointer font-bold text-slate-700"
      >
        📦 Сортировка по коробкам
      </button>
      <button 
        type="button"
        onClick={() => onAddBlock('open_input')} 
        className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl transition flex items-center gap-2 cursor-pointer font-bold text-slate-700"
      >
        💬 Письменный вопрос
      </button>
    </div>
  </div>
);
