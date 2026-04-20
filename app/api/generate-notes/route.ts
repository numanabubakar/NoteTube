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
    const { transcript } = await request.json();

    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Gemini API key is not configured' },
        { status: 500 }
      );
    }

    const google = createGoogleGenerativeAI({ apiKey });

    // Limit transcript length to prevent hitting token quotas on the free tier
    const MAX_CHARS = 30000;
    const clampedTranscript = transcript.length > MAX_CHARS
      ? transcript.substring(0, MAX_CHARS) + '\\n\\n[TRANSCRIPT TRUNCATED DUE TO LENGTH LIMITS]'
      : transcript;

    const { text } = await generateText({
      model: google('gemini-3-flash-preview'),
      prompt: `You are an expert note-taker. Convert the following YouTube transcript into well-organized, comprehensive study notes.

Format the notes using Markdown:
1. Use # for the main title
2. Use ## for main sections
3. Use ### for sub-sections
4. Use bullet points (-) for key points
5. Use **bold text** for important definitions or emphasis
6. Use > for important highlights or quotes
7. Add a "Conclusion" or "Summary" section at the end

Transcript:
${clampedTranscript}

Please provide comprehensive, well-structured study notes in Markdown format.`,
    });

    return NextResponse.json({ notes: text });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate notes';
    console.error('Error generating notes:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
