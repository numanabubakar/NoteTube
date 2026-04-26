export const maxDuration = 120;
import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { transcript, videoId } = await request.json();

    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      );
    }

    // Server-side caching check
    if (videoId) {
      const { data: existingNote } = await supabase
        .from('notes')
        .select('content')
        .eq('video_id', videoId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existingNote) {
        console.log('Returning cached notes for video:', videoId);
        return NextResponse.json({ notes: existingNote.content, cached: true });
      }
    }

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Gemini API key is not configured' },
        { status: 500 }
      );
    }

    const google = createGoogleGenerativeAI({ apiKey });
    const model = google('gemini-3-flash-preview');

    const { text } = await generateText({
      model,
      prompt: `You are an expert note-taker. Based on the following YouTube transcript, create comprehensive, well-organized study notes.
      
      IMPORTANT: The transcript may be in Hindi, Urdu, or another language. Regardless of the transcript's language, you MUST write the final notes entirely in English.
      
      Format the notes using professional Markdown:
      1. Use a clear # Title
      2. Use ## for main sections and ### for sub-sections.
      3. Use bullet points (-) for key points and details.
      4. Use **bold text** for important terms, names, or definitions.
      5. Include a brief "Key Takeaways" or "Summary" section at the end.
      
      Transcript:
      ${transcript}
      
      Generate detailed notes that capture the essence and important details of the entire content.`,
    });

    return NextResponse.json({ notes: text });
  } catch (error: any) {
    console.error('Error generating notes:', error);

    // Improved error handling for quota/rate limits
    if (error?.status === 429 || error?.message?.includes('quota') || error?.message?.includes('Rate limit')) {
      return NextResponse.json(
        { error: 'AI Quota exceeded. Please wait a minute before trying again.' },
        { status: 429 }
      );
    }

    const message = error instanceof Error ? error.message : 'Failed to generate notes';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
