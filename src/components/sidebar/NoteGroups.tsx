'use client';

// Note groups component for organizing notes by tags/categories
import { useState, useMemo } from 'react';
import { File, ChevronDown, ChevronRight, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import type { Note } from '@/types/notes';
import { cn } from '@/lib/utils';

// Category definitions with icons and colors
const CATEGORIES: Record<string, { tags: string[]; color: string; icon: string }> = {
  'Sales & Business': {
    tags: ['sales', 'closing', 'objections', 'lead-gen', 'follow-up', 'negotiation', 'growth', 'client-success', 'pricing'],
    color: '#2C3E50', // Muted Navy
    icon: '💼',
  },
  'AI & Technology': {
    tags: ['ai', 'tech', 'javascript', 'typescript', 'react', 'nextjs', 'python', 'rust', 'go'],
    color: '#34495E', // Charcoal
    icon: '🤖',
  },
  'Business Ideas': {
    tags: ['saas', 'business', 'roadmap', 'app', 'documentation', 'security'],
    color: '#9A7D0A', // Old Gold
    icon: '💡',
  },
  'Research & Development': {
    tags: ['research'],
    color: '#1E8449', // Deep Sage
    icon: '🔬',
  },
  'General': {
    tags: [], // Default for notes without matching tags
    color: '#7F8C8D', // Warm Gray
    icon: '📝',
  },
};

interface NoteGroup {
  name: string;
  icon: string;
  color: string;
  notes: Note[];
  count: number;
}

interface NoteGroupsProps {
  notes: Note[];
  selectedId: string | null;
  onNoteSelect: (path: string) => void;
}

export default function NoteGroups({
  notes,
  selectedId,
  onNoteSelect,
}: NoteGroupsProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Sales & Business', 'AI & Technology']));

  // Group notes by category
  const groupedNotes = useMemo(() => {
    const groups: NoteGroup[] = [];
    const unassignedNotes: Note[] = [];

    // First, categorize notes
    for (const [categoryName, category] of Object.entries(CATEGORIES)) {
      if (categoryName === 'General') continue; // Skip General, handle separately

      const categoryNotes = notes.filter((note) => {
        if (!note.tags || note.tags.length === 0) return false;
        return note.tags.some((tag) => category.tags.includes(tag.toLowerCase()));
      });

      if (categoryNotes.length > 0) {
        groups.push({
          name: categoryName,
          icon: category.icon,
          color: category.color,
          notes: categoryNotes,
          count: categoryNotes.length,
        });
      }
    }

    // Find notes that weren't assigned to any category
    const assignedNoteIds = new Set(groups.flatMap((g) => g.notes.map((n) => n.id)));
    const generalNotes = notes.filter((n) => !assignedNoteIds.has(n.id));

    if (generalNotes.length > 0) {
      groups.push({
        name: 'General',
        icon: CATEGORIES.General.icon,
        color: CATEGORIES.General.color,
        notes: generalNotes,
        count: generalNotes.length,
      });
    }

    return groups;
  }, [notes]);

  // Get unique tags from all notes for tag cloud
  const allTags = useMemo(() => {
    const tagMap = new Map<string, number>();
    for (const note of notes) {
      for (const tag of note.tags || []) {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
      }
    }
    return Array.from(tagMap.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }, [notes]);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupName)) {
        next.delete(groupName);
      } else {
        next.add(groupName);
      }
      return next;
    });
  };

  return (
    <div className="h-full flex flex-col bg-editorial-bg font-sans">
      {/* Header */}
      <div className="px-4 py-4 border-b border-editorial-line">
        <h2 className="text-[10px] font-bold text-editorial-ink/40 uppercase tracking-[0.2em] mb-4">
          Taxonomy
        </h2>

        {/* Tag Cloud */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {allTags.slice(0, 15).map(({ tag, count }) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 border border-editorial-line text-editorial-ink/60 hover:border-editorial-accent hover:text-editorial-accent transition-colors cursor-pointer font-medium"
                title={`${count} entry${count > 1 ? 'ies' : ''}`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Groups */}
      <div className="flex-1 overflow-y-auto py-4">
        {groupedNotes.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <h3 className="font-display italic text-editorial-ink/30 text-lg mb-2">No taxonomy defined.</h3>
            <p className="text-[10px] uppercase tracking-widest text-editorial-ink/40">Tag entries to organize.</p>
          </div>
        ) : (
          groupedNotes.map((group) => {
            const isExpanded = expandedGroups.has(group.name);

            return (
              <div key={group.name} className="mb-2">
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(group.name)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2 transition-colors group',
                    'hover:bg-editorial-ink/5'
                  )}
                >
                  <div 
                    className="w-1 h-4 transition-colors" 
                    style={{ backgroundColor: group.color, opacity: isExpanded ? 1 : 0.3 }} 
                  />
                  <span className="flex-1 text-left text-xs font-bold uppercase tracking-wider text-editorial-ink/80">
                    {group.name}
                  </span>
                  <span className="text-[10px] font-bold text-editorial-ink/30">
                    {group.count}
                  </span>
                </button>

                {/* Group Notes */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      {group.notes.map((note) => {
                        const isSelected = selectedId === note.id;
                        return (
                          <button
                            key={note.id}
                            onClick={() => onNoteSelect(note.path)}
                            className={cn(
                              'w-full flex items-center gap-2 px-4 py-1.5 transition-colors group',
                              isSelected 
                                ? 'bg-editorial-ink/5 text-editorial-accent font-medium shadow-[inset_-2px_0_0_0_#D94126]' 
                                : 'text-editorial-ink/60 hover:bg-editorial-ink/5 hover:text-editorial-ink'
                            )}
                            style={{ paddingLeft: '2.5rem' }}
                          >
                            <span className="flex-1 text-left truncate text-xs">
                              {note.title}
                            </span>
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>

      {/* Stats Footer */}
      <div className="px-4 py-4 border-t border-editorial-line bg-editorial-ink/[0.02]">
        <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-editorial-ink/30">
          <span>{notes.length} Entries</span>
          <span>{allTags.length} Points</span>
        </div>
      </div>
    </div>
  );
}
