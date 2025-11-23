# Manhood - AI Chatbot with RAG

A Next.js application featuring an AI chatbot trained on "Manhood" by Steve Biddulph using Retrieval Augmented Generation (RAG). The system uses local embeddings and vector database for a completely free, open-source solution.

## Features

- 📖 **PDF Processing**: Extract and process text from PDF files
- 🤖 **AI Chatbot**: Chat interface powered by OpenAI GPT-4o-mini
- 🔍 **RAG System**: Retrieval Augmented Generation for accurate, context-aware responses
- 💾 **Local Vector Database**: ChromaDB for storing embeddings locally
- 🆓 **Free Embeddings**: Uses @xenova/transformers for local embedding generation

## Tech Stack

- **Next.js 16** - React framework
- **Vercel AI SDK** - AI integration
- **ChromaDB** - Local vector database
- **@xenova/transformers** - Local embedding generation
- **OpenAI API** - LLM for chat responses
- **pdf-parse** - PDF text extraction

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

Get your OpenAI API key from [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)

### 3. Process Your PDF

Place your PDF file in the project directory (or provide the full path), then run:

```bash
npm run process-pdf path/to/your/book.pdf
```

For example:
```bash
npm run process-pdf ./Manhood.pdf
```

This will:
- Extract text from the PDF
- Chunk the text into manageable pieces
- Generate embeddings using local transformers
- Store everything in ChromaDB

**Note**: The first time you run this, it will download the embedding model (~90MB), which may take a few minutes.

### 4. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Chat with the Bot

Navigate to the dashboard and start chatting! The bot will use the book content to answer your questions.

## Project Structure

```
my-app/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # Chat API with RAG
│   ├── dashboard/
│   │   └── page.tsx               # Dashboard page
│   └── page.tsx                   # Landing page
├── components/
│   └── bot-tab.tsx                # Chat UI component
├── lib/
│   ├── embeddings.ts             # Embedding generation
│   ├── text-processing.ts         # Text chunking utilities
│   └── vector-db.ts               # ChromaDB operations
├── scripts/
│   └── process-pdf.ts             # PDF processing script
└── chroma_db/                     # ChromaDB storage (created automatically)
```

## How It Works

1. **PDF Processing**: The `process-pdf.ts` script extracts text from your PDF
2. **Text Chunking**: Text is split into chunks of ~1000 characters with 200 character overlap
3. **Embedding Generation**: Each chunk is converted to a vector embedding using a local model
4. **Vector Storage**: Embeddings are stored in ChromaDB with metadata
5. **Query Processing**: When a user asks a question:
   - The question is converted to an embedding
   - Similar chunks are retrieved from the database
   - Relevant context is included in the LLM prompt
   - The AI generates a response based on the book content

## Re-processing the PDF

If you want to update the book content, simply run the process-pdf script again. It will automatically clear the old data and add the new content.

## Troubleshooting

### ChromaDB Connection Issues
If you encounter ChromaDB connection errors, try deleting the `chroma_db` folder and re-running the PDF processing script.

### Embedding Model Download
The first time you process a PDF, the embedding model will be downloaded. This is a one-time download (~90MB) and may take a few minutes depending on your internet connection.

### OpenAI API Errors
Make sure your `OPENAI_API_KEY` is set correctly in `.env.local`. The API key should start with `sk-`.

## Production Deployment

For production deployment:

1. Make sure to set `OPENAI_API_KEY` in your deployment environment variables
2. Process the PDF before deployment (or include the `chroma_db` folder in your deployment)
3. The embedding model will be cached, so subsequent deployments will be faster

## License

This project is open source and available for personal and commercial use.
