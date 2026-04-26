'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/dashboard-layout';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, BookOpen, PlayCircle, Loader2, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface SessionData {
  id: string;
  duration_minutes: number;
  notes_count: number;
  quiz_score: number | null;
  video_id: string;
  created_at: string;
  videos: {
    title: string;
    youtube_url: string;
  };
}

export default function LearningHistoryPage() {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('learning_sessions')
          .select(`
            id,
            duration_minutes,
            notes_count,
            quiz_score,
            video_id,
            created_at,
            videos (
              title,
              youtube_url
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setSessions(data || []);
      } catch (err) {
        console.error('Error fetching learning history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        <div>
          <h1 className="text-3xl font-bold">Learning History</h1>
          <p className="text-muted-foreground mt-2">
            Track your past learning sessions and revisit your progress
          </p>
        </div>

        {sessions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="rounded-lg border border-border/40 bg-card p-12 text-center"
          >
            <div className="inline-flex rounded-lg bg-gradient-to-br from-blue-600/20 to-purple-600/20 p-4 mb-4">
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No learning sessions yet</h3>
            <p className="text-muted-foreground mb-6">
              Start your learning journey by processing a YouTube video
            </p>
          </motion.div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            {sessions.map((session) => (
              <motion.div
                key={session.id}
                variants={item}
                whileHover={{ translateY: -2 }}
              >
                <Card className="hover:border-primary/50 transition-all">
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="rounded-lg bg-gradient-to-br from-blue-600/20 to-purple-600/20 p-3">
                          <PlayCircle className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate">
                            {session.videos?.title || 'Untitled Video'}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {new Date(session.created_at).toLocaleDateString()} at{' '}
                            {new Date(session.created_at).toLocaleTimeString()}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-3">
                            {session.notes_count > 0 && (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                {session.notes_count} Notes Created
                              </Badge>
                            )}
                            {session.quiz_score !== null && (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Quiz Completed ({session.quiz_score}%)
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">
                          {session.duration_minutes || 0}
                        </p>
                        <p className="text-sm text-muted-foreground mb-4">minutes</p>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/process-video?v=${session.video_id}`}>
                            Reopen <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
