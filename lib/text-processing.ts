/**
 * Text processing utilities for chunking and cleaning text
 */

export interface TextChunk {
  text: string
  metadata: {
    chunkIndex: number
    startChar?: number
    endChar?: number
    pageNumber?: number
  }
}

/**
 * Chunks text into smaller pieces with overlap for better context retention
 */
export function chunkText(
  text: string,
  chunkSize: number = 1000,
  overlap: number = 200
): TextChunk[] {
  const chunks: TextChunk[] = []
  let startIndex = 0
  let chunkIndex = 0

  while (startIndex < text.length) {
    const endIndex = Math.min(startIndex + chunkSize, text.length)
    const chunkText = text.slice(startIndex, endIndex)

    // Only add non-empty chunks
    if (chunkText.trim().length > 0) {
      chunks.push({
        text: chunkText.trim(),
        metadata: {
          chunkIndex,
          startChar: startIndex,
          endChar: endIndex,
        },
      })
      chunkIndex++
    }

    // Move start index forward, accounting for overlap
    startIndex = endIndex - overlap

    // Prevent infinite loop if overlap is too large
    if (startIndex <= startIndex - overlap) {
      startIndex = endIndex
    }
  }

  return chunks
}

/**
 * Cleans extracted text from PDF
 */
export function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
    .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newline
    .trim()
}

/**
 * Splits text into sentences for better chunking
 */
export function splitIntoSentences(text: string): string[] {
  // Simple sentence splitting - can be improved with NLP libraries
  return text
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => sentence.trim().length > 0)
}

