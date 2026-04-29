# 🏛️ Technical Architecture

This document describes the underlying architecture, data flow, and components of the Knowledge Graph Note-Taking App.

## 1. System Overview

The application is built on a modern, React-based stack using Next.js 16 (App Router) for both frontend rendering and backend API routes. The primary purpose of the application is to read, parse, and visualize markdown-based notes stored in the local file system.

### Core Stack
*   **Next.js (App Router):** Handles routing, server-side data fetching, and API endpoints.
*   **React 19:** Core UI library, utilizing modern hooks (`useMemo`, `useCallback`) for performance optimization.
*   **Tailwind CSS v4:** Utility-first CSS framework for styling, implementing an "editorial" design system.
*   **React Force Graph 2D:** Wrapper around `d3-force` for rendering the interactive network graph on an HTML5 canvas.

## 2. Data Flow

### Note Storage & Parsing
Notes are stored as physical `.md` files in a designated data directory. 
1.  **Reading:** The backend (`src/app/api/notes/route.ts`) reads these files using Node.js `fs` and `path` modules.
2.  **Parsing:** Content is parsed using `gray-matter` (for frontmatter metadata like tags and dates) and custom regular expressions to extract `[[Wikilinks]]` and structure.
3.  **Graph Construction:** `src/lib/graph.ts` processes all notes to build the `GraphData` object (`nodes` and `edges`). It categorizes connections based on explicit links, shared tags, and implicit semantic themes.

### API Layer
*   `GET /api/notes`: Returns a lightweight list of all notes (metadata only).
*   `GET /api/notes/[id]`: Returns the full content and metadata of a specific note.
*   `GET /api/graph`: Returns the fully constructed `nodes` and `edges` arrays.
*   `GET /api/backlinks/[id]`: Calculates and returns notes that link *to* the specified note.

### State Management
The main application state is managed in `src/app/page.tsx` using React `useState` and optimized with `useMemo`.
*   Data fetching is parallelized (`Promise.all`) to reduce load times.
*   The `fileTree` state is derived from `notes` and memoized to prevent unnecessary recalculations.

## 3. Graph Component Architecture (`GraphView.tsx`)

The `GraphView` component is the most complex part of the frontend, responsible for rendering the force-directed graph.

### Performance Optimizations
*   **Adjacency Map:** An O(1) lookup map is built using `useMemo` to instantly check if two nodes are connected. This replaces O(E) array lookups during the `nodeColor` rendering loop, drastically improving frame rates on hover.
*   **Memoized Data Sets:** Filtered `currentData` and isolated sub-graphs (`isolatedData`) are memoized.
*   **Physics Tuning:** `d3AlphaDecay` and `cooldownTicks` are tuned to quickly stabilize the graph and stop background CPU usage when the simulation settles.

### Interaction Features
*   **Focus Mode (Isolation):** When a user clicks the "Sparkles" button or isolates a node, the graph filters out all nodes except the selected node and its immediate neighbors (Degree 1 connections).
*   **Tag Filtering:** The interface allows filtering the graph by specific tags.
*   **Export:** Users can download the current canvas state as a PNG.

## 4. Styling & Theming

The application uses an "Editorial" design system defined in `src/app/globals.css`.
*   Instead of standard web colors, it uses print-inspired terminology: `editorial-bg` (warm paper), `editorial-ink` (dark text), and `editorial-accent` (terracotta highlight).
*   Dark mode is supported by inverting these CSS variables under the `.dark` class.
*   The graph's connection lines are explicitly set to `#000000` (black) for maximum contrast and readability against the background.
