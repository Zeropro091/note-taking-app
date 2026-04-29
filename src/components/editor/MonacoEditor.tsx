'use client';

// Monaco Editor component with markdown support
import { useEffect, useRef, useState } from 'react';
import Editor, { OnMount, OnChange } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

interface MonacoEditorProps {
  noteId: string;
  content: string;
  onChange: (content: string) => void;
  onSave?: () => void;
  readOnly?: boolean;
}

// Configure Monaco for markdown
const configureMonaco = (editor: monaco.editor.IStandaloneCodeEditor) => {
  // Set editor options
  editor.updateOptions({
    wordWrap: 'on',
    lineNumbers: 'off',
    minimap: { enabled: false },
    fontSize: 16,
    fontFamily: "var(--font-mono)",
    fontLigatures: true,
    scrollBeyondLastLine: false,
    renderWhitespace: 'none',
    padding: { top: 40, bottom: 40 },
    lineHeight: 28,
    quickSuggestions: {
      other: true,
      comments: false,
      strings: false,
    },
  });

  // Register wikilink completion provider
  monaco.languages.registerCompletionItemProvider('markdown', {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      // This would be populated with actual note titles from the API
      const noteTitles = [
        'Welcome',
        'Getting Started',
        'Features',
        'API Reference',
      ];

      return {
        suggestions: noteTitles.map((title) => ({
          label: title,
          kind: 17, // Enum kind
          insertText: title,
          detail: 'Link to note',
          sortText: title,
          range,
        })),
      };
    },
  });
};

export default function MonacoEditor({
  noteId,
  content,
  onChange,
  onSave,
  readOnly = false,
}: MonacoEditorProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [localContent, setLocalContent] = useState(content);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    setLocalContent(content);
    setIsDarkMode(document.documentElement.classList.contains('dark'));
  }, [noteId, content]);

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;
    configureMonaco(editor);

    // Register keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave?.();
    });
  };

  const handleChange: OnChange = (value) => {
    if (value !== undefined) {
      setLocalContent(value);
      onChange(value);
    }
  };

  return (
    <div className="h-full w-full bg-editorial-bg">
      <Editor
        height="100%"
        defaultLanguage="markdown"
        value={localContent}
        onChange={handleChange}
        onMount={handleMount}
        theme={isDarkMode ? "vs-dark" : "vs"}
        options={{
          readOnly,
          domReadOnly: readOnly,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          glyphMargin: false,
          folding: false,
          scrollbar: {
            vertical: 'hidden',
            horizontal: 'hidden'
          }
        }}
        loading={<div className="flex items-center justify-center h-full text-[10px] font-bold uppercase tracking-widest text-editorial-ink/30 italic">Preparing Draft...</div>}
      />
    </div>
  );
}
