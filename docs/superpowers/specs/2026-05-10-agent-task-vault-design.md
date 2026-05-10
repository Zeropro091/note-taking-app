# Design: Agent Task Vault

## 1. Overview
The Agent Task Vault is a centralized intelligence system that tracks AI agent activity, manages task assignments, and prevents file mutation conflicts across the user's workspace. It serves as a unified command center, consisting of a Web UI and a Markdown-based data layer.

## 2. Architecture

### 2.1 The Data Layer (Markdown Vault)
Located within the existing note-taking app structure to leverage its organization: `data/notes/agent-vault/`
*   `_registry.md`: The master index of discovered projects and their absolute paths.
*   `[project-name].md`: Individual project files containing current active tasks, locked files, and agent assignments.
*   *Conflict Resolution:* The system relies on atomic file reads by the AI agent before execution.

### 2.2 The Web App Interface
A new route integrated into the existing `note-taking-app` (e.g., `/vault` or `/tasks`).
*   **Dashboard View:** Displays all active projects, assigned agents, and locked files.
*   **Discovery Engine:** A button/action to scan the user directory (`C:\Users\Putu Ari\`) for undiscovered projects and append them to `_registry.md`.
*   **Task Assignment UI:** Forms to register a new task, define the scope, and explicitly lock specific files or directories.

### 2.3 Agent Protocol Integration
Global system update to enforce the vault protocol.
*   Modify `C:\Users\Putu Ari\.gemini\gemini.md` (The Master Profile).
*   **Pre-Flight Mandate:** Before executing a file modification tool, the agent MUST read the target project's vault file.
*   **Conflict Handling:** If a file is listed as locked by another active task, the agent MUST pause and request user override.
*   **State Syncing:** Agents are responsible for updating their status in the vault file upon task completion.

## 3. Data Flow
1. User defines a task and locks files via the Web App.
2. The Web App writes the lock state to `data/notes/agent-vault/[project].md`.
3. An AI Agent receives a prompt to work on `[project]`.
4. Agent reads `gemini.md`, which mandates checking the vault.
5. Agent reads `data/notes/agent-vault/[project].md`.
6. If no conflict, agent proceeds. If conflict, agent halts and asks user.
7. Upon completion, agent updates `[project].md` to release locks.

## 4. Implementation Constraints
*   The UI must follow the established "impeccable" editorial design system of the note-taking app.
*   The system must use existing UI components (shadcn/ui, lucide-react) where possible.
*   Vault files must remain human-readable Markdown.