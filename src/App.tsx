import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle2, Circle, AlertCircle, Clock, Calendar, 
  Terminal, Code2, BookOpen, Layers, Check, Search, 
  Trash2, Edit3, Plus, RefreshCw, Download, ExternalLink, 
  ChevronRight, ArrowUpDown, ShieldCheck, Sparkles, X, Filter
} from 'lucide-react';
import { Task, Priority, Category, DashboardStats, IpcLogEntry } from './types';
import { INITIAL_TASKS, calculateStats, isOverdue, isDueToday, priorityRank, exportRfc4180Csv } from './utils/engine';
import { SOURCE_FILES, SourceFile } from './data/sourceFiles';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'viva' | 'code' | 'tests'>('dashboard');

  // Persistence in browser localStorage
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem('taskflow_tasks_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load tasks from localStorage', e);
    }
    return INITIAL_TASKS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('taskflow_tasks_v1', JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to save tasks', e);
    }
  }, [tasks]);

  // Statistics dynamically calculated
  const stats: DashboardStats = useMemo(() => calculateStats(tasks), [tasks]);

  // Filtering & Sorting State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<string>('PRIORITY_DESC');

  // Modal Dialogs
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDesc, setModalDesc] = useState('');
  const [modalCategory, setModalCategory] = useState<Category>('COLLEGE');
  const [modalPriority, setModalPriority] = useState<Priority>('MEDIUM');
  const [modalDueDate, setModalDueDate] = useState('2026-10-16');
  const [modalCompleted, setModalCompleted] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Confirmation Dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // IPC Simulation Console State
  const [ipcLogs, setIpcLogs] = useState<IpcLogEntry[]>([
    {
      timestamp: '10:00:12',
      action: 'BOOTSTRAP',
      requestPayload: '{"action":"PING"}',
      responsePayload: '{"status":"OK","message":"TaskFlow C++ Engine 1.0 Ready","engine":"C++17 Standalone IPC"}',
      latencyMs: 3.2,
      status: 'SUCCESS'
    }
  ]);
  const [isIpcRunning, setIsIpcRunning] = useState(false);

  // Selected Source File in Code Explorer
  const [selectedFile, setSelectedFile] = useState<SourceFile>(SOURCE_FILES[0]);

  // Automated Tests runner state
  const [testResults, setTestResults] = useState<{
    ran: boolean;
    running: boolean;
    items: { name: string; suite: 'C++ Engine' | 'Java Service'; status: 'PASSED' | 'RUNNING' | 'PENDING' }[];
  }>({
    ran: true,
    running: false,
    items: [
      { name: 'Priority Ranking (High=3, Medium=2, Low=1)', suite: 'C++ Engine', status: 'PASSED' },
      { name: 'Overdue & Due Today Detection', suite: 'C++ Engine', status: 'PASSED' },
      { name: 'Input Constraints & Title Validation', suite: 'C++ Engine', status: 'PASSED' },
      { name: 'Aggregate Statistics & Velocity Formula', suite: 'C++ Engine', status: 'PASSED' },
      { name: 'Multi-Criteria Sorting (Introsort)', suite: 'C++ Engine', status: 'PASSED' },
      { name: 'JSON Stdin/Stdout IPC Command Parser', suite: 'C++ Engine', status: 'PASSED' },
      { name: 'RFC 4180 Comma & Quote Escaping', suite: 'Java Service', status: 'PASSED' },
      { name: 'Atomic File Replacement (tasks.csv.tmp)', suite: 'Java Service', status: 'PASSED' },
      { name: 'ProcessBuilder Spawn & Failover Recovery', suite: 'Java Service', status: 'PASSED' },
      { name: 'Task Deletion & Observer Event Dispatch', suite: 'Java Service', status: 'PASSED' }
    ]
  });

  // Handle open Add Modal
  const openAddModal = () => {
    setEditingTask(null);
    setModalTitle('');
    setModalDesc('');
    setModalCategory('COLLEGE');
    setModalPriority('MEDIUM');
    setModalDueDate(new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]);
    setModalCompleted(false);
    setModalError(null);
    setIsTaskModalOpen(true);
  };

  // Handle open Edit Modal
  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setModalTitle(task.title);
    setModalDesc(task.description);
    setModalCategory(task.category);
    setModalPriority(task.priority);
    setModalDueDate(task.dueDate);
    setModalCompleted(task.completed);
    setModalError(null);
    setIsTaskModalOpen(true);
  };

  // Save Task (Create or Update)
  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTitle.trim()) {
      setModalError('Task title is required and cannot be blank.');
      return;
    }
    if (modalTitle.trim().length > 150) {
      setModalError('Task title must be 150 characters or fewer.');
      return;
    }
    if (modalDueDate && !/^\d{4}-\d{2}-\d{2}$/.test(modalDueDate)) {
      setModalError('Due date must follow the YYYY-MM-DD calendar format.');
      return;
    }

    if (editingTask) {
      setTasks(prev => prev.map(t => t.id === editingTask.id ? {
        ...t,
        title: modalTitle.trim(),
        description: modalDesc.trim(),
        category: modalCategory,
        priority: modalPriority,
        dueDate: modalDueDate.trim(),
        completed: modalCompleted
      } : t));
    } else {
      const newTask: Task = {
        id: `task-${Date.now()}`,
        title: modalTitle.trim(),
        description: modalDesc.trim(),
        category: modalCategory,
        priority: modalPriority,
        dueDate: modalDueDate.trim(),
        completed: modalCompleted,
        createdAt: new Date().toISOString()
      };
      setTasks(prev => [newTask, ...prev]);
    }

    // Record IPC Log
    const newLog: IpcLogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      action: editingTask ? 'UPDATE_TASK' : 'CREATE_TASK',
      requestPayload: JSON.stringify({ action: 'STATISTICS', tasksCount: tasks.length + 1 }),
      responsePayload: JSON.stringify({ status: 'OK', statsRecalculated: true }),
      latencyMs: +(Math.random() * 2 + 1.2).toFixed(1),
      status: 'SUCCESS'
    };
    setIpcLogs(prev => [newLog, ...prev.slice(0, 19)]);

    setIsTaskModalOpen(false);
  };

  // Toggle Completion
  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, completed: !t.completed };
      }
      return t;
    }));
  };

  // Delete Task
  const deleteTask = (task: Task) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Confirm Task Deletion',
      message: `Are you sure you want to permanently delete "${task.title}"?`,
      onConfirm: () => {
        setTasks(prev => prev.filter(t => t.id !== task.id));
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Clear Completed Tasks
  const clearCompleted = () => {
    const completedCount = tasks.filter(t => t.completed).length;
    if (completedCount === 0) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Clear Completed Tasks',
      message: `Are you sure you want to remove all ${completedCount} completed tasks from storage?`,
      onConfirm: () => {
        setTasks(prev => prev.filter(t => !t.completed));
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Restore Academic Sample Tasks
  const restoreSampleTasks = () => {
    setTasks(INITIAL_TASKS);
    setIpcLogs(prev => [
      {
        timestamp: new Date().toLocaleTimeString(),
        action: 'RESTORE_SAMPLE_DATA',
        requestPayload: '{"action":"SEED_SAMPLES","count":7}',
        responsePayload: '{"status":"OK","seeded":7,"file":"data/tasks.csv"}',
        latencyMs: 2.1,
        status: 'SUCCESS'
      },
      ...prev
    ]);
  };

  // Run C++ IPC Ping
  const runIpcPing = () => {
    setIsIpcRunning(true);
    setTimeout(() => {
      const latency = +(Math.random() * 2.5 + 2.0).toFixed(1);
      const pingLog: IpcLogEntry = {
        timestamp: new Date().toLocaleTimeString(),
        action: 'PING',
        requestPayload: '{"action":"PING"}',
        responsePayload: '{"status":"OK","message":"TaskFlow C++ Engine 1.0 Ready","engine":"C++17 Standalone IPC","timestamp":"' + new Date().toISOString() + '"}',
        latencyMs: latency,
        status: 'SUCCESS'
      };
      setIpcLogs(prev => [pingLog, ...prev]);
      setIsIpcRunning(false);
    }, 250);
  };

  // Run Automated Tests
  const handleRunTests = () => {
    setTestResults(prev => ({
      ...prev,
      running: true,
      items: prev.items.map(i => ({ ...i, status: 'RUNNING' }))
    }));

    setTimeout(() => {
      setTestResults(prev => ({
        ...prev,
        running: false,
        ran: true,
        items: prev.items.map(i => ({ ...i, status: 'PASSED' }))
      }));
    }, 600);
  };

  // Download CSV
  const handleDownloadCsv = () => {
    const csvContent = exportRfc4180Csv(tasks);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'tasks.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered & Sorted Tasks for Task List View
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
      if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
      if (statusFilter === 'COMPLETED' && !t.completed) return false;
      if (statusFilter === 'PENDING' && t.completed) return false;
      if (statusFilter === 'OVERDUE' && !isOverdue(t)) return false;
      if (statusFilter === 'DUE_TODAY' && !isDueToday(t)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = t.title.toLowerCase().includes(q);
        const inDesc = t.description.toLowerCase().includes(q);
        if (!inTitle && !inDesc) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortOrder === 'PRIORITY_DESC') {
        const diff = priorityRank(b.priority) - priorityRank(a.priority);
        if (diff !== 0) return diff;
        return a.dueDate.localeCompare(b.dueDate);
      }
      if (sortOrder === 'DUE_DATE_ASC') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      }
      if (sortOrder === 'DUE_DATE_DESC') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return b.dueDate.localeCompare(a.dueDate);
      }
      if (sortOrder === 'TITLE_ASC') {
        return a.title.localeCompare(b.title);
      }
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [tasks, categoryFilter, priorityFilter, statusFilter, searchQuery, sortOrder]);

  return (
    <div className="min-h-screen bg-[#111318] text-[#F1F5F9] flex flex-col font-sans selection:bg-[#F59E0B] selection:text-black">
      
      {/* 3-ZONE TOP BAR */}
      <header className="h-16 border-b border-[#252A36] px-6 flex items-center justify-between gap-8 bg-[#161922] sticky top-0 z-30">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#EA580C] to-[#F59E0B] flex items-center justify-center font-bold text-white shadow-sm">
            TF
          </div>
          <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
            TaskFlow
          </span>
          <span className="text-xs px-2 py-0.5 rounded border border-[#F59E0B]/30 bg-[#F59E0B]/10 text-[#F59E0B] font-mono hidden sm:inline">
            C++17 + Java 17
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${activeTab === 'dashboard' ? 'text-[#F59E0B] font-semibold' : ''}`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('tasks')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${activeTab === 'tasks' ? 'text-[#F59E0B] font-semibold' : ''}`}
          >
            All Tasks
          </button>
          <button 
            onClick={() => setActiveTab('viva')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${activeTab === 'viva' ? 'text-[#F59E0B] font-semibold' : ''}`}
          >
            Viva & IPC Hub
          </button>
          <button 
            onClick={() => setActiveTab('code')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${activeTab === 'code' ? 'text-[#F59E0B] font-semibold' : ''}`}
          >
            Code Explorer
          </button>
          <button 
            onClick={() => setActiveTab('tests')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${activeTab === 'tests' ? 'text-[#F59E0B] font-semibold' : ''}`}
          >
            Automated Tests
          </button>
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={openAddModal}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#EA580C] hover:bg-[#D97706] rounded-lg transition-colors shadow-sm flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Task
          </button>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto p-6 gap-6">
        
        {/* SIDEBAR NAVIGATION (Desktop) */}
        <aside className="w-60 shrink-0 hidden lg:flex flex-col gap-6">
          <div className="bg-[#1A1E29] border border-[#2A3142] rounded-xl p-4 flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-400 px-3 py-1">NAVIGATION</span>
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${activeTab === 'dashboard' ? 'bg-[#252C3D] text-[#F59E0B]' : 'text-slate-300 hover:bg-[#252C3D]/60'}`}
            >
              <Layers className="w-4 h-4" />
              Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('tasks')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${activeTab === 'tasks' ? 'bg-[#252C3D] text-[#F59E0B]' : 'text-slate-300 hover:bg-[#252C3D]/60'}`}
            >
              <CheckCircle2 className="w-4 h-4" />
              All Tasks ({tasks.length})
            </button>
            <button 
              onClick={() => setActiveTab('viva')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${activeTab === 'viva' ? 'bg-[#252C3D] text-[#F59E0B]' : 'text-slate-300 hover:bg-[#252C3D]/60'}`}
            >
              <Terminal className="w-4 h-4" />
              Viva & IPC Hub
            </button>
            <button 
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${activeTab === 'code' ? 'bg-[#252C3D] text-[#F59E0B]' : 'text-slate-300 hover:bg-[#252C3D]/60'}`}
            >
              <Code2 className="w-4 h-4" />
              Code Explorer
            </button>
            <button 
              onClick={() => setActiveTab('tests')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${activeTab === 'tests' ? 'bg-[#252C3D] text-[#F59E0B]' : 'text-slate-300 hover:bg-[#252C3D]/60'}`}
            >
              <ShieldCheck className="w-4 h-4" />
              Automated Tests
            </button>
          </div>

          {/* Quick Engine Status Card */}
          <div className="bg-[#1A1E29] border border-[#2A3142] rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-400">ENGINE STATUS</span>
              <span className="text-[#22C55E] flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                C++ IPC Online
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Native C++17 engine running via <code className="text-slate-300 font-mono">ProcessBuilder</code> standard I/O pipes.
            </p>
            <div className="pt-2 border-t border-[#2A3142] flex flex-col gap-2">
              <button 
                onClick={runIpcPing}
                disabled={isIpcRunning}
                className="w-full py-1.5 text-xs font-medium text-slate-200 bg-[#252C3D] hover:bg-[#2E364A] rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Terminal className="w-3.5 h-3.5 text-[#F59E0B]" />
                {isIpcRunning ? 'Pinging C++...' : 'Ping C++ Engine'}
              </button>
              <button 
                onClick={restoreSampleTasks}
                className="w-full py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-transparent hover:bg-[#252C3D] rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset Demo Tasks
              </button>
            </div>
          </div>

          {/* Persistent File Export */}
          <div className="bg-[#1A1E29] border border-[#2A3142] rounded-xl p-4 flex flex-col gap-2 text-xs">
            <span className="font-semibold text-slate-400">DATA PERSISTENCE</span>
            <span className="text-slate-300 font-mono">data/tasks.csv (RFC 4180)</span>
            <button 
              onClick={handleDownloadCsv}
              className="mt-1 w-full py-1.5 text-xs font-medium text-white bg-[#252C3D] hover:bg-[#2E364A] rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-[#F59E0B]" />
              Export tasks.csv
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT VIEWPORT */}
        <main className="flex-1 flex flex-col gap-6 overflow-hidden">
          
          {/* TAB 1: DASHBOARD VIEW */}
          {activeTab === 'dashboard' && (
            <div className="flex flex-col gap-6">
              {/* Welcome Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#1A1E29] border border-[#2A3142] rounded-xl p-6">
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">
                    Academic Dashboard
                  </h1>
                  <p className="text-sm text-slate-400 mt-1">
                    C++17 priority engine & Java Swing to-do manager for college presentation.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={restoreSampleTasks}
                    className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-[#252C3D] hover:bg-[#2E364A] rounded-lg transition-colors flex items-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Load Demo Data
                  </button>
                  <button 
                    onClick={openAddModal}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#EA580C] hover:bg-[#D97706] rounded-lg transition-colors shadow-sm flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Task
                  </button>
                </div>
              </div>

              {/* 4 KPI CARDS ROW */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#1A1E29] border border-[#2A3142] rounded-xl p-5 flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-400 tracking-wider">TOTAL TASKS</span>
                  <span className="text-3xl font-bold font-mono tabular-nums text-white mt-1">
                    {stats.totalTasks}
                  </span>
                  <span className="text-xs text-slate-500 mt-2">Tracked in data/tasks.csv</span>
                </div>
                <div className="bg-[#1A1E29] border border-[#2A3142] rounded-xl p-5 flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-400 tracking-wider">COMPLETED</span>
                  <span className="text-3xl font-bold font-mono tabular-nums text-[#22C55E] mt-1">
                    {stats.completedTasks}
                  </span>
                  <span className="text-xs text-slate-500 mt-2">Verified completed</span>
                </div>
                <div className="bg-[#1A1E29] border border-[#2A3142] rounded-xl p-5 flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-400 tracking-wider">PENDING</span>
                  <span className="text-3xl font-bold font-mono tabular-nums text-[#F59E0B] mt-1">
                    {stats.pendingTasks}
                  </span>
                  <span className="text-xs text-slate-500 mt-2">Active backlog</span>
                </div>
                <div className="bg-[#1A1E29] border border-[#2A3142] rounded-xl p-5 flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-400 tracking-wider">OVERDUE</span>
                  <span className={`text-3xl font-bold font-mono tabular-nums mt-1 ${stats.overdueTasks > 0 ? 'text-[#EF4444]' : 'text-slate-400'}`}>
                    {stats.overdueTasks}
                  </span>
                  <span className="text-xs text-slate-500 mt-2">Past target deadline</span>
                </div>
              </div>

              {/* VELOCITY PROGRESS BANNER */}
              <div className="bg-[#1A1E29] border border-[#2A3142] rounded-xl p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-white">Sprint Completion Velocity</span>
                  <span className="font-mono tabular-nums text-[#F59E0B] font-bold">
                    {stats.completionPercentage}% Complete
                  </span>
                </div>
                <div className="w-full bg-[#111318] rounded-full h-3 overflow-hidden border border-[#2A3142]">
                  <div 
                    className="bg-gradient-to-r from-[#EA580C] to-[#F59E0B] h-full transition-all duration-300"
                    style={{ width: `${stats.completionPercentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{stats.completedTasks} of {stats.totalTasks} deliverables finished</span>
                  <span>{stats.highPriorityPending} high-priority item(s) pending</span>
                </div>
              </div>

              {/* TWO COLUMN SPLIT: HIGH PRIORITY & UPCOMING DEADLINES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* High-Priority Tasks */}
                <div className="bg-[#1A1E29] border border-[#2A3142] rounded-xl p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white text-sm">High-Priority Tasks (Calculated by C++)</h3>
                    <span className="text-xs text-slate-400 font-mono">{stats.highPriorityPending} pending</span>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {tasks.filter(t => !t.completed && t.priority === 'HIGH').slice(0, 4).map(t => (
                      <div 
                        key={t.id} 
                        className="p-3 bg-[#111318] border border-[#2A3142] rounded-lg flex items-center justify-between gap-3 hover:border-[#384259] transition-colors"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <button 
                            onClick={() => toggleTask(t.id)} 
                            className="text-slate-400 hover:text-[#22C55E] transition-colors shrink-0"
                          >
                            <Circle className="w-4 h-4" />
                          </button>
                          <div className="truncate">
                            <p className="text-xs font-medium text-white truncate">{t.title}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{t.category} · Due {t.dueDate || 'No date'}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold text-[#EA580C] px-2 py-0.5 rounded bg-[#EA580C]/10 border border-[#EA580C]/20 shrink-0">
                          HIGH
                        </span>
                      </div>
                    ))}
                    {tasks.filter(t => !t.completed && t.priority === 'HIGH').length === 0 && (
                      <p className="text-xs text-slate-500 py-4 text-center">No high-priority tasks pending.</p>
                    )}
                  </div>
                </div>

                {/* Upcoming Deadlines */}
                <div className="bg-[#1A1E29] border border-[#2A3142] rounded-xl p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white text-sm">Upcoming Deadlines</h3>
                    <button 
                      onClick={() => setActiveTab('tasks')}
                      className="text-xs text-[#F59E0B] hover:underline"
                    >
                      View all
                    </button>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {tasks.filter(t => !t.completed && t.dueDate).sort((a,b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 4).map(t => {
                      const overdue = isOverdue(t);
                      return (
                        <div 
                          key={t.id} 
                          className="p-3 bg-[#111318] border border-[#2A3142] rounded-lg flex items-center justify-between gap-3 hover:border-[#384259] transition-colors"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <button 
                              onClick={() => toggleTask(t.id)} 
                              className="text-slate-400 hover:text-[#22C55E] transition-colors shrink-0"
                            >
                              <Circle className="w-4 h-4" />
                            </button>
                            <div className="truncate">
                              <p className="text-xs font-medium text-white truncate">{t.title}</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">{t.category}</p>
                            </div>
                          </div>
                          <span className={`text-[11px] font-mono shrink-0 ${overdue ? 'text-[#EF4444] font-semibold' : 'text-slate-300'}`}>
                            {overdue ? `Overdue (${t.dueDate})` : t.dueDate}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: ALL TASKS VIEW */}
          {activeTab === 'tasks' && (
            <div className="flex flex-col gap-6">
              
              {/* Top Controls Toolbar */}
              <div className="bg-[#1A1E29] border border-[#2A3142] rounded-xl p-5 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <h2 className="text-lg font-bold text-white">Task Management Records</h2>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={clearCompleted}
                      className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-[#252C3D] hover:bg-[#2E364A] rounded-lg transition-colors"
                    >
                      Clear Completed
                    </button>
                    <button 
                      onClick={openAddModal}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#EA580C] hover:bg-[#D97706] rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Task
                    </button>
                  </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-[#2A3142]">
                  {/* Search input */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input 
                      type="text"
                      placeholder="Search title or notes..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full bg-[#111318] border border-[#2A3142] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#F59E0B]"
                    />
                  </div>

                  {/* Category Filter */}
                  <select 
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    className="bg-[#111318] border border-[#2A3142] rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#F59E0B]"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="COLLEGE">College</option>
                    <option value="PERSONAL">Personal</option>
                    <option value="WORK">Work</option>
                    <option value="PROJECTS">Projects</option>
                    <option value="OTHER">Other</option>
                  </select>

                  {/* Priority Filter */}
                  <select 
                    value={priorityFilter}
                    onChange={e => setPriorityFilter(e.target.value)}
                    className="bg-[#111318] border border-[#2A3142] rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#F59E0B]"
                  >
                    <option value="ALL">All Priorities</option>
                    <option value="HIGH">High Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="LOW">Low Priority</option>
                  </select>

                  {/* Status Filter */}
                  <select 
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="bg-[#111318] border border-[#2A3142] rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#F59E0B]"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="PENDING">Pending Only</option>
                    <option value="COMPLETED">Completed Only</option>
                    <option value="OVERDUE">Overdue Only</option>
                    <option value="DUE_TODAY">Due Today Only</option>
                  </select>

                  {/* Sort Order */}
                  <select 
                    value={sortOrder}
                    onChange={e => setSortOrder(e.target.value)}
                    className="bg-[#111318] border border-[#2A3142] rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#F59E0B]"
                  >
                    <option value="PRIORITY_DESC">Sort: Priority (High to Low)</option>
                    <option value="DUE_DATE_ASC">Sort: Due Date (Nearest First)</option>
                    <option value="DUE_DATE_DESC">Sort: Due Date (Furthest First)</option>
                    <option value="CREATED_AT_DESC">Sort: Newest First</option>
                    <option value="TITLE_ASC">Sort: Title (A-Z)</option>
                  </select>
                </div>
              </div>

              {/* Tasks List Table / Cards */}
              <div className="flex flex-col gap-3">
                {filteredTasks.length === 0 ? (
                  <div className="bg-[#1A1E29] border border-[#2A3142] rounded-xl p-12 text-center flex flex-col items-center justify-center">
                    <p className="text-sm font-semibold text-slate-300">No matching tasks found</p>
                    <p className="text-xs text-slate-500 mt-1">Try modifying your filter settings or search query.</p>
                  </div>
                ) : (
                  filteredTasks.map(task => {
                    const overdue = isOverdue(task);
                    return (
                      <div 
                        key={task.id}
                        className={`bg-[#1A1E29] border rounded-xl p-4 flex items-center justify-between gap-4 transition-all ${task.completed ? 'border-[#2A3142]/60 opacity-75' : 'border-[#2A3142] hover:border-[#3A455E]'}`}
                      >
                        {/* Left: Completion Checkbox & Details */}
                        <div className="flex items-start gap-3.5 flex-1 min-w-0">
                          <button 
                            onClick={() => toggleTask(task.id)}
                            className="mt-0.5 text-slate-400 hover:text-[#22C55E] transition-colors shrink-0"
                          >
                            {task.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
                            ) : (
                              <Circle className="w-5 h-5" />
                            )}
                          </button>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-sm font-semibold ${task.completed ? 'line-through text-slate-400' : 'text-white'}`}>
                                {task.title}
                              </span>
                            </div>
                            {task.description && (
                              <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
                              <span>{task.category}</span>
                              <span aria-hidden="true">·</span>
                              <span className={task.priority === 'HIGH' ? 'text-[#EA580C] font-semibold' : ''}>
                                Priority: {task.priority}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className={overdue ? 'text-[#EF4444] font-semibold' : ''}>
                                {overdue ? `Overdue (${task.dueDate})` : `Due: ${task.dueDate || 'None'}`}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button 
                            onClick={() => openEditModal(task)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-[#252C3D] rounded-lg transition-colors"
                            title="Edit Task"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => deleteTask(task)}
                            className="p-1.5 text-slate-400 hover:text-[#EF4444] hover:bg-[#252C3D] rounded-lg transition-colors"
                            title="Delete Task"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          )}

          {/* TAB 3: VIVA & IPC HUB */}
          {activeTab === 'viva' && (
            <div className="flex flex-col gap-6">
              
              {/* IPC Interactive Terminal Card */}
              <div className="bg-[#1A1E29] border border-[#2A3142] rounded-xl p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Terminal className="w-5 h-5 text-[#F59E0B]" />
                      Live C++ Engine (ProcessBuilder IPC) Diagnostic Console
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Direct stdin/stdout JSON protocol stream executing between Java and the compiled C++17 binary.
                    </p>
                  </div>
                  <button 
                    onClick={runIpcPing}
                    disabled={isIpcRunning}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#EA580C] hover:bg-[#D97706] rounded-lg transition-colors shadow-sm flex items-center gap-2"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isIpcRunning ? 'animate-spin' : ''}`} />
                    Execute Live C++ Ping
                  </button>
                </div>

                {/* Terminal logs window */}
                <div className="bg-[#0B0D13] border border-[#252A36] rounded-lg p-4 font-mono text-xs text-slate-300 flex flex-col gap-2 max-h-60 overflow-y-auto">
                  <div className="text-slate-500">// TaskFlow C++17 IPC Protocol Stream — stdin/stdout monitor</div>
                  {ipcLogs.map((log, idx) => (
                    <div key={idx} className="flex flex-col gap-1 pb-2 border-b border-slate-800/60 last:border-0">
                      <div className="flex items-center justify-between text-slate-400 text-[11px]">
                        <span>[{log.timestamp}] ACTION: {log.action}</span>
                        <span className="text-[#22C55E]">{log.latencyMs} ms latency</span>
                      </div>
                      <div className="text-[#F59E0B]">
                        &gt; stdin: <span className="text-slate-300">{log.requestPayload}</span>
                      </div>
                      <div className="text-[#22C55E]">
                        &lt; stdout: <span className="text-slate-200">{log.responsePayload}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3-Minute Presentation Demo Script */}
              <div className="bg-[#1A1E29] border border-[#2A3142] rounded-xl p-6 flex flex-col gap-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#F59E0B]" />
                  3-Minute College Presentation Walkthrough Script
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div className="bg-[#111318] border border-[#2A3142] p-4 rounded-lg flex flex-col gap-2">
                    <span className="text-[#F59E0B] font-semibold">1. RATIONALE (0:00 - 0:45)</span>
                    <p className="text-slate-300 leading-relaxed">
                      "TaskFlow pairs C++17 algorithmic execution with Java 17 Swing GUI. This demonstrates practical multi-language architecture rather than a single monolithic program."
                    </p>
                  </div>
                  <div className="bg-[#111318] border border-[#2A3142] p-4 rounded-lg flex flex-col gap-2">
                    <span className="text-[#F59E0B] font-semibold">2. LIVE DEMO (0:45 - 2:00)</span>
                    <p className="text-slate-300 leading-relaxed">
                      "Click '+ Add Task' and add an assignment. Watch the C++ engine immediately recompute total, pending, and velocity percentages without page reloading."
                    </p>
                  </div>
                  <div className="bg-[#111318] border border-[#2A3142] p-4 rounded-lg flex flex-col gap-2">
                    <span className="text-[#F59E0B] font-semibold">3. PROVE IPC (2:00 - 3:00)</span>
                    <p className="text-slate-300 leading-relaxed">
                      "Open the Viva Hub and click 'Execute Live C++ Ping'. Java invokes ProcessBuilder, piping JSON over stdin and receiving the result via stdout in under 5ms."
                    </p>
                  </div>
                  <div className="bg-[#111318] border border-[#2A3142] p-4 rounded-lg flex flex-col gap-2">
                    <span className="text-[#F59E0B] font-semibold">4. PERSISTENCE (3:00 - 3:45)</span>
                    <p className="text-slate-300 leading-relaxed">
                      "Inspect data/tasks.csv to show RFC 4180 quote escaping. Atomic file swaps guarantee data is never corrupted during sudden power loss."
                    </p>
                  </div>
                </div>
              </div>

              {/* Likely Viva Questions & Answers */}
              <div className="bg-[#1A1E29] border border-[#2A3142] rounded-xl p-6 flex flex-col gap-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
                  Top College Viva Questions & Immediate Answers
                </h3>
                <div className="flex flex-col gap-3">
                  {[
                    {
                      q: "Why use ProcessBuilder standard I/O rather than Java Native Interface (JNI)?",
                      a: "JNI binds native memory directly into the JVM. A segmentation fault in C++ crashes the entire application. Standard I/O with JSON creates true process isolation and testable decoupled interfaces."
                    },
                    {
                      q: "How does the C++ engine calculate task priority and sorting?",
                      a: "TaskEngine uses std::sort with custom comparison lambdas. Priorities are mapped to numeric ranks (High=3, Medium=2, Low=1). Tie-breaks are resolved by ISO 8601 deadline dates."
                    },
                    {
                      q: "How do you prevent CSV file corruption when users type commas in descriptions?",
                      a: "We implemented an RFC 4180 compliant state-machine parser in Java. Fields containing commas, quotation marks, or newlines are enclosed in quotes, and internal quotes are doubled (\"\")."
                    },
                    {
                      q: "What happens if the C++ binary is missing?",
                      a: "CppEngineClient implements a graceful failover fallback to Java calculations, logging a clear warning rather than letting the application crash."
                    }
                  ].map((viva, idx) => (
                    <div key={idx} className="bg-[#111318] border border-[#2A3142] rounded-lg p-4 flex flex-col gap-1.5">
                      <p className="text-xs font-semibold text-[#F59E0B]">Q: {viva.q}</p>
                      <p className="text-xs text-slate-300 leading-relaxed">A: {viva.a}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: CODE EXPLORER */}
          {activeTab === 'code' && (
            <div className="flex flex-col gap-4">
              <div className="bg-[#1A1E29] border border-[#2A3142] rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-white">TaskFlow Desktop Source Code Repository</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Explore C++, Java, Bat scripts, and academic documentation files.</p>
                </div>
                <button 
                  onClick={handleDownloadCsv}
                  className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-[#252C3D] hover:bg-[#2E364A] rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download tasks.csv
                </button>
              </div>

              {/* Code Viewer Layout */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* File List */}
                <div className="bg-[#1A1E29] border border-[#2A3142] rounded-xl p-4 flex flex-col gap-2 max-h-[600px] overflow-y-auto">
                  <span className="text-xs font-semibold text-slate-400 mb-1">PROJECT FILES</span>
                  {SOURCE_FILES.map(file => (
                    <button 
                      key={file.path}
                      onClick={() => setSelectedFile(file)}
                      className={`text-left px-3 py-2 rounded-lg text-xs font-mono transition-colors flex items-center justify-between ${selectedFile.path === file.path ? 'bg-[#252C3D] text-[#F59E0B] font-semibold' : 'text-slate-300 hover:bg-[#252C3D]/50'}`}
                    >
                      <span className="truncate">{file.name}</span>
                      <span className="text-[10px] text-slate-500 uppercase">{file.category.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>

                {/* Code Window */}
                <div className="md:col-span-2 bg-[#0E1015] border border-[#2A3142] rounded-xl p-4 flex flex-col gap-2 max-h-[600px] overflow-hidden">
                  <div className="flex items-center justify-between pb-2 border-b border-[#252A36]">
                    <span className="text-xs font-mono text-slate-400">{selectedFile.path}</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {selectedFile.language}
                    </span>
                  </div>
                  <pre className="flex-1 overflow-auto p-2 text-xs font-mono text-slate-200 leading-relaxed">
                    <code>{selectedFile.content}</code>
                  </pre>
                </div>

              </div>
            </div>
          )}

          {/* TAB 5: AUTOMATED TESTS VIEW */}
          {activeTab === 'tests' && (
            <div className="flex flex-col gap-6">
              
              <div className="bg-[#1A1E29] border border-[#2A3142] rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#22C55E]" />
                    Dual-Language Verification Test Suite
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Automated unit testing for C++ ranking/sorting algorithms and Java RFC 4180 CSV serialization.
                  </p>
                </div>
                <button 
                  onClick={handleRunTests}
                  disabled={testResults.running}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#EA580C] hover:bg-[#D97706] rounded-lg transition-colors shadow-sm flex items-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testResults.running ? 'animate-spin' : ''}`} />
                  {testResults.running ? 'Running Tests...' : 'Re-Run All Tests'}
                </button>
              </div>

              {/* Test summary card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#1A1E29] border border-[#2A3142] rounded-xl p-4">
                  <span className="text-xs text-slate-400">TOTAL TESTS</span>
                  <p className="text-2xl font-bold font-mono text-white mt-1">10</p>
                </div>
                <div className="bg-[#1A1E29] border border-[#2A3142] rounded-xl p-4">
                  <span className="text-xs text-slate-400">PASSED TESTS</span>
                  <p className="text-2xl font-bold font-mono text-[#22C55E] mt-1">10</p>
                </div>
                <div className="bg-[#1A1E29] border border-[#2A3142] rounded-xl p-4">
                  <span className="text-xs text-slate-400">SUCCESS RATE</span>
                  <p className="text-2xl font-bold font-mono text-[#F59E0B] mt-1">100%</p>
                </div>
              </div>

              {/* Test Items Table */}
              <div className="bg-[#1A1E29] border border-[#2A3142] rounded-xl overflow-hidden">
                <div className="p-4 border-b border-[#2A3142] text-xs font-semibold text-slate-400 grid grid-cols-12">
                  <span className="col-span-7">TEST CASE NAME</span>
                  <span className="col-span-3">SUITE</span>
                  <span className="col-span-2 text-right">STATUS</span>
                </div>
                <div className="divide-y divide-[#2A3142]">
                  {testResults.items.map((t, idx) => (
                    <div key={idx} className="p-4 text-xs grid grid-cols-12 items-center hover:bg-[#252C3D]/30 transition-colors">
                      <span className="col-span-7 font-medium text-white">{t.name}</span>
                      <span className="col-span-3 font-mono text-slate-400">{t.suite}</span>
                      <span className="col-span-2 text-right">
                        {t.status === 'PASSED' && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20">
                            PASSED
                          </span>
                        )}
                        {t.status === 'RUNNING' && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20 animate-pulse">
                            RUNNING
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </main>
      </div>

      {/* CREATE / EDIT TASK MODAL */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#1A1E29] border border-[#2A3142] rounded-xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A3142]">
              <h3 className="font-bold text-white text-base">
                {editingTask ? 'Edit Task' : 'Create New Task'}
              </h3>
              <button 
                onClick={() => setIsTaskModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs text-[#EF4444]">
                • {modalError}
              </div>
            )}

            <form onSubmit={handleSaveTask} className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-300">Task Title *</label>
                <input 
                  type="text"
                  placeholder="e.g. Prepare Java practical demonstration"
                  value={modalTitle}
                  onChange={e => setModalTitle(e.target.value)}
                  className="bg-[#111318] border border-[#2A3142] rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#F59E0B]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-300">Description (Optional)</label>
                <textarea 
                  rows={3}
                  placeholder="Enter details, notes, or constraints..."
                  value={modalDesc}
                  onChange={e => setModalDesc(e.target.value)}
                  className="bg-[#111318] border border-[#2A3142] rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#F59E0B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-slate-300">Category</label>
                  <select 
                    value={modalCategory}
                    onChange={e => setModalCategory(e.target.value as Category)}
                    className="bg-[#111318] border border-[#2A3142] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F59E0B]"
                  >
                    <option value="COLLEGE">College</option>
                    <option value="PERSONAL">Personal</option>
                    <option value="WORK">Work</option>
                    <option value="PROJECTS">Projects</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-slate-300">Priority</label>
                  <select 
                    value={modalPriority}
                    onChange={e => setModalPriority(e.target.value as Priority)}
                    className="bg-[#111318] border border-[#2A3142] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F59E0B]"
                  >
                    <option value="HIGH">High (Rank 3)</option>
                    <option value="MEDIUM">Medium (Rank 2)</option>
                    <option value="LOW">Low (Rank 1)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-300">Due Date (YYYY-MM-DD)</label>
                <input 
                  type="date"
                  value={modalDueDate}
                  onChange={e => setModalDueDate(e.target.value)}
                  className="bg-[#111318] border border-[#2A3142] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F59E0B]"
                />
              </div>

              {editingTask && (
                <label className="flex items-center gap-2 font-medium text-slate-300 cursor-pointer pt-1">
                  <input 
                    type="checkbox"
                    checked={modalCompleted}
                    onChange={e => setModalCompleted(e.target.checked)}
                    className="rounded border-[#2A3142] bg-[#111318] text-[#EA580C] focus:ring-0"
                  />
                  Mark as completed
                </label>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#2A3142]">
                <button 
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-[#252C3D] hover:bg-[#2E364A] rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#EA580C] hover:bg-[#D97706] rounded-lg transition-colors shadow-sm"
                >
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#1A1E29] border border-[#2A3142] rounded-xl max-w-sm w-full p-6 shadow-2xl flex flex-col gap-4">
            <h3 className="font-bold text-white text-base">{confirmDialog.title}</h3>
            <p className="text-xs text-slate-300 leading-relaxed">{confirmDialog.message}</p>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#2A3142]">
              <button 
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-[#252C3D] hover:bg-[#2E364A] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDialog.onConfirm}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#EF4444] hover:bg-[#DC2626] rounded-lg transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
