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

    // 1. Get ACTUAL totals (not limited by timeframe or 10 rows)
    const { count: totalSessions } = await supabase
      .from('learning_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const { data: minutesData } = await supabase
      .from('learning_sessions')
      .select('duration_minutes')
      .eq('user_id', user.id);
    const totalMinutes = minutesData?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0;

    const { count: totalNotes } = await supabase
      .from('notes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // 2. Calculate Current Streak correctly
    // Fetch all stats sorted by date descending to find consecutive days
    const { data: rawStats } = await supabase
      .from('learning_stats')
      .select('stats_date, session_count')
      .eq('user_id', user.id)
      .order('stats_date', { ascending: false });

    let currentStreak = 0;
    if (rawStats && rawStats.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      // Start checking from the most recent session
      let lastDate = rawStats[0].stats_date;
      
      // If the most recent session is not today and not yesterday, streak is broken (0)
      if (lastDate === today || lastDate === yesterday) {
        currentStreak = 1;
        for (let i = 1; i < rawStats.length; i++) {
          const currentDate = new Date(rawStats[i-1].stats_date);
          const prevDate = new Date(rawStats[i].stats_date);
          const diffDays = Math.round((currentDate.getTime() - prevDate.getTime()) / (1000 * 3600 * 24));
          
          if (diffDays === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }

    // 3. Timeframe-specific data for charts
    const now = new Date();
    let startDate = new Date();
    if (timeframe === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (timeframe === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    }

    const { data: statsData } = await supabase
      .from('learning_stats')
      .select('*')
      .eq('user_id', user.id)
      .gte('stats_date', startDate.toISOString().split('T')[0])
      .order('stats_date', { ascending: true });

    // 4. Recent sessions (limited for UI)
    const { data: sessionsData } = await supabase
      .from('learning_sessions')
      .select(`*, videos (title, youtube_url)`)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    const totalQuizzes = statsData?.reduce((sum, stat) => sum + (stat.quizzes_taken || 0), 0) || 0;
    const avgQuizScore = totalQuizzes > 0
        ? ((statsData || []).reduce((sum, stat) => sum + (stat.avg_quiz_score || 0), 0) / (statsData?.length || 1)).toFixed(2)
        : '0';

    const dailyStats = (statsData || []).map((stat) => ({
      date: stat.stats_date,
      sessions: stat.session_count,
      minutes: stat.total_minutes,
      videos: stat.videos_watched,
      notes: stat.notes_created,
      quizzes: stat.quizzes_taken,
    }));

    return NextResponse.json({
      profile: profileData,
      summary: {
        totalMinutes,
        totalSessions: totalSessions || 0,
        totalNotes: totalNotes || 0,
        totalQuizzes,
        avgQuizScore: parseFloat(avgQuizScore),
        currentStreak,
        totalVideosProcessed: profileData?.total_videos_processed || 0,
      },
      dailyStats,
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
