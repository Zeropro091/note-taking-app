'use client';

// Panel showing table of contents from headings
import { List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { extractHeadings } from '@/lib/markdown';
import { cn } from '@/lib/utils';

interface OutlinePanelProps {
  content: string;
  onHeadingClick?: (line: number) => void;
}

export default function OutlinePanel({
  content,
  onHeadingClick,
}: OutlinePanelProps) {
  const headings = extractHeadings(content);

  return (
    <div className="h-full flex flex-col bg-editorial-bg font-sans">
      <div className="px-4 py-4 border-b border-editorial-line flex items-center justify-between">
        <h3 className="text-[10px] font-bold text-editorial-ink/40 uppercase tracking-[0.2em]">
          Outline
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <AnimatePresence mode="wait">
          {headings.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 text-center"
            >
              <h4 className="font-display italic text-editorial-ink/30 text-lg mb-2">No outline.</h4>
              <p className="text-[10px] uppercase tracking-widest text-editorial-ink/40">Section headings will appear.</p>
            </motion.div>
          ) : (
            <motion.nav
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {headings.map((heading, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  onClick={() => onHeadingClick?.(heading.line)}
                  className={cn(
                    "block w-full text-left transition-colors border-l-2 py-1",
                    heading.level === 1 
                      ? "border-editorial-accent/30 pl-3 font-display italic text-lg text-editorial-ink" 
                      : "border-transparent text-editorial-ink/60 hover:text-editorial-ink",
                    heading.level === 2 ? "pl-6 text-sm" : "",
                    heading.level === 3 ? "pl-9 text-xs" : "",
                    heading.level >= 4 ? "pl-12 text-[10px]" : ""
                  )}
                >
                  {heading.text}
                </motion.button>
              ))}
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
