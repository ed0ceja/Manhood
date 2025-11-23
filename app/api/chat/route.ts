/**
 * Chat API route with RAG (Retrieval Augmented Generation)
 */

import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { generateEmbedding } from '@/lib/embeddings'
import { querySimilar } from '@/lib/vector-db-simple'
import { hasDocuments } from '@/lib/vector-db-simple'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    // Get the last user message
    const lastMessage = messages[messages.length - 1]
    if (!lastMessage || lastMessage.role !== 'user') {
      return new Response('No user message found', { status: 400 })
    }

    const userQuery = lastMessage.content

    // Check if vector database is populated
    const dbHasDocuments = await hasDocuments()
    
    let contextText = ''
    
    if (dbHasDocuments) {
      // Generate embedding for the query
      const queryEmbedding = await generateEmbedding(userQuery)
      
      // Retrieve similar documents
      const similarDocs = await querySimilar(queryEmbedding, 5)
      
      // Build context from retrieved documents
      if (similarDocs.length > 0) {
        contextText = similarDocs
          .map((doc) => doc.text)
          .join('\n\n---\n\n')
      }
    }

    // Build the system prompt with context
    const systemPrompt = `You are a wise, friendly mentor based on the book "Manhood" by Steve Biddulph. 

You're having a natural conversation with someone, sharing insights about men supporting men, mentorship, and personal growth based solely on the book and Steve's ideas or references from the book.

${contextText ? `Here is relevant context from the book that relates to the question:\n\n${contextText}\n\n` : ''}

CRITICAL INSTRUCTIONS FOR YOUR RESPONSES:
- Explain ideas in Steve's words - try to quote directly from the book as natural as possible.
- This is a conversation but more like something being shared from the book.
- If the context doesn't have relevant information, say so honestly and don't share any of your own ideas

Tone is based from Steve's tone in the book.

FORMATTING:
- Break long paragraphs into shorter ones (2-4 sentences each)
- Add blank lines between paragraphs for visual breathing room
- Use line breaks to separate distinct ideas or points`

    // Stream the response using OpenAI
    const result = await streamText({
      model: openai('gpt-4o-mini'), // Using gpt-4o-mini for cost efficiency
      system: systemPrompt,
      messages: messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: 0.8,
      maxTokens: 1000,
    })

    return result.toTextStreamResponse()
  } catch (error: any) {
    console.error('Chat API error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

