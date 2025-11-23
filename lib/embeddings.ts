/**
 * Embedding generation using OpenAI API
 */

const OPENAI_API_URL = 'https://api.openai.com/v1/embeddings'

function getApiKey(): string {
  const key = process.env.OPENAI_API_KEY
  if (!key) {
    throw new Error('OPENAI_API_KEY is not set in environment variables')
  }
  return key
}

/**
 * Generate embedding for a single text using OpenAI API
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = getApiKey()

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small', // Cost-effective, fast, 1536 dimensions
      input: text,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return data.data[0].embedding
}

/**
 * Generate embeddings for multiple texts in batch using OpenAI API
 * OpenAI supports up to 2048 inputs per request, but we'll use smaller batches for reliability
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const apiKey = getApiKey()

  const embeddings: number[][] = []
  const batchSize = 100 // OpenAI supports up to 2048, but 100 is safer

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize)
    
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: batch,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI API error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    const batchEmbeddings = data.data.map((item: any) => item.embedding)
    embeddings.push(...batchEmbeddings)

    // Small delay to respect rate limits
    if (i + batchSize < texts.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  return embeddings
}

