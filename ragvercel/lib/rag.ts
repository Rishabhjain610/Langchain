import { embed, embedMany } from "ai";
import { ollama } from "ollama-ai-provider-v2";
import fs from "fs/promises";
import path from "path";

export interface Document {
  id: string;
  name: string;
  content: string;
  createdAt: string;
  size: number;
}

export interface Chunk {
  id: string;
  documentId: string;
  documentName: string;
  content: string;
  embedding: number[];
}

export interface DatabaseSchema {
  documents: Document[];
  chunks: Chunk[];
}

const DB_PATH = path.join(process.cwd(), "lib", "rag-db.json");
const embeddingModel = ollama.textEmbeddingModel("nomic-embed-text");

// Cosine similarity between two vectors
export function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let mA = 0;
  let mB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    mA += a[i] * a[i];
    mB += b[i] * b[i];
  }
  if (mA === 0 || mB === 0) return 0;
  return dotProduct / (Math.sqrt(mA) * Math.sqrt(mB));
}

// Simple sliding-window character chunking
export function chunkText(text: string, chunkSize = 600, overlap = 100): string[] {
  const chunks: string[] = [];
  let start = 0;
  const cleanText = text.replace(/\r\n/g, "\n");

  while (start < cleanText.length) {
    let end = start + chunkSize;

    if (end >= cleanText.length) {
      chunks.push(cleanText.substring(start));
      break;
    }

    // Try to find natural breaks near the target end
    let nextBoundary = cleanText.indexOf("\n\n", end - 100);
    if (nextBoundary !== -1 && nextBoundary < end + 100) {
      end = nextBoundary + 2;
    } else {
      nextBoundary = cleanText.indexOf("\n", end - 50);
      if (nextBoundary !== -1 && nextBoundary < end + 50) {
        end = nextBoundary + 1;
      } else {
        nextBoundary = cleanText.indexOf(". ", end - 30);
        if (nextBoundary !== -1 && nextBoundary < end + 30) {
          end = nextBoundary + 2;
        } else {
          const spaceBoundary = cleanText.lastIndexOf(" ", end);
          if (spaceBoundary > start) {
            end = spaceBoundary + 1;
          }
        }
      }
    }

    chunks.push(cleanText.substring(start, end).trim());
    start = end - overlap;
    if (start < 0) start = 0;
    if (start >= end) {
      start = end; // prevent infinite loops
    }
  }

  return chunks.filter((c) => c.length > 5);
}

// Load database
export async function loadDb(): Promise<DatabaseSchema> {
  try {
    const data = await fs.readFile(DB_PATH, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return empty DB structure
    return { documents: [], chunks: [] };
  }
}

// Save database
export async function saveDb(db: DatabaseSchema): Promise<void> {
  // Ensure the directory exists
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

// Add a document (chunk and embed it)
export async function addDocument(name: string, content: string): Promise<Document> {
  const db = await loadDb();
  
  // Generate random id
  const docId = Math.random().toString(36).substring(2, 11);
  const newDoc: Document = {
    id: docId,
    name,
    content,
    createdAt: new Date().toISOString(),
    size: Buffer.byteLength(content, "utf-8"),
  };

  const chunks = chunkText(content);
  if (chunks.length > 0) {
    // Generate embeddings
    const { embeddings } = await embedMany({
      model: embeddingModel,
      values: chunks,
    });

    const newChunks: Chunk[] = chunks.map((chunkText, idx) => ({
      id: `${docId}-chunk-${idx}`,
      documentId: docId,
      documentName: name,
      content: chunkText,
      embedding: embeddings[idx],
    }));

    db.chunks.push(...newChunks);
  }

  db.documents.push(newDoc);
  await saveDb(db);
  return newDoc;
}

// Delete a document and its chunks
export async function deleteDocument(docId: string): Promise<void> {
  const db = await loadDb();
  db.documents = db.documents.filter((d) => d.id !== docId);
  db.chunks = db.chunks.filter((c) => c.documentId !== docId);
  await saveDb(db);
}

// Retrieve relevant chunks for a query
export async function retrieveContext(
  query: string,
  topK = 4
): Promise<{ content: string; source: string; similarity: number }[]> {
  const db = await loadDb();
  if (db.chunks.length === 0) {
    return [];
  }

  // Generate query embedding
  const { embedding: queryEmbedding } = await embed({
    model: embeddingModel,
    value: query,
  });

  // Calculate similarity for all chunks
  const scores = db.chunks.map((chunk) => {
    const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);
    return {
      content: chunk.content,
      source: chunk.documentName,
      similarity,
    };
  });

  // Sort and select top K
  scores.sort((a, b) => b.similarity - a.similarity);
  return scores.slice(0, topK);
}
