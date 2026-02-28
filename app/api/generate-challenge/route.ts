import { createClient } from '@supabase/supabase-js'
import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { querySimilar } from '@/lib/vector-db-simple'
import { generateEmbedding } from '@/lib/embeddings'

export const runtime = 'nodejs'
export const maxDuration = 30

function getSupabaseClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: Request) {
  // Secure the endpoint with a secret header
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const supabase = getSupabaseClient()
    const today = new Date().toISOString().split('T')[0]

    // Check if a challenge already exists for today
    const { data: existing } = await supabase
      .from('daily_challenges')
      .select('id')
      .eq('challenge_date', today)
      .single()

    if (existing) {
      return Response.json({ message: 'Challenge already exists for today' })
    }

    // Pick a random topic from the book to base the challenge on
    const topics = [
      'father son relationship masculinity',
      'men friendship brotherhood support',
      'emotional courage vulnerability men',
      'purpose work meaning men',
      'anger grief healing men',
      'marriage partnership love men',
      'mentorship wisdom older men',
      'body health strength men',
    ]
    const randomTopic = topics[Math.floor(Math.random() * topics.length)]

    // Get relevant passage from the book
    const embedding = await generateEmbedding(randomTopic)
    const passages = await querySimilar(embedding, 3)
    const context = passages.map(p => p.text).join('\n\n---\n\n')

    // Generate challenge using AI
    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: `Based on this passage from "Manhood" by Steve Biddulph:

${context}

Create a single, concrete daily challenge for men. The challenge must:
- Be something a man can do TODAY in real life (not just think about)
- Take 5-30 minutes
- Be specific and actionable
- Be inspired by the wisdom in the passage above

Respond with JSON in this exact format:
{
  "challenge_text": "The challenge instruction (1-2 sentences, direct and action-oriented)",
  "source_passage": "A short quote (max 150 chars) from the passage that inspired this challenge"
}`,
    })

    const cleaned = text.replace(/```json\n?|\n?```/g, '').trim()
    const parsed = JSON.parse(cleaned)

    const { error } = await supabase.from('daily_challenges').insert({
      challenge_text: parsed.challenge_text,
      source_passage: parsed.source_passage,
      challenge_date: today,
    })

    if (error) throw new Error(error.message)

    return Response.json({ success: true, challenge: parsed.challenge_text })
  } catch (error: any) {
    console.error('Generate challenge error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
