'use client';

// Panel for showing semantic "Brain Bridges" (AI suggestions)
import { Sparkles, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Bridge } from '@/types/notes';

interface BridgesPanelProps {
  bridges: Bridge[];
  onNoteClick: (id: string) => void;
  onConnect: (bridge: Bridge) => void;
}

export default function BridgesPanel({
  bridges,
  onNoteClick,
  onConnect,
}: BridgesPanelProps) {
  return (
    <div className="pt-8 mt-8 border-t border-editorial-line px-4">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-3 h-3 text-editorial-accent" />
        <h3 className="text-[10px] font-bold text-editorial-accent uppercase tracking-[0.2em]">
          Brain Bridges
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {bridges.length === 0 ? (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[10px] text-editorial-ink/30 italic"
            >
              Awaiting new neural connections...
            </motion.p>
          ) : (
            <div className="space-y-8">
              {bridges.map((bridge) => (
                <motion.div
                  key={bridge.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="group relative"
                >
                  <div className="text-[10px] font-bold text-editorial-ink/20 mb-1">
                    Relevance: {Math.round(bridge.score * 100)}%
                  </div>
                  <button
                    onClick={() => onNoteClick(bridge.id)}
                    className="block text-left mb-2"
                  >
                    <span className="text-xs font-bold uppercase tracking-wider group-hover:text-editorial-accent transition-colors">
                      {bridge.title}
                    </span>
                  </button>
                  <p className="text-[10px] text-editorial-ink/50 leading-relaxed italic line-clamp-3 mb-3">
                    {bridge.excerpt}
                  </p>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => onConnect(bridge)}
                      className="text-[9px] font-bold uppercase tracking-widest text-editorial-ink/40 hover:text-editorial-accent transition-colors"
                    >
                      Bridge
                    </button>
                    <ArrowRight className="w-3 h-3 text-editorial-ink/20 group-hover:text-editorial-accent transition-colors" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
