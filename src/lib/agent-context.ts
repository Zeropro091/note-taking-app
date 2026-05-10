import { getAllNotes } from './file-system';
import { buildGraph } from './graph';
import type { Note, GraphData } from '@/types/notes';

interface AgentContext {
  notes: Array<{
    id: string;
    title: string;
    tags: string[];
    summary: string; // First 200 chars
    updatedAt: string;
  }>;
  taxonomy: string[];
  graph: GraphData;
}

/**
 * Generate a condensed context for AI agents
 */
export async function getAgentContext(): Promise<AgentContext> {
  const notes = await getAllNotes();
  const graph = buildGraph(notes);
  
  const taxonomy = Array.from(new Set(notes.flatMap(n => n.tags)));
  
  // Background sync for embeddings if they don't exist
  import('./vector-store').then(({ syncAllEmbeddings }) => {
    syncAllEmbeddings(notes).catch(err => console.error('Background sync failed:', err));
  });
  
  return {
    notes: notes.map(n => ({
      id: n.id,
      title: n.title,
      tags: n.tags,
      summary: n.content.slice(0, 200) + (n.content.length > 200 ? '...' : ''),
      updatedAt: n.updatedAt.toISOString()
    })),
    taxonomy,
    graph
  };
}
