'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Loader2, AlertCircle, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion } from 'framer-motion';

interface LearningStats {
  totalMinutes: number;
  totalSessions: number;
  totalQuizzes: number;
  avgQuizScore: number;
  currentStreak: number;
  totalVideosProcessed: number;
}

interface DailyStats {
  date: string;
  sessions: number;
  minutes: number;
  videos: number;
  notes: number;
  quizzes: number;
}

interface QuizScore {
  score: number;
  date: string;
}

export function LearningAnalytics() {
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [quizScores, setQuizScores] = useState<QuizScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'week' | 'month'>('week');

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/learning-stats?timeframe=${timeframe}`);
        if (!response.ok) throw new Error('Failed to fetch stats');

        const data = await response.json();
        setStats(data.summary);
        setDailyStats(data.dailyStats || []);
        setQuizScores(data.quizScores || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [timeframe]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const statCards = [
    {
      title: 'Total Learning Time',
      value: `${stats?.totalMinutes || 0}`,
      unit: 'minutes',
      icon: '⏱️',
    },
    {
      title: 'Learning Sessions',
      value: stats?.totalSessions || 0,
      unit: 'sessions',
      icon: '📚',
    },
    {
      title: 'Quizzes Completed',
      value: stats?.totalQuizzes || 0,
      unit: 'quizzes',
      icon: '📝',
    },
    {
      title: 'Average Quiz Score',
      value: `${stats?.avgQuizScore || 0}%`,
      unit: 'score',
      icon: '⭐',
    },
  ];

  // Prepare data for charts
  const chartData = dailyStats.map((stat) => ({
    date: new Date(stat.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    sessions: stat.sessions,
    minutes: stat.minutes,
    videos: stat.videos,
    quizzes: stat.quizzes,
  }));

  const quizDistribution = [
    { name: 'Excellent (80-100%)', value: quizScores.filter((q) => q.score >= 80).length },
    { name: 'Good (60-79%)', value: quizScores.filter((q) => q.score >= 60 && q.score < 80).length },
    { name: 'Fair (40-59%)', value: quizScores.filter((q) => q.score >= 40 && q.score < 60).length },
    { name: 'Needs Work (<40%)', value: quizScores.filter((q) => q.score < 40).length },
  ];

  const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-8">
      {/* Timeframe Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setTimeframe('week')}
          className={`px-4 py-2 rounded-lg transition-all ${
            timeframe === 'week'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary hover:bg-secondary/80'
          }`}
        >
          This Week
        </button>
        <button
          onClick={() => setTimeframe('month')}
          className={`px-4 py-2 rounded-lg transition-all ${
            timeframe === 'month'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary hover:bg-secondary/80'
          }`}
        >
          This Month
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="group hover:border-primary/50 transition-all">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold">{card.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{card.unit}</p>
                  </div>
                  <span className="text-3xl opacity-50 group-hover:opacity-100 transition-opacity">{card.icon}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Learning Activity</CardTitle>
            <CardDescription>Sessions and minutes over {timeframe}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sessions" fill="#3b82f6" name="Sessions" />
                <Bar dataKey="minutes" fill="#8b5cf6" name="Minutes" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quiz Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Quiz Performance</CardTitle>
            <CardDescription>Score distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {quizScores.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={quizDistribution.filter((d) => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {quizDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">No quiz data available yet</p>
            )}
          </CardContent>
        </Card>

        {/* Progress Over Time */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Learning Progress</CardTitle>
            <CardDescription>Videos watched and notes created over {timeframe}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="videos" stroke="#22c55e" name="Videos" strokeWidth={2} />
                <Line type="monotone" dataKey="quizzes" stroke="#f59e0b" name="Quizzes" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Current Streak */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Current Streak
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold">{stats?.currentStreak || 0}</p>
          <p className="text-muted-foreground mt-2">consecutive learning days</p>
        </CardContent>
      </Card>
    </div>
  );
}
