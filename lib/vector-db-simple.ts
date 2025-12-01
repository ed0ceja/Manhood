/**
 * Simple file-based vector database using SQLite
 * This is a lightweight alternative to ChromaDB that doesn't require a server
 */

import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import os from 'os'

// In Vercel, use /tmp (writable), otherwise use local chroma_db
const isVercel = process.env.VERCEL === '1'
const DB_DIR = isVercel ? path.join(os.tmpdir(), 'chroma_db') : path.join(process.cwd(), 'chroma_db')
const DB_PATH = path.join(DB_DIR, 'vectors.db')
const COLLECTION_NAME = 'manhood_book'

// URL to download database from (set via VECTOR_DB_URL env var)
const VECTOR_DB_URL = process.env.VECTOR_DB_URL || 'https://github.com/ed0ceja/Manhood/releases/download/v1.0.0/vectors.db'

let db: Database.Database | null = null
let dbDownloadPromise: Promise<void> | null = null

/**
 * Download database from GitHub Releases if it doesn't exist
 * This only runs in production (Vercel) when the file is missing
 */
async function ensureDatabaseExists(): Promise<void> {
  // If database already exists, we're good
  if (fs.existsSync(DB_PATH)) {
    return
  }

  // Only download in production (Vercel), not in local development
  if (!isVercel) {
    console.warn('Database not found locally. Run: npm run process-pdf')
    return
  }

  // Prevent multiple simultaneous downloads
  if (dbDownloadPromise) {
    return dbDownloadPromise
  }

  dbDownloadPromise = (async () => {
    try {
      console.log('📥 Downloading vector database from GitHub Releases...')

      // Ensure directory exists
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true })
      }

      // Download the database file
      const response = await fetch(VECTOR_DB_URL)
      if (!response.ok) {
        throw new Error(`Failed to download database: ${response.status} ${response.statusText}`)
      }

      const buffer = await response.arrayBuffer()
      fs.writeFileSync(DB_PATH, Buffer.from(buffer))

      console.log('✅ Vector database downloaded successfully')
    } catch (error) {
      console.error('❌ Error downloading vector database:', error)
      throw error
    } finally {
      dbDownloadPromise = null
    }
  })()

  return dbDownloadPromise
}

/**
 * Initialize the database
 * Now async because it might need to download the database first
 */
async function getDB(): Promise<Database.Database> {
  if (!db) {
    // Ensure database file exists (download if needed in production)
    await ensureDatabaseExists()

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
  const database = await getDB()
  const insert = database.prepare(`
    INSERT OR REPLACE INTO vectors (id, text, embedding, metadata)
    VALUES (?, ?, ?, ?)
  `)

  const transaction = database.transaction((items: Array<{ id: string, text: string, embedding: string, metadata: string }>) => {
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
  const database = await getDB()

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
    const database = await getDB()
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
    const database = await getDB()
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
      const database = await getDB()
      const result = database.prepare('SELECT COUNT(*) as count FROM vectors').get() as { count: number }
      return result.count
    },
  }
}

