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
    const model = google('gemini-3-flash-preview');

    // Chunking logic to handle large transcripts (10,000 chars ~ 10-15 mins)
    const CHUNK_SIZE = 10000;
    const chunks: string[] = [];
    for (let i = 0; i < transcript.length; i += CHUNK_SIZE) {
      chunks.push(transcript.substring(i, i + CHUNK_SIZE));
    }

    const allNotes: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const { text } = await generateText({
        model,
        prompt: `You are an expert note-taker. This is part ${i + 1} of ${chunks.length} of a long YouTube transcript. 
        Convert the following segment into well-organized study notes.
        
        Maintain consistent formatting with previous parts.
        Format the notes using Markdown:
        1. Use ## for main sections in this part
        2. Use ### for sub-sections
        3. Use bullet points (-) for key points
        4. Use **bold text** for important definitions
        
        Transcript Segment (Part ${i + 1}/${chunks.length}):
        ${chunks[i]}
        
        Notes for this part:`,
      });
      
      allNotes.push(`### Part ${i + 1} of ${chunks.length}\n${text}\n\n---\n\n`);
    }

    const finalNotes = `# Study Notes\n\nGenerated for a video with ${chunks.length} segments.\n\n${allNotes.join('')}`;

    return NextResponse.json({ notes: finalNotes });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate notes';
    console.error('Error generating notes:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
