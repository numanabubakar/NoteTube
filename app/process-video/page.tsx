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
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

export default function ProcessVideoPage() {
  return (
    <Suspense fallback={<DashboardLayout><div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></DashboardLayout>}>
      <ProcessVideoContent />
    </Suspense>
  );
}

function ProcessVideoContent() {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [transcript, setTranscript] = useState('');
  const [notes, setNotes] = useState('');
  const [quiz, setQuiz] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('input');
  const [videoId, setVideoId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [bookmarkedNotes, setBookmarkedNotes] = useState<Set<string>>(new Set());
  
  const searchParams = useSearchParams();
  const vId = searchParams.get('v');

  useEffect(() => {
    if (vId) {
      loadExistingData(vId);
    }
  }, [vId]);

  const loadExistingData = async (id: string) => {
    setLoading(true);
    try {
      const supabase = createClient();
      
      // Fetch video
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .select('*')
        .eq('id', id)
        .single();
      
      if (videoError) throw videoError;
      
      setVideoId(id);
      setTranscript(videoData.transcript);
      setYoutubeUrl(videoData.youtube_url);

      // Fetch existing notes
      const { data: notesData } = await supabase
        .from('notes')
        .select('*')
        .eq('video_id', id)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (notesData && notesData.length > 0) {
        console.log('Found existing notes for video:', id);
        setNotes(notesData[0].content);
        const bookmarked = new Set<string>();
        if (notesData[0].is_bookmarked) {
          bookmarked.add(notesData[0].content);
        }
        setBookmarkedNotes(bookmarked);
      } else {
        console.log('No existing notes found for video:', id);
        setNotes('');
      }

      // Fetch existing quiz
      const { data: quizData } = await supabase
        .from('quizzes')
        .select('*')
        .eq('video_id', id)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (quizData && quizData.length > 0) {
        console.log('Found existing quiz for video:', id);
        setQuiz({ questions: quizData[0].questions });
      } else {
        console.log('No existing quiz found for video:', id);
        setQuiz(null);
      }

      setActiveTab('notes');
    } catch (err) {
      console.error('Error loading existing data:', err);
      setError('Failed to load existing notes for this video.');
    } finally {
      setLoading(false);
    }
  };

  const handleExtractTranscript = async () => {
    if (!youtubeUrl.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Unauthorized');

      const youtubeId = extractYoutubeId(youtubeUrl);
      if (!youtubeId) throw new Error('Invalid YouTube URL');

      // 1. DATABASE-FIRST CHECK: See if we already have this video
      const { data: existingVideo } = await supabase
        .from('videos')
        .select('id')
        .eq('video_id', youtubeId)
        .eq('user_id', user.id)
        .single();

      if (existingVideo) {
        console.log('Video found in database, loading existing data...');
        await loadExistingData(existingVideo.id);
        setLoading(false);
        return;
      }

      // 2. ONLY EXTRACT IF NEW: Proceed with transcript extraction
      const response = await fetch('/api/extract-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtubeUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract transcript');
      }

      const today = new Date().toISOString().split('T')[0];
      
      // Save new video to database
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .insert({
          user_id: user.id,
          youtube_url: youtubeUrl,
          video_id: youtubeId,
          title: `Video from ${youtubeUrl}`,
          transcript: data.transcript,
          duration_seconds: data.duration || 0,
        })
        .select()
        .single();

      if (videoError) {
        console.error('Error saving video:', videoError);
        throw new Error(`Failed to save video to database: ${videoError.message}`);
      }

        if (videoData) {
          setVideoId(videoData.id);
          setTranscript(videoData.transcript);
          
          // 2. Check if a session for today already exists
          let { data: sessionData, error: sessionFetchError } = await supabase
            .from('learning_sessions')
            .select('*')
            .eq('video_id', videoData.id)
            .eq('user_id', user.id)
            .eq('session_date', today)
            .single();

          if (!sessionData) {
            // Create new learning session
            const { data: newSession, error: sErr } = await supabase
              .from('learning_sessions')
              .insert({
                user_id: user.id,
                video_id: videoData.id,
                duration_minutes: Math.ceil((data.duration || 0) / 60),
                session_date: today,
              })
              .select()
              .single();
            
            if (sErr) {
              console.error('Error creating session:', sErr);
            } else {
              sessionData = newSession;
              
              // Update learning stats for new session/video
              const { data: existingStats } = await supabase
                .from('learning_stats')
                .select('id, session_count, videos_watched, total_minutes')
                .eq('user_id', user.id)
                .eq('stats_date', today)
                .single();

              const sessionMinutes = Math.ceil((data.duration || 0) / 60);

              if (existingStats) {
                await supabase.from('learning_stats').update({
                  session_count: (existingStats.session_count || 0) + 1,
                  videos_watched: (existingStats.videos_watched || 0) + 1,
                  total_minutes: (existingStats.total_minutes || 0) + sessionMinutes,
                  updated_at: new Date().toISOString()
                }).eq('id', existingStats.id);
              } else {
                await supabase.from('learning_stats').insert({
                  user_id: user.id,
                  stats_date: today,
                  session_count: 1,
                  videos_watched: 1,
                  total_minutes: sessionMinutes
                });
              }
            }
          }

          if (sessionData) {
            setSessionId(sessionData.id);
          }

          // 3. Fetch any existing notes/quizzes for this video to auto-load
          const { data: existingNotes } = await supabase
            .from('notes')
            .select('*')
            .eq('video_id', videoData.id)
            .eq('user_id', user.id)
            .limit(1);
          
          if (existingNotes && existingNotes.length > 0) {
            setNotes(existingNotes[0].content);
            if (existingNotes[0].is_bookmarked) {
              setBookmarkedNotes(new Set([existingNotes[0].content]));
            }
          } else {
            setNotes('');
          }

          const { data: existingQuiz } = await supabase
            .from('quizzes')
            .select('*')
            .eq('video_id', videoData.id)
            .eq('user_id', user.id)
            .limit(1);
          
          if (existingQuiz && existingQuiz.length > 0) {
            setQuiz({ questions: existingQuiz[0].questions });
          } else {
            setQuiz(null);
          }

          // If content already exists, move to the notes tab
          if (existingNotes?.length || existingQuiz?.length) {
            setActiveTab('notes');
          } else {
            // Only reset if NO existing content was found
            setNotes('');
            setQuiz(null);
            setActiveTab('notes'); 
          }
        }
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
          .upsert({
            user_id: user.id,
            video_id: videoId,
            content: data.notes,
            is_bookmarked: false,
          }, { onConflict: 'user_id,video_id' });

        if (saveError) {
          console.error('Error saving notes to database:', saveError);
        } else if (sessionId) {
          // Increment notes count in session
          await supabase.rpc('increment_notes_count', { session_id: sessionId });
          // Also update learning stats
          const today = new Date().toISOString().split('T')[0];
          await supabase.rpc('increment_notes_created', { u_id: user.id, s_date: today });
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
        body: JSON.stringify({ transcript, videoId, numQuestions }),
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
          .upsert({
            user_id: user.id,
            video_id: videoId,
            questions: data.quiz.questions,
          }, { onConflict: 'user_id,video_id' });

        if (saveError) {
          console.error('Error saving quiz to database:', saveError);
        } else if (sessionId) {
          // Record quiz completion
          const today = new Date().toISOString().split('T')[0];
          await supabase.rpc('increment_quizzes_taken', { u_id: user.id, s_date: today });
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
                  {quiz ? 'Answer the questions to test your understanding' : 'Select how many questions you want and click generate'}
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
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Number of Questions: {numQuestions}</label>
                      <input 
                        type="range" 
                        min="1" 
                        max="20" 
                        value={numQuestions} 
                        onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>1</span>
                        <span>10</span>
                        <span>20</span>
                      </div>
                    </div>
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
                  </div>
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
