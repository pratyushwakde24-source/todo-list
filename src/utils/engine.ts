import { Task, Priority, Category, DashboardStats } from '../types';

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Complete Data Structures assignment',
    description: 'Implement Red-Black tree deletion and benchmark search latency.',
    category: 'COLLEGE',
    priority: 'HIGH',
    dueDate: '2026-10-15',
    completed: false,
    createdAt: '2026-10-14T09:00:00'
  },
  {
    id: 'task-2',
    title: 'Prepare Java practical demonstration',
    description: 'Walk through ProcessBuilder IPC architecture and RFC 4180 CSV parser.',
    category: 'COLLEGE',
    priority: 'MEDIUM',
    dueDate: '2026-10-14',
    completed: false,
    createdAt: '2026-10-14T09:15:00'
  },
  {
    id: 'task-3',
    title: 'Submit Final Project Report',
    description: 'Compile IEEE format project report, system architecture diagrams, and test results.',
    category: 'PROJECTS',
    priority: 'HIGH',
    dueDate: '2026-10-17',
    completed: false,
    createdAt: '2026-10-14T09:30:00'
  },
  {
    id: 'task-4',
    title: 'Review OS synchronization lecture',
    description: 'Revise semaphores, mutex locks, and inter-process message passing.',
    category: 'COLLEGE',
    priority: 'MEDIUM',
    dueDate: '2026-10-18',
    completed: false,
    createdAt: '2026-10-14T09:45:00'
  },
  {
    id: 'task-5',
    title: 'Organize personal study notes',
    description: 'Sort semester revision flashcards into binders.',
    category: 'PERSONAL',
    priority: 'LOW',
    dueDate: '2026-10-21',
    completed: false,
    createdAt: '2026-10-14T10:00:00'
  },
  {
    id: 'task-6',
    title: 'Submit Lab Assistant Timesheet',
    description: 'Log university research lab assistant hours for the academic week.',
    category: 'WORK',
    priority: 'MEDIUM',
    dueDate: '2026-10-12',
    completed: false,
    createdAt: '2026-10-14T08:00:00'
  },
  {
    id: 'task-7',
    title: 'Set up Git repository for presentation',
    description: 'Initialize clean commit history and tag presentation-ready release v1.0.',
    category: 'PROJECTS',
    priority: 'MEDIUM',
    dueDate: '2026-10-13',
    completed: true,
    createdAt: '2026-10-13T16:00:00'
  }
];

export function priorityRank(p: Priority): number {
  switch (p) {
    case 'HIGH': return 3;
    case 'MEDIUM': return 2;
    case 'LOW': return 1;
    default: return 0;
  }
}

export function isOverdue(task: Task, todayStr: string = '2026-10-14'): boolean {
  if (task.completed || !task.dueDate) return false;
  return task.dueDate < todayStr;
}

export function isDueToday(task: Task, todayStr: string = '2026-10-14'): boolean {
  if (task.completed || !task.dueDate) return false;
  return task.dueDate === todayStr;
}

export function calculateStats(tasks: Task[], todayStr: string = '2026-10-14'): DashboardStats {
  const total = tasks.length;
  let completed = 0;
  let pending = 0;
  let overdue = 0;
  let dueToday = 0;
  let highPriorityPending = 0;

  for (const t of tasks) {
    if (t.completed) {
      completed++;
    } else {
      pending++;
      if (t.priority === 'HIGH') highPriorityPending++;
      if (isOverdue(t, todayStr)) overdue++;
      if (isDueToday(t, todayStr)) dueToday++;
    }
  }

  const completionPercentage = total > 0 ? (completed / total) * 100 : 0;

  return {
    totalTasks: total,
    completedTasks: completed,
    pendingTasks: pending,
    overdueTasks: overdue,
    dueTodayTasks: dueToday,
    highPriorityPending,
    completionPercentage: Math.round(completionPercentage * 10) / 10
  };
}

export function exportRfc4180Csv(tasks: Task[]): string {
  const escapeCell = (val: string) => {
    if (!val) return '';
    if (val.includes(',') || val.includes('"') || val.includes('\n') || val.includes('\r')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const header = 'id,title,description,category,priority,dueDate,completed,createdAt';
  const rows = tasks.map(t => [
    escapeCell(t.id),
    escapeCell(t.title),
    escapeCell(t.description),
    t.category,
    t.priority,
    escapeCell(t.dueDate),
    t.completed,
    escapeCell(t.createdAt)
  ].join(','));

  return [header, ...rows].join('\n');
}
