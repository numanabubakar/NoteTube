'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/dashboard-layout';
import { BarChart3, BookOpen, Zap, Target, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface UserStats {
  total_sessions: number;
  total_minutes: number;
  total_notes: number;
  total_quizzes: number;
  current_streak: number;
}

interface RecentSession {
  id: string;
  video_id: string;
  duration_minutes: number;
  created_at: string;
}

const StatCard = ({ icon: Icon, label, value, color }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="rounded-lg border border-border/40 bg-card p-6"
  >
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-3xl font-bold">{value}</p>
      </div>
      <div className={`rounded-lg p-3 ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
  </motion.div>
);

export default function DashboardPage() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [videoTitles, setVideoTitles] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;

        setUserName(user.email?.split('@')[0] || 'User');

        // Fetch learning stats from our optimized API
        const statsResponse = await fetch('/api/learning-stats');
        const statsData = await statsResponse.json();

        if (statsData && statsData.summary) {
          setStats({
            total_sessions: statsData.summary.totalSessions,
            total_minutes: statsData.summary.totalMinutes,
            total_notes: statsData.summary.totalNotes,
            total_quizzes: statsData.summary.totalQuizzes,
            current_streak: statsData.summary.currentStreak
          });
          
          if (statsData.dailyStats) {
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const chartData = statsData.dailyStats.map((stat: any) => {
              const date = new Date(stat.date);
              return {
                date: dayNames[date.getDay()],
                time: stat.minutes || 0
              };
            });
            setChartData(chartData);
          }
        }

        // Fetch recent sessions
        const { data: sessionsData } = await supabase
          .from('learning_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (sessionsData) {
          setRecentSessions(sessionsData);

          // Fetch video titles
          const videoIds = sessionsData.map((s) => s.video_id);
          if (videoIds.length > 0) {
            const { data: videosData } = await supabase
              .from('videos')
              .select('id, title')
              .in('id', videoIds);

            if (videosData) {
              const titles: Record<string, string> = {};
              videosData.forEach((video) => {
                titles[video.id] = video.title;
              });
              setVideoTitles(titles);
            }
          }
        }

        // Generate weekly chart data from sessions
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: allSessions } = await supabase
          .from('learning_sessions')
          .select('duration_minutes, created_at')
          .eq('user_id', user.id)
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: true });

        if (allSessions) {
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const grouped: Record<string, number> = {};

          allSessions.forEach((session: any) => {
            const date = new Date(session.created_at);
            const dayName = dayNames[date.getDay()];
            grouped[dayName] = (grouped[dayName] || 0) + session.duration_minutes;
          });

          const data = dayNames.map((day) => ({
            date: day,
            time: grouped[day] || 0,
          }));

          setChartData(data);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
        {/* Welcome Section */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">
            Welcome back, {userName}!
          </h1>
          <p className="text-muted-foreground">
            Track your learning progress and continue growing
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Target}
            label="Total Sessions"
            value={stats?.total_sessions || 0}
            color="bg-gradient-to-br from-blue-600 to-blue-500"
          />
          <StatCard
            icon={Zap}
            label="Learning Time"
            value={`${stats?.total_minutes || 0}m`}
            color="bg-gradient-to-br from-purple-600 to-purple-500"
          />
          <StatCard
            icon={BookOpen}
            label="Notes Created"
            value={stats?.total_notes || 0}
            color="bg-gradient-to-br from-pink-600 to-pink-500"
          />
          <StatCard
            icon={BarChart3}
            label="Current Streak"
            value={`${stats?.current_streak || 0}d`}
            color="bg-gradient-to-br from-orange-600 to-orange-500"
          />
        </div>

        {/* Charts and Activity */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Weekly Activity Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2 rounded-lg border border-border/40 bg-card p-6"
          >
            <CardHeader className="p-0 mb-6">
              <CardTitle>This Week&apos;s Activity</CardTitle>
              <CardDescription>Minutes spent learning</CardDescription>
            </CardHeader>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="time"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Recent Sessions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-lg border border-border/40 bg-card p-6"
          >
            <CardHeader className="p-0 mb-6">
              <CardTitle>Recent Sessions</CardTitle>
              <CardDescription>{recentSessions.length} total</CardDescription>
            </CardHeader>
            <div className="space-y-4">
              {recentSessions.length > 0 ? (
                recentSessions.map((session) => (
                  <div key={session.id} className="flex items-start gap-3 pb-4 border-b border-border/40 last:border-0">
                    <div className="rounded-lg bg-gradient-to-br from-blue-600/20 to-purple-600/20 p-2">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {videoTitles[session.video_id] || 'Untitled Video'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(session.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <p className="text-sm font-semibold">{session.duration_minutes}m</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No sessions yet. Start learning!
                </p>
              )}
            </div>
            {recentSessions.length > 0 && (
              <Button variant="ghost" className="w-full mt-4" asChild>
                <Link href="/learning-history">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </motion.div>
        </div>

        {/* Call to Action */}
        {recentSessions.length === 0 && (
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
            <CardHeader>
              <CardTitle>Ready to Start Learning?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Transform any YouTube video into comprehensive study notes and interactive quizzes.
              </p>
              <Button variant="secondary" asChild>
                <Link href="/process-video">Process Your First Video</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
