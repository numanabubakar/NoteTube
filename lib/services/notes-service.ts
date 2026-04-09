import { createClient } from '@/lib/supabase/server'

export type ImportanceLevel = 'low' | 'medium' | 'high'

export async function createNote(userId: string, videoId: string, content: string, importance: ImportanceLevel = 'medium') {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notes')
    .insert({
      user_id: userId,
      video_id: videoId,
      content,
      importance_level: importance,
    })
    .select()
    .single()
  return { note: data, error }
}

export async function updateNote(noteId: string, updates: Partial<{
  content: string
  is_bookmarked: boolean
  importance_level: ImportanceLevel
}>) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notes')
    .update(updates)
    .eq('id', noteId)
    .select()
    .single()
  return { note: data, error }
}

export async function toggleBookmark(noteId: string, isBookmarked: boolean) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notes')
    .update({ is_bookmarked: isBookmarked })
    .eq('id', noteId)
    .select()
    .single()
  return { note: data, error }
}

export async function deleteNote(noteId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId)
  return { error }
}

export async function createKeypoint(userId: string, noteId: string, content: string, importance: ImportanceLevel = 'medium') {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('keypoints')
    .insert({
      user_id: userId,
      note_id: noteId,
      content,
      importance_level: importance,
    })
    .select()
    .single()
  return { keypoint: data, error }
}

export async function updateKeypoint(keypointId: string, updates: Partial<{
  content: string
  importance_level: ImportanceLevel
}>) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('keypoints')
    .update(updates)
    .eq('id', keypointId)
    .select()
    .single()
  return { keypoint: data, error }
}

export async function deleteKeypoint(keypointId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('keypoints')
    .delete()
    .eq('id', keypointId)
  return { error }
}

export async function getKeypointsForNote(noteId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('keypoints')
    .select('*')
    .eq('note_id', noteId)
    .order('created_at', { ascending: false })
  return { keypoints: data, error }
}
