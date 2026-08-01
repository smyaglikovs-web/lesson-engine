export function getYouTubeId(url = '') {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export const fetchYouTubeTranscriptAuto = async (videoUrl) => {
  const videoId = getYouTubeId(videoUrl);
  if (!videoId) return null;

  try {
    const res = await fetch(`https://subtitles-youtube.vercel.app/api/tr?v=${videoId}`);
    if (res.ok) {
      const text = await res.text();
      if (text.length > 50) return text.slice(0, 3500);
    }
  } catch(e) {}

  return null;
};

export const compressAndUploadImage = (file, maxWidth = 1000, quality = 0.72) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = () => reject(new Error('Ошибка чтения изображения'));
    };
    reader.onerror = () => reject(new Error('Ошибка файла'));
  });
};
