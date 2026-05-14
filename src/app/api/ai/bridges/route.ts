// src/app/api/ai/bridges/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAllNotes } from '@/lib/file-system';
import { semanticSearch } from '@/lib/vector-store';
import { extractWikilinks } from '@/lib/markdown';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { id, content } = await request.json();
    const notes = await getAllNotes();
    
    // 1. Get semantic matches
    const semanticResults = await semanticSearch(content, notes, 10);
    
    // 2. Extract existing links to filter them out
    const existingLinks = new Set(extractWikilinks(content).map(l => l.target));
    
    // 3. Filter results: exclude self, score > 0.8, and not already linked
    const bridges = semanticResults
      .filter(res => 
        res.note.id !== id && 
        res.score > 0.8 && 
        !existingLinks.has(res.note.id) &&
        !existingLinks.has(res.note.title)
      )
      .slice(0, 5)
      .map(res => ({
        id: res.note.id,
        title: res.note.title,
        excerpt: res.snippet,
        score: res.score
      }));

    return NextResponse.json({ success: true, bridges });
  } catch (error) {
    console.error('Bridges API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to discover bridges' }, { status: 500 });
  }
}
