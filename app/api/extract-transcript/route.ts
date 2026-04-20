import { NextRequest, NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';

function extractVideoId(youtubeUrl: string): string {
    try {
        const url = new URL(youtubeUrl);
        if (url.hostname === 'youtu.be') {
            return url.pathname.slice(1);
        }
        if (url.hostname.includes('youtube.com')) {
            return url.searchParams.get('v') || '';
        }
    } catch {}
    if (youtubeUrl.length === 11) return youtubeUrl;
    return '';
}

import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { youtubeUrl } = await request.json();

    if (!youtubeUrl) {
      return NextResponse.json(
        { error: 'YouTube URL is required' },
        { status: 400 }
      );
    }

    const videoId = extractVideoId(youtubeUrl);
    
    if (!videoId) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    // Use native Node.js package instead of spawning Python!
    const segments = await YoutubeTranscript.fetchTranscript(videoId);
    const fullTranscript = segments.map((s: any) => s.text).join(' ');

    // Calculate duration in seconds
    const lastSegment = segments[segments.length - 1];
    const durationSeconds = lastSegment ? Math.ceil(lastSegment.offset + lastSegment.duration) : 0;

    console.log('\n--- EXTRACTED TRANSCRIPT ---');
    console.log(`Video ID: ${videoId}`);
    console.log(`Duration: ${durationSeconds} seconds`);
    console.log('----------------------------\n');

    return NextResponse.json({
      success: true,
      video_id: videoId,
      transcript: fullTranscript,
      duration: durationSeconds,
      segments: segments
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to extract transcript. Please make sure the video has captions enabled.';
    console.error('Error fetching transcript:', error);
    // Explicitly return success: false to match expected standard from the UI previously.
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
