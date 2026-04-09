'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Loader2 } from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { createClient } from '@/lib/supabase/client';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

interface Session {
  id: string;
  duration_minutes: number;
  quiz_score?: number;
  created_at: string;
}

export default function AnalyticsPage() {
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [quizPerformance, setQuizPerformance] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;

        // Fetch all sessions for this user
        const { data: sessionsData } = await supabase
          .from('learning_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (sessionsData) {
          // Generate daily data for the last 7 days
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const dailyMap: Record<string, { sessions: number; duration: number }> = {};

          sessionsData.forEach((session: Session) => {
            const date = new Date(session.created_at);
            const dayName = dayNames[date.getDay()];
            if (!dailyMap[dayName]) {
              dailyMap[dayName] = { sessions: 0, duration: 0 };
            }
            dailyMap[dayName].sessions += 1;
            dailyMap[dayName].duration += session.duration_minutes || 0;
          });

          const daily = dayNames.map((day) => ({
            day,
            sessions: dailyMap[day]?.sessions || 0,
            duration: dailyMap[day]?.duration || 0,
          }));

          setDailyData(daily);

          // Calculate quiz performance distribution
          const quizScores = sessionsData
            .filter((s: Session) => s.quiz_score !== null && s.quiz_score !== undefined)
            .map((s: Session) => s.quiz_score as number);

          const performance = [
            { range: '0-20%', count: quizScores.filter((s) => s < 20).length },
            { range: '20-40%', count: quizScores.filter((s) => s >= 20 && s < 40).length },
            { range: '40-60%', count: quizScores.filter((s) => s >= 40 && s < 60).length },
            { range: '60-80%', count: quizScores.filter((s) => s >= 60 && s < 80).length },
            { range: '80-100%', count: quizScores.filter((s) => s >= 80).length },
          ];

          setQuizPerformance(performance);

          // Calculate pie chart data
          const { data: notesData } = await supabase
            .from('notes')
            .select('id')
            .eq('user_id', user.id);

          const { data: quizzesData } = await supabase
            .from('quizzes')
            .select('id')
            .eq('user_id', user.id);

          const totalNotes = notesData?.length || 0;
          const totalQuizzes = quizzesData?.length || 0;

          const pie = [
            { name: 'Notes Generated', value: totalNotes },
            { name: 'Quizzes Completed', value: totalQuizzes },
            { name: 'Sessions', value: sessionsData.length },
          ].filter((item) => item.value > 0);

          setPieData(pie);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
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
        <div>
          <h1 className="text-4xl font-bold">Learning Analytics</h1>
          <p className="text-muted-foreground">Track your learning progress and performance</p>
        </div>

        {/* Daily Activity */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Weekly Activity</CardTitle>
              <CardDescription>Sessions and duration by day</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="day" stroke="var(--muted-foreground)" />
                  <YAxis stroke="var(--muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="sessions" fill="#3b82f6" />
                  <Bar dataKey="duration" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quiz Performance and Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quiz Performance Distribution */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Quiz Performance Distribution</CardTitle>
                <CardDescription>Your quiz score ranges</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={quizPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="range" stroke="var(--muted-foreground)" />
                    <YAxis stroke="var(--muted-foreground)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="count" fill="#ec4899" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Learning Overview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Learning Overview</CardTitle>
                <CardDescription>Content and completion distribution</CardDescription>
              </CardHeader>
              <CardContent>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--card)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    No data available yet
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Performance Trends */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>Your improvement over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="day" stroke="var(--muted-foreground)" />
                  <YAxis stroke="var(--muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="duration"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
