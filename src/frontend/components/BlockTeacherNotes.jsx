import React, { useState } from 'react';

export const BlockTeacherNotes = ({ block, isTeacher }) => {
  // If viewed in Student/Homework mode, completely hide this block from the DOM
  if (!isTeacher) return null;

  const [expanded, setExpanded] = useState(true);

  return (
    <div className="my-4 bg-amber-50/70 border-2 border-amber-200/90 rounded-3xl p-4 sm:p-5 shadow-xs transition duration-200">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
            👨‍🏫
          </span>
          <div>
            <h4 className="font-extrabold text-amber-950 text-xs uppercase tracking-wider">
              Teacher's Notes & Prompts (Скрыто от ученика)
            </h4>
            <p className="text-[11px] text-amber-800/80 font-semibold">Методические цели и речевые скрипты</p>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1.5 text-amber-800 hover:bg-amber-100 rounded-xl font-extrabold text-xs transition cursor-pointer"
        >
          {expanded ? '▲ Свернуть' : '▼ Показать'}
        </button>
      </div>

      {expanded && (
        <div className="mt-3.5 pt-3.5 border-t border-amber-200/80 space-y-3 text-xs text-amber-900 leading-relaxed font-sans">
          {block.aim && (
            <div className="bg-white/80 p-3 rounded-2xl border border-amber-200/60">
              <strong className="text-amber-950 font-bold uppercase text-[10px] tracking-wider block mb-1">
                🎯 Цель этапа (Stage Aim):
              </strong>
              <p className="font-medium text-slate-800">{block.aim}</p>
            </div>
          )}

          {block.speech && (
            <div className="bg-amber-100/60 p-3 rounded-2xl border border-amber-300/60">
              <strong className="text-amber-950 font-bold uppercase text-[10px] tracking-wider block mb-1">
                💬 You can say (Речевой скрипт для учителя):
              </strong>
              <p className="italic font-semibold text-slate-900">"{block.speech}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
