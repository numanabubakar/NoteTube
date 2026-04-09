'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/dashboard-layout';
import { useLearningStore } from '@/store/learning-store';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, BookOpen, PlayCircle } from 'lucide-react';

export default function LearningHistoryPage() {
  const sessions = useLearningStore((state) => state.sessions);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

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
                            {session.videoTitle}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {new Date(session.createdAt).toLocaleDateString()} at{' '}
                            {new Date(session.createdAt).toLocaleTimeString()}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-3">
                            {session.notesGenerated && (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Notes Generated
                              </Badge>
                            )}
                            {session.quizCompleted && (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Quiz Completed
                                {session.score && ` (${session.score}%)`}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">
                          {session.duration}
                        </p>
                        <p className="text-sm text-muted-foreground">minutes</p>
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
