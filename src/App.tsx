import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  CheckCircle2, Circle, Clock, Calendar, 
  Search, Trash2, Edit3, Plus, Download, Upload,
  SlidersHorizontal, CheckCheck, FolderKanban,
  Settings as SettingsIcon, LayoutDashboard,
  CalendarDays, X
} from 'lucide-react';
import { Task, Priority, Category, DashboardStats } from './types';
import { 
  INITIAL_TASKS, 
  calculateStats, 
  isOverdue, 
  isDueToday, 
  priorityRank, 
  exportRfc4180Csv, 
  importRfc4180Csv,
  getTodayStr 
} from './utils/engine';

type NavigationTab = 
  | 'dashboard' 
  | 'tasks' 
  | 'today' 
  | 'upcoming' 
  | 'completed' 
  | 'categories' 
  | 'settings';

export default function App() {
  // Navigation State (Exclusively 7 allowed tabs)
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Hidden file input for CSV import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persistence in browser localStorage
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem('taskflow_tasks_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load tasks from localStorage', e);
    }
    return INITIAL_TASKS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('taskflow_tasks_v2', JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to save tasks', e);
    }
  }, [tasks]);

  // Dynamically calculated statistics
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
  const [modalCategory, setModalCategory] = useState<Category>('WORK');
  const [modalPriority, setModalPriority] = useState<Priority>('MEDIUM');
  const [modalDueDate, setModalDueDate] = useState(getTodayStr());
  const [modalCompleted, setModalCompleted] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Temporary Notification Toast
  const [notification, setNotification] = useState<string | null>(null);
  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Confirmation Dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // Settings State
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [showOverdueBanner, setShowOverdueBanner] = useState(true);

  // Time-based greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Handle open Add Modal
  const openAddModal = (presetCategory?: Category) => {
    setEditingTask(null);
    setModalTitle('');
    setModalDesc('');
    setModalCategory(presetCategory || 'WORK');
    setModalPriority('MEDIUM');
    setModalDueDate(getTodayStr());
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
    setModalDueDate(task.dueDate || getTodayStr());
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
      showNotice('Task updated successfully.');
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
      showNotice('New task created.');
    }

    setIsTaskModalOpen(false);
  };

  // Toggle Completion
  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const nextCompleted = !t.completed;
        showNotice(nextCompleted ? 'Task marked as completed.' : 'Task reopened.');
        return { ...t, completed: nextCompleted };
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
        showNotice('Task deleted.');
      }
    });
  };

  // Clear Completed Tasks
  const clearCompleted = () => {
    const count = tasks.filter(t => t.completed).length;
    if (count === 0) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Clear Completed Tasks',
      message: `Are you sure you want to remove all ${count} completed tasks?`,
      onConfirm: () => {
        setTasks(prev => prev.filter(t => !t.completed));
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        showNotice(`Removed ${count} completed tasks.`);
      }
    });
  };

  // Download CSV
  const handleDownloadCsv = () => {
    const csvContent = exportRfc4180Csv(tasks);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `tasks_${getTodayStr()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotice('Exported tasks to CSV.');
  };

  // Import CSV
  const handleImportCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) return;
        const imported = importRfc4180Csv(text);
        if (imported.length > 0) {
          setTasks(prev => {
            const existingIds = new Set(prev.map(t => t.id));
            const newOnly = imported.filter(t => !existingIds.has(t.id));
            return [...newOnly, ...prev];
          });
          showNotice(`Imported ${imported.length} tasks from CSV.`);
        } else {
          showNotice('No valid task records found in CSV file.');
        }
      } catch (err) {
        showNotice('Failed to parse CSV file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Filtered & Sorted Tasks based on active tab and filters
  const displayTasks = useMemo(() => {
    const today = getTodayStr();

    return tasks.filter(t => {
      // Tab-specific filters
      if (activeTab === 'today' && !isDueToday(t, today)) return false;
      if (activeTab === 'upcoming') {
        if (t.completed || !t.dueDate || t.dueDate <= today) return false;
      }
      if (activeTab === 'completed' && !t.completed) return false;

      // General Filters (applied in tasks tab or other tabs)
      if (activeTab === 'tasks') {
        if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
        if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
        if (statusFilter === 'COMPLETED' && !t.completed) return false;
        if (statusFilter === 'PENDING' && t.completed) return false;
        if (statusFilter === 'OVERDUE' && !isOverdue(t, today)) return false;
        if (statusFilter === 'DUE_TODAY' && !isDueToday(t, today)) return false;
      }

      // Search Query
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
        return (a.dueDate || '').localeCompare(b.dueDate || '');
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
  }, [tasks, activeTab, categoryFilter, priorityFilter, statusFilter, searchQuery, sortOrder]);

  // Counts for sidebar badges
  const todayCount = useMemo(() => tasks.filter(t => !t.completed && isDueToday(t)).length, [tasks]);
  const upcomingCount = useMemo(() => tasks.filter(t => !t.completed && t.dueDate && t.dueDate > getTodayStr()).length, [tasks]);
  const completedCount = useMemo(() => tasks.filter(t => t.completed).length, [tasks]);

  // Helper for priority badge colors
  const getPriorityBadge = (p: Priority) => {
    switch (p) {
      case 'HIGH':
        return 'text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/30';
      case 'MEDIUM':
        return 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30';
      case 'LOW':
        return 'text-[#94A3B8] bg-[#94A3B8]/10 border-[#94A3B8]/30';
    }
  };

  // Helper for category badge colors
  const getCategoryBadge = (c: Category) => {
    switch (c) {
      case 'WORK':
        return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
      case 'PROJECTS':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'COLLEGE':
        return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
      case 'PERSONAL':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1117] text-[#F1F5F9] flex flex-col font-sans selection:bg-[#F59E0B] selection:text-black">
      
      {/* Hidden File Input for CSV Import */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImportCsvFile} 
        accept=".csv,text/csv" 
        className="hidden" 
      />

      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-[#1E2330] border border-[#F59E0B]/40 text-slate-100 text-xs px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-[#F59E0B]" />
          <span>{notification}</span>
        </div>
      )}

      {/* TOP HEADER BAR */}
      <header className="h-16 border-b border-[#222838] px-4 sm:px-6 flex items-center justify-between gap-4 bg-[#141822] sticky top-0 z-30">
        
        {/* TaskFlow Logo & Name */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#EA580C] to-[#F59E0B] flex items-center justify-center font-bold text-white shadow-md text-sm">
            TF
          </div>
          <span className="text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap">
            TaskFlow
          </span>
        </div>

        {/* Desktop Primary Navigation (Strict 7 items) */}
        <nav className="hidden lg:flex items-center gap-1 text-xs font-medium text-slate-300">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-[#212738] text-[#F59E0B] font-semibold' : 'hover:text-white hover:bg-[#1C2230]'}`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('tasks')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${activeTab === 'tasks' ? 'bg-[#212738] text-[#F59E0B] font-semibold' : 'hover:text-white hover:bg-[#1C2230]'}`}
          >
            All Tasks
          </button>
          <button 
            onClick={() => setActiveTab('today')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'today' ? 'bg-[#212738] text-[#F59E0B] font-semibold' : 'hover:text-white hover:bg-[#1C2230]'}`}
          >
            Today {todayCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#F59E0B]/20 text-[#F59E0B] font-mono">
                {todayCount}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('upcoming')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'upcoming' ? 'bg-[#212738] text-[#F59E0B] font-semibold' : 'hover:text-white hover:bg-[#1C2230]'}`}
          >
            Upcoming {upcomingCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                {upcomingCount}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('completed')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${activeTab === 'completed' ? 'bg-[#212738] text-[#F59E0B] font-semibold' : 'hover:text-white hover:bg-[#1C2230]'}`}
          >
            Completed
          </button>
          <button 
            onClick={() => setActiveTab('categories')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${activeTab === 'categories' ? 'bg-[#212738] text-[#F59E0B] font-semibold' : 'hover:text-white hover:bg-[#1C2230]'}`}
          >
            Categories
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${activeTab === 'settings' ? 'bg-[#212738] text-[#F59E0B] font-semibold' : 'hover:text-white hover:bg-[#1C2230]'}`}
          >
            Settings
          </button>
        </nav>

        {/* Right Section: Add Task & Administrator Profile */}
        <div className="flex items-center gap-3 shrink-0">
          
          {/* Prominent Add Task Button */}
          <button 
            onClick={() => openAddModal()}
            className="px-3.5 sm:px-4 py-2 text-xs font-semibold text-white bg-[#EA580C] hover:bg-[#D97706] rounded-lg transition-colors shadow-sm flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>

          {/* Small Administrator Profile Badge */}
          <div 
            onClick={() => setActiveTab('settings')}
            title="Dinesh Nikam · System Administrator"
            className="hidden sm:flex items-center gap-2 pl-2 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-[#252C3D] border border-[#3E4862] flex items-center justify-center text-xs font-bold text-[#F59E0B]">
              DN
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-medium text-white leading-tight">
                Dinesh Nikam
              </p>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-400 hover:text-white bg-[#1C2230] rounded-lg"
            aria-label="Toggle Navigation Menu"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

        </div>
      </header>

      {/* MOBILE MENU DROPDOWN */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#141822] border-b border-[#222838] px-4 py-3 flex flex-col gap-1 text-xs">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#222838]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#252C3D] flex items-center justify-center font-bold text-[10px] text-[#F59E0B]">
                DN
              </div>
              <span className="font-semibold text-white">Dinesh Nikam</span>
            </div>
            <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'tasks', label: `All Tasks (${tasks.length})` },
            { id: 'today', label: `Today (${todayCount})` },
            { id: 'upcoming', label: `Upcoming (${upcomingCount})` },
            { id: 'completed', label: `Completed (${completedCount})` },
            { id: 'categories', label: 'Categories' },
            { id: 'settings', label: 'Settings' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as NavigationTab);
                setMobileMenuOpen(false);
              }}
              className={`text-left px-3 py-2 rounded-lg transition-colors ${activeTab === tab.id ? 'bg-[#212738] text-[#F59E0B] font-semibold' : 'text-slate-300 hover:bg-[#1C2230]'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto p-4 sm:p-6 gap-6">
        
        {/* COMPACT SIDEBAR NAVIGATION (Desktop) */}
        <aside className="w-56 shrink-0 hidden lg:flex flex-col gap-4">
          
          <div className="bg-[#161924] border border-[#262C3D] rounded-xl p-3 flex flex-col gap-1 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-400 px-3 py-1 uppercase tracking-wider">
              NAVIGATION
            </span>
            
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${activeTab === 'dashboard' ? 'bg-[#222838] text-[#F59E0B] font-semibold' : 'text-slate-300 hover:bg-[#222838]/60 hover:text-white'}`}
            >
              <span className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4 text-[#F59E0B]" />
                Dashboard
              </span>
            </button>

            <button 
              onClick={() => setActiveTab('tasks')}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${activeTab === 'tasks' ? 'bg-[#222838] text-[#F59E0B] font-semibold' : 'text-slate-300 hover:bg-[#222838]/60 hover:text-white'}`}
            >
              <span className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4" />
                All Tasks
              </span>
              <span className="font-mono text-[11px] text-slate-400">{tasks.length}</span>
            </button>

            <button 
              onClick={() => setActiveTab('today')}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${activeTab === 'today' ? 'bg-[#222838] text-[#F59E0B] font-semibold' : 'text-slate-300 hover:bg-[#222838]/60 hover:text-white'}`}
            >
              <span className="flex items-center gap-2.5">
                <Clock className="w-4 h-4" />
                Today
              </span>
              {todayCount > 0 && (
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-[#F59E0B]/20 text-[#F59E0B] font-semibold">
                  {todayCount}
                </span>
              )}
            </button>

            <button 
              onClick={() => setActiveTab('upcoming')}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${activeTab === 'upcoming' ? 'bg-[#222838] text-[#F59E0B] font-semibold' : 'text-slate-300 hover:bg-[#222838]/60 hover:text-white'}`}
            >
              <span className="flex items-center gap-2.5">
                <CalendarDays className="w-4 h-4" />
                Upcoming
              </span>
              <span className="font-mono text-[11px] text-slate-400">{upcomingCount}</span>
            </button>

            <button 
              onClick={() => setActiveTab('completed')}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${activeTab === 'completed' ? 'bg-[#222838] text-[#F59E0B] font-semibold' : 'text-slate-300 hover:bg-[#222838]/60 hover:text-white'}`}
            >
              <span className="flex items-center gap-2.5">
                <CheckCheck className="w-4 h-4" />
                Completed
              </span>
              <span className="font-mono text-[11px] text-[#22C55E]">{completedCount}</span>
            </button>

            <button 
              onClick={() => setActiveTab('categories')}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${activeTab === 'categories' ? 'bg-[#222838] text-[#F59E0B] font-semibold' : 'text-slate-300 hover:bg-[#222838]/60 hover:text-white'}`}
            >
              <span className="flex items-center gap-2.5">
                <FolderKanban className="w-4 h-4" />
                Categories
              </span>
            </button>

            <div className="pt-2 mt-1 border-t border-[#262C3D]" />

            <button 
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${activeTab === 'settings' ? 'bg-[#222838] text-[#F59E0B] font-semibold' : 'text-slate-300 hover:bg-[#222838]/60 hover:text-white'}`}
            >
              <SettingsIcon className="w-4 h-4" />
              Settings
            </button>
          </div>

          {/* Quick CSV Export/Import Widget */}
          <div className="bg-[#161924] border border-[#262C3D] rounded-xl p-3.5 flex flex-col gap-2 text-xs shadow-sm">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">BACKUP & CSV</span>
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <button 
                onClick={handleDownloadCsv}
                className="py-1.5 text-xs font-medium text-slate-200 bg-[#222838] hover:bg-[#2C344A] rounded-lg transition-colors flex items-center justify-center gap-1"
                title="Export tasks as CSV"
              >
                <Download className="w-3.5 h-3.5 text-[#F59E0B]" />
                Export
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="py-1.5 text-xs font-medium text-slate-200 bg-[#222838] hover:bg-[#2C344A] rounded-lg transition-colors flex items-center justify-center gap-1"
                title="Import tasks from CSV"
              >
                <Upload className="w-3.5 h-3.5 text-[#F59E0B]" />
                Import
              </button>
            </div>
          </div>

        </aside>

        {/* MAIN VIEWPORT */}
        <main className="flex-1 flex flex-col gap-6 overflow-hidden">
          
          {/* ==================================================================== */}
          {/* 1. DASHBOARD VIEW */}
          {/* ==================================================================== */}
          {activeTab === 'dashboard' && (
            <div className="flex flex-col gap-6">
              
              {/* Welcome Header */}
              <div className="bg-[#161924] border border-[#262C3D] rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">
                    {greeting}, Dinesh!
                  </h1>
                  <p className="text-sm text-slate-400 mt-1">
                    Plan your day, one task at a time.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => openAddModal()}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#EA580C] hover:bg-[#D97706] rounded-lg transition-colors shadow-sm flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Task
                  </button>
                </div>
              </div>

              {/* 4 Summary Cards (Total, Completed, Pending, Overdue) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Total Tasks */}
                <div className="bg-[#161924] border border-[#262C3D] rounded-xl p-5 flex flex-col gap-1 shadow-sm">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    TOTAL TASKS
                  </span>
                  <span className="text-3xl font-bold font-mono tabular-nums text-white mt-1">
                    {stats.totalTasks}
                  </span>
                  <span className="text-xs text-slate-400 mt-1">
                    All tasks
                  </span>
                </div>

                {/* Completed Tasks */}
                <div className="bg-[#161924] border border-[#262C3D] rounded-xl p-5 flex flex-col gap-1 shadow-sm">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    COMPLETED
                  </span>
                  <span className="text-3xl font-bold font-mono tabular-nums text-[#22C55E] mt-1">
                    {stats.completedTasks}
                  </span>
                  <span className="text-xs text-slate-400 mt-1">
                    Tasks finished
                  </span>
                </div>

                {/* Pending Tasks */}
                <div className="bg-[#161924] border border-[#262C3D] rounded-xl p-5 flex flex-col gap-1 shadow-sm">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    PENDING
                  </span>
                  <span className="text-3xl font-bold font-mono tabular-nums text-[#F59E0B] mt-1">
                    {stats.pendingTasks}
                  </span>
                  <span className="text-xs text-slate-400 mt-1">
                    Tasks in progress
                  </span>
                </div>

                {/* Overdue Tasks */}
                <div className="bg-[#161924] border border-[#262C3D] rounded-xl p-5 flex flex-col gap-1 shadow-sm">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    OVERDUE
                  </span>
                  <span className={`text-3xl font-bold font-mono tabular-nums mt-1 ${stats.overdueTasks > 0 ? 'text-[#EF4444]' : 'text-slate-400'}`}>
                    {stats.overdueTasks}
                  </span>
                  <span className="text-xs text-slate-400 mt-1">
                    Past due date
                  </span>
                </div>

              </div>

              {/* Completion Progress Bar */}
              <div className="bg-[#161924] border border-[#262C3D] rounded-xl p-5 flex flex-col gap-3 shadow-sm">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-white">Completion Progress</span>
                  <span className="font-mono tabular-nums text-[#F59E0B] font-bold">
                    {stats.completionPercentage}%
                  </span>
                </div>
                <div className="w-full bg-[#0F1117] rounded-full h-3 overflow-hidden border border-[#262C3D]">
                  <div 
                    className="bg-gradient-to-r from-[#EA580C] to-[#F59E0B] h-full transition-all duration-300"
                    style={{ width: `${stats.completionPercentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{stats.completedTasks} of {stats.totalTasks} tasks completed</span>
                  <span>{stats.pendingTasks} remaining</span>
                </div>
              </div>

              {/* Today's Tasks & Upcoming Tasks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Today's Tasks Panel */}
                <div className="bg-[#161924] border border-[#262C3D] rounded-xl p-5 flex flex-col gap-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#F59E0B]" />
                      <h3 className="font-bold text-white text-sm">Today's Tasks</h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('today')}
                      className="text-xs text-[#F59E0B] hover:underline"
                    >
                      View all ({todayCount})
                    </button>
                  </div>
                  
                  <div className="flex flex-col gap-2.5">
                    {tasks.filter(t => isDueToday(t)).slice(0, 4).map(t => (
                      <div 
                        key={t.id} 
                        className="p-3 bg-[#10131C] border border-[#262C3D] rounded-lg flex items-center justify-between gap-3 hover:border-[#38425A] transition-colors"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <button 
                            onClick={() => toggleTask(t.id)} 
                            className="text-slate-400 hover:text-[#22C55E] transition-colors shrink-0"
                            title={t.completed ? "Reopen task" : "Mark complete"}
                          >
                            {t.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                          </button>
                          <div className="truncate">
                            <p className={`text-xs font-medium truncate ${t.completed ? 'line-through text-slate-400' : 'text-white'}`}>
                              {t.title}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {t.category}
                            </p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border shrink-0 ${getPriorityBadge(t.priority)}`}>
                          {t.priority}
                        </span>
                      </div>
                    ))}
                    {tasks.filter(t => isDueToday(t)).length === 0 && (
                      <div className="py-8 text-center flex flex-col items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-slate-600 mb-1" />
                        <p className="text-xs text-slate-400">No tasks due today.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Upcoming Tasks Panel */}
                <div className="bg-[#161924] border border-[#262C3D] rounded-xl p-5 flex flex-col gap-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-[#F59E0B]" />
                      <h3 className="font-bold text-white text-sm">Upcoming Tasks</h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('upcoming')}
                      className="text-xs text-[#F59E0B] hover:underline"
                    >
                      View all ({upcomingCount})
                    </button>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {tasks.filter(t => !t.completed && t.dueDate && t.dueDate > getTodayStr())
                      .sort((a,b) => a.dueDate.localeCompare(b.dueDate))
                      .slice(0, 4)
                      .map(t => (
                        <div 
                          key={t.id} 
                          className="p-3 bg-[#10131C] border border-[#262C3D] rounded-lg flex items-center justify-between gap-3 hover:border-[#38425A] transition-colors"
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
                          <span className="text-[11px] font-mono text-slate-300 shrink-0">
                            {t.dueDate}
                          </span>
                        </div>
                      ))}
                    {tasks.filter(t => !t.completed && t.dueDate && t.dueDate > getTodayStr()).length === 0 && (
                      <div className="py-8 text-center flex flex-col items-center justify-center">
                        <Calendar className="w-8 h-8 text-slate-600 mb-1" />
                        <p className="text-xs text-slate-400">No upcoming tasks scheduled.</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ==================================================================== */}
          {/* 2. TASK LIST VIEWS (All Tasks, Today, Upcoming, Completed) */}
          {/* ==================================================================== */}
          {(activeTab === 'tasks' || activeTab === 'today' || activeTab === 'upcoming' || activeTab === 'completed') && (
            <div className="flex flex-col gap-6">
              
              {/* Header & Controls Toolbar */}
              <div className="bg-[#161924] border border-[#262C3D] rounded-xl p-5 flex flex-col gap-4 shadow-sm">
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-white capitalize">
                      {activeTab === 'today' && "Today's Tasks"}
                      {activeTab === 'upcoming' && "Upcoming Tasks"}
                      {activeTab === 'completed' && "Completed Tasks"}
                      {activeTab === 'tasks' && "All Tasks"}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Showing {displayTasks.length} task(s)
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {completedCount > 0 && (activeTab === 'completed' || activeTab === 'tasks') && (
                      <button 
                        onClick={clearCompleted}
                        className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-[#222838] hover:bg-[#2C344A] rounded-lg transition-colors"
                      >
                        Clear Completed ({completedCount})
                      </button>
                    )}
                    <button 
                      onClick={() => openAddModal()}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#EA580C] hover:bg-[#D97706] rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Task
                    </button>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 border-t border-[#262C3D]">
                  
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input 
                      type="text"
                      placeholder="Search tasks..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full bg-[#0F1117] border border-[#262C3D] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#F59E0B]"
                    />
                  </div>

                  {/* Category Filter */}
                  <select 
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    className="bg-[#0F1117] border border-[#262C3D] rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#F59E0B]"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="WORK">Work</option>
                    <option value="PROJECTS">Projects</option>
                    <option value="COLLEGE">College</option>
                    <option value="PERSONAL">Personal</option>
                    <option value="OTHER">Other</option>
                  </select>

                  {/* Priority Filter */}
                  <select 
                    value={priorityFilter}
                    onChange={e => setPriorityFilter(e.target.value)}
                    className="bg-[#0F1117] border border-[#262C3D] rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#F59E0B]"
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
                    className="bg-[#0F1117] border border-[#262C3D] rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#F59E0B]"
                    disabled={activeTab !== 'tasks'}
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
                    className="bg-[#0F1117] border border-[#262C3D] rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#F59E0B]"
                  >
                    <option value="PRIORITY_DESC">Sort: Priority (High to Low)</option>
                    <option value="DUE_DATE_ASC">Sort: Due Date (Nearest First)</option>
                    <option value="DUE_DATE_DESC">Sort: Due Date (Furthest First)</option>
                    <option value="TITLE_ASC">Sort: Title (A-Z)</option>
                    <option value="CREATED_AT_DESC">Sort: Newest First</option>
                  </select>

                </div>

              </div>

              {/* Tasks List */}
              <div className="flex flex-col gap-3">
                {displayTasks.length === 0 ? (
                  <div className="bg-[#161924] border border-[#262C3D] rounded-xl p-12 text-center flex flex-col items-center justify-center shadow-sm">
                    <CheckCircle2 className="w-10 h-10 text-slate-600 mb-2" />
                    <p className="text-sm font-semibold text-slate-300">No tasks found.</p>
                    <p className="text-xs text-slate-400 mt-1">Try modifying your filter or create a new task.</p>
                  </div>
                ) : (
                  displayTasks.map(task => {
                    const overdue = isOverdue(task);
                    return (
                      <div 
                        key={task.id}
                        className={`bg-[#161924] border rounded-xl p-4 sm:p-5 flex items-center justify-between gap-4 transition-all shadow-sm ${task.completed ? 'border-[#262C3D]/60 opacity-70' : 'border-[#262C3D] hover:border-[#38425A]'}`}
                      >
                        {/* Checkbox & Details */}
                        <div className="flex items-start gap-3.5 flex-1 min-w-0">
                          <button 
                            onClick={() => toggleTask(task.id)}
                            className="mt-0.5 text-slate-400 hover:text-[#22C55E] transition-colors shrink-0"
                            title={task.completed ? "Reopen Task" : "Mark Complete"}
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
                              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                {task.description}
                              </p>
                            )}

                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-2 flex-wrap">
                              <span className={`px-2 py-0.5 rounded border text-[11px] font-medium ${getCategoryBadge(task.category)}`}>
                                {task.category}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${getPriorityBadge(task.priority)}`}>
                                {task.priority} Priority
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className={`text-xs ${overdue ? 'text-[#EF4444] font-semibold' : 'text-slate-300'}`}>
                                {overdue ? `Overdue (${task.dueDate})` : `Due: ${task.dueDate || 'None'}`}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button 
                            onClick={() => toggleTask(task.id)}
                            className="px-2.5 py-1 text-xs rounded-lg border border-[#262C3D] text-slate-300 hover:text-white hover:bg-[#222838] transition-colors hidden sm:inline-block"
                          >
                            {task.completed ? "Reopen" : "Complete"}
                          </button>
                          <button 
                            onClick={() => openEditModal(task)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-[#222838] rounded-lg transition-colors"
                            title="Edit Task"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => deleteTask(task)}
                            className="p-1.5 text-slate-400 hover:text-[#EF4444] hover:bg-[#222838] rounded-lg transition-colors"
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

          {/* ==================================================================== */}
          {/* 3. CATEGORIES VIEW */}
          {/* ==================================================================== */}
          {activeTab === 'categories' && (
            <div className="flex flex-col gap-6">
              
              <div className="bg-[#161924] border border-[#262C3D] rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FolderKanban className="w-5 h-5 text-[#F59E0B]" />
                    Categories
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Manage tasks grouped by project and area.
                  </p>
                </div>
                <button 
                  onClick={() => openAddModal()}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#EA580C] hover:bg-[#D97706] rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Task
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(['WORK', 'PROJECTS', 'COLLEGE', 'PERSONAL', 'OTHER'] as Category[]).map(cat => {
                  const catTasks = tasks.filter(t => t.category === cat);
                  const catCompleted = catTasks.filter(t => t.completed).length;
                  const catPending = catTasks.length - catCompleted;
                  const catPct = catTasks.length > 0 ? Math.round((catCompleted / catTasks.length) * 100) : 0;

                  return (
                    <div 
                      key={cat}
                      className="bg-[#161924] border border-[#262C3D] rounded-xl p-5 flex flex-col gap-4 hover:border-[#38425A] transition-colors shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{cat}</span>
                        <span className="font-mono text-xs text-[#F59E0B] font-semibold">{catPct}% Done</span>
                      </div>

                      <div className="w-full bg-[#0F1117] rounded-full h-2 overflow-hidden border border-[#262C3D]">
                        <div 
                          className="bg-gradient-to-r from-[#EA580C] to-[#F59E0B] h-full transition-all duration-300"
                          style={{ width: `${catPct}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>{catTasks.length} total tasks</span>
                        <span>{catPending} pending</span>
                      </div>

                      <div className="pt-2 border-t border-[#262C3D] flex items-center gap-2">
                        <button 
                          onClick={() => {
                            setCategoryFilter(cat);
                            setActiveTab('tasks');
                          }}
                          className="flex-1 py-1.5 text-xs font-medium text-slate-200 bg-[#222838] hover:bg-[#2C344A] rounded-lg transition-colors text-center"
                        >
                          View Tasks ({catTasks.length})
                        </button>
                        <button 
                          onClick={() => openAddModal(cat)}
                          className="p-1.5 text-slate-300 hover:text-white bg-[#222838] hover:bg-[#2C344A] rounded-lg transition-colors"
                          title={`Add ${cat} Task`}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* ==================================================================== */}
          {/* 4. SETTINGS VIEW */}
          {/* ==================================================================== */}
          {activeTab === 'settings' && (
            <div className="flex flex-col gap-6">
              
              <div className="bg-[#161924] border border-[#262C3D] rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <SettingsIcon className="w-5 h-5 text-[#F59E0B]" />
                  Settings
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Task preferences and data options.
                </p>
              </div>

              {/* Data & Preferences */}
              <div className="bg-[#161924] border border-[#262C3D] rounded-xl p-6 flex flex-col gap-5 shadow-sm">
                <h3 className="text-sm font-semibold text-white">Task Preferences</h3>
                
                <div className="flex items-center justify-between pb-4 border-b border-[#262C3D]">
                  <div>
                    <p className="text-xs font-medium text-white">Auto-save State</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Automatically save task modifications</p>
                  </div>
                  <button 
                    onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
                    className={`px-3 py-1 text-xs font-medium rounded-lg border transition-colors ${autoSaveEnabled ? 'bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                  >
                    {autoSaveEnabled ? "Enabled" : "Disabled"}
                  </button>
                </div>

                <div className="flex items-center justify-between pb-4 border-b border-[#262C3D]">
                  <div>
                    <p className="text-xs font-medium text-white">Overdue Highlights</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Highlight tasks past their due date in red</p>
                  </div>
                  <button 
                    onClick={() => setShowOverdueBanner(!showOverdueBanner)}
                    className={`px-3 py-1 text-xs font-medium rounded-lg border transition-colors ${showOverdueBanner ? 'bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B]' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                  >
                    {showOverdueBanner ? "Active" : "Muted"}
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#262C3D]">
                  <div>
                    <p className="text-xs font-medium text-white">Backup & Restore (CSV)</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Download your task list or restore from a CSV file</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleDownloadCsv}
                      className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-[#222838] hover:bg-[#2C344A] rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5 text-[#F59E0B]" />
                      Export CSV
                    </button>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-[#222838] hover:bg-[#2C344A] rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#F59E0B]" />
                      Import CSV
                    </button>
                  </div>
                </div>

                {/* Administrator Profile in Settings */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <p className="text-xs font-medium text-white">Administrator</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Dinesh Nikam · System Administrator</p>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-1 rounded bg-[#0F1117] border border-[#262C3D] text-slate-300">
                    Administrator
                  </span>
                </div>
              </div>

            </div>
          )}

        </main>
      </div>

      {/* CREATE / EDIT TASK MODAL */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-[#161924] border border-[#262C3D] rounded-xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#262C3D]">
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
                  placeholder="e.g. Update client presentation slides"
                  value={modalTitle}
                  onChange={e => setModalTitle(e.target.value)}
                  className="bg-[#0F1117] border border-[#262C3D] rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#F59E0B]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-300">Description (Optional)</label>
                <textarea 
                  rows={3}
                  placeholder="Enter details, notes, or subtasks..."
                  value={modalDesc}
                  onChange={e => setModalDesc(e.target.value)}
                  className="bg-[#0F1117] border border-[#262C3D] rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#F59E0B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-slate-300">Category</label>
                  <select 
                    value={modalCategory}
                    onChange={e => setModalCategory(e.target.value as Category)}
                    className="bg-[#0F1117] border border-[#262C3D] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F59E0B]"
                  >
                    <option value="WORK">Work</option>
                    <option value="PROJECTS">Projects</option>
                    <option value="COLLEGE">College</option>
                    <option value="PERSONAL">Personal</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-slate-300">Priority</label>
                  <select 
                    value={modalPriority}
                    onChange={e => setModalPriority(e.target.value as Priority)}
                    className="bg-[#0F1117] border border-[#262C3D] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F59E0B]"
                  >
                    <option value="HIGH">High Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="LOW">Low Priority</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-300">Due Date (YYYY-MM-DD)</label>
                <input 
                  type="date"
                  value={modalDueDate}
                  onChange={e => setModalDueDate(e.target.value)}
                  className="bg-[#0F1117] border border-[#262C3D] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F59E0B]"
                />
              </div>

              {editingTask && (
                <label className="flex items-center gap-2 font-medium text-slate-300 cursor-pointer pt-1">
                  <input 
                    type="checkbox"
                    checked={modalCompleted}
                    onChange={e => setModalCompleted(e.target.checked)}
                    className="rounded border-[#262C3D] bg-[#0F1117] text-[#EA580C] focus:ring-0"
                  />
                  Mark as completed
                </label>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#262C3D]">
                <button 
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-[#222838] hover:bg-[#2C344A] rounded-lg transition-colors"
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

      {/* CONFIRMATION DIALOG MODAL */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-[#161924] border border-[#262C3D] rounded-xl max-w-sm w-full p-6 shadow-2xl flex flex-col gap-4">
            <h3 className="font-bold text-white text-base">{confirmDialog.title}</h3>
            <p className="text-xs text-slate-300 leading-relaxed">{confirmDialog.message}</p>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#262C3D]">
              <button 
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-[#222838] hover:bg-[#2C344A] rounded-lg transition-colors"
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
