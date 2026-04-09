import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { noteId, title, description, importanceLevel } = await request.json();

    const { data, error } = await supabase
      .from('keypoints')
      .insert({
        user_id: user.id,
        note_id: noteId,
        title,
        description,
        importance_level: importanceLevel || 'medium',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating keypoint:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create keypoint' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const noteId = request.nextUrl.searchParams.get('noteId');
    let query = supabase.from('keypoints').select('*').eq('user_id', user.id);

    if (noteId) {
      query = query.eq('note_id', noteId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching keypoints:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch keypoints' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, title, description, importanceLevel } = await request.json();

    const { data, error } = await supabase
      .from('keypoints')
      .update({
        title,
        description,
        importance_level: importanceLevel,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating keypoint:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update keypoint' },
      { status: 500 }
    );
  }
}
