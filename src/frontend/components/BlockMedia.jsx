import React, { useState, useRef } from 'react';
import { getYouTubeEmbedUrl } from '../utils/youtube.js';

export const BlockHeading = ({ block }) => {
  const level = block.level || 2;
  const styles = { 
    1: "text-3xl font-extrabold text-slate-900 tracking-tight mb-4", 
    2: "text-2xl font-bold text-slate-800 mb-3", 
    3: "text-xl font-semibold text-slate-700 mb-2" 
  };
  if (level === 1) return <h1 className={styles[1]}>{block.text}</h1>;
  if (level === 3) return <h3 className={styles[3]}>{block.text}</h3>;
  return <h2 className={styles[2]}>{block.text}</h2>;
};

export const BlockText = ({ block }) => (
  <p className="text-slate-700 text-base sm:text-lg leading-relaxed mb-4 font-sans font-medium whitespace-pre-line">
    {block.text}
  </p>
);

export const BlockImage = ({ block, onEditMedia }) => {
  const [lightboxUrl, setLightboxUrl] = useState(null);

  const imageList = block.images && block.images.length > 0
    ? block.images
    : (block.url ? [{ url: block.url, caption: block.caption }] : []);

  if (imageList.length === 0) return null;

  const gridCols = imageList.length === 1 ? 'grid-cols-1 max-w-xl mx-auto' :
                   imageList.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
                   imageList.length === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4';

  return (
    <div className="my-6 space-y-3 relative group">
      {block.caption && <h4 className="font-bold text-slate-800 text-base">{block.caption}</h4>}

      <div className={`grid ${gridCols} gap-4`}>
        {imageList.map((img, idx) => (
          <div
            key={idx}
            onClick={() => setLightboxUrl(img.url)}
            className="group relative overflow-hidden rounded-2xl border border-slate-200 shadow-xs bg-slate-100 cursor-pointer hover:shadow-md transition"
          >
            <img
              src={img.url}
              alt={img.caption || `Visual ${idx + 1}`}
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
              loading="lazy"
              className="w-full h-48 sm:h-56 object-cover group-hover:scale-105 transition duration-300"
            />
            {img.caption && (
              <div className="p-2.5 bg-white/95 backdrop-blur-xs text-xs font-semibold text-slate-700 text-center border-t border-slate-100">
                {img.caption}
              </div>
            )}
          </div>
        ))}
      </div>

      {onEditMedia && (
        <button
          onClick={() => onEditMedia(block.id, 'url', block.url)}
          className="mt-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xs transition cursor-pointer"
        >
          🔗 Изменить ссылку на фото
        </button>
      )}

      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={lightboxUrl}
              alt="Zoomed"
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
              className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain"
            />
            <button onClick={() => setLightboxUrl(null)} className="absolute top-2 right-2 bg-slate-900/80 text-white w-8 h-8 rounded-full font-bold">✕</button>
          </div>
        </div>
      )}
    </div>
  );
};

export const BlockVideo = ({ block, onEditMedia }) => {
  const embedUrl = getYouTubeEmbedUrl(block.url);
  const isYouTube = embedUrl && embedUrl.includes('youtube.com/embed');

  return (
    <div className="my-6 relative group">
      {block.title && <h4 className="font-semibold text-lg text-slate-800 mb-3">{block.title}</h4>}
      <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-900 shadow-md">
        {isYouTube ? (
          <iframe 
            src={embedUrl} 
            className="w-full h-full border-0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
          ></iframe>
        ) : (
          <video controls className="w-full h-full"><source src={block.url} type="video/mp4" /></video>
        )}
      </div>
      {onEditMedia && (
        <button
          onClick={() => onEditMedia(block.id, 'url', block.url)}
          className="mt-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xs transition cursor-pointer"
        >
          🔗 Изменить ссылку на видео
        </button>
      )}
    </div>
  );
};

// CLEAN LIGHT-THEMED AUDIO / PODCAST PLAYER
export const BlockAudio = ({ block = {}, onEditMedia }) => {
  const [showTranscript, setShowTranscript] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const audioRef = useRef(null);

  const handleSpeedChange = (speed) => {
    setPlaybackRate(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  return (
    <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xs mb-6 space-y-4">
      {/* HEADER */}
      <div className="flex justify-between items-start gap-3">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 text-xl font-bold shadow-2xs shrink-0">
            🎙️
          </div>
          <div>
            <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-extrabold text-[10px] uppercase tracking-wider inline-block mb-1">
              Listening Audio / Podcast
            </span>
            <h4 className="font-extrabold text-lg sm:text-xl text-slate-900 leading-snug">
              {block.title || 'Audio Episode'}
            </h4>
          </div>
        </div>

        {onEditMedia && (
          <button
            type="button"
            onClick={() => onEditMedia(block.id, 'url', block.url)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 cursor-pointer transition shrink-0"
          >
            🔗 Edit Audio
          </button>
        )}
      </div>

      {/* AUDIO PLAYER & SPEED CONTROLS */}
      {block.url ? (
        <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <audio 
            ref={audioRef}
            controls 
            className="w-full h-10" 
            key={block.url}
          >
            <source src={block.url} type="audio/mpeg" />
            <source src={block.url} type="audio/wav" />
            Your browser does not support audio playback.
          </audio>

          {/* PLAYBACK SPEED BUTTONS */}
          <div className="flex justify-between items-center text-xs font-bold pt-1">
            <span className="text-[11px] text-slate-500 font-extrabold uppercase tracking-wider">Speed:</span>
            <div className="flex gap-1.5">
              {[0.8, 1.0, 1.2].map((speed) => (
                <button
                  key={speed}
                  type="button"
                  onClick={() => handleSpeedChange(speed)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                    playbackRate === speed
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 italic">
          Audio is being processed or not uploaded yet.
        </div>
      )}

      {/* TRANSCRIPT COLLAPSIBLE DRAWER */}
      {block.transcript && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowTranscript(!showTranscript)}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition flex items-center gap-1.5 cursor-pointer select-none"
          >
            <span>{showTranscript ? '▲ Скрыть текст записи' : '▼ Показать текст записи (Транскрипт)'}</span>
          </button>

          {showTranscript && (
            <div className="mt-3 p-4 bg-slate-50 rounded-2xl text-xs sm:text-sm text-slate-800 whitespace-pre-line border border-slate-200 leading-relaxed animate-fade-in font-sans">
              {block.transcript}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const BlockGrammarCard = ({ block }) => (
  <div className="bg-gradient-to-r from-indigo-50/90 to-blue-50/90 border border-indigo-100 p-6 rounded-2xl shadow-xs mb-6 space-y-3">
    <div className="flex items-center gap-2">
      <span className="px-2.5 py-0.5 bg-indigo-600 text-white text-[10px] font-extrabold rounded-full uppercase tracking-wider">Правило</span>
      <h3 className="text-xl font-bold text-slate-900">{block.title}</h3>
    </div>
    {block.formula && (
      <div className="my-2 p-3 bg-white border border-indigo-200 rounded-xl font-mono text-indigo-950 font-bold text-center text-sm shadow-2xs">
        {block.formula}
      </div>
    )}
    {block.explanation && <p className="text-slate-700 text-sm leading-relaxed">{block.explanation}</p>}
    {block.examples?.length > 0 && (
      <div className="space-y-1 pt-1">
        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Примеры:</p>
        {block.examples.map((ex, idx) => (
          <p key={idx} className="text-sm font-medium text-slate-800 italic">&bull; "{ex}"</p>
        ))}
      </div>
    )}
  </div>
);
