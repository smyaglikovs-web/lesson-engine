import React, { useState } from 'react';

export function getYouTubeEmbedUrl(url) {
  if (!url) return null;
  if (url.indexOf('embed/') !== -1) return url;
  if (url.indexOf('watch?v=') !== -1) {
    var parts = url.split('watch?v=')[1];
    var id = parts ? parts.split('&')[0] : '';
    return 'https://www.youtube.com/embed/' + id;
  }
  if (url.indexOf('youtu.be/') !== -1) {
    var parts = url.split('youtu.be/')[1];
    var id = parts ? parts.split('?')[0] : '';
    return 'https://www.youtube.com/embed/' + id;
  }
  return url;
}

export const BlockHeading = ({ block }) => {
  const level = block.level || 2;
  const styles = { 1: "text-3xl font-bold text-slate-800 mb-4", 2: "text-2xl font-bold text-slate-800 mb-3", 3: "text-xl font-semibold text-slate-700 mb-2" };
  if (level === 1) return <h1 className={styles[1]}>{block.text}</h1>;
  if (level === 3) return <h3 className={styles[3]}>{block.text}</h3>;
  return <h2 className={styles[2]}>{block.text}</h2>;
};

export const BlockText = ({ block }) => <p className="text-slate-600 text-lg leading-relaxed mb-4">{block.text}</p>;

export const BlockImage = ({ block, onEditMedia }) => (
  <div className="my-6 relative group">
    <img src={block.url} alt={block.caption || 'Visual'} className="w-full max-h-96 object-cover rounded-xl shadow-md" />
    {block.caption && <p className="text-sm text-slate-500 text-center mt-2">{block.caption}</p>}
    {onEditMedia && (
      <button onClick={() => onEditMedia(block.id, 'url', block.url)} className="absolute top-3 right-3 bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow transition">
        🔗 Вставить ссылку на фото
      </button>
    )}
  </div>
);

export const BlockVideo = ({ block, onEditMedia }) => {
  const embedUrl = getYouTubeEmbedUrl(block.url);
  const isYouTube = embedUrl && embedUrl.indexOf('youtube.com/embed') !== -1;
  return (
    <div className="my-6 relative group">
      {block.title && <h4 className="font-semibold text-lg text-slate-800 mb-3">{block.title}</h4>}
      <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-900 shadow-md">
        {isYouTube ? (
          <iframe src={embedUrl} className="w-full h-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
        ) : (
          <video controls className="w-full h-full"><source src={block.url} type="video/mp4" /></video>
        )}
      </div>
      {onEditMedia && (
        <button onClick={() => onEditMedia(block.id, 'url', block.url)} className="mt-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow transition">
          🔗 Изменить ссылку на видео (YouTube / MP4)
        </button>
      )}
    </div>
  );
};

export const BlockAudio = ({ block, onEditMedia }) => {
  const [showTranscript, setShowTranscript] = useState(false);
  return (
    <div className="bg-slate-900 text-white p-6 rounded-xl shadow-md mb-6 relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white">🎧</div>
          <h4 className="font-semibold text-lg">{block.title || 'Прослушайте запись:'}</h4>
        </div>
        {onEditMedia && (
          <button onClick={() => onEditMedia(block.id, 'url', block.url)} className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700">
            🔗 Вставить MP3 ссылку
          </button>
        )}
      </div>
      <audio controls className="w-full mb-4"><source src={block.url} type="audio/mpeg" /></audio>
      {block.transcript && (
        <div>
          <button onClick={() => setShowTranscript(!showTranscript)} className="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium">
            {showTranscript ? 'Скрыть текст' : 'Показать транскрипт'}
          </button>
          {showTranscript && <div className="mt-3 p-3 bg-slate-800 rounded-lg text-sm text-slate-300 whitespace-pre-line border border-slate-700">{block.transcript}</div>}
        </div>
      )}
    </div>
  );
};

export const BlockGrammarCard = ({ block }) => (
  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 p-6 rounded-xl shadow-sm mb-6">
    <div className="flex items-center gap-2 mb-2">
      <span className="px-2.5 py-0.5 bg-indigo-600 text-white text-xs font-bold rounded-full uppercase">Правило</span>
      <h3 className="text-xl font-bold text-slate-800">{block.title}</h3>
    </div>
    {block.formula && <div className="my-3 p-3 bg-white border border-indigo-200 rounded-lg font-mono text-indigo-900 font-bold text-center">{block.formula}</div>}
    {block.explanation && <p className="text-slate-600 text-sm mb-3">{block.explanation}</p>}
    {block.examples?.length > 0 && (
      <div className="space-y-1">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Примеры:</p>
        {block.examples.map((ex, idx) => <p key={idx} className="text-sm font-medium text-slate-700 italic">&bull; "{ex}"</p>)}
      </div>
    )}
  </div>
);
