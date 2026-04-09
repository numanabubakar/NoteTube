import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const timeframe = request.nextUrl.searchParams.get('timeframe') || 'week';

    // Get user profile for total stats
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Calculate date range
    const now = new Date();
    let startDate = new Date();

    if (timeframe === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (timeframe === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    }

    // Get learning stats for the timeframe
    const { data: statsData } = await supabase
      .from('learning_stats')
      .select('*')
      .eq('user_id', user.id)
      .gte('stats_date', startDate.toISOString().split('T')[0])
      .order('stats_date', { ascending: true });

    // Get recent sessions
    const { data: sessionsData } = await supabase
      .from('learning_sessions')
      .select(
        `*,
        videos (
          title,
          youtube_url
        )`
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Calculate aggregated stats
    const totalMinutes = statsData?.reduce((sum, stat) => sum + (stat.total_minutes || 0), 0) || 0;
    const totalSessions = sessionsData?.length || 0;
    const totalQuizzes = statsData?.reduce((sum, stat) => sum + (stat.quizzes_taken || 0), 0) || 0;
    const avgQuizScore =
      totalQuizzes > 0
        ? (
            (statsData || []).reduce((sum, stat) => sum + (stat.avg_quiz_score || 0), 0) / (statsData?.length || 1)
          ).toFixed(2)
        : '0';

    // Get daily breakdown for charts
    const dailyStats = (statsData || []).map((stat) => ({
      date: stat.stats_date,
      sessions: stat.session_count,
      minutes: stat.total_minutes,
      videos: stat.videos_watched,
      notes: stat.notes_created,
      quizzes: stat.quizzes_taken,
    }));

    // Get quiz performance data
    const quizScores = sessionsData
      ?.filter((s) => s.quiz_score !== null)
      .map((s) => ({
        score: parseFloat(s.quiz_score),
        date: s.session_date,
      })) || [];

    return NextResponse.json({
      profile: profileData,
      summary: {
        totalMinutes,
        totalSessions,
        totalQuizzes,
        avgQuizScore: parseFloat(avgQuizScore),
        currentStreak: profileData?.current_streak || 0,
        totalVideosProcessed: profileData?.total_videos_processed || 0,
      },
      dailyStats,
      quizScores,
      recentSessions: sessionsData,
    });
  } catch (error) {
    console.error('Error fetching learning stats:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { videoId, durationMinutes, quizScore } = await request.json();

    const today = new Date().toISOString().split('T')[0];

    // Create or update learning session
    const { error: sessionError } = await supabase.from('learning_sessions').insert({
      user_id: user.id,
      video_id: videoId,
      duration_minutes: durationMinutes,
      quiz_score: quizScore,
      session_date: today,
    });

    if (sessionError) throw sessionError;

    // Get or create today's stats
    const { data: existingStats } = await supabase
      .from('learning_stats')
      .select('*')
      .eq('user_id', user.id)
      .eq('stats_date', today)
      .single();

    if (existingStats) {
      // Update existing stats
      await supabase
        .from('learning_stats')
        .update({
          session_count: (existingStats.session_count || 0) + 1,
          total_minutes: (existingStats.total_minutes || 0) + (durationMinutes || 0),
          videos_watched: (existingStats.videos_watched || 0) + 1,
          quizzes_taken: (existingStats.quizzes_taken || 0) + (quizScore ? 1 : 0),
          avg_quiz_score: quizScore || existingStats.avg_quiz_score,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingStats.id);
    } else {
      // Create new stats entry
      await supabase.from('learning_stats').insert({
        user_id: user.id,
        stats_date: today,
        session_count: 1,
        total_minutes: durationMinutes || 0,
        videos_watched: 1,
        quizzes_taken: quizScore ? 1 : 0,
        avg_quiz_score: quizScore,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error recording learning session:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to record session' },
      { status: 500 }
    );
  }
}
