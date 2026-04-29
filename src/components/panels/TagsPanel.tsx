'use client';

// Panel showing all tags in the knowledge base
import { Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Note } from '@/types/notes';
import { getAllTags } from '@/lib/search';
import { cn } from '@/lib/utils';

interface TagsPanelProps {
  notes: Note[];
  selectedTag: string | null;
  onTagSelect: (tag: string | null) => void;
}

export default function TagsPanel({
  notes,
  selectedTag,
  onTagSelect,
}: TagsPanelProps) {
  const tagCounts = getAllTags(notes);
  const sortedTags = Array.from(tagCounts.entries()).sort(
    (a, b) => b[1] - a[1]
  );

  return (
    <div className="h-full flex flex-col bg-editorial-bg font-sans">
      <div className="px-4 py-4 border-b border-editorial-line flex items-center justify-between">
        <h3 className="text-[10px] font-bold text-editorial-ink/40 uppercase tracking-[0.2em]">
          Taxonomy
        </h3>
        <span className="text-[10px] font-bold text-editorial-ink/30 italic">
          {sortedTags.length} Points
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <AnimatePresence mode="wait">
          {sortedTags.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 text-center"
            >
              <h4 className="font-display italic text-editorial-ink/30 text-lg mb-2">No taxonomy.</h4>
              <p className="text-[10px] uppercase tracking-widest text-editorial-ink/40">Tags will appear here.</p>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-1"
            >
              {/* Show all option */}
              <button
                onClick={() => onTagSelect(null)}
                className={cn(
                  "w-full text-left px-3 py-2 transition-colors text-xs font-bold uppercase tracking-wider flex items-center justify-between",
                  selectedTag === null 
                    ? "bg-editorial-ink text-editorial-bg shadow-sm" 
                    : "text-editorial-ink/60 hover:bg-editorial-ink/5"
                )}
              >
                <span>Complete Archive</span>
                <span className={selectedTag === null ? "text-editorial-bg/60" : "text-editorial-ink/30"}>{notes.length}</span>
              </button>

              <div className="h-4" />

              {/* Tags list */}
              {sortedTags.map(([tag, count], index) => (
                <motion.button
                  key={tag}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  onClick={() => onTagSelect(tag === selectedTag ? null : tag)}
                  className={cn(
                    "w-full text-left px-3 py-2 transition-colors text-xs flex items-center justify-between group",
                    selectedTag === tag 
                      ? "bg-editorial-ink/5 text-editorial-accent font-medium shadow-[inset_-2px_0_0_0_#D94126]" 
                      : "text-editorial-ink/60 hover:bg-editorial-ink/5"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-editorial-ink/20 font-bold">#</span>
                    <span className={cn(selectedTag === tag ? "text-editorial-accent" : "group-hover:text-editorial-ink")}>{tag}</span>
                  </span>
                  <span className="text-[10px] font-bold text-editorial-ink/30">{count}</span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
