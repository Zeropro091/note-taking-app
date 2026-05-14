// API route for Project Cockpit analytics
import { NextRequest, NextResponse } from 'next/server';
import { getAllNotes } from '@/lib/file-system';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const notes = await getAllNotes();
    
    // Filter for projects: category 'project' or tag 'project'
    const projectNotes = notes.filter(note => 
      note.frontmatter?.category === 'project' || 
      note.tags.map(t => t.toLowerCase()).includes('project')
    );

    const cockpitData = projectNotes.map(note => {
      const content = note.content || '';
      
      // Parse tasks: - [ ] and - [x]
      const tasks = content.match(/- \[( |x)\] .+/gi) || [];
      const completedTasks = tasks.filter(task => /- \[x\]/i.test(task));
      
      const progress = tasks.length > 0 
        ? Math.round((completedTasks.length / tasks.length) * 100) 
        : 0;

      // Extract uncompleted tasks for "Immediate Actions"
      const pendingTasks = tasks
        .filter(task => /- \[ \] /i.test(task))
        .map(task => task.replace(/- \[ \] /i, '').trim());

      // Health tracking: Stale if not updated in 7 days
      const lastUpdated = new Date(note.updatedAt);
      const now = new Date();
      const diffDays = Math.ceil(Math.abs(now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
      const status = diffDays > 7 ? 'stale' : (note.frontmatter?.status || 'active');

      return {
        id: note.id,
        title: note.title,
        path: note.path,
        progress,
        taskCount: tasks.length,
        completedCount: completedTasks.length,
        pendingTasks: pendingTasks.slice(0, 3), // Top 3 tasks
        priority: note.frontmatter?.priority || 'medium',
        deadline: note.frontmatter?.deadline || null,
        lastUpdated: note.updatedAt,
        status,
        health: diffDays > 7 ? 'at-risk' : 'healthy',
      };
    });

    // Sort by priority (high first) then by progress (desc)
    cockpitData.sort((a, b) => {
      const priorityMap: Record<string, number> = { high: 3, medium: 2, low: 1 };
      const aPrio = priorityMap[a.priority as string] || 0;
      const bPrio = priorityMap[b.priority as string] || 0;
      
      if (aPrio !== bPrio) return bPrio - aPrio;
      return b.progress - a.progress;
    });

    return NextResponse.json({
      success: true,
      projects: cockpitData,
    });
  } catch (error) {
    console.error('Error fetching cockpit data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cockpit analytics' },
      { status: 500 }
    );
  }
}
