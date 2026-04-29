'use client';

// Quick switcher for fuzzy searching notes
import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, FileText, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Note } from '@/types/notes';

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
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter notes based on query
  const filteredNotes = useCallback(() => {
    if (!query.trim()) {
      // Show recent notes when no query
      return notes.slice(0, 8);
    }

    const lowerQuery = query.toLowerCase();
    return notes
      .filter((note) =>
        note.title.toLowerCase().includes(lowerQuery) ||
        note.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
      )
      .slice(0, 8);
  }, [notes, query]);

  const results = filteredNotes();

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      // Focus input after a small delay to ensure dialog is rendered
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

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
          {/* Search input */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-editorial-ink/30" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Search archive by title or taxonomy..."
              className="pl-12 h-12 bg-editorial-ink/5 border-editorial-line rounded-none focus-visible:ring-editorial-accent text-sm"
            />
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto pr-2">
            {results.length === 0 ? (
              <div className="py-12 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-10" />
                <h4 className="font-display italic text-lg text-editorial-ink/30">Nothing found in the archive.</h4>
                <p className="text-[10px] uppercase tracking-widest text-editorial-ink/40 mt-1">Try a different term.</p>
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
                    <FileText className={cn("w-4 h-4 mt-0.5 flex-shrink-0", index === selectedIndex ? "text-editorial-accent" : "text-editorial-ink/20")} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{note.title}</div>
                      <div className={cn(
                        "text-[10px] truncate mt-1 font-mono uppercase tracking-tight",
                        index === selectedIndex ? "text-editorial-bg/60" : "text-editorial-ink/30"
                      )}>
                        {note.path}
                      </div>
                      {note.tags.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {note.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className={cn(
                                "text-[9px] px-2 py-0.5 border font-bold uppercase tracking-wider",
                                index === selectedIndex
                                  ? "border-editorial-bg/20 text-editorial-bg/80"
                                  : "border-editorial-line text-editorial-ink/40"
                              )}
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
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
              <span className="flex items-center gap-2"><kbd className="px-1.5 py-0.5 bg-editorial-ink/5 border border-editorial-line">↵</kbd> Open</span>
              <span className="flex items-center gap-2"><kbd className="px-1.5 py-0.5 bg-editorial-ink/5 border border-editorial-line">Esc</kbd> Close</span>
            </div>
            <span>{results.length} Entries</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to trigger quick switcher with keyboard shortcut
export function useQuickSwitcher() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open quick switcher
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
