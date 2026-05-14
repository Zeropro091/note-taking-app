'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { File } from 'lucide-react';
import type { Note } from '@/types/notes';
import { cn } from '@/lib/utils';
import { PARA_CATEGORIES } from '../sidebar/NoteGroups';

interface PARABoardProps {
  notes: Note[];
  onNoteSelect: (path: string) => void;
  onMoveNote: (noteId: string, newTags: string[]) => void;
}

export default function PARABoard({ notes, onNoteSelect, onMoveNote }: PARABoardProps) {
  const [draggedNote, setDraggedNote] = useState<Note | null>(null);

  // Define columns matching PARA_CATEGORIES plus General/Inbox
  const columns = useMemo(() => {
    return [
      { id: 'General', title: 'Inbox', color: PARA_CATEGORIES.General.color, icon: PARA_CATEGORIES.General.icon, tags: PARA_CATEGORIES.General.tags },
      { id: 'Projects', title: 'Projects', color: PARA_CATEGORIES.Projects.color, icon: PARA_CATEGORIES.Projects.icon, tags: PARA_CATEGORIES.Projects.tags },
      { id: 'Areas', title: 'Areas', color: PARA_CATEGORIES.Areas.color, icon: PARA_CATEGORIES.Areas.icon, tags: PARA_CATEGORIES.Areas.tags },
      { id: 'Resources', title: 'Resources', color: PARA_CATEGORIES.Resources.color, icon: PARA_CATEGORIES.Resources.icon, tags: PARA_CATEGORIES.Resources.tags },
      { id: 'Archives', title: 'Archives', color: PARA_CATEGORIES.Archives.color, icon: PARA_CATEGORIES.Archives.icon, tags: PARA_CATEGORIES.Archives.tags },
    ];
  }, []);

  // Group notes into columns based on tags
  const notesByColumn = useMemo(() => {
    const grouped: Record<string, Note[]> = {
      General: [],
      Projects: [],
      Areas: [],
      Resources: [],
      Archives: [],
    };

    const assignedNoteIds = new Set<string>();

    // Assign notes to categories (excluding General first)
    for (const note of notes) {
      if (!note.tags || note.tags.length === 0) continue;

      for (const col of columns) {
        if (col.id === 'General') continue;
        if (note.tags.some((tag) => col.tags.includes(tag.toLowerCase()))) {
          grouped[col.id].push(note);
          assignedNoteIds.add(note.id);
          break; // Assign to first matching category
        }
      }
    }

    // Unassigned notes go to General (Inbox)
    for (const note of notes) {
      if (!assignedNoteIds.has(note.id)) {
        grouped['General'].push(note);
      }
    }

    return grouped;
  }, [notes, columns]);

  const handleDragStart = (e: React.DragEvent, note: Note) => {
    setDraggedNote(note);
    e.dataTransfer.effectAllowed = 'move';
    // Firefox requires setting data
    e.dataTransfer.setData('text/plain', note.id);
    
    // Slight delay to make the original card look transparent while dragging
    setTimeout(() => {
      if (e.target instanceof HTMLElement) {
        e.target.style.opacity = '0.5';
      }
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.target instanceof HTMLElement) {
      e.target.style.opacity = '1';
    }
    setDraggedNote(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    
    if (!draggedNote) return;

    // Check if the note is already in the target column
    const isAlreadyInTarget = notesByColumn[targetColumnId].some(n => n.id === draggedNote.id);
    if (isAlreadyInTarget) return;

    // Determine new tags
    const targetColumn = columns.find(c => c.id === targetColumnId);
    if (!targetColumn) return;

    // Remove existing PARA tags
    const allPARATags = columns.flatMap(c => c.tags);
    let newTags = (draggedNote.tags || []).filter(tag => !allPARATags.includes(tag.toLowerCase()));

    // Add target column tags (if not General/Inbox)
    if (targetColumn.tags.length > 0) {
      newTags = [...newTags, ...targetColumn.tags];
    }

    onMoveNote(draggedNote.id, newTags);
  };

  return (
    <div className="h-full w-full p-6 flex gap-6 overflow-x-auto bg-editorial-bg">
      {columns.map((column) => (
        <div
          key={column.id}
          className="flex flex-col min-w-[300px] max-w-[350px] bg-editorial-ink/5 rounded-none border border-editorial-line"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, column.id)}
        >
          {/* Column Header */}
          <div 
            className="p-4 border-b border-editorial-line flex items-center justify-between bg-editorial-bg"
            style={{ borderTop: `4px solid ${column.color}` }}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{column.icon}</span>
              <h3 className="font-display text-sm font-bold uppercase tracking-widest text-editorial-ink/80">{column.title}</h3>
            </div>
            <span className="text-[10px] font-bold text-editorial-accent bg-editorial-accent/10 px-2 py-0.5 rounded-none">
              {notesByColumn[column.id]?.length || 0}
            </span>
          </div>

          {/* Column Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            <AnimatePresence>
              {notesByColumn[column.id]?.map((note) => (
                <motion.div
                  key={note.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  draggable
                  onDragStart={(e) => handleDragStart(e as any, note)}
                  onDragEnd={handleDragEnd as any}
                  onClick={() => onNoteSelect(note.path)}
                  className={cn(
                    "p-4 border border-editorial-line bg-editorial-bg cursor-grab active:cursor-grabbing hover:border-editorial-accent transition-all group shadow-sm hover:shadow-md",
                    draggedNote?.id === note.id ? "opacity-50" : ""
                  )}
                >
                  <div className="flex items-start gap-3">
                    <File className="w-4 h-4 text-editorial-ink/20 mt-0.5 shrink-0 group-hover:text-editorial-accent transition-colors" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-editorial-ink font-bold leading-tight mb-2">
                        {note.title}
                      </p>
                      
                      {/* Non-PARA Tags */}
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {note.tags
                            .filter(tag => !columns.flatMap(c => c.tags).includes(tag.toLowerCase()))
                            .slice(0, 3)
                            .map((tag) => (
                              <span key={tag} className="text-[9px] font-bold uppercase tracking-tighter text-editorial-ink/40">
                                #{tag}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {notesByColumn[column.id]?.length === 0 && (
              <div className="h-full flex items-center justify-center min-h-[120px] border-2 border-dashed border-editorial-line rounded-none">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-editorial-ink/20">Empty Space</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
