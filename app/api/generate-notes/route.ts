import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

export async function POST(request: NextRequest) {
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
      model: google('gemini-2.5-flash'),
      prompt: `You are an expert note-taker. Convert the following YouTube transcript into well-organized, comprehensive study notes.

Format the notes with:
1. A clear title/summary
2. Main sections with headers
3. Key points as bullet points
4. Important definitions in bold
5. Summary at the end

Transcript:
${clampedTranscript}

Please provide comprehensive, well-structured study notes.`,
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
