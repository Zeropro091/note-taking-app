'use client';

import { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2, Minimize2, Terminal as TerminalIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// Import xterm CSS
import 'xterm/css/xterm.css';

interface TerminalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Terminal({ isOpen, onClose }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (!isOpen || !terminalRef.current) return;

    // Initialize xterm
    const xterm = new XTerm({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, "Courier New", monospace',
      theme: {
        background: '#1a1a1a',
        foreground: '#d1d1d1',
        cursor: '#f5f5f5',
        selectionBackground: 'rgba(255, 255, 255, 0.1)',
        black: '#1a1a1a',
        red: '#e06c75',
        green: '#98c379',
        yellow: '#d19a66',
        blue: '#61afef',
        magenta: '#c678dd',
        cyan: '#56b6c2',
        white: '#abb2bf',
      },
    });

    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);
    xterm.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    // Connect to PTY server
    const socket = io('http://localhost:3006');
    socketRef.current = socket;

    socket.on('connect', () => {
      xterm.write('\x1b[1;32mConnected to terminal server\x1b[0m\r\n');
      // Send initial size
      socket.emit('resize', { cols: xterm.cols, rows: xterm.rows });
    });

    socket.on('output', (data: string) => {
      xterm.write(data);
    });

    xterm.onData((data) => {
      socket.emit('input', data);
    });

    xterm.onResize(({ cols, rows }) => {
      socket.emit('resize', { cols, rows });
    });

    const handleResize = () => {
      fitAddon.fit();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      socket.disconnect();
      xterm.dispose();
    };
  }, [isOpen]);

  // Refit when maximized state changes
  useEffect(() => {
    if (fitAddonRef.current) {
      setTimeout(() => fitAddonRef.current?.fit(), 100);
    }
  }, [isMaximized]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={cn(
            "fixed bottom-0 left-0 right-0 z-50 bg-[#1a1a1a] border-t border-editorial-line shadow-2xl flex flex-col",
            isMaximized ? "h-[90vh]" : "h-80"
          )}
        >
          {/* Header */}
          <div className="h-10 border-b border-white/5 flex items-center justify-between px-4 bg-[#141414]">
            <div className="flex items-center gap-2">
              <TerminalIcon className="w-3.5 h-3.5 text-editorial-accent" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">
                System Terminal
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMaximized(!isMaximized)}
                className="text-white/40 hover:text-white transition-colors"
              >
                {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={onClose}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Terminal Viewport */}
          <div className="flex-1 overflow-hidden p-2" ref={terminalRef} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
