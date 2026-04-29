# Knowledge Graph Note-Taking App

A powerful, editorial-style note-taking application built with Next.js, featuring an interactive network graph visualization for exploring connections between your thoughts, ideas, and projects.

## 🌟 Key Features

- **Interactive Knowledge Graph:** Visualize the relationships between your notes using a force-directed graph. 
  - Connections are built dynamically from shared tags, markdown wikilinks, and semantic themes.
  - Hover over nodes to see direct connections with a highlighted path (connections shown in high-contrast solid black for maximum clarity).
  - Isolate specific nodes and their immediate neighbors to focus on specific topics.
- **Editorial Design System:** Clean, typography-focused aesthetic reminiscent of print media, featuring warm paper backgrounds, sharp borders, and dark ink typography, plus a seamless dark mode.
- **Markdown Support:** Full markdown rendering using `react-markdown` with GitHub Flavored Markdown (GFM) support.
- **Backlink Tracking:** Automatically discovers and tracks bidirectional links between notes, displaying them alongside the note content.
- **Tag Management:** Filter your entire graph and note collection by specific tags.
- **Performance Optimized:** Utilizes React's `useMemo`, parallel API fetching, and O(1) adjacency map lookups for a smooth experience even with hundreds of connected nodes.

## 🛠️ Technology Stack

- **Framework:** Next.js 16+ (App Router)
- **UI Library:** React 19
- **Styling:** Tailwind CSS v4 + Tailwind Animate + Shadcn UI
- **Graph Visualization:** `react-force-graph-2d` + `d3-force`
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Markdown:** `react-markdown`, `remark-gfm`, `rehype-sanitize`

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm, pnpm, yarn, or bun

### Installation

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone https://github.com/Zeropro091/note-taking-app.git
   cd note-taking-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```
   *Note: The application is configured to run on port `3005` by default to avoid conflicts.*

4. **Open your browser** and navigate to [http://localhost:3005](http://localhost:3005).

## 📂 Project Structure

```text
src/
├── app/                  # Next.js App Router (pages, layouts, API routes)
│   ├── api/              # Backend API endpoints (notes, graph, backlinks)
│   ├── globals.css       # Global styles and editorial color variables
│   └── page.tsx          # Main dashboard application logic
├── components/           # Reusable React components
│   ├── editor/           # Markdown preview and editor components
│   ├── graph/            # ForceGraph2D implementation (GraphView)
│   ├── panels/           # Sidebar, Outline, and Backlink panels
│   └── ui/               # Shadcn UI primitive components
├── lib/                  # Utility functions
│   ├── graph.ts          # Core logic for building node edges and calculating backlinks
│   ├── markdown.ts       # Utilities for parsing wikilinks and extracting tags
│   └── utils.ts          # Tailwind class merging utility
└── types/                # TypeScript type definitions
```

## 🧠 Using the Knowledge Graph

The graph automatically builds relationships based on your notes' content:
- **Wikilinks:** Writing `[[Node ID]]` in your markdown content will create a direct, strong link.
- **Shared Tags:** Notes sharing specific, non-generic tags are automatically clustered together.
- **Themes:** Projects and Business ideas are categorized and connected intelligently.

**Graph Controls:**
- **Scroll:** Zoom in/out
- **Drag:** Pan around the canvas or move specific nodes to restructure
- **Click Node:** View node details and navigate to the note
- **Sparkles Button:** Enter "Focus Mode" to isolate a selected node and its immediate neighbors
- **Play/Pause:** Toggle the physics simulation
- **Download:** Export the current graph view as a PNG image

## 📄 License

This project is licensed under the MIT License.
