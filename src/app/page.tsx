'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import type { Note, FileNode, GraphData, Backlink } from '@/types/notes';
import {
  Menu,
  Search,
  GitGraph,
  PanelRight,
  Plus,
  Terminal as TerminalIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';

const NoteEditor = dynamic(() => import('@/components/editor/NoteEditor'), { ssr: false });
const FileTree = dynamic(() => import('@/components/sidebar/FileTree'), { ssr: false });
const NoteGroups = dynamic(() => import('@/components/sidebar/NoteGroups'), { ssr: false });
const QuickSwitcher = dynamic(() => import('@/components/sidebar/QuickSwitcher'), { ssr: false });
const GraphView = dynamic(() => import('@/components/graph/GraphView'), { ssr: false });
const BacklinksPanel = dynamic(() => import('@/components/panels/BacklinksPanel'), { ssr: false });
const OutlinePanel = dynamic(() => import('@/components/panels/OutlinePanel'), { ssr: false });
const TagsPanel = dynamic(() => import('@/components/panels/TagsPanel'), { ssr: false });
const BridgesPanel = dynamic(() => import('@/components/panels/BridgesPanel'), { ssr: false });
const Terminal = dynamic(() => import('@/components/Terminal'), { ssr: false });

// Import useQuickSwitcher from the QuickSwitcher component
import { useQuickSwitcher } from '@/components/sidebar/QuickSwitcher';
import type { Bridge } from '@/types/notes';

function getTabClassName(active: boolean) {
  return cn(
    'flex-1 px-3 py-2 text-[10px] font-bold uppercase tracking-widest transition-all duration-200',
    active 
      ? 'text-editorial-accent border-b-2 border-editorial-accent' 
      : 'text-editorial-ink/40 hover:text-editorial-ink/60'
  );
}

export default function Home() {
  const router = useRouter();
  const params = useParams();
  const noteId = params?.id as string | undefined;

  const [notes, setNotes] = useState<Note[]>([]);
  const [graph, setGraph] = useState<GraphData>({ nodes: [], edges: [] });
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [backlinks, setBacklinks] = useState<Backlink[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [bridges, setBridges] = useState<Bridge[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'files' | 'groups'>('files');
  const [activeRightTab, setActiveRightTab] = useState<'backlinks' | 'outline' | 'tags'>('backlinks');
  const [showGraph, setShowGraph] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const quickSwitcher = useQuickSwitcher();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [notesRes, graphRes] = await Promise.all([
        fetch('/api/notes'),
        fetch('/api/graph')
      ]);
      
      if (!notesRes.ok || !graphRes.ok) {
        throw new Error('Failed to reach the archive. Check your connection.');
      }

      const [notesData, graphData] = await Promise.all([
        notesRes.json(),
        graphRes.json()
      ]);

      if (notesData.success) {
        setNotes(notesData.notes);
      } else {
        throw new Error(notesData.error || 'Failed to sync archive entries.');
      }

      if (graphData.success) {
        setGraph(graphData.graph);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred during sync.';
      setError(message);
      console.error('Archive Sync Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fileTree = useMemo(() => {
    const tree: FileNode[] = [];
    const folders = new Map<string, FileNode>();

    for (const note of notes) {
      const pathParts = note.path.split(/[\/\\]/);
      let currentLevel = tree;
      let currentPath = '';

      for (let i = 0; i < pathParts.length - 1; i++) {
        const folderName = pathParts[i];
        currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;

        if (!folders.has(currentPath)) {
          const folderNode: FileNode = {
            name: folderName,
            path: currentPath,
            type: 'folder',
            children: [],
          };
          folders.set(currentPath, folderNode);
          currentLevel.push(folderNode);
        }

        const folder = folders.get(currentPath)!;
        currentLevel = folder.children!;
      }

      currentLevel.push({
        name: pathParts[pathParts.length - 1],
        path: note.path,
        type: 'file',
      });
    }

    return tree;
  }, [notes]);

  const loadCurrentNote = useCallback(async () => {
    if (!noteId) {
      setCurrentNote(null);
      setBacklinks([]);
      return;
    }

    try {
      const [noteRes, backlinksRes] = await Promise.all([
        fetch(`/api/notes/${noteId}`),
        fetch(`/api/backlinks/${noteId}`)
      ]);
      
      if (!noteRes.ok || !backlinksRes.ok) {
        throw new Error('Entry not found or inaccessible.');
      }

      const [noteData, backlinksData] = await Promise.all([
        noteRes.json(),
        backlinksRes.json()
      ]);

      if (noteData.success) {
        setCurrentNote(noteData.note);
      } else {
        setCurrentNote(null);
        setError(noteData.error || 'The requested entry could not be retrieved.');
      }

      if (backlinksData.success) {
        setBacklinks(backlinksData.backlinks);
      } else {
        setBacklinks([]);
      }
    } catch (err) {
      setCurrentNote(null);
      setBacklinks([]);
      setError(err instanceof Error ? err.message : 'Communication error.');
    }
  }, [noteId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadCurrentNote();
  }, [loadCurrentNote]);

  const handleNoteSelect = useCallback((path: string) => {
    const id = path.replace(/\.md$/, '');
    router.push(`/${id}`);
  }, [router]);

  const handleSave = useCallback(async (content: string) => {
    if (!currentNote) return;

    try {
      const res = await fetch(`/api/notes/${currentNote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          frontmatter: currentNote.frontmatter,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCurrentNote(data.note);
        await loadData();
      }
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  }, [currentNote, loadData]);

  const handleNoteCreate = useCallback(async (path: string, title: string) => {
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, title }),
      });

      const data = await res.json();
      if (data.success) {
        await loadData();
        handleNoteSelect(data.note.id);
      }
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  }, [loadData, handleNoteSelect]);

  const handleNoteDelete = useCallback(async (path: string) => {
    try {
      const id = path.replace(/\.md$/, '');
      await fetch(`/api/notes/${id}`, { method: 'DELETE' });
      await loadData();
      if (noteId === id) {
        router.push('/');
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  }, [loadData, noteId, router]);

  const handleNoteRename = useCallback(async (oldPath: string, newPath: string) => {
    try {
      const oldId = oldPath.replace(/\.md$/, '');
      const newId = newPath.replace(/\.md$/, '');

      const res = await fetch(`/api/notes/${oldId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newId }),
      });

      const data = await res.json();
      if (data.success) {
        await loadData();
        if (noteId === oldId) {
          router.push(`/${newId}`);
        }
      }
    } catch (error) {
      console.error('Failed to rename note:', error);
    }
  }, [loadData, noteId, router]);

  const handleGraphNodeClick = useCallback((nodeId: string) => {
    router.push(`/${nodeId}`);
    setShowGraph(false);
  }, [router]);

  const handleQuickSwitcherSelect = useCallback((selectedNoteId: string) => {
    router.push(`/${selectedNoteId}`);
  }, [router]);

  const handleNewNote = useCallback(async () => {
    const title = 'Untitled';
    const id = `Untitled-${Date.now()}`;
    await handleNoteCreate(id, title);
  }, [handleNoteCreate]);

  const handleBridgeConnect = useCallback((bridge: Bridge) => {
    if (!currentNote) return;
    const newContent = `${currentNote.content}\n\n## Bridge: [[${bridge.title}]]\n${bridge.excerpt}`;
    handleSave(newContent);
  }, [currentNote, handleSave]);

  const filteredNotes = useMemo(() => 
    selectedTag
      ? notes.filter((n) => n.tags.includes(selectedTag))
      : notes,
    [notes, selectedTag]
  );

  return (
    <div className="h-screen flex flex-col bg-editorial-bg text-editorial-ink font-sans">
      <header className="h-16 border-b border-editorial-line flex items-center justify-between px-6 bg-editorial-bg relative">
        {/* Loading Progress Bar */}
        {isLoading && (
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            className="absolute bottom-0 left-0 h-[1px] bg-editorial-accent z-20"
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        
        <div className="flex items-center gap-6">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-editorial-ink/60 hover:text-editorial-ink transition-colors"
            title="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="font-display text-xl font-medium tracking-tight">
            {currentNote?.title || 'Knowledge Base'}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="flex items-center bg-editorial-ink/5 rounded-full px-3 py-1.5 gap-2 border border-editorial-line">
            <button
              onClick={() => setShowGraph(!showGraph)}
              className={cn("p-1 transition-colors", showGraph ? "text-editorial-accent" : "text-editorial-ink/40 hover:text-editorial-ink/60")}
              title="Toggle graph view"
            >
              <GitGraph className="w-4 h-4" />
            </button>
            <div className="w-px h-3 bg-editorial-line" />
            <button
              onClick={() => quickSwitcher.open()}
              className="p-1 text-editorial-ink/40 hover:text-editorial-ink/60 transition-colors"
              title="Quick switcher (⌘K)"
            >
              <Search className="w-4 h-4" />
            </button>
            <div className="w-px h-3 bg-editorial-line" />
            <button
              onClick={() => setTerminalOpen(!terminalOpen)}
              className={cn("p-1 transition-colors", terminalOpen ? "text-editorial-accent" : "text-editorial-ink/40 hover:text-editorial-ink/60")}
              title="Toggle terminal"
            >
              <TerminalIcon className="w-4 h-4" />
            </button>
            <div className="w-px h-3 bg-editorial-line" />
            <button
              onClick={() => setRightPanelOpen(!rightPanelOpen)}
              className={cn("p-1 transition-colors", rightPanelOpen ? "text-editorial-accent" : "text-editorial-ink/40 hover:text-editorial-ink/60")}
              title="Toggle right panel"
            >
              <PanelRight className="w-4 h-4" />
            </button>
          </div>
          
          <button
            onClick={handleNewNote}
            className="bg-editorial-accent text-editorial-bg px-4 py-1.5 text-sm font-medium hover:brightness-110 transition-all flex items-center gap-2"
            title="New note"
          >
            <Plus className="w-4 h-4" />
            Create
          </button>
        </div>
      </header>

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-editorial-accent text-editorial-bg px-6 py-2 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-between overflow-hidden"
          >
            <span>{error}</span>
            <button 
              onClick={() => {
                setError(null);
                loadData();
              }}
              className="border border-editorial-bg/30 px-3 py-1 hover:bg-editorial-bg hover:text-editorial-accent transition-colors"
            >
              Retry Sync
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex overflow-hidden">
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="border-r border-editorial-line bg-editorial-bg flex flex-col overflow-hidden"
            >
              {/* Sidebar Tabs */}
              <div className="flex items-center px-4 pt-4">
                <div className="flex flex-1 border-b border-editorial-line/40">
                  <button
                    onClick={() => setActiveSidebarTab('files')}
                    className={getTabClassName(activeSidebarTab === 'files')}
                  >
                    Archive
                  </button>
                  <button
                    onClick={() => setActiveSidebarTab('groups')}
                    className={getTabClassName(activeSidebarTab === 'groups')}
                  >
                    Index
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-auto py-2">
                {activeSidebarTab === 'files' ? (
                  <FileTree
                    tree={fileTree}
                    selectedId={noteId || null}
                    onNoteSelect={handleNoteSelect}
                    onNoteCreate={handleNoteCreate}
                    onNoteDelete={handleNoteDelete}
                    onNoteRename={handleNoteRename}
                  />
                ) : (
                  <NoteGroups
                    notes={notes}
                    selectedId={noteId || null}
                    onNoteSelect={handleNoteSelect}
                  />
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        <main className="flex-1 overflow-hidden relative bg-editorial-bg">
          <AnimatePresence mode="wait">
            {showGraph ? (
              <motion.div
                key="graph"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full w-full"
              >
                <GraphView
                  graph={graph}
                  onNodeClick={handleGraphNodeClick}
                  selectedNodeId={noteId}
                  notes={notes}
                />
              </motion.div>
            ) : currentNote ? (
              <motion.div
                key={currentNote.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full w-full"
              >
                <NoteEditor
                  noteId={currentNote.id}
                  initialContent={currentNote.content}
                  onSave={handleSave}
                  onBridgesUpdate={setBridges}
                />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex items-center justify-center p-12"
              >
                <div className="max-w-md text-center">
                  <div className="w-16 h-px bg-editorial-accent mx-auto mb-8" />
                  <h2 className="font-display text-3xl mb-4 italic">The blank page is a canvas for your thoughts.</h2>
                  <p className="text-editorial-ink/60 font-sans leading-relaxed mb-8">
                    Select an entry from your archive or begin a new draft to continue your journey.
                  </p>
                  <button 
                    onClick={handleNewNote}
                    className="border border-editorial-ink px-8 py-2 text-sm font-medium hover:bg-editorial-ink hover:text-editorial-bg transition-all"
                  >
                    Begin New Entry
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <AnimatePresence initial={false}>
          {rightPanelOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="border-l border-editorial-line bg-editorial-bg flex flex-col overflow-hidden"
            >
              <div className="flex items-center px-4 pt-4">
                <div className="flex flex-1 border-b border-editorial-line/40">
                  <button
                    onClick={() => setActiveRightTab('backlinks')}
                    className={getTabClassName(activeRightTab === 'backlinks')}
                  >
                    Context
                  </button>
                  <button
                    onClick={() => setActiveRightTab('outline')}
                    className={getTabClassName(activeRightTab === 'outline')}
                  >
                    Outline
                  </button>
                  <button
                    onClick={() => setActiveRightTab('tags')}
                    className={getTabClassName(activeRightTab === 'tags')}
                  >
                    Taxonomy
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto py-4">
                {activeRightTab === 'backlinks' && (
                  <div className="flex flex-col h-full">
                    <BacklinksPanel
                      backlinks={backlinks}
                      onNoteClick={handleNoteSelect}
                    />
                    <BridgesPanel 
                      bridges={bridges}
                      onNoteClick={handleNoteSelect}
                      onConnect={handleBridgeConnect}
                    />
                  </div>
                )}
                {activeRightTab === 'outline' && (
                  <OutlinePanel content={currentNote?.content || ''} />
                )}
                {activeRightTab === 'tags' && (
                  <TagsPanel
                    notes={notes}
                    selectedTag={selectedTag}
                    onTagSelect={setSelectedTag}
                  />
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
      <QuickSwitcher
        notes={filteredNotes}
        isOpen={quickSwitcher.isOpen}
        onClose={quickSwitcher.close}
        onSelect={handleQuickSwitcherSelect}
      />
      <Terminal
        isOpen={terminalOpen}
        onClose={() => setTerminalOpen(false)}
      />
    </div>
  );
}
