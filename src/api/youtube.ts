import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export function getYoutubeVideoId(url: string): string {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : '';
}

export async function validateYoutubeUrl(url: string): Promise<boolean> {
  const videoId = getYoutubeVideoId(url);
  if (!videoId) return false;

  try {
    const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    return response.ok;
  } catch {
    return false;
  }
}

export async function downloadYoutubeAudio(url: string): Promise<File> {
  try {
    const videoId = getYoutubeVideoId(url);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    // Create a proxy server URL for YouTube audio extraction
    const proxyUrl = `https://youtube-audio-proxy.vercel.app/api/audio?videoId=${videoId}`;
    
    const response = await fetch(proxyUrl);
    if (!response.ok) {
      throw new Error('Failed to download YouTube audio');
    }

    const audioBlob = await response.blob();
    return new File([audioBlob], `youtube_${videoId}.wav`, { type: 'audio/wav' });
  } catch (error) {
    console.error('Error downloading YouTube audio:', error);
    throw new Error('Failed to download YouTube audio. Please try again.');
  }
}

export function createYoutubeErrorMessage(url: string): string {
  if (!url.trim()) {
    return 'Please enter a YouTube URL';
  }
  if (!getYoutubeVideoId(url)) {
    return 'Invalid YouTube URL format';
  }
  return 'This video is not available for processing. Please try another video.';
}