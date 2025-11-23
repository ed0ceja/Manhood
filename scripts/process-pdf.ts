/**
 * Script to process PDF and populate vector database
 * Run with: npx tsx scripts/process-pdf.ts <path-to-pdf>
 */

import dotenv from 'dotenv'
import path from 'path'

// Load .env.local file
dotenv.config({ path: path.join(process.cwd(), '.env.local') })
import fs from 'fs'
import path from 'path'
import { cleanText } from '../lib/text-processing'
import { generateEmbeddings } from '../lib/embeddings'
import { addDocuments, getCollection, clearCollection } from '../lib/vector-db-simple'

// Use require for CommonJS module - pdf-parse v2.x exports PDFParse class
const { PDFParse } = require('pdf-parse')

async function processPDF(pdfPath: string) {
  console.log('📖 Processing PDF:', pdfPath)

  // Check for API key
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not found in environment variables')
    console.error('   Make sure you have a .env.local file with OPENAI_API_KEY=your_key')
    process.exit(1)
  }

  // Read PDF file
  const dataBuffer = fs.readFileSync(pdfPath)
  
  // Use PDFParse class to parse the PDF
  const parser = new PDFParse({ data: dataBuffer })
  const pdfData = await parser.getText()

  console.log(`📄 Extracted ${pdfData.total} pages`)
  console.log(`📝 Text length: ${pdfData.text.length} characters`)

  // Clean the text
  const cleanedText = cleanText(pdfData.text)
  console.log('✨ Text cleaned')

  // Clear existing collection first
  console.log('🗑️  Clearing existing documents...')
  await clearCollection()

  // Process chunks incrementally to avoid memory issues
  console.log('📦 Chunking and processing text...')
  const chunkSize = 2000
  const overlap = 400
  let startIndex = 0
  let chunkIndex = 0
  let batch: Array<{ text: string; metadata: any }> = []
  const batchSize = 50

  async function processBatch(batchToProcess: Array<{ text: string; metadata: any }>, batchNum: number) {
    const totalBatches = Math.ceil((cleanedText.length / (chunkSize - overlap)) / batchSize)
    console.log(`  Processing batch ${batchNum} (${batchToProcess.length} chunks)...`)
    
    const texts = batchToProcess.map((chunk) => chunk.text)
    const metadatas = batchToProcess.map((chunk) => ({
      chunkIndex: chunk.metadata.chunkIndex,
      startChar: chunk.metadata.startChar,
      endChar: chunk.metadata.endChar,
    }))
    const ids = batchToProcess.map((chunk) => `chunk_${chunk.metadata.chunkIndex}`)
    
    const embeddings = await generateEmbeddings(texts)
    await addDocuments(texts, embeddings, metadatas, ids)
  }

  while (startIndex < cleanedText.length) {
    const endIndex = Math.min(startIndex + chunkSize, cleanedText.length)
    const chunkText = cleanedText.slice(startIndex, endIndex).trim()
    
    if (chunkText.length > 0) {
      batch.push({
        text: chunkText,
        metadata: {
          chunkIndex,
          startChar: startIndex,
          endChar: endIndex,
        },
      })
      chunkIndex++

      // Process batch when it reaches the desired size
      if (batch.length >= batchSize) {
        const batchNum = Math.floor(chunkIndex / batchSize)
        await processBatch(batch, batchNum)
        batch = [] // Clear the batch
      }
    }
    
    // Move start index forward with overlap
    const newStartIndex = endIndex - overlap
    if (newStartIndex > startIndex) {
      startIndex = newStartIndex
    } else {
      startIndex = endIndex
    }
  }
  
  // Process remaining chunks
  if (batch.length > 0) {
    const batchNum = Math.floor(chunkIndex / batchSize) + 1
    await processBatch(batch, batchNum)
  }
  
  console.log(`📦 Created ${chunkIndex} total chunks`)

  const collection = await getCollection()
  const count = await collection.count()
  console.log(`✅ Successfully added ${count} documents to vector database!`)
  console.log('🎉 PDF processing complete!')
}

// Main execution
const pdfPath = process.argv[2]

if (!pdfPath) {
  console.error('❌ Please provide a PDF path')
  console.log('Usage: npx tsx scripts/process-pdf.ts <path-to-pdf>')
  process.exit(1)
}

if (!fs.existsSync(pdfPath)) {
  console.error(`❌ PDF file not found: ${pdfPath}`)
  process.exit(1)
}

processPDF(pdfPath).catch((error) => {
  console.error('❌ Error processing PDF:', error)
  process.exit(1)
})
