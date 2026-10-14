import { Task, Priority, Category, DashboardStats } from '../types';

export const getTodayStr = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Review System Architecture and Performance Benchmarks',
    description: 'Verify sub-millisecond sorting execution, memory allocations, and stress-test pipelines.',
    category: 'WORK',
    priority: 'HIGH',
    dueDate: getTodayStr(),
    completed: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'task-2',
    title: 'Audit CSV Data Persistence and Integrity',
    description: 'Ensure RFC 4180 quote escaping and atomic replacement protect against data loss.',
    category: 'PROJECTS',
    priority: 'HIGH',
    dueDate: getTodayStr(),
    completed: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'task-3',
    title: 'Finalize Infrastructure Deployment Checklist',
    description: 'Verify automated builds, edge routing, responsive layouts, and SSL certificates.',
    category: 'WORK',
    priority: 'MEDIUM',
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    completed: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'task-4',
    title: 'Quarterly Security & Access Permission Audit',
    description: 'Review admin role delegations, credential security, and environment variable hygiene.',
    category: 'WORK',
    priority: 'MEDIUM',
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    completed: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'task-5',
    title: 'Schedule Team Sync on Sprint Deliverables',
    description: 'Align task priority distribution, upcoming deadlines, and cross-functional dependencies.',
    category: 'COLLEGE',
    priority: 'LOW',
    dueDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    completed: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'task-6',
    title: 'Weekly Task Backlog Grooming & Clean-up',
    description: 'Archive completed items, reprioritize pending items, and log weekly velocity.',
    category: 'PERSONAL',
    priority: 'LOW',
    dueDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
    completed: true,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
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

export function isOverdue(task: Task, todayStr: string = getTodayStr()): boolean {
  if (task.completed || !task.dueDate) return false;
  return task.dueDate < todayStr;
}

export function isDueToday(task: Task, todayStr: string = getTodayStr()): boolean {
  if (task.completed || !task.dueDate) return false;
  return task.dueDate === todayStr;
}

export function calculateStats(tasks: Task[], todayStr: string = getTodayStr()): DashboardStats {
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

export function importRfc4180Csv(csvText: string): Task[] {
  const lines: string[] = [];
  let currentLine = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    if (char === '"') {
      insideQuotes = !insideQuotes;
      currentLine += char;
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && csvText[i + 1] === '\n') {
        i++;
      }
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) {
    lines.push(currentLine);
  }

  if (lines.length <= 1) return [];

  // Parse rows (ignoring header)
  const parseRow = (line: string): string[] => {
    const cells: string[] = [];
    let cell = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuote && line[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuote = !inQuote;
        }
      } else if (c === ',' && !inQuote) {
        cells.push(cell);
        cell = '';
      } else {
        cell += c;
      }
    }
    cells.push(cell);
    return cells;
  };

  const importedTasks: Task[] = [];
  for (let idx = 1; idx < lines.length; idx++) {
    const cells = parseRow(lines[idx]);
    if (cells.length < 2 || !cells[1].trim()) continue;

    const id = cells[0]?.trim() || `task-${Date.now()}-${idx}`;
    const title = cells[1]?.trim() || 'Untitled Task';
    const description = cells[2]?.trim() || '';
    
    const rawCategory = (cells[3]?.trim().toUpperCase() || 'OTHER') as Category;
    const category: Category = ['COLLEGE', 'PERSONAL', 'WORK', 'PROJECTS', 'OTHER'].includes(rawCategory)
      ? rawCategory
      : 'OTHER';

    const rawPriority = (cells[4]?.trim().toUpperCase() || 'MEDIUM') as Priority;
    const priority: Priority = ['HIGH', 'MEDIUM', 'LOW'].includes(rawPriority)
      ? rawPriority
      : 'MEDIUM';

    const dueDate = cells[5]?.trim() || '';
    const completed = cells[6]?.trim().toLowerCase() === 'true';
    const createdAt = cells[7]?.trim() || new Date().toISOString();

    importedTasks.push({
      id,
      title,
      description,
      category,
      priority,
      dueDate,
      completed,
      createdAt
    });
  }

  return importedTasks;
}
