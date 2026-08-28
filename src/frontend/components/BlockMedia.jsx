import React, { useState } from 'react';
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
  <p className="text-slate-700 text-base sm:text-lg leading-relaxed mb-4 font-sans font-medium">
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
            className="group relative overflow-hidden rounded-2xl border border-slate-200 shadow-sm bg-slate-100 cursor-pointer hover:shadow-md transition"
          >
            <img
              src={img.url}
              alt={img.caption || `Visual ${idx + 1}`}
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
          className="mt-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow transition cursor-pointer"
        >
          🔗 Изменить ссылку на фото
        </button>
      )}

      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={lightboxUrl} alt="Zoomed" className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain" />
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
          className="mt-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow transition cursor-pointer"
        >
          🔗 Изменить ссылку на видео
        </button>
      )}
    </div>
  );
};

export const BlockAudio = ({ block, onEditMedia }) => {
  const [showTranscript, setShowTranscript] = useState(false);
  return (
    <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md mb-6 relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">🎧</div>
          <h4 className="font-semibold text-lg">{block.title || 'Прослушайте запись:'}</h4>
        </div>
        {onEditMedia && (
          <button
            onClick={() => onEditMedia(block.id, 'url', block.url)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 cursor-pointer"
          >
            🔗 Вставить MP3 ссылку
          </button>
        )}
      </div>
      <audio controls className="w-full mb-4"><source src={block.url} type="audio/mpeg" /></audio>
      {block.transcript && (
        <div>
          <button onClick={() => setShowTranscript(!showTranscript)} className="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium cursor-pointer">
            {showTranscript ? 'Скрыть текст' : 'Показать транскрипт'}
          </button>
          {showTranscript && <div className="mt-3 p-3 bg-slate-800 rounded-xl text-sm text-slate-300 whitespace-pre-line border border-slate-700">{block.transcript}</div>}
        </div>
      )}
    </div>
  );
};

export const BlockGrammarCard = ({ block }) => (
  <div className="bg-gradient-to-r from-indigo-50/90 to-blue-50/90 border border-indigo-100 p-6 rounded-2xl shadow-sm mb-6 space-y-3">
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
