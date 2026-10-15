// src/pendingTasksStorage.js
// Local storage and management for Pending Shift Handover Tasks
// Designed for local testing and prepared for seamless future database (e.g. Supabase) integration.

export const PENDING_TASKS_STORAGE_KEY = 'cc_pending_tasks_data_v1';

/**
 * Retrieves all stored pending tasks from localStorage.
 * Sorts by newest first.
 */
export function getStoredPendingTasks() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PENDING_TASKS_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Sort by createdAt descending (newest first)
    return parsed.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  } catch (err) {
    console.error('Error loading pending tasks from localStorage:', err);
    return [];
  }
}

/**
 * Saves task list to localStorage and notifies listeners.
 */
export function saveStoredPendingTasks(tasks) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(PENDING_TASKS_STORAGE_KEY, JSON.stringify(tasks));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pending_tasks_changed'));
    }
  } catch (err) {
    console.error('Error saving pending tasks to localStorage:', err);
  }
}

/**
 * Creates and stores a new pending task.
 */
export function createPendingTask({ title, details, createdBy }) {
  const currentTasks = getStoredPendingTasks();
  const newTask = {
    id: `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: (title || '').trim(),
    details: (details || '').trim(),
    createdBy: (createdBy || 'Support').trim(),
    createdAt: new Date().toISOString(),
    status: 'pending',
    resolvedBy: null,
    resolutionNotes: null,
    resolvedAt: null,
  };

  const updatedTasks = [newTask, ...currentTasks];
  saveStoredPendingTasks(updatedTasks);
  return { task: newTask, tasks: updatedTasks };
}

/**
 * Marks a task as resolved with mandatory resolution details and user attribution.
 */
export function resolvePendingTask(id, { resolutionNotes, resolvedBy }) {
  const currentTasks = getStoredPendingTasks();
  let resolvedTask = null;

  const updatedTasks = currentTasks.map((t) => {
    if (t.id === id) {
      resolvedTask = {
        ...t,
        status: 'resolved',
        resolutionNotes: (resolutionNotes || '').trim(),
        resolvedBy: (resolvedBy || 'Support').trim(),
        resolvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return resolvedTask;
    }
    return t;
  });

  saveStoredPendingTasks(updatedTasks);
  return { task: resolvedTask, tasks: updatedTasks };
}

/**
 * Re-opens a resolved task back to pending status.
 */
export function reopenPendingTask(id) {
  const currentTasks = getStoredPendingTasks();
  let reopenedTask = null;

  const updatedTasks = currentTasks.map((t) => {
    if (t.id === id) {
      reopenedTask = {
        ...t,
        status: 'pending',
        resolvedBy: null,
        resolutionNotes: null,
        resolvedAt: null,
        reopenedAt: new Date().toISOString(),
      };
      return reopenedTask;
    }
    return t;
  });

  saveStoredPendingTasks(updatedTasks);
  return { task: reopenedTask, tasks: updatedTasks };
}

/**
 * Deletes a task by ID (only allowed if status is resolved).
 */
export function deletePendingTask(id) {
  const currentTasks = getStoredPendingTasks();
  const target = currentTasks.find((t) => t.id === id);
  if (target && target.status === 'pending') {
    console.warn('Cannot delete task while status is pending.');
    return { success: false, error: 'Cannot delete pending tasks', tasks: currentTasks };
  }
  const updatedTasks = currentTasks.filter((t) => t.id !== id);
  saveStoredPendingTasks(updatedTasks);
  return { success: true, tasks: updatedTasks };
}

/**
 * Computes counts of pending vs resolved tasks.
 */
export function getPendingTasksSummary(tasks = null) {
  const list = tasks || getStoredPendingTasks();
  const pendingCount = list.filter((t) => t.status === 'pending').length;
  const resolvedCount = list.filter((t) => t.status === 'resolved').length;
  return {
    total: list.length,
    pending: pendingCount,
    resolved: resolvedCount,
  };
}
