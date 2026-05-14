# Design Spec: Semantic Brain Bridges

**Status:** Draft
**Date:** 2026-03-19
**Topic:** Semantic "Brain Bridges" (AI Connection Discovery)

## 1. Overview
The "Semantic Brain Bridges" feature transforms the note-taking app from a passive library into an active "Second Brain." It proactively suggests connections between the current note and existing notes using semantic vector similarity, helping users bridge the gap between deep research and daily tasks.

## 2. Architecture & Logic

### 2.1 Hybrid Intelligent Pulse
- **Frequency:** Suggestions refresh every 20 seconds.
- **Trigger Condition:** Update only fires if the content length has changed by >= 50 characters since the last pulse.
- **Engine:** Utilizes the existing `semanticSearch` in `src/lib/vector-store.ts` via Gemini embeddings.

### 2.2 Suggestion Filtering
- **Relevance Threshold:** Only suggest notes with a cosine similarity score > 0.8.
- **Exclusion:** Automatically filter out notes already linked via wikilinks (`[[link]]`) or direct tags.
- **Limit:** Show top 3-5 high-confidence bridges to maintain "Editorial" restraint.

## 3. UI/UX Design

### 3.1 Placement
- **Location:** Right Sidebar, beneath the "Backlinks" (Context) panel.
- **New Component:** `BridgesPanel.tsx`.

### 3.2 Visual Style
- **Aesthetic:** "Editor's Notes" or "Citations."
- **Typography:** Italicized excerpts with subtle, high-contrast labels.
- **Transitions:** Use `framer-motion` for smooth, quiet entries as new bridges are discovered.

### 3.3 Interactions
- **Preview:** Clicking a bridge shows a small popup/hover with more context.
- **Connect:** A subtle "Bridge" button to automatically append a wikilink to the bottom of the current note.
- **Teleport:** A button to navigate directly to the suggested note.

## 4. Technical Requirements

### 4.1 API Endpoints
- `POST /api/ai/bridges`: Accepts the current note content and returns semantically similar notes that are not already linked.

### 4.2 State Management
- A new `useBridges` hook to manage the polling logic and state within the `NoteEditor` and its parent layouts.

## 5. Testing Strategy
- **Unit Tests:** Verify the filtering logic (ensure no duplicate links are suggested).
- **Integration Tests:** Mock Gemini API responses to verify the "Pulse" trigger works at 20s intervals with character-count gating.
