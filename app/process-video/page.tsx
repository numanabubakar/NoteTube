'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, AlertCircle, Bookmark, BookmarkCheck } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DashboardLayout } from '@/components/dashboard-layout';
import dynamic from 'next/dynamic';

const NotesDisplay = dynamic(() => import('@/components/notes-display'), {
  ssr: false,
  loading: () => <div className="h-40 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
});

import QuizDisplay from '@/components/quiz-display';
import { createClient } from '@/lib/supabase/client';

export default function ProcessVideoPage() {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [transcript, setTranscript] = useState('');
  const [notes, setNotes] = useState('');
  const [quiz, setQuiz] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('input');
  const [videoId, setVideoId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [bookmarkedNotes, setBookmarkedNotes] = useState<Set<string>>(new Set());

  const handleExtractTranscript = async () => {
    if (!youtubeUrl.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/extract-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtubeUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract transcript');
      }

      setTranscript(data.transcript);
      setNotes('');
      setQuiz(null);
      
      // Save video to database
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const youtubeId = extractYoutubeId(youtubeUrl);
        const { data: videoData, error: videoError } = await supabase
          .from('videos')
          .insert({
            user_id: user.id,
            youtube_url: youtubeUrl,
            video_id: youtubeId,
            title: `Video from ${youtubeUrl}`,
            transcript: data.transcript,
          })
          .select()
          .single();

        if (videoError) {
          console.error('Error saving video:', videoError);
          throw new Error(`Failed to save video to database: ${videoError.message}`);
        }

        if (videoData) {
          setVideoId(videoData.id);
          
          // Create learning session
          const { data: sessionData } = await supabase
            .from('learning_sessions')
            .insert({
              user_id: user.id,
              video_id: videoData.id,
            })
            .select()
            .single();
          
          if (sessionData) {
            setSessionId(sessionData.id);
          }
        }
      }
      
      setActiveTab('notes');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateNotes = async () => {
    if (!transcript || !videoId) {
      setError('Transcript and Video ID are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/generate-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate notes');
      }

      setNotes(data.notes);

      // Save to database
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { error: saveError } = await supabase
          .from('notes')
          .insert({
            user_id: user.id,
            video_id: videoId,
            content: data.notes,
            is_bookmarked: false,
          });

        if (saveError) {
          console.error('Error saving notes to database:', saveError);
          // We don't throw here to avoid clearing the generated notes from state
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!transcript || !videoId) {
      setError('Transcript and Video ID are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, numQuestions: 5 }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate quiz');
      }

      setQuiz(data.quiz);

      // Save to database
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { error: saveError } = await supabase
          .from('quizzes')
          .insert({
            user_id: user.id,
            video_id: videoId,
            questions: data.quiz.questions,
          });

        if (saveError) {
          console.error('Error saving quiz to database:', saveError);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = async (noteContent: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !videoId) return;

    const isBookmarked = bookmarkedNotes.has(noteContent);
    
    if (isBookmarked) {
      // Remove bookmark
      const { error } = await supabase
        .from('notes')
        .update({ is_bookmarked: false })
        .eq('user_id', user.id)
        .eq('video_id', videoId)
        .eq('content', noteContent);

      if (!error) {
        const newBookmarked = new Set(bookmarkedNotes);
        newBookmarked.delete(noteContent);
        setBookmarkedNotes(newBookmarked);
      }
    } else {
      // Add bookmark
      const { error } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          video_id: videoId,
          content: noteContent,
          is_bookmarked: true,
          importance_level: 'high',
        });

      if (!error) {
        setBookmarkedNotes(new Set(bookmarkedNotes).add(noteContent));
      }
    }
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <div>
          <h1 className="text-3xl font-bold">Process Video</h1>
          <p className="text-muted-foreground">Transform YouTube videos into study notes and quizzes</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="input">Extract</TabsTrigger>
            <TabsTrigger value="notes" disabled={!transcript}>Notes</TabsTrigger>
            <TabsTrigger value="quiz" disabled={!transcript}>Quiz</TabsTrigger>
          </TabsList>

          {/* Input Tab */}
          <TabsContent value="input" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Enter YouTube URL</CardTitle>
                <CardDescription>
                  Paste a YouTube video link to extract its transcript
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Input
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleExtractTranscript();
                      }
                    }}
                    disabled={loading}
                  />
                  <Button
                    onClick={handleExtractTranscript}
                    disabled={loading}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Extracting...
                      </>
                    ) : (
                      'Extract Transcript'
                    )}
                  </Button>
                </div>

                <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600">
                  <p className="font-semibold mb-2">Supported URLs:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>youtube.com/watch?v=VIDEO_ID</li>
                    <li>youtu.be/VIDEO_ID</li>
                    <li>Direct video IDs</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Study Notes</CardTitle>
                <CardDescription>
                  {notes ? 'Generated study notes from the transcript' : 'Click the button below to generate notes'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {!notes && (
                  <Button
                    onClick={handleGenerateNotes}
                    disabled={loading || !transcript}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Notes...
                      </>
                    ) : (
                      'Generate Study Notes'
                    )}
                  </Button>
                )}

                {notes && <NotesDisplay notes={notes} />}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quiz Tab */}
          <TabsContent value="quiz" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Interactive Quiz</CardTitle>
                <CardDescription>
                  {quiz ? 'Answer the questions to test your understanding' : 'Click the button below to generate a quiz'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {!quiz && (
                  <Button
                    onClick={handleGenerateQuiz}
                    disabled={loading || !transcript}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Quiz...
                      </>
                    ) : (
                      'Generate Quiz'
                    )}
                  </Button>
                )}

                {quiz && <QuizDisplay quiz={quiz} />}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </DashboardLayout>
  );
}

function extractYoutubeId(url: string): string {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : '';
}
