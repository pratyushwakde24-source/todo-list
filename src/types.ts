export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';
export type Category = 'COLLEGE' | 'PERSONAL' | 'WORK' | 'PROJECTS' | 'OTHER';

export interface Task {
  id: string;
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  dueDate: string; // YYYY-MM-DD
  completed: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  dueTodayTasks: number;
  highPriorityPending: number;
  completionPercentage: number;
}

export interface IpcLogEntry {
  timestamp: string;
  action: string;
  requestPayload: string;
  responsePayload: string;
  latencyMs: number;
  status: 'SUCCESS' | 'ERROR';
}
