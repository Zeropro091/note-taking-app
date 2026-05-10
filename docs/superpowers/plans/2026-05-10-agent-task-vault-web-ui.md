# Agent Task Vault Web UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Web UI dashboard for the Agent Task Vault and the discovery engine to manage AI agent file locks across projects.

**Architecture:** A new Next.js route (`/vault`) leveraging server actions to read/write Markdown files in `data/notes/agent-vault/`. The UI will use Tailwind CSS and existing `lucide-react` icons, adhering to the "impeccable" editorial design system (monochrome, high-contrast, clean).

**Tech Stack:** Next.js (App Router), React, Tailwind CSS 4, Node.js `fs` module, `gray-matter`.

---

### Task 1: Create the Vault Data Access Layer

**Files:**
- Create: `src/lib/vault.ts`

- [ ] **Step 1: Write the implementation**
```typescript
import fs from 'fs';
import path from 'path';

const VAULT_DIR = path.join(process.cwd(), 'data/notes/agent-vault');
const REGISTRY_FILE = path.join(VAULT_DIR, '_registry.md');

export interface VaultTask {
  agent: string;
  description: string;
  lockedPaths: string[];
  startTime: string;
  status: string;
}

export interface ProjectVault {
  name: string;
  status: string;
  activeTasks: VaultTask[];
}

export async function getRegistry(): Promise<{ name: string, path: string }[]> {
  if (!fs.existsSync(REGISTRY_FILE)) return [];
  const content = await fs.promises.readFile(REGISTRY_FILE, 'utf8');
  const lines = content.split('\n');
  const projects = [];
  for (const line of lines) {
    const match = line.match(/-\s+\*\*([^]+)\*\*:\s+`([^]+)`/);
    if (match) {
      projects.push({ name: match[1], path: match[2] });
    }
  }
  return projects;
}

export async function getProjectVault(projectName: string): Promise<ProjectVault | null> {
  const vaultFile = path.join(VAULT_DIR, `${projectName}.md`);
  if (!fs.existsSync(vaultFile)) return null;
  
  // Minimal parser for the specific markdown format
  const content = await fs.promises.readFile(vaultFile, 'utf8');
  const statusMatch = content.match(/## Status:\s+(.+)/);
  const status = statusMatch ? statusMatch[1] : 'Unknown';
  
  // Extract active agents section
  const activeTasks: VaultTask[] = [];
  const agentBlocks = content.split('### Agent:');
  agentBlocks.shift(); // Remove the part before the first agent
  
  for (const block of agentBlocks) {
    const lines = block.trim().split('\n');
    const agentName = lines[0].trim();
    let description = '';
    const lockedPaths: string[] = [];
    let startTime = '';
    let taskStatus = '';
    
    for (const line of lines) {
      if (line.startsWith('- **Task**:')) description = line.replace('- **Task**: ', '').trim();
      if (line.startsWith('- **Start Time**:')) startTime = line.replace('- **Start Time**: ', '').trim();
      if (line.startsWith('- **Status**:')) taskStatus = line.replace('- **Status**: ', '').trim();
      if (line.trim().startsWith('- `')) lockedPaths.push(line.replace('- `', '').replace('`', '').trim());
    }
    
    activeTasks.push({ agent: agentName, description, lockedPaths, startTime, status: taskStatus });
  }
  
  return { name: projectName, status, activeTasks };
}

export async function scanForProjects(baseDir: string): Promise<string[]> {
  // Simplified scan for immediate children with package.json
  const discovered = [];
  try {
    const entries = await fs.promises.readdir(baseDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        const pkgPath = path.join(baseDir, entry.name, 'package.json');
        if (fs.existsSync(pkgPath)) {
          discovered.push(entry.name);
        }
      }
    }
  } catch (error) {
    console.error('Scan error:', error);
  }
  return discovered;
}
```

- [ ] **Step 2: Commit**
```bash
git add src/lib/vault.ts
git commit -m "feat(vault): add data access layer for agent vault markdown files"
```

### Task 2: Create Server Actions for Vault

**Files:**
- Create: `src/app/vault/actions.ts`

- [ ] **Step 1: Write the implementation**
```typescript
'use server';

import fs from 'fs';
import path from 'path';
import { scanForProjects, getRegistry } from '@/lib/vault';
import { revalidatePath } from 'next/cache';

const VAULT_DIR = path.join(process.cwd(), 'data/notes/agent-vault');
const REGISTRY_FILE = path.join(VAULT_DIR, '_registry.md');

export async function discoverProjectsAction() {
  const baseDir = path.resolve(process.cwd(), '..'); // Assuming C:\Users\Putu Ari\
  const discovered = await scanForProjects(baseDir);
  const existing = await getRegistry();
  const existingNames = new Set(existing.map(p => p.name));
  
  let addedCount = 0;
  let registryContent = fs.existsSync(REGISTRY_FILE) 
    ? await fs.promises.readFile(REGISTRY_FILE, 'utf8')
    : '# Agent Task Vault Registry\n\n## Registered Projects\n';

  for (const proj of discovered) {
    if (!existingNames.has(proj)) {
      registryContent += `- **${proj}**: \`${path.join(baseDir, proj)}\`\n`;
      
      // Create empty project vault file
      const projFile = path.join(VAULT_DIR, `${proj}.md`);
      if (!fs.existsSync(projFile)) {
        await fs.promises.writeFile(projFile, `# ${proj}\n\n## Status: Idle\n\n## Active Agents\n\n## Completed Tasks Archive\n`);
      }
      addedCount++;
    }
  }

  if (addedCount > 0) {
    await fs.promises.writeFile(REGISTRY_FILE, registryContent);
  }

  revalidatePath('/vault');
  return { success: true, added: addedCount };
}
```

- [ ] **Step 2: Commit**
```bash
git add src/app/vault/actions.ts
git commit -m "feat(vault): add server actions for project discovery"
```

### Task 3: Build the Vault Dashboard Page

**Files:**
- Create: `src/app/vault/page.tsx`
- Modify: `src/app/page.tsx:1-100` (Add link to vault)

- [ ] **Step 1: Write the implementation**
```tsx
import { getRegistry, getProjectVault, ProjectVault } from '@/lib/vault';
import { discoverProjectsAction } from './actions';
import { ShieldAlert, Search, Server, Activity, FolderGit2 } from 'lucide-react';
import Link from 'next/link';

export default async function VaultPage() {
  const registry = await getRegistry();
  const projects: ProjectVault[] = [];
  
  for (const reg of registry) {
    const p = await getProjectVault(reg.name);
    if (p) projects.push(p);
  }

  return (
    <div className="min-h-screen bg-editorial-bg text-editorial-ink font-sans p-8">
      <header className="max-w-4xl mx-auto mb-12 flex justify-between items-end border-b border-editorial-line pb-4">
        <div>
          <div className="flex items-center gap-3 mb-2 text-editorial-accent">
            <ShieldAlert className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">System Intelligence</span>
          </div>
          <h1 className="font-display text-3xl font-medium tracking-tight">Agent Task Vault</h1>
        </div>
        
        <div className="flex gap-4">
          <Link href="/" className="px-4 py-2 text-sm border border-editorial-line hover:bg-editorial-ink/5 transition-colors">
            Back to Notes
          </Link>
          <form action={discoverProjectsAction}>
            <button type="submit" className="bg-editorial-ink text-editorial-bg px-4 py-2 text-sm font-medium hover:opacity-90 flex items-center gap-2">
              <Search className="w-4 h-4" />
              Discover Projects
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-4xl mx-auto grid gap-8">
        {projects.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-editorial-line">
            <FolderGit2 className="w-8 h-8 mx-auto mb-4 text-editorial-ink/40" />
            <p className="text-editorial-ink/60">No projects registered. Run discovery scan.</p>
          </div>
        ) : (
          projects.map(project => (
            <section key={project.name} className="border border-editorial-line bg-editorial-bg shadow-sm">
              <div className="px-6 py-4 border-b border-editorial-line flex justify-between items-center bg-editorial-ink/5">
                <h2 className="font-medium flex items-center gap-2">
                  <Server className="w-4 h-4 text-editorial-ink/60" />
                  {project.name}
                </h2>
                <span className="text-xs px-2 py-1 bg-editorial-bg border border-editorial-line">
                  Status: {project.status}
                </span>
              </div>
              
              <div className="p-6">
                {project.activeTasks.length === 0 ? (
                  <p className="text-sm text-editorial-ink/60 italic">No active agents.</p>
                ) : (
                  <div className="space-y-6">
                    {project.activeTasks.map((task, idx) => (
                      <div key={idx} className="border-l-2 border-editorial-accent pl-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Activity className="w-4 h-4 text-editorial-accent" />
                          <h3 className="font-medium text-sm">{task.agent}</h3>
                          <span className="text-[10px] text-editorial-ink/40">{task.startTime}</span>
                        </div>
                        <p className="text-sm mb-3">{task.description}</p>
                        
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-editorial-ink/60 mb-2">Locked Paths</p>
                          <ul className="space-y-1">
                            {task.lockedPaths.map(path => (
                              <li key={path} className="text-xs font-mono bg-editorial-ink/5 px-2 py-1 inline-block mr-2 border border-editorial-line/50">
                                {path}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          ))
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Add Link to Main Page Header**
Modify `src/app/page.tsx`. Find the `<header>` section (around line 300) and add a link to the vault next to the Terminal button.

```tsx
import { ShieldAlert } from 'lucide-react'; // Add this to imports at top
import Link from 'next/link'; // Add this to imports if missing

// Inside the header div.flex.items-center.gap-4:
            <button
              onClick={() => setTerminalOpen(!terminalOpen)}
              className={cn("p-1 transition-colors", terminalOpen ? "text-editorial-accent" : "text-editorial-ink/40 hover:text-editorial-ink/60")}
              title="Toggle terminal"
            >
              <TerminalIcon className="w-4 h-4" />
            </button>
            <div className="w-px h-3 bg-editorial-line" />
            <Link
              href="/vault"
              className="p-1 text-editorial-ink/40 hover:text-editorial-ink/60 transition-colors"
              title="Agent Task Vault"
            >
              <ShieldAlert className="w-4 h-4" />
            </Link>
            <div className="w-px h-3 bg-editorial-line" />
```

- [ ] **Step 3: Commit**
```bash
git add src/app/vault/page.tsx src/app/page.tsx
git commit -m "feat(vault): build vault dashboard ui and link from main header"
```
