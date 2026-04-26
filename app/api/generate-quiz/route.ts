export const maxDuration = 60;
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
    const { transcript, videoId, numQuestions = 5 } = await request.json();

    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      );
    }

    // Server-side caching check
    if (videoId) {
      const { data: existingQuiz } = await supabase
        .from('quizzes')
        .select('questions')
        .eq('video_id', videoId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existingQuiz) {
        console.log('Returning cached quiz for video:', videoId);
        return NextResponse.json({ quiz: { questions: existingQuiz.questions }, cached: true });
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

    const { object } = await generateObject({
      model: google('gemini-3-flash-preview'),
      schema: quizSchema,
      prompt: `You are an expert quiz creator. Based on the following YouTube transcript, create ${numQuestions} multiple-choice questions.
      
      IMPORTANT: The transcript may be in Hindi, Urdu, or another language. Regardless of the transcript's language, you MUST write the questions, options, and explanations entirely in English.
      
      Each question should:
      1. Test understanding of the key concepts presented in the video.
      2. Have exactly 4 options.
      3. Have only one correct answer (index 0-3).
      4. Include a helpful explanation for why the answer is correct.
      
      Transcript:
      ${transcript}
      
      Generate exactly ${numQuestions} questions in the specified JSON format.`,
    });

    return NextResponse.json({ quiz: object });
  } catch (error: any) {
    console.error('Error generating quiz:', error);
    
    // Improved error handling for quota/rate limits
    if (error?.status === 429 || error?.message?.includes('quota') || error?.message?.includes('Rate limit')) {
      return NextResponse.json(
        { error: 'AI Quota exceeded. Please wait a minute before trying again.' },
        { status: 429 }
      );
    }

    const message = error instanceof Error ? error.message : 'Failed to generate quiz';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
