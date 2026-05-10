'use client';

// Quick switcher with fuzzy and semantic search
import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, FileText, Sparkles, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Note, SearchResult } from '@/types/notes';

interface QuickSwitcherProps {
  notes: Note[];
  isOpen: boolean;
  onClose: () => void;
  onSelect: (noteId: string) => void;
}

export default function QuickSwitcher({
  notes,
  isOpen,
  onClose,
  onSelect,
}: QuickSwitcherProps) {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'fuzzy' | 'semantic'>('fuzzy');
  const [results, setResults] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Perform search
  const performSearch = useCallback(async (searchQuery: string, searchMode: 'fuzzy' | 'semantic') => {
    if (!searchQuery.trim()) {
      setResults(notes.slice(0, 8));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/notes/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          mode: searchMode,
          limit: 8
        })
      });
      
      const data = await res.json();
      if (data.success) {
        if (searchMode === 'semantic') {
          setResults(data.results.map((r: SearchResult) => r.note));
        } else {
          // fuzzy results from backend are already notes or {note}
          setResults(data.results.map((r: any) => r.note || r));
        }
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }, [notes]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query, mode);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, mode, performSearch]);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setResults(notes.slice(0, 8));
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, notes]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case 'Tab':
          e.preventDefault();
          setMode(prev => prev === 'fuzzy' ? 'semantic' : 'fuzzy');
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            onSelect(results[selectedIndex].id);
            onClose();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onSelect, onClose]);

  const handleSelect = (noteId: string) => {
    onSelect(noteId);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 max-w-lg bg-editorial-bg border border-editorial-line rounded-none">
        <div className="p-6 font-sans">
          {/* Search input and mode toggle */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-editorial-ink/30" />
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder={mode === 'fuzzy' ? "Search by title or tags..." : "Ask your archive a question..."}
                className="pl-12 h-12 bg-editorial-ink/5 border-editorial-line rounded-none focus-visible:ring-editorial-accent text-sm"
              />
              {loading && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-4 h-4 border-2 border-editorial-accent border-t-transparent rounded-full"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 p-1 bg-editorial-ink/5 rounded-full border border-editorial-line w-fit">
              <button
                onClick={() => setMode('fuzzy')}
                className={cn(
                  "flex items-center gap-2 px-3 py-1 text-[9px] font-bold uppercase tracking-wider transition-all",
                  mode === 'fuzzy' ? "bg-editorial-ink text-editorial-bg" : "text-editorial-ink/40 hover:text-editorial-ink/60"
                )}
              >
                <Search className="w-3 h-3" />
                Keyword
              </button>
              <button
                onClick={() => setMode('semantic')}
                className={cn(
                  "flex items-center gap-2 px-3 py-1 text-[9px] font-bold uppercase tracking-wider transition-all",
                  mode === 'semantic' ? "bg-editorial-accent text-editorial-bg" : "text-editorial-ink/40 hover:text-editorial-ink/60"
                )}
              >
                <Brain className="w-3 h-3" />
                Semantic
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto pr-2">
            {results.length === 0 ? (
              <div className="py-12 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-10" />
                <h4 className="font-display italic text-lg text-editorial-ink/30">
                  {loading ? "Scanning the network..." : "Nothing found in the archive."}
                </h4>
                <p className="text-[10px] uppercase tracking-widest text-editorial-ink/40 mt-1">
                  {mode === 'semantic' ? "Try rephrasing your thought." : "Try a different term."}
                </p>
              </div>
            ) : (
              <div className="py-1">
                {query === '' && (
                  <div className="px-4 py-2 text-[10px] font-bold text-editorial-ink/40 uppercase tracking-[0.2em] mb-2">
                    Recent Entries
                  </div>
                )}
                {results.map((note, index) => (
                  <motion.button
                    key={note.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    onClick={() => handleSelect(note.id)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      "relative w-full flex items-start gap-4 px-4 py-3 transition-all text-left",
                      index === selectedIndex 
                        ? "bg-editorial-ink text-editorial-bg shadow-lg scale-[1.02] z-10" 
                        : "text-editorial-ink/60 hover:bg-editorial-ink/5"
                    )}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      {mode === 'semantic' ? (
                        <Sparkles className={cn("w-4 h-4", index === selectedIndex ? "text-editorial-accent" : "text-editorial-ink/20")} />
                      ) : (
                        <FileText className={cn("w-4 h-4", index === selectedIndex ? "text-editorial-accent" : "text-editorial-ink/20")} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{note.title}</div>
                      <div className={cn(
                        "text-[10px] truncate mt-1 font-mono uppercase tracking-tight",
                        index === selectedIndex ? "text-editorial-bg/60" : "text-editorial-ink/30"
                      )}>
                        {note.path}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Footer hints */}
          <div className="mt-6 pt-6 border-t border-editorial-line flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.15em] text-editorial-ink/30">
            <div className="flex gap-6">
              <span className="flex items-center gap-2"><kbd className="px-1.5 py-0.5 bg-editorial-ink/5 border border-editorial-line">↑↓</kbd> Navigate</span>
              <span className="flex items-center gap-2"><kbd className="px-1.5 py-0.5 bg-editorial-ink/5 border border-editorial-line">Tab</kbd> Switch Mode</span>
              <span className="flex items-center gap-2"><kbd className="px-1.5 py-0.5 bg-editorial-ink/5 border border-editorial-line">↵</kbd> Open</span>
            </div>
            <span>{results.length} Entries</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to trigger quick switcher
export function useQuickSwitcher() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  };
}
