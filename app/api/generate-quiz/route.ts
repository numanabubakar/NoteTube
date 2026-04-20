import { NextRequest, NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';

const quizSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string(),
      options: z.array(z.string()).length(4),
      correctAnswer: z.number().min(0).max(3),
      explanation: z.string(),
    })
  ),
});

import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { transcript, numQuestions = 5 } = await request.json();

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

    // Chunking logic to handle large transcripts
    const CHUNK_SIZE = 12000; // Characters per chunk
    const chunks = [];
    for (let i = 0; i < transcript.length; i += CHUNK_SIZE) {
      chunks.push(transcript.substring(i, i + CHUNK_SIZE));
    }

    const allQuestions: any[] = [];
    const questionsPerChunk = Math.ceil(numQuestions / chunks.length);

    for (const chunk of chunks) {
      const { object } = await generateObject({
        model: google('gemini-3-flash-preview'),
        schema: quizSchema,
        prompt: `You are an expert quiz creator. Create ${questionsPerChunk} multiple-choice questions based on the following segment of a YouTube transcript.
        
        Each question should:
        1. Test understanding of key concepts in this segment
        2. Have 4 options (A, B, C, D)
        3. Have only one correct answer
        4. Include an explanation for the correct answer
        
        Transcript Segment:
        ${chunk}
        
        Generate ${questionsPerChunk} questions in the specified JSON format.`,
      });

      if (object.questions) {
        allQuestions.push(...object.questions);
      }
    }

    // Combine and limit to exactly the requested number of questions
    const finalQuiz = {
      questions: allQuestions.slice(0, numQuestions),
    };

    return NextResponse.json({ quiz: finalQuiz });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate quiz';
    console.error('Error generating quiz:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
