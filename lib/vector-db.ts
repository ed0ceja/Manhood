/**
 * ChromaDB vector database operations
 */

import { ChromaClient } from 'chromadb'
import type { Collection } from 'chromadb'

const COLLECTION_NAME = 'manhood_book'

let client: ChromaClient | null = null
let collection: Collection | null = null

/**
 * Get or create ChromaDB client
 * ChromaDB v3+ requires a server for local storage, or we can use in-memory mode
 */
function getClient(): ChromaClient {
  if (!client) {
    // For local development, ChromaDB v3+ can work in-memory or with a local server
    // We'll use the default client which tries to connect to localhost:8000
    // If that fails, we'll need to start a ChromaDB server or use in-memory mode
    try {
      // Try connecting to local ChromaDB server (if running)
      client = new ChromaClient({
        path: 'http://localhost:8000',
      })
    } catch (error) {
      // Fallback: use in-memory client (data won't persist)
      // For production, you'd want to run ChromaDB server
      console.warn('⚠️  ChromaDB server not found. Using in-memory mode (data will not persist).')
      console.warn('   To persist data, start ChromaDB server: docker run -p 8000:8000 chromadb/chroma')
      client = new ChromaClient()
    }
  }
  return client
}

/**
 * Get or create the collection
 * Note: We provide our own embeddings, so we don't need an embedding function
 */
export async function getCollection(): Promise<Collection> {
  if (!collection) {
    const client = getClient()
    
    try {
      // Try to get existing collection
      collection = await client.getCollection({
        name: COLLECTION_NAME,
      })
    } catch (error: any) {
      // Collection doesn't exist, create it
      // We provide embeddings ourselves, so we don't need an embedding function
      try {
        collection = await client.createCollection({
          name: COLLECTION_NAME,
          metadata: {
            description: 'Embeddings for Manhood by Steve Biddulph',
          },
        })
      } catch (createError: any) {
        // If creation fails, it might be because collection already exists
        // Try getting it again
        try {
          collection = await client.getCollection({
            name: COLLECTION_NAME,
          })
        } catch (finalError) {
          throw new Error(`Failed to get or create collection: ${finalError}`)
        }
      }
    }
  }
  return collection
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
  const collection = await getCollection()
  
  const documentIds = ids || texts.map((_, index) => `chunk_${index}`)

  await collection.add({
    ids: documentIds,
    embeddings: embeddings,
    documents: texts,
    metadatas: metadatas,
  })
}

/**
 * Query the vector database for similar documents
 */
export async function querySimilar(
  queryEmbedding: number[],
  nResults: number = 5
): Promise<Array<{ text: string; metadata: Record<string, any>; distance: number }>> {
  const collection = await getCollection()

  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults,
  })

  if (!results.documents || !results.documents[0]) {
    return []
  }

  return results.documents[0].map((text, index) => ({
    text: text || '',
    metadata: results.metadatas?.[0]?.[index] || {},
    distance: results.distances?.[0]?.[index] || 0,
  }))
}

/**
 * Check if collection has any documents
 */
export async function hasDocuments(): Promise<boolean> {
  try {
    const collection = await getCollection()
    const count = await collection.count()
    return count > 0
  } catch (error) {
    return false
  }
}

/**
 * Clear all documents from the collection
 */
export async function clearCollection(): Promise<void> {
  try {
    const collection = await getCollection()
    await collection.delete({
      where: {},
    })
  } catch (error) {
    console.error('Error clearing collection:', error)
  }
}
