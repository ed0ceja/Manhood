/**
 * Simple file-based vector database using SQLite
 * This is a lightweight alternative to ChromaDB that doesn't require a server
 */

import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DB_PATH = path.join(process.cwd(), 'chroma_db', 'vectors.db')
const COLLECTION_NAME = 'manhood_book'

let db: Database.Database | null = null

/**
 * Initialize the database
 */
function getDB(): Database.Database {
  if (!db) {
    // Ensure directory exists
    const dbDir = path.dirname(DB_PATH)
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
    }

    db = new Database(DB_PATH)
    
    // Create tables if they don't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS vectors (
        id TEXT PRIMARY KEY,
        text TEXT NOT NULL,
        embedding TEXT NOT NULL,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_created_at ON vectors(created_at);
    `)
  }
  return db
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0
  
  let dotProduct = 0
  let normA = 0
  let normB = 0
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
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
  const database = getDB()
  const insert = database.prepare(`
    INSERT OR REPLACE INTO vectors (id, text, embedding, metadata)
    VALUES (?, ?, ?, ?)
  `)
  
  const transaction = database.transaction((items: Array<{id: string, text: string, embedding: string, metadata: string}>) => {
    for (const item of items) {
      insert.run(item.id, item.text, item.embedding, item.metadata)
    }
  })
  
  const items = texts.map((text, index) => ({
    id: ids?.[index] || `chunk_${index}`,
    text,
    embedding: JSON.stringify(embeddings[index]),
    metadata: JSON.stringify(metadatas[index] || {}),
  }))
  
  transaction(items)
}

/**
 * Query the vector database for similar documents
 */
export async function querySimilar(
  queryEmbedding: number[],
  nResults: number = 5
): Promise<Array<{ text: string; metadata: Record<string, any>; distance: number }>> {
  const database = getDB()
  
  // Get all vectors
  const rows = database.prepare('SELECT id, text, embedding, metadata FROM vectors').all() as Array<{
    id: string
    text: string
    embedding: string
    metadata: string
  }>
  
  // Calculate similarities
  const results = rows.map(row => {
    const embedding = JSON.parse(row.embedding) as number[]
    const similarity = cosineSimilarity(queryEmbedding, embedding)
    const distance = 1 - similarity // Convert similarity to distance
    
    return {
      text: row.text,
      metadata: JSON.parse(row.metadata || '{}'),
      distance,
      similarity,
    }
  })
  
  // Sort by similarity (highest first) and take top nResults
  results.sort((a, b) => b.similarity - a.similarity)
  
  return results.slice(0, nResults).map(({ similarity, ...rest }) => rest)
}

/**
 * Check if collection has any documents
 */
export async function hasDocuments(): Promise<boolean> {
  try {
    const database = getDB()
    const count = database.prepare('SELECT COUNT(*) as count FROM vectors').get() as { count: number }
    return count.count > 0
  } catch (error) {
    return false
  }
}

/**
 * Clear all documents from the collection
 */
export async function clearCollection(): Promise<void> {
  try {
    const database = getDB()
    database.prepare('DELETE FROM vectors').run()
  } catch (error) {
    console.error('Error clearing collection:', error)
  }
}

/**
 * Get collection (for compatibility with existing code)
 */
export async function getCollection(): Promise<any> {
  return {
    count: async () => {
      const database = getDB()
      const result = database.prepare('SELECT COUNT(*) as count FROM vectors').get() as { count: number }
      return result.count
    },
  }
}

