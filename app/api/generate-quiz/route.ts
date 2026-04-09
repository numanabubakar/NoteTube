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

export async function POST(request: NextRequest) {
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
    
    // Limit transcript length to prevent hitting token quotas on the free tier
    const MAX_CHARS = 30000; 
    const clampedTranscript = transcript.length > MAX_CHARS 
        ? transcript.substring(0, MAX_CHARS) + '\\n\\n[TRANSCRIPT TRUNCATED DUE TO LENGTH LIMITS]'
        : transcript;

    const { object } = await generateObject({
      model: google('gemini-2.0-flash'),
      schema: quizSchema,
      prompt: `You are an expert quiz creator. Create ${numQuestions} multiple-choice questions based on the following YouTube transcript.

Each question should:
1. Test understanding of key concepts
2. Have 4 options (A, B, C, D)
3. Have only one correct answer
4. Include an explanation for the correct answer

Transcript:
${clampedTranscript}

Generate ${numQuestions} questions in the specified JSON format.`,
    });

    return NextResponse.json({ quiz: object });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate quiz';
    console.error('Error generating quiz:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
