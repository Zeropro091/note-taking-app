'use client';

// Graph visualization component with enhanced interactivity
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import type { GraphData as FGData } from 'react-force-graph-2d';
import * as d3 from 'd3-force';
import { motion, AnimatePresence } from 'framer-motion';
import type { GraphData, GraphNode, Note } from '@/types/notes';
import { Maximize2, Filter, ZoomIn, ZoomOut, RotateCcw, Play, Pause, Undo, Sparkles, Download, ExternalLink, X, FileText, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface GraphViewProps {
  graph: GraphData;
  onNodeClick?: (nodeId: string) => void;
  selectedNodeId?: string;
  notes?: Note[];
}

export default function GraphView({
  graph,
  onNodeClick,
  selectedNodeId,
  notes = [],
}: GraphViewProps) {
  const fgRef = useRef<any>(null);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [isIsolated, setIsIsolated] = useState(false);
  const [isolatedData, setIsolatedData] = useState<FGData | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  // Get note details for a node ID
  const getNoteDetails = useCallback((nodeId: string): Note | undefined => {
    return notes.find((n) => n.id === nodeId);
  }, [notes]);

  // Save current graph data before isolation
  const currentData: FGData = useMemo(() => {
    const nodes = graph.nodes
      .filter((node) => {
        if (!filterTag) return true;
        return node.tags.includes(filterTag);
      })
      .map((node) => ({
        id: node.id,
        name: node.label,
        val: (node.tags?.length || 0) + 1,
        color: node.id === selectedNodeId ? '#3b82f6' : getColorForTags(node.tags),
      }));

    const nodeIds = new Set(nodes.map(n => n.id));

    const links = graph.edges
      .filter((edge) => {
        // Only include edges if both source and target exist in the current node list
        return nodeIds.has(edge.source) && nodeIds.has(edge.target);
      })
      .map((edge) => ({
        source: edge.source,
        target: edge.target,
      }));

    return { nodes, links };
  }, [graph, filterTag, selectedNodeId]);

  // Use isolated data if available, otherwise use filtered currentData
  const displayData = useMemo(() => isolatedData || currentData, [isolatedData, currentData]);

  // Get all unique tags
  const allTags = useMemo(() => Array.from(
    new Set(graph.nodes.flatMap((n) => n.tags))
  ).sort(), [graph.nodes]);

  // Zoom controls
  const handleZoomIn = () => {
    if (fgRef.current) {
      const currentZoom = fgRef.current.zoom();
      fgRef.current.zoom(currentZoom * 1.3, 400);
    }
  };

  const handleZoomOut = () => {
    if (fgRef.current) {
      const currentZoom = fgRef.current.zoom();
      fgRef.current.zoom(currentZoom * 0.7, 400);
    }
  };

  const handleReset = () => {
    fgRef.current?.zoomToFit(400);
  };

  // Toggle physics animation
  const togglePause = () => {
    setIsPaused(!isPaused);
    if (isPaused) {
      // Pause the simulation
      if (fgRef.current) {
        fgRef.current.pauseAnimation();
      }
    } else {
      // Resume animation
      if (fgRef.current) {
        fgRef.current.resumeAnimation();
      }
    }
  };

  // Reset to full graph
  const resetGraph = useCallback(() => {
    setIsIsolated(false);
    setIsolatedData(null);
    setHoveredNode(null);
  }, []);

  // Build adjacency map for fast O(1) connection checks
  const adjacencyMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    graph.edges.forEach(edge => {
      if (!map.has(edge.source)) map.set(edge.source, new Set());
      if (!map.has(edge.target)) map.set(edge.target, new Set());
      map.get(edge.source)!.add(edge.target);
      map.get(edge.target)!.add(edge.source);
    });
    return map;
  }, [graph.edges]);

  // Click to isolate node (show only connected nodes)
  const isolateNode = useCallback((nodeId: string) => {
    const neighbors = adjacencyMap.get(nodeId) || new Set<string>();
    const connectedNodeIds = new Set([nodeId, ...Array.from(neighbors)]);
    
    // Filter nodes from currentData (which already has tag filtering applied)
    const filteredNodes = currentData.nodes.filter((n: any) => connectedNodeIds.has(n.id));
    const filteredLinks = currentData.links.filter((l: any) =>
      connectedNodeIds.has(typeof l.source === 'object' ? l.source.id : l.source) && 
      connectedNodeIds.has(typeof l.target === 'object' ? l.target.id : l.target)
    );

    setIsolatedData({
      nodes: filteredNodes.map((n: any) => ({
        ...n,
        val: (n.tags?.length || 0 + 1) * 1.5,
      })),
      links: filteredLinks,
    });
    setIsIsolated(true);
  }, [currentData, adjacencyMap]);

  // Highlight connected nodes on hover
  const handleNodeHover = (node: any) => {
    setHoveredNode(node?.id || null);
  };

  // Reset highlight when not hovering
  const handleBackgroundClick = () => {
    setHoveredNode(null);
    setSelectedNode(null);
    if (isIsolated) {
      resetGraph();
    }
  };

  // Handle node click - show info panel
  const handleNodeClick = (node: any) => {
    const graphNode = graph.nodes.find((n) => n.id === node.id);
    if (graphNode) {
      setSelectedNode(graphNode);
    }
  };

  // Navigate to the selected note
  const navigateToNote = useCallback(() => {
    if (selectedNode) {
      onNodeClick?.(selectedNode.id);
      setSelectedNode(null);
    }
  }, [selectedNode, onNodeClick]);

  // Close info panel
  const closeInfoPanel = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Zoom to selected node
  useEffect(() => {
    if (selectedNodeId && fgRef.current && !isIsolated) {
      const node = currentData.nodes.find((n: any) => n.id === selectedNodeId);
      if (node) {
        fgRef.current.centerAt(node.x || 0, node.y || 0, 1.2, 300);
      }
    }
  }, [selectedNodeId, currentData, isIsolated]);

  // Community-based coloring (Louvain)
  const getCommunityColor = useCallback((community: number | undefined) => {
    if (community === undefined) return '#141414';
    // Warm, editorial-friendly palette for communities
    const palette = [
      '#141414', // Charcoal
      '#D94126', // Terracotta
      '#4A5D4E', // Sage
      '#5E4A5D', // Plum
      '#4A555D', // Slate
      '#8C7356', // Bronze
      '#568C7B', // Ocean
      '#7B568C', // Violet
    ];
    return palette[community % palette.length];
  }, []);

  // Configure forces for better spacing when data changes
  useEffect(() => {
    if (!fgRef.current) return;

    // Wait for graph to be ready
    const timeoutId = setTimeout(() => {
      if (!fgRef.current) return;

      const nodeCount = displayData.nodes.length;
      // Scale charge force (repulsion) based on node count
      const chargeStrength = -300 * Math.log10(nodeCount + 10);
      // Scale link distance based on node count
      const linkDistance = 50 + Math.log10(nodeCount + 10) * 40;

      try {
        fgRef.current.d3Force('charge', (d3 as any).forceManyBody().strength(chargeStrength));
        fgRef.current.d3Force('link', (d3 as any).forceLink().distance(linkDistance));
        fgRef.current.d3Force('collide', (d3 as any).forceCollide().radius(15 + Math.log10(nodeCount + 10) * 3));
        fgRef.current.d3ReheatSimulation();
      } catch (e) {
        // Force configuration might fail, ignore
        console.debug('Force configuration:', e);
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [displayData, isPaused]);

  // Export graph as image
  const exportGraph = () => {
    if (fgRef.current) {
      const canvas = (fgRef.current as any).canvas();
      if (canvas) {
        const link = document.createElement('a');
        link.download = 'knowledge-graph.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    }
  };

  // Optimize link drawing
  const drawLink = useCallback((link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const start = link.source;
    const end = link.target;
    if (typeof start !== 'object' || typeof end !== 'object') return;

    const isHovered = hoveredNode && (start.id === hoveredNode || end.id === hoveredNode);
    
    // Performance optimization: Skip shadows at very small scales
    const shouldGlow = globalScale > 0.2;

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);

    const sourceColor = start.color && start.color !== '#141414' ? start.color : '#3b82f6';
    
    if (isHovered) {
      ctx.strokeStyle = '#D94126';
      ctx.lineWidth = 2 / globalScale;
      if (shouldGlow) {
        ctx.shadowBlur = 12 / globalScale;
        ctx.shadowColor = '#D94126';
      }
    } else {
      ctx.strokeStyle = `rgba(${hexToRgb(sourceColor)}, 0.4)`;
      ctx.lineWidth = 0.8 / globalScale;
      if (shouldGlow) {
        ctx.shadowBlur = 4 / globalScale;
        ctx.shadowColor = sourceColor;
      }
    }
    
    ctx.stroke();
    ctx.shadowBlur = 0;
  }, [hoveredNode]);

  return (
    <div className={`
      relative bg-editorial-bg
      ${isFullscreen ? 'fixed inset-0 z-50' : 'h-full'}
    `}>
      {/* Controls Panel */}
      <div className="absolute top-6 left-6 z-10 flex flex-col gap-2 p-1 bg-editorial-ink/5 border border-editorial-line rounded-full">
        <button
          onClick={handleZoomIn}
          className="p-2 text-editorial-ink/40 hover:text-editorial-accent transition-colors"
          title="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 text-editorial-ink/40 hover:text-editorial-accent transition-colors"
          title="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-4 h-px bg-editorial-line mx-auto" />
        <button
          onClick={handleReset}
          className="p-2 text-editorial-ink/40 hover:text-editorial-accent transition-colors"
          title="View All / Reset"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          onClick={togglePause}
          className={cn("p-2 transition-colors", isPaused ? "text-editorial-accent" : "text-editorial-ink/40 hover:text-editorial-accent")}
          title={isPaused ? "Resume" : "Pause"}
        >
          {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
        </button>
      </div>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="absolute top-6 right-6 z-10 bg-editorial-bg border border-editorial-line p-4 max-w-xs shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-[10px] font-bold text-editorial-ink/40 uppercase tracking-widest">Filter Archive</h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => {
                setFilterTag(null);
                if (isIsolated) resetGraph();
              }}
              className={cn(
                "text-[10px] px-2 py-0.5 border transition-colors font-medium",
                filterTag === null
                  ? 'bg-editorial-ink text-editorial-bg border-editorial-ink'
                  : 'border-editorial-line text-editorial-ink/60 hover:border-editorial-accent'
              )}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  setFilterTag(filterTag === tag ? null : tag);
                  if (isIsolated) resetGraph();
                }}
                className={cn(
                  "text-[10px] px-2 py-0.5 border transition-colors font-medium",
                  filterTag === tag
                    ? 'bg-editorial-ink text-editorial-bg border-editorial-ink'
                    : 'border-editorial-line text-editorial-ink/60 hover:border-editorial-accent'
                )}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Instructions overlay */}
      {!isFullscreen && (
        <div className="absolute bottom-20 right-6 z-10 bg-editorial-bg/80 backdrop-blur-sm border border-editorial-line px-4 py-3 text-[9px] font-bold uppercase tracking-widest text-editorial-ink/40 pointer-events-none">
          <div className="mb-2 text-editorial-ink/60">Interaction Guide</div>
          <div className="space-y-1">
            <div>• Drag to Position</div>
            <div>• Scroll to Zoom</div>
            <div>• Click to Isolate</div>
            <div>• Background to Reset</div>
          </div>
        </div>
      )}

      {/* Graph */}
      <ForceGraph2D
        key={isIsolated ? 'isolated' : 'full'}
        ref={fgRef}
        graphData={displayData}
        nodeLabel={(node: any) => `
          <div class="bg-editorial-ink text-editorial-bg px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest pointer-events-none shadow-sm">
            ${node.name}
          </div>
        `}
        nodeColor={(node: any) => {
          if (hoveredNode) {
            if (node.id === hoveredNode) return '#D94126'; // Terracotta accent
            if (adjacencyMap.get(hoveredNode)?.has(node.id)) return getCommunityColor(node.community);
            return 'rgba(20, 20, 20, 0.05)'; // Ghostly
          }
          if (node.id === selectedNodeId) return '#D94126';
          return getCommunityColor(node.community);
        }}
        nodeRelSize={4}
        linkCanvasObjectMode={() => 'after'}
        linkCanvasObject={drawLink}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        onBackgroundClick={handleBackgroundClick}
        enableNodeDrag={true}
        enableZoomInteraction={true}
        cooldownTicks={isPaused ? 0 : 50}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.4}
        warmupTicks={100}
        minZoom={0.01}
        maxZoom={10}
        onEngineStop={() => console.log('Graph engine stabilized')}
      />

      {/* Stats */}
      <div className="absolute bottom-6 left-6 z-10 bg-editorial-bg border border-editorial-line px-4 py-2 text-[9px] font-bold uppercase tracking-[0.2em] text-editorial-ink/40">
        {displayData.nodes.length} Entries · {displayData.links.length} Relations
      </div>

      {/* Note Info Panel */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-6 right-6 z-20 w-80 bg-editorial-bg shadow-2xl border border-editorial-line p-6"
          >
            <div className="flex justify-between items-start mb-6">
              <h3 className="font-display italic text-2xl text-editorial-ink leading-tight">
                {selectedNode.label}
              </h3>
              <button onClick={closeInfoPanel} className="text-editorial-ink/20 hover:text-editorial-accent transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedNode.tags && selectedNode.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-8">
                {selectedNode.tags.map((tag) => (
                  <span key={tag} className="text-[9px] font-bold uppercase tracking-widest text-editorial-accent border border-editorial-accent/20 px-2 py-0.5">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <button
              onClick={navigateToNote}
              className="w-full bg-editorial-ink text-editorial-bg py-3 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-editorial-accent transition-colors"
            >
              Review Entry
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper function to check if two nodes are connected
function isConnected(
  nodeId1: string,
  nodeId2: string,
  edges: Array<{ source: string; target: string }>
): boolean {
  return edges.some(
    (e) =>
      (e.source === nodeId1 && e.target === nodeId2) ||
      (e.source === nodeId2 && e.target === nodeId1)
  );
}

// Generate color based on tags
function getColorForTags(tags: string[] | undefined | null): string {
  // Ensure tags is an array and has at least one valid string tag
  if (!tags || !Array.isArray(tags) || tags.length === 0) {
    return '#666666';
  }

  // Filter out non-string tags
  const validTags = tags.filter((tag): tag is string => typeof tag === 'string');

  if (validTags.length === 0) {
    return '#666666';
  }

  const colors: Record<string, string> = {
    // Predefined colors for common tags
    javascript: '#f7df1e',
    typescript: '#3178c6',
    react: '#61dafb',
    nextjs: '#000000',
    python: '#3776ab',
    rust: '#000000',
    go: '#00add8',
    ai: '#10b981',
    business: '#f59e0b',
    saas: '#8b5cf6',
    documentation: '#06b6d4',
    security: '#ef4444',
    roadmap: '#ec4899',
    tech: '#3b82f6',
    app: '#8b5cf6',
    research: '#14b8a6',
    sales: '#22c55e',
    closing: '#eab308',
    objections: '#f97316',
    'follow-up': '#0ea5e9',
    'lead-gen': '#a855f7',
    negotiation: '#6366f1',
    growth: '#84cc16',
    'client-success': '#10b981',
    pricing: '#f59e0b',
    psychology: '#ec4899',
    // Default colors
    default: '#6366f1',
  };

  // Return color for first matching tag, or default
  for (const tag of validTags) {
    const key = tag.toLowerCase();
    if (colors[key]) return colors[key];
  }

  // Generate consistent color from tag string
  const firstTag = validTags[0];
  const hash = firstTag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 50%)`;
}

// Helper to convert hex to rgb string for rgba usage
function hexToRgb(hex: string): string {
  // Try to parse standard hex
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  // Fallback for hsl or named colors (simplification)
  return '100, 100, 100'; 
}