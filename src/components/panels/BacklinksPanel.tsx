'use client';

// Panel showing backlinks (notes that link to the current note)
import { Link2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Backlink } from '@/types/notes';

interface BacklinksPanelProps {
  backlinks: Backlink[];
  onNoteClick: (noteId: string) => void;
}

export default function BacklinksPanel({
  backlinks,
  onNoteClick,
}: BacklinksPanelProps) {
  return (
    <div className="h-full flex flex-col bg-editorial-bg font-sans">
      <div className="px-4 py-4 border-b border-editorial-line flex items-center justify-between">
        <h3 className="text-[10px] font-bold text-editorial-ink/40 uppercase tracking-[0.2em]">
          Context
        </h3>
        <span className="text-[10px] font-bold text-editorial-ink/30 italic">
          {backlinks.length} Link{backlinks.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <AnimatePresence mode="wait">
          {backlinks.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 text-center"
            >
              <h4 className="font-display italic text-editorial-ink/30 text-lg mb-2">No context found.</h4>
              <p className="text-[10px] uppercase tracking-widest text-editorial-ink/40">Entries linking here will appear.</p>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {backlinks.map((backlink, index) => (
                <motion.button
                  key={backlink.noteId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onNoteClick(backlink.noteId)}
                  className="w-full text-left group"
                >
                  <div className="text-xs font-bold uppercase tracking-wider text-editorial-ink/80 group-hover:text-editorial-accent transition-colors mb-1">
                    {backlink.title}
                  </div>
                  <div className="text-xs text-editorial-ink/50 leading-relaxed italic line-clamp-3">
                    {backlink.excerpt}
                  </div>
                  <div className="w-4 h-px bg-editorial-line mt-3 group-hover:w-full group-hover:bg-editorial-accent/30 transition-all duration-300" />
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
