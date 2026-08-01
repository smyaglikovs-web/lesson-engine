import { YoutubeTranscript } from 'youtube-transcript';

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const videoUrl = body.url;

    if (!videoUrl) {
      return new Response(JSON.stringify({ success: false, error: "No URL provided" }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }

    const transcriptArray = await YoutubeTranscript.fetchTranscript(videoUrl);
    const fullText = transcriptArray.map(item => item.text).join(' ');

    return new Response(JSON.stringify({ success: true, transcript: fullText }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error("Cloudflare YouTube Transcript Error:", error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}
