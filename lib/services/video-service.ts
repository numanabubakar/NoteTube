import { createClient } from '@/lib/supabase/server'

export async function saveVideo(userId: string, videoData: {
  youtube_id: string
  title: string
  transcript: string
  duration_seconds?: number
}) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('videos')
    .upsert(
      {
        user_id: userId,
        ...videoData,
      },
      { onConflict: 'user_id,youtube_id' }
    )
    .select()
    .single()
  return { video: data, error }
}

export async function getVideoById(videoId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('id', videoId)
    .single()
  return { video: data, error }
}

export async function createLearningSession(userId: string, videoId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('learning_sessions')
    .insert({
      user_id: userId,
      video_id: videoId,
      duration_minutes: 0,
      notes_created: 0,
      quiz_completed: false,
    })
    .select()
    .single()
  return { session: data, error }
}

export async function updateLearningSession(
  sessionId: string,
  updates: Partial<{
    duration_minutes: number
    notes_created: number
    quiz_completed: boolean
    quiz_score: number
  }>
) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('learning_sessions')
    .update(updates)
    .eq('id', sessionId)
    .select()
    .single()
  return { session: data, error }
}
