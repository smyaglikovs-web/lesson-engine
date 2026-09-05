import React, { useState, useEffect } from 'react';
import { normalizeBlockType } from './BlockRenderer.jsx';

export const PrintWorksheetModal = ({ lesson, onClose }) => {
  const [fullLesson, setFullLesson] = useState(lesson?.pages ? lesson : null);
  const [loading, setLoading] = useState(!lesson?.pages);
  const [includeQrCodes, setIncludeQrCodes] = useState(true);
  const [includeTeacherNotes, setIncludeTeacherNotes] = useState(false);

  useEffect(() => {
    if (!lesson?.pages && lesson?.id) {
      setLoading(true);
      fetch(`/api/lessons/${lesson.id}`)
        .then(res => res.json())
        .then(data => {
          setFullLesson(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [lesson]);

  const handlePrint = () => {
    window.print();
  };

  const activeLesson = fullLesson || lesson || {};
  const pages = activeLesson.pages || [{ blocks: [] }];

  // Flatten blocks across all pages
  const allBlocks = pages.flatMap(p => p.blocks || []);

  const renderPrintBlock = (block, idx) => {
    const type = normalizeBlockType(block.type);

    // 1. HEADING
    if (type === 'heading') {
      return (
        <div key={idx} className="border-b-2 border-slate-900 pb-1 mt-6 mb-3">
          <h3 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">
            {block.text}
          </h3>
        </div>
      );
    }

    // 2. READING TEXT / PASSAGE
    if (type === 'text') {
      return (
        <div key={idx} className="my-4 text-slate-800 text-sm leading-relaxed font-serif whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-200">
          {block.text}
        </div>
      );
    }

    // 3. FLASHCARDS (PRINTABLE VOCABULARY TABLE)
    if (type === 'flashcards') {
      const cards = Array.isArray(block.cards) ? block.cards : [];
      if (cards.length === 0) return null;

      return (
        <div key={idx} className="my-5 border border-slate-300 rounded-xl overflow-hidden">
          <div className="bg-slate-100 px-3 py-2 border-b border-slate-300 font-extrabold text-xs text-slate-900 uppercase">
            🎴 {block.title || 'Key Target Vocabulary'}
          </div>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                <th className="p-2.5 w-1/4 border-r border-slate-200">Word / Term</th>
                <th className="p-2.5 w-1/3 border-r border-slate-200">Translation / Definition</th>
                <th className="p-2.5">Context Example Sentence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {cards.map((c, ci) => (
                <tr key={ci}>
                  <td className="p-2.5 font-bold text-slate-900 border-r border-slate-200">{c.front || c.word}</td>
                  <td className="p-2.5 text-slate-700 border-r border-slate-200">{c.back || c.translation}</td>
                  <td className="p-2.5 text-slate-600 italic">"{c.example || ''}"</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // 4. MULTIPLE CHOICE / QUIZ (PAPER CHECKBOXES)
    if (type === 'multiple_choice') {
      const options = Array.isArray(block.options) 
        ? block.options.map(o => typeof o === 'object' && o !== null ? (o.text || o.option || JSON.stringify(o)) : String(o))
        : ['Option A', 'Option B'];

      return (
        <div key={idx} className="my-4 p-3.5 border border-slate-300 rounded-xl break-inside-avoid">
          <p className="font-bold text-sm text-slate-900 mb-2">
            <span className="text-slate-500 mr-1.5 font-mono">Q:</span>
            {block.question || 'Choose the correct answer:'}
          </p>
          <div className="space-y-1.5 pl-4">
            {options.map((opt, oi) => (
              <div key={oi} className="flex items-center gap-2 text-xs text-slate-800">
                <span className="w-4 h-4 rounded-full border border-slate-400 inline-block shrink-0 text-[10px] font-bold text-center leading-3.5">
                  {String.fromCharCode(65 + oi)}
                </span>
                <span>{opt}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 5. GAP FILL (BLANK HANDWRITING UNDERLINES)
    if (type === 'gap_fill') {
      const rawText = block.text || '';
      const lines = rawText.split('\n').filter(l => l.trim().length > 0);

      return (
        <div key={idx} className="my-5 p-4 border border-slate-300 rounded-xl break-inside-avoid space-y-2">
          <p className="font-extrabold text-xs text-slate-900 uppercase">
            ✏️ {block.instruction || 'Fill the missing words in the blanks:'}
          </p>
          <div className="space-y-2 text-xs sm:text-sm font-serif leading-loose">
            {lines.map((line, li) => {
              const parts = line.split(/\[(.*?)\]/);
              return (
                <div key={li} className="py-1">
                  {parts.map((seg, si) => {
                    if (si % 2 === 1) {
                      return <span key={si} className="inline-block border-b-2 border-slate-900 min-w-[120px] mx-1 text-center font-mono font-bold text-transparent select-none">&nbsp;</span>;
                    }
                    return <span key={si}>{seg}</span>;
                  })}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // 6. GAP FILL BANK (WORD BANK IN A BOX + UNDERLINE SENTENCES)
    if (type === 'gap_fill_bank') {
      const rawParts = (block.text || '').split(/\[(.*?)\]/);
      const answers = rawParts.filter((_, i) => i % 2 === 1).map(w => w.trim()).filter(Boolean);
      const distractors = Array.isArray(block.distractors) ? block.distractors : [];
      const allWordPool = [...answers, ...distractors].filter(d => !/^\d+$/.test(d));

      return (
        <div key={idx} className="my-5 p-4 border border-slate-300 rounded-xl break-inside-avoid space-y-3">
          <p className="font-extrabold text-xs text-slate-900 uppercase">
            🧩 {block.instruction || 'Fill the gaps using words from the bank:'}
          </p>
          
          {/* WORD BANK CONTAINER */}
          <div className="p-2.5 bg-slate-100 border border-slate-300 rounded-lg flex flex-wrap gap-2 text-xs font-bold font-mono">
            {allWordPool.map((w, wi) => (
              <span key={wi} className="px-2.5 py-0.5 bg-white border border-slate-300 rounded-md">
                {w}
              </span>
            ))}
          </div>

          <div className="text-xs sm:text-sm font-serif leading-loose pt-1">
            {rawParts.map((seg, si) => {
              if (si % 2 === 1) {
                return <span key={si} className="inline-block border-b-2 border-slate-900 min-w-[110px] mx-1 text-center text-transparent select-none">&nbsp;</span>;
              }
              return <span key={si}>{seg}</span>;
            })}
          </div>
        </div>
      );
    }

    // 7. MATCHING (TWO PRINTABLE COLUMNS WITH CONNECTING DOTS)
    if (type === 'matching') {
      const pairs = Array.isArray(block.pairs) ? block.pairs : [];
      if (pairs.length === 0) return null;

      // Shuffle right side for print puzzle
      const shuffledRights = [...pairs].map(p => p.right).sort(() => 0.5 - Math.random());

      return (
        <div key={idx} className="my-5 p-4 border border-slate-300 rounded-xl break-inside-avoid space-y-3">
          <p className="font-extrabold text-xs text-slate-900 uppercase">
            🔗 {block.instruction || 'Match the words on the left with definitions on the right:'}
          </p>
          <div className="grid grid-cols-2 gap-6 text-xs">
            <div className="space-y-2">
              {pairs.map((p, pi) => (
                <div key={pi} className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between font-bold text-slate-800">
                  <span>{pi + 1}. {p.left}</span>
                  <span className="w-2.5 h-2.5 rounded-full border-2 border-slate-700 inline-block"></span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {shuffledRights.map((rText, ri) => (
                <div key={ri} className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between font-medium text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full border-2 border-slate-700 inline-block mr-2"></span>
                  <span className="flex-1 text-right">{rText}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // 8. SENTENCE REORDER (UNSCRAMBLE WORDS + WRITING LINE)
    if (type === 'sentence_reorder') {
      const sentences = Array.isArray(block.sentences) && block.sentences.length > 0 
        ? block.sentences 
        : (block.sentence ? [block.sentence] : []);

      return (
        <div key={idx} className="my-5 p-4 border border-slate-300 rounded-xl break-inside-avoid space-y-3">
          <p className="font-extrabold text-xs text-slate-900 uppercase">
            🔤 {block.instruction || 'Put the words in order to form correct sentences:'}
          </p>
          <div className="space-y-4 text-xs">
            {sentences.map((sent, si) => {
              const shuffledWords = sent.split(/\s+/).sort(() => 0.5 - Math.random());
              return (
                <div key={si} className="space-y-1.5">
                  <div className="flex flex-wrap gap-1.5 font-bold font-mono">
                    <span className="text-slate-400 font-sans mr-1">{si + 1}.</span>
                    {shuffledWords.map((w, wi) => (
                      <span key={wi} className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded-md">
                        {w}
                      </span>
                    ))}
                  </div>
                  <div className="border-b border-slate-800 pt-3 pb-0.5 text-slate-400 italic">
                    ✍️ ____________________________________________________________________________________
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // 9. VIDEO & AUDIO MEDIA (TRANSCRIPT + SCANNABLE QR CODE)
    if (type === 'video' || type === 'audio') {
      const mediaUrl = block.url || '';
      const qrCodeUrl = mediaUrl && includeQrCodes
        ? `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(mediaUrl)}`
        : null;

      return (
        <div key={idx} className="my-5 p-4 border-2 border-dashed border-slate-300 rounded-2xl break-inside-avoid flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex-1 space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              {type === 'video' ? '🎥 Video Transcript' : '🎙️ Audio / Podcast Script'}
            </span>
            <h4 className="font-bold text-sm text-slate-900">{block.title || 'Media Presentation'}</h4>
            {block.transcript ? (
              <p className="text-xs font-serif text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-3 rounded-xl border border-slate-200">
                "{block.transcript}"
              </p>
            ) : (
              <p className="text-xs italic text-slate-400">Scan QR code on your phone to play the media.</p>
            )}
          </div>

          {qrCodeUrl && (
            <div className="text-center p-2 bg-white border border-slate-300 rounded-xl shrink-0 self-center sm:self-start">
              <img src={qrCodeUrl} alt="QR Code" className="w-24 h-24 mx-auto" />
              <span className="text-[9px] font-bold text-slate-500 uppercase block mt-1">📱 Сканировать</span>
            </div>
          )}
        </div>
      );
    }

    // 10. REFERENCE LINK (TEXT + SCANNABLE QR CODE)
    if (type === 'link') {
      const qrCodeUrl = block.url && includeQrCodes
        ? `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(block.url)}`
        : null;

      return (
        <div key={idx} className="my-4 p-3.5 border border-slate-300 rounded-xl break-inside-avoid flex justify-between items-center gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500">🔗 Reference Material:</span>
            <h5 className="font-bold text-xs text-slate-900">{block.title || 'Online Article'}</h5>
            <p className="text-[11px] text-slate-600">{block.description || ''}</p>
          </div>
          {qrCodeUrl && (
            <div className="text-center p-1.5 bg-white border border-slate-200 rounded-lg shrink-0">
              <img src={qrCodeUrl} alt="QR Code" className="w-16 h-16" />
            </div>
          )}
        </div>
      );
    }

    // 11. OPEN INPUT / ESSAY / WRITING PROMPT
    if (type === 'open_input') {
      return (
        <div key={idx} className="my-5 p-4 border border-slate-300 rounded-xl break-inside-avoid space-y-2">
          <p className="font-bold text-xs text-slate-900 whitespace-pre-line">
            📝 {block.prompt || 'Writing / Discussion Prompt:'}
          </p>
          <div className="space-y-3 pt-2 text-slate-300 font-mono">
            <div className="border-b border-slate-400 h-6"></div>
            <div className="border-b border-slate-400 h-6"></div>
            <div className="border-b border-slate-400 h-6"></div>
            <div className="border-b border-slate-400 h-6"></div>
          </div>
        </div>
      );
    }

    // 12. GRAMMAR CARD
    if (type === 'grammar_card') {
      return (
        <div key={idx} className="my-4 p-4 border-2 border-indigo-200 bg-indigo-50/40 rounded-xl break-inside-avoid space-y-2">
          <span className="text-[10px] font-extrabold uppercase text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded">
            📘 Grammar Focus: {block.title}
          </span>
          {block.formula && (
            <div className="p-2 bg-white border border-indigo-200 rounded-lg font-mono text-xs font-bold text-indigo-950">
              Formula: {block.formula}
            </div>
          )}
          {block.explanation && <p className="text-xs text-slate-800">{block.explanation}</p>}
        </div>
      );
    }

    // 13. TEACHER NOTES (HIDDEN BY DEFAULT UNLESS TOGGLED)
    if (type === 'teacher_notes' && includeTeacherNotes) {
      return (
        <div key={idx} className="my-4 p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 break-inside-avoid">
          <strong>👨‍🏫 Teacher Note / Aim:</strong> {block.aim || ''} &bull; {block.speech || ''}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      
      {/* SCREEN CONTROLS TOOLBAR (HIDDEN ON PHYSICAL PRINT) */}
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden print:shadow-none print:border-none print:max-h-full print:rounded-none">
        
        {/* TOP MODAL HEADER BAR */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
              🖨️ Печать / Сохранить рабочий лист (PDF)
            </h3>
            <p className="text-xs text-slate-500">
              Автоматическая адаптация для печати на бумаге A4 с QR-кодами
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={includeQrCodes}
                onChange={e => setIncludeQrCodes(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded"
              />
              <span>QR-коды</span>
            </label>

            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
            >
              <span>🖨️</span>
              <span>Распечатать</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold flex items-center justify-center text-xs cursor-pointer transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* PRINTABLE WORKSHEET DOCUMENT (A4 READY) */}
        <div className="p-6 sm:p-10 overflow-y-auto flex-1 bg-white text-slate-900 print:p-0 print:overflow-visible">
          
          {/* WORKSHEET STUDENT HEADER */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                  Level {activeLesson.level || 'B1'} &bull; English Worksheet
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                  {activeLesson.title || 'English Practice Lesson'}
                </h1>
              </div>
            </div>

            {/* HANDWRITING LINES FOR STUDENT & DATE */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 text-xs font-bold text-slate-700">
              <div>
                <span>Student Name:</span>
                <span className="border-b border-slate-700 inline-block w-32 ml-1"></span>
              </div>
              <div>
                <span>Date:</span>
                <span className="border-b border-slate-700 inline-block w-24 ml-1"></span>
              </div>
              <div>
                <span>Score:</span>
                <span className="border-b border-slate-700 inline-block w-16 ml-1"></span>
                <span>/ ______</span>
              </div>
            </div>
          </div>

          {/* ALL WORKSHEET TASKS */}
          {loading ? (
            <div className="text-center py-12 text-slate-400 font-bold">Подготовка рабочего листа...</div>
          ) : (
            <div className="space-y-4">
              {allBlocks.map((b, idx) => renderPrintBlock(b, idx))}
            </div>
          )}

          {/* PRINT FOOTER */}
          <div className="mt-10 pt-4 border-t border-slate-300 text-center text-[10px] text-slate-400 font-mono">
            {activeLesson.title} &bull; Generated with Lesson Engine
          </div>
        </div>

      </div>
    </div>
  );
};
