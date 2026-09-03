import React, { useState, useEffect } from 'react';

export const BlockLink = ({ block = {} }) => {
  const [showModal, setShowModal] = useState(false);
  const rawUrl = block.url || 'https://en.wikipedia.org';
  
  const cleanUrl = rawUrl.startsWith('http://') || rawUrl.startsWith('https://') 
    ? rawUrl 
    : `https://${rawUrl}`;

  let domain = '';
  try {
    domain = new URL(cleanUrl).hostname.replace('www.', '');
  } catch (e) {
    domain = cleanUrl;
  }

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowModal(false);
    };
    if (showModal) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal]);

  const handleCardClick = (e) => {
    // On small screens (< 768px), open directly in a new tab
    if (window.innerWidth < 768 || block.displayMode === 'new_tab') {
      window.open(cleanUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    e.preventDefault();
    setShowModal(true);
  };

  return (
    <div className="my-6">
      {/* RESOURCE CARD */}
      <div
        onClick={handleCardClick}
        className="group relative bg-white hover:bg-slate-50/90 border border-slate-200/90 hover:border-indigo-300 rounded-3xl p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col sm:flex-row justify-between sm:items-center gap-4"
      >
        <div className="flex items-start gap-3.5 flex-1">
          {/* FAVICON BADGE */}
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
            <img
              src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
              alt="Site icon"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
              className="w-6 h-6 object-contain"
            />
            <span className="text-lg hidden">🔗</span>
          </div>

          {/* TEXT & CONTEXT */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-extrabold text-[10px] uppercase tracking-wider">
                {domain}
              </span>
              <span className="text-[11px] text-indigo-600 font-semibold hidden sm:inline">
                • Interactive Web Resource
              </span>
            </div>
            <h4 className="font-extrabold text-slate-900 text-base group-hover:text-indigo-600 transition leading-snug">
              {block.title || 'Interactive Learning Resource'}
            </h4>
            <p className="text-slate-500 text-xs leading-relaxed font-medium">
              {block.description || 'Click to view the interactive web page or reference material.'}
            </p>
          </div>
        </div>

        {/* ACTION BUTTON */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            type="button"
            className="px-4 py-2.5 bg-indigo-50 group-hover:bg-indigo-600 text-indigo-700 group-hover:text-white font-extrabold rounded-2xl text-xs transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>Open Link</span>
            <span className="text-xs">↗</span>
          </button>
        </div>
      </div>

      {/* DESKTOP HOVER/MODAL IFRAME VIEWER */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 sm:p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
          >
            {/* MODAL TOP BAR */}
            <div className="bg-slate-50 px-6 py-3.5 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 truncate pr-4">
                <img
                  src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                  alt=""
                  className="w-5 h-5 rounded"
                />
                <div className="truncate">
                  <h5 className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">
                    {block.title || domain}
                  </h5>
                  <p className="text-[10px] text-slate-400 font-mono truncate">{cleanUrl}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={cleanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1"
                  title="Open in external browser tab"
                >
                  <span>Open in Tab</span>
                  <span>↗</span>
                </a>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-700 font-extrabold flex items-center justify-center transition cursor-pointer"
                  title="Close preview"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* EMBEDDED IFRAME FRAME */}
            <div className="flex-1 bg-slate-100 relative">
              <iframe
                src={cleanUrl}
                title={block.title || 'Web Resource'}
                className="w-full h-full border-0 bg-white"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                loading="lazy"
              />

              {/* EMBED SAFETY FOOTER NOTICE */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-medium px-4 py-1.5 rounded-full shadow-lg pointer-events-auto flex items-center gap-2">
                <span>Page not displaying properly?</span>
                <a
                  href={cleanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-bold text-indigo-300 hover:text-indigo-200"
                >
                  Open in a new tab ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
