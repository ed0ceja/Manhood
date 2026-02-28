import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const maxDuration = 30

function getSupabaseClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET: fetch today's challenge + completion count + user's completion status
export async function GET(req: Request) {
  try {
    const supabase = getSupabaseClient()
    const { searchParams } = new URL(req.url)
    const nullifier = searchParams.get('nullifier')
    const today = new Date().toISOString().split('T')[0]

    const { data: challenge, error } = await supabase
      .from('daily_challenges')
      .select('*')
      .eq('challenge_date', today)
      .single()

    if (error || !challenge) {
      return Response.json({ challenge: null })
    }

    // Get completion count
    const { count } = await supabase
      .from('challenge_completions')
      .select('*', { count: 'exact', head: true })
      .eq('challenge_id', challenge.id)

    // Check if this user completed it
    let completed = false
    if (nullifier) {
      const { data: completion } = await supabase
        .from('challenge_completions')
        .select('id')
        .eq('challenge_id', challenge.id)
        .eq('user_nullifier', nullifier)
        .single()
      completed = !!completion
    }

    return Response.json({
      challenge: {
        id: challenge.id,
        challenge_text: challenge.challenge_text,
        source_passage: challenge.source_passage,
        challenge_date: challenge.challenge_date,
      },
      completion_count: count ?? 0,
      completed,
    })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

// POST: mark challenge as complete
export async function POST(req: Request) {
  try {
    const supabase = getSupabaseClient()
    const { nullifier, challenge_id } = await req.json()

    if (!nullifier || !challenge_id) {
      return Response.json({ error: 'Missing nullifier or challenge_id' }, { status: 400 })
    }

    const { error } = await supabase
      .from('challenge_completions')
      .insert({ challenge_id, user_nullifier: nullifier })

    if (error) {
      // Unique constraint violation = already completed
      if (error.code === '23505') {
        return Response.json({ success: true, already_completed: true })
      }
      throw new Error(error.message)
    }

    // Return updated count
    const { count } = await supabase
      .from('challenge_completions')
      .select('*', { count: 'exact', head: true })
      .eq('challenge_id', challenge_id)

    return Response.json({ success: true, completion_count: count ?? 0 })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
