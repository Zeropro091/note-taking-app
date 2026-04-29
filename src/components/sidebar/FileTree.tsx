'use client';

// File tree component for browsing notes
import { useState } from 'react';
import { File, Folder, FolderOpen, FilePlus, FolderPlus, Trash2, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { FileNode } from '@/types/notes';

interface FileTreeProps {
  tree: FileNode[];
  selectedId: string | null;
  onNoteSelect: (path: string) => void;
  onNoteCreate?: (path: string, title: string) => void;
  onNoteDelete?: (path: string) => void;
  onNoteRename?: (oldPath: string, newPath: string) => void;
}

interface TreeNodeProps {
  node: FileNode;
  level: number;
  selectedId: string | null;
  onNoteSelect: (path: string) => void;
  onNoteCreate?: (path: string, title: string) => void;
  onNoteDelete?: (path: string) => void;
  onNoteRename?: (oldPath: string, newPath: string) => void;
}

function TreeNode({
  node,
  level,
  selectedId,
  onNoteSelect,
  onNoteCreate,
  onNoteDelete,
  onNoteRename,
}: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 1);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(node.name);

  const isSelected = selectedId === node.path.replace(/\.md$/, '');

  const handleClick = () => {
    if (node.type === 'folder') {
      setIsExpanded(!isExpanded);
    } else {
      onNoteSelect(node.path);
    }
  };

  const handleEdit = async () => {
    if (editValue !== node.name) {
      const newPath = node.path.replace(node.name, editValue);
      onNoteRename?.(node.path, newPath);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEdit();
    } else if (e.key === 'Escape') {
      setEditValue(node.name);
      setIsEditing(false);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete "${node.name}"?`)) {
      onNoteDelete?.(node.path);
    }
  };

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 transition-colors cursor-pointer group",
          isSelected 
            ? "bg-editorial-ink/5 text-editorial-accent font-medium shadow-[inset_-2px_0_0_0_#D94126]" 
            : "text-editorial-ink/60 hover:bg-editorial-ink/5 hover:text-editorial-ink"
        )}
        style={{ paddingLeft: `${level * 12 + 12}px` }}
        onClick={handleClick}
        onContextMenu={(e) => {
          e.preventDefault();
          setIsEditing(true);
        }}
      >
        {node.type === 'folder' ? (
          isExpanded ? (
            <FolderOpen className="w-4 h-4 text-editorial-ink/30" />
          ) : (
            <Folder className="w-4 h-4 text-editorial-ink/30" />
          )
        ) : (
          <File className="w-4 h-4 text-editorial-ink/30" />
        )}

        {isEditing ? (
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleEdit}
            onKeyDown={handleKeyDown}
            className="h-6 text-xs bg-editorial-bg border-editorial-line"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 text-sm truncate">{node.name}</span>
        )}

        {node.type === 'file' && (
          <button
            onClick={handleDelete}
            className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-1"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>

      {node.type === 'folder' && isExpanded && node.children && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              level={level + 1}
              selectedId={selectedId}
              onNoteSelect={onNoteSelect}
              onNoteCreate={onNoteCreate}
              onNoteDelete={onNoteDelete}
              onNoteRename={onNoteRename}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}

export default function FileTree({
  tree,
  selectedId,
  onNoteSelect,
  onNoteCreate,
  onNoteDelete,
  onNoteRename,
}: FileTreeProps) {
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [newItemPath, setNewItemPath] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState<'file' | 'folder'>('file');

  const handleCreate = async () => {
    if (!newItemName.trim()) return;

    const path = newItemPath
      ? `${newItemPath}/${newItemName}${newItemType === 'file' ? '.md' : ''}`
      : `${newItemName}${newItemType === 'file' ? '.md' : ''}`;

    if (newItemType === 'file') {
      onNoteCreate?.(path, newItemName);
    }

    setNewItemName('');
    setNewItemPath('');
    setShowNewMenu(false);
  };

  return (
    <div className="h-full flex flex-col bg-editorial-bg font-sans">
      {/* Header */}
      <div className="px-4 py-4 border-b border-editorial-line">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[10px] font-bold text-editorial-ink/40 uppercase tracking-[0.2em]">
            Archive
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setNewItemType('file');
                setShowNewMenu(!showNewMenu);
              }}
              className="text-editorial-ink/30 hover:text-editorial-accent transition-colors"
              title="New Entry"
            >
              <FilePlus className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setNewItemType('folder');
                setShowNewMenu(!showNewMenu);
              }}
              className="text-editorial-ink/30 hover:text-editorial-accent transition-colors"
              title="New Collection"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* New item form */}
        {showNewMenu && (
          <div className="space-y-3 p-3 bg-editorial-ink/5 border border-editorial-line mb-2">
            <Input
              placeholder={`Entry name...`}
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') setShowNewMenu(false);
              }}
              className="h-8 text-xs bg-editorial-bg border-editorial-line"
              autoFocus
            />
            <div className="flex gap-2">
              <button 
                onClick={handleCreate} 
                className="flex-1 text-[10px] font-bold uppercase tracking-widest bg-editorial-ink text-editorial-bg py-1.5"
              >
                Create
              </button>
              <button
                onClick={() => setShowNewMenu(false)}
                className="flex-1 text-[10px] font-bold uppercase tracking-widest text-editorial-ink/60 py-1.5"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-4">
        {tree.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <h3 className="font-display italic text-editorial-ink/30 text-lg mb-2">The archive is empty.</h3>
            <p className="text-[10px] uppercase tracking-widest text-editorial-ink/40">Begin your first entry.</p>
          </div>
        ) : (
          tree.map((node) => (
            <TreeNode
              key={node.path}
              node={node}
              level={0}
              selectedId={selectedId}
              onNoteSelect={onNoteSelect}
              onNoteCreate={onNoteCreate}
              onNoteDelete={onNoteDelete}
              onNoteRename={onNoteRename}
            />
          ))
        )}
      </div>
    </div>
  );
}
