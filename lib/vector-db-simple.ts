/**
 * Vector database using Supabase pgvector
 * Replaces the SQLite-based implementation to avoid memory issues on Vercel
 */

import { createClient } from '@supabase/supabase-js'

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
  }
  return createClient(url, key)
}

/**
 * Add documents to the vector database
 */
export async function addDocuments(
  texts: string[],
  embeddings: number[][],
  metadatas: Array<Record<string, any>>,
  ids?: string[]
): Promise<void> {
  const supabase = getSupabaseClient()

  const rows = texts.map((text, index) => ({
    id: ids?.[index] || `chunk_${index}`,
    text,
    embedding: embeddings[index],
    metadata: metadatas[index] || {},
  }))

  const { error } = await supabase.from('vectors').upsert(rows)
  if (error) throw new Error(`Supabase insert error: ${error.message}`)
}

/**
 * Query the vector database for similar documents
 */
export async function querySimilar(
  queryEmbedding: number[],
  nResults: number = 5
): Promise<Array<{ text: string; metadata: Record<string, any>; distance: number }>> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: queryEmbedding,
    match_count: nResults,
    match_threshold: 0.3,
  })

  if (error) throw new Error(`Supabase query error: ${error.message}`)

  return (data || []).map((row: any) => ({
    text: row.text,
    metadata: row.metadata || {},
    distance: 1 - row.similarity,
  }))
}

/**
 * Check if collection has any documents
 */
export async function hasDocuments(): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()
    const { count, error } = await supabase
      .from('vectors')
      .select('*', { count: 'exact', head: true })
    if (error) return false
    return (count ?? 0) > 0
  } catch {
    return false
  }
}

/**
 * Clear all documents from the collection
 */
export async function clearCollection(): Promise<void> {
  const supabase = getSupabaseClient()
  const { error } = await supabase.from('vectors').delete().neq('id', '')
  if (error) throw new Error(`Supabase clear error: ${error.message}`)
}

/**
 * Get collection (for compatibility with existing code)
 */
export async function getCollection(): Promise<any> {
  return {
    count: async () => {
      const supabase = getSupabaseClient()
      const { count } = await supabase
        .from('vectors')
        .select('*', { count: 'exact', head: true })
      return count ?? 0
    },
  }
}
