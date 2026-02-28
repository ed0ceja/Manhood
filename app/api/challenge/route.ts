import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const maxDuration = 30

function getSupabaseClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET: fetch today's challenge + completion count
export async function GET(req: Request) {
  try {
    const supabase = getSupabaseClient()
    const today = new Date().toISOString().split('T')[0]

    const { data: challenge, error } = await supabase
      .from('daily_challenges')
      .select('*')
      .eq('challenge_date', today)
      .single()

    if (error || !challenge) {
      return Response.json({ challenge: null })
    }

    const { count } = await supabase
      .from('challenge_completions')
      .select('*', { count: 'exact', head: true })
      .eq('challenge_id', challenge.id)

    return Response.json({
      challenge: {
        id: challenge.id,
        challenge_text: challenge.challenge_text,
        source_passage: challenge.source_passage,
        challenge_date: challenge.challenge_date,
      },
      completion_count: count ?? 0,
    })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

// POST: increment completion count (anonymous)
export async function POST(req: Request) {
  try {
    const supabase = getSupabaseClient()
    const { challenge_id } = await req.json()

    if (!challenge_id) {
      return Response.json({ error: 'Missing challenge_id' }, { status: 400 })
    }

    await supabase
      .from('challenge_completions')
      .insert({ challenge_id, user_nullifier: crypto.randomUUID() })

    const { count } = await supabase
      .from('challenge_completions')
      .select('*', { count: 'exact', head: true })
      .eq('challenge_id', challenge_id)

    return Response.json({ success: true, completion_count: count ?? 0 })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
