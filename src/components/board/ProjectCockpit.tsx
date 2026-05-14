'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rocket, 
  Activity, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Circle,
  ArrowRight,
  TrendingUp,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectAnalytics {
  id: string;
  title: string;
  path: string;
  progress: number;
  taskCount: number;
  completedCount: number;
  pendingTasks: string[];
  priority: string;
  deadline: string | null;
  lastUpdated: string;
  status: string;
  health: 'healthy' | 'at-risk' | 'stale';
}

interface ProjectCockpitProps {
  onProjectSelect: (path: string) => void;
}

export default function ProjectCockpit({ onProjectSelect }: ProjectCockpitProps) {
  const [projects, setProjects] = useState<ProjectAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch('/api/cockpit');
        const data = await res.json();
        if (data.success) {
          setProjects(data.projects);
        }
      } catch (err) {
        console.error('Failed to fetch cockpit data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  const totalTasks = projects.reduce((acc, p) => acc + p.taskCount, 0);
  const completedTasks = projects.reduce((acc, p) => acc + p.completedCount, 0);
  const avgProgress = projects.length > 0 
    ? Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / projects.length) 
    : 0;

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-editorial-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-editorial-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-editorial-ink/40">Syncing Cockpit...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-editorial-bg overflow-y-auto custom-scrollbar">
      {/* Cockpit Header */}
      <div className="px-8 pt-12 pb-8 border-b border-editorial-line bg-editorial-ink/[0.02]">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-editorial-accent text-editorial-bg">
              <Rocket className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display text-4xl font-medium tracking-tight">Project Cockpit</h1>
              <p className="text-xs uppercase tracking-[0.3em] text-editorial-ink/40 font-bold mt-1">Operational Command Center</p>
            </div>
          </div>

          {/* High Level Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="border-l-2 border-editorial-line pl-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-editorial-ink/40 mb-2 flex items-center gap-2">
                <Target className="w-3 h-3" /> Active Deployments
              </p>
              <p className="text-3xl font-display italic">{projects.length}</p>
            </div>
            <div className="border-l-2 border-editorial-line pl-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-editorial-ink/40 mb-2 flex items-center gap-2">
                <Activity className="w-3 h-3" /> Brain Throughput
              </p>
              <p className="text-3xl font-display italic">{avgProgress}% <span className="text-xs font-sans not-italic text-editorial-ink/40 ml-2">Avg Progress</span></p>
            </div>
            <div className="border-l-2 border-editorial-line pl-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-editorial-ink/40 mb-2 flex items-center gap-2">
                <Clock className="w-3 h-3" /> Task Velocity
              </p>
              <p className="text-3xl font-display italic">{completedTasks}/{totalTasks} <span className="text-xs font-sans not-italic text-editorial-ink/40 ml-2">Units Resolved</span></p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-12 max-w-6xl mx-auto">
        {/* Project Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {projects.map((project) => (
            <motion.div
              key={project.id}
              whileHover={{ y: -4 }}
              className="border border-editorial-line bg-editorial-bg p-6 group transition-all hover:shadow-xl relative overflow-hidden"
              onClick={() => onProjectSelect(project.path)}
            >
              {/* Status Ribbon */}
              <div className={cn(
                "absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 rotate-45 flex items-end justify-center pb-1",
                project.health === 'healthy' ? "bg-green-500/10" : project.health === 'at-risk' ? "bg-red-500/10" : "bg-editorial-ink/10"
              )}>
                <span className={cn(
                  "text-[8px] font-bold uppercase tracking-widest",
                  project.health === 'healthy' ? "text-green-600" : project.health === 'at-risk' ? "text-red-600" : "text-editorial-ink/40"
                )}>
                  {project.health}
                </span>
              </div>

              <div className="flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                  <div className="max-w-[80%]">
                    <h3 className="font-display text-xl font-bold leading-tight group-hover:text-editorial-accent transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-editorial-ink/30 mt-2">
                      Priority: {project.priority} • {project.status}
                    </p>
                  </div>
                </div>

                {/* Progress Visual */}
                <div className="mb-8">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-editorial-ink/40">Deployment Progress</span>
                    <span className="text-lg font-display italic">{project.progress}%</span>
                  </div>
                  <div className="h-1 bg-editorial-line w-full">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${project.progress}%` }}
                      className="h-full bg-editorial-accent"
                    />
                  </div>
                </div>

                {/* Immediate Actions */}
                <div className="flex-1 border-t border-editorial-line pt-6">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-editorial-ink/40 mb-4 flex items-center gap-2">
                    <AlertCircle className="w-3 h-3" /> Immediate Actions
                  </p>
                  <div className="space-y-3">
                    {project.pendingTasks.length > 0 ? (
                      project.pendingTasks.map((task, idx) => (
                        <div key={idx} className="flex items-start gap-2 group/item cursor-pointer">
                          <Circle className="w-3 h-3 text-editorial-line mt-0.5 group-hover/item:text-editorial-accent transition-colors" />
                          <p className="text-[11px] text-editorial-ink/70 group-hover/item:text-editorial-ink transition-colors leading-tight truncate">
                            {task}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center gap-2 text-editorial-ink/20 italic py-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-[11px]">All systems nominal. No pending tasks.</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 flex justify-between items-center">
                  <p className="text-[9px] font-bold text-editorial-ink/30 uppercase tracking-widest">
                    Last Sync: {new Date(project.lastUpdated).toLocaleDateString()}
                  </p>
                  <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-editorial-accent hover:gap-3 transition-all">
                    Open Entry <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Empty State */}
          {projects.length === 0 && (
            <div className="col-span-full border-2 border-dashed border-editorial-line p-12 text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-10" />
              <h3 className="font-display text-2xl italic text-editorial-ink/20">No active projects detected.</h3>
              <p className="text-[10px] uppercase tracking-widest text-editorial-ink/30 mt-2">
                Tag notes with #project to bring them into the cockpit.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
