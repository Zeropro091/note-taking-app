// src/hooks/use-bridges.ts
import { useState, useEffect, useRef } from 'react';
import type { Bridge } from '@/types/notes';

export function useBridges(noteId: string, content: string) {
  const [bridges, setBridges] = useState<Bridge[]>([]);
  const lastPulseContent = useRef(content);

  useEffect(() => {
    // Reset when note changes
    setBridges([]);
    lastPulseContent.current = content;
  }, [noteId]);

  useEffect(() => {
    const triggerPulse = async () => {
      // Logic: Only pulse if content changed by >= 50 chars
      if (Math.abs(content.length - lastPulseContent.current.length) < 50) return;

      try {
        const res = await fetch('/api/ai/bridges', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: noteId, content }),
        });
        const data = await res.json();
        if (data.success) {
          setBridges(data.bridges);
          lastPulseContent.current = content;
        }
      } catch (err) {
        console.error('Bridges Pulse Error:', err);
      }
    };

    const interval = setInterval(triggerPulse, 20000); // 20 seconds
    return () => clearInterval(interval);
  }, [noteId, content]);

  return { bridges, setBridges };
}
