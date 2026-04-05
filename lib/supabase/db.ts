import { createClient } from '@/lib/supabase/server'

export async function getUser() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  return { user: data?.user, error }
}

export async function getUserProfile(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return { profile: data, error }
}

export async function updateUserProfile(userId: string, updates: any) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  return { profile: data, error }
}

export async function getUserLearningStats(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('learning_stats')
    .select('*')
    .eq('user_id', userId)
    .single()
  return { stats: data, error }
}

export async function getUserVideos(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return { videos: data, error }
}

export async function getUserNotes(userId: string, videoId?: string) {
  const supabase = await createClient()
  let query = supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)

  if (videoId) {
    query = query.eq('video_id', videoId)
  }

  const { data, error } = await query.order('created_at', { ascending: false })
  return { notes: data, error }
}

export async function getUserSessions(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('learning_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return { sessions: data, error }
}

export async function getWeeklyStats(userId: string) {
  const supabase = await createClient()
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data, error } = await supabase
    .from('learning_sessions')
    .select('duration_minutes, created_at')
    .eq('user_id', userId)
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: true })

  if (error) return { stats: [], error }

  // Group by date
  const grouped: Record<string, number> = {}
  data?.forEach((session: any) => {
    const date = new Date(session.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
    grouped[date] = (grouped[date] || 0) + session.duration_minutes
  })

  const stats = Object.entries(grouped).map(([date, minutes]) => ({
    date,
    minutes,
  }))

  return { stats, error: null }
}
