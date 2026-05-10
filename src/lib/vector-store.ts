import fs from 'fs/promises';
import path from 'path';
import { generateEmbedding, cosineSimilarity } from './gemini';
import type { Note, SearchResult } from '@/types/notes';
import { generateSnippet } from './markdown';

const EMBEDDINGS_FILE = path.join(process.cwd(), 'data', 'embeddings.json');

interface EmbeddingData {
  [noteId: string]: {
    embedding: number[];
    updatedAt: string;
    hash: string; // To check if content changed
  };
}

/**
 * Simple hash function for content comparison
 */
function hashContent(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
}

/**
 * Load embeddings from file
 */
async function loadEmbeddings(): Promise<EmbeddingData> {
  try {
    const data = await fs.readFile(EMBEDDINGS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

/**
 * Save embeddings to file
 */
async function saveEmbeddings(data: EmbeddingData): Promise<void> {
  const dir = path.dirname(EMBEDDINGS_FILE);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
  await fs.writeFile(EMBEDDINGS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Update embedding for a single note if needed
 */
export async function updateNoteEmbedding(note: Note): Promise<void> {
  const embeddings = await loadEmbeddings();
  const currentHash = hashContent(note.content);
  
  // Only update if content changed or embedding doesn't exist
  if (!embeddings[note.id] || embeddings[note.id].hash !== currentHash) {
    console.log(`Generating embedding for note: ${note.id}`);
    const textToEmbed = `${note.title}\n${note.tags.join(' ')}\n${note.content}`;
    const embedding = await generateEmbedding(textToEmbed);
    
    embeddings[note.id] = {
      embedding,
      updatedAt: new Date().toISOString(),
      hash: currentHash
    };
    
    await saveEmbeddings(embeddings);
  }
}

/**
 * Perform semantic search across all notes
 */
export async function semanticSearch(
  query: string,
  notes: Note[],
  limit = 10
): Promise<SearchResult[]> {
  const queryEmbedding = await generateEmbedding(query);
  const embeddings = await loadEmbeddings();
  
  const results: SearchResult[] = [];
  
  for (const note of notes) {
    const data = embeddings[note.id];
    if (data) {
      const score = cosineSimilarity(queryEmbedding, data.embedding);
      
      // Only include results with some similarity
      if (score > 0.6) {
        results.push({
          note,
          score,
          snippet: generateSnippet(note.content, query),
          matches: [] // We don't have specific keyword matches in semantic search
        });
      }
    }
  }
  
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Sync embeddings for all notes (useful for initialization)
 */
export async function syncAllEmbeddings(notes: Note[]): Promise<void> {
  for (const note of notes) {
    await updateNoteEmbedding(note);
  }
}
