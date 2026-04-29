'use client';

// Combined editor with markdown preview
import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Edit, Eye, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

const MonacoEditor = dynamic(() => import('./MonacoEditor'), { ssr: false });
const MarkdownPreview = dynamic(() => import('./MarkdownPreview'), { ssr: false });

interface NoteEditorProps {
  noteId: string;
  initialContent: string;
  onSave: (content: string) => void;
}

type ViewMode = 'edit' | 'preview' | 'split';

export default function NoteEditor({
  noteId,
  initialContent,
  onSave,
}: NoteEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    setContent(initialContent);
    setHasUnsavedChanges(false);
  }, [noteId, initialContent]);

  const handleChange = useCallback((newContent: string) => {
    setContent(newContent);
    setHasUnsavedChanges(newContent !== initialContent);
  }, [initialContent]);

  const handleSave = useCallback(async () => {
    setSaveStatus('saving');
    try {
      await onSave(content);
      setHasUnsavedChanges(false);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save note:', error);
      setSaveStatus('idle');
    }
  }, [content, onSave]);

  // Auto-save with debounce
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const timer = setTimeout(() => {
      handleSave();
    }, 2000);

    return () => clearTimeout(timer);
  }, [content, hasUnsavedChanges, handleSave]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      // Ctrl/Cmd + E to toggle edit mode
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        setViewMode('edit');
      }
      // Ctrl/Cmd + P to toggle preview mode
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        setViewMode('preview');
      }
      // Ctrl/Cmd + \ to toggle split mode
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault();
        setViewMode('split');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  return (
    <div className="flex flex-col h-full bg-editorial-bg">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-editorial-line bg-editorial-bg">
        <div className="flex items-center gap-1 p-1 bg-editorial-ink/5 rounded-full border border-editorial-line">
          <button
            onClick={() => setViewMode('edit')}
            className={cn(
              "px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all",
              viewMode === 'edit' ? "bg-editorial-ink text-editorial-bg shadow-sm" : "text-editorial-ink/40 hover:text-editorial-ink/60"
            )}
          >
            Draft
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={cn(
              "px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all",
              viewMode === 'preview' ? "bg-editorial-ink text-editorial-bg shadow-sm" : "text-editorial-ink/40 hover:text-editorial-ink/60"
            )}
          >
            Review
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={cn(
              "px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all",
              viewMode === 'split' ? "bg-editorial-ink text-editorial-bg shadow-sm" : "text-editorial-ink/40 hover:text-editorial-ink/60"
            )}
          >
            Dual
          </button>
        </div>

        <div className="flex items-center gap-6">
          {/* Save status indicator */}
          <span className="text-[10px] font-bold uppercase tracking-widest text-editorial-ink/30">
            {saveStatus === 'saving' && 'Syncing...'}
            {saveStatus === 'saved' && 'Archived'}
            {saveStatus === 'idle' && hasUnsavedChanges && 'Drafting...'}
          </span>

          <button
            onClick={handleSave}
            disabled={!hasUnsavedChanges || saveStatus === 'saving'}
            className={cn(
              "text-[10px] font-bold uppercase tracking-widest transition-all",
              hasUnsavedChanges ? "text-editorial-accent hover:brightness-110" : "text-editorial-ink/20 cursor-default"
            )}
          >
            Archive Entry
          </button>
        </div>
      </div>

      {/* Editor/Preview */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {viewMode === 'edit' && (
            <motion.div
              key="edit"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <MonacoEditor
                noteId={noteId}
                content={content}
                onChange={handleChange}
                onSave={handleSave}
              />
            </motion.div>
          )}

          {viewMode === 'preview' && (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <MarkdownPreview content={content} noteId={noteId} />
            </motion.div>
          )}

          {viewMode === 'split' && (
            <motion.div
              key="split"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex h-full"
            >
              <div className="w-1/2 border-r border-editorial-line">
                <MonacoEditor
                  noteId={noteId}
                  content={content}
                  onChange={handleChange}
                  onSave={handleSave}
                />
              </div>
              <div className="w-1/2">
                <MarkdownPreview content={content} noteId={noteId} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
