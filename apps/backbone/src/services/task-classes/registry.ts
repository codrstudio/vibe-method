import type { TaskClass, TaskWorkflow } from './types.js';
import { loadTaskClasses, loadTaskClass } from './loader.js';

class TaskClassRegistry {
  private classes: Map<string, TaskClass> = new Map();
  private initialized = false;

  /**
   * Initialize the registry by loading all task classes from YAML files
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    const taskClasses = await loadTaskClasses();

    for (const taskClass of taskClasses) {
      this.classes.set(taskClass.name, taskClass);
    }

    this.initialized = true;
    console.log(`[TaskClasses] Registry initialized with ${this.classes.size} classes`);
  }

  /**
   * Get a task class by name
   */
  get(name: string): TaskClass | undefined {
    return this.classes.get(name);
  }

  /**
   * Get all registered task classes
   */
  getAll(): TaskClass[] {
    return Array.from(this.classes.values());
  }

  /**
   * Check if a task class exists
   */
  has(name: string): boolean {
    return this.classes.has(name);
  }

  /**
   * Reload a specific task class from disk
   */
  async reload(name: string): Promise<TaskClass | null> {
    const taskClass = await loadTaskClass(name);

    if (taskClass) {
      this.classes.set(name, taskClass);
      console.log(`[TaskClasses] Reloaded class: ${name}`);
    }

    return taskClass;
  }

  /**
   * Reload all task classes from disk
   */
  async reloadAll(): Promise<void> {
    this.classes.clear();
    this.initialized = false;
    await this.initialize();
  }

  /**
   * Build workflow object to store in notification
   */
  buildWorkflow(taskClass: TaskClass): TaskWorkflow {
    return {
      className: taskClass.name,
      transitions: taskClass.transitions,
      closeRequires: taskClass.closeRequires || [],
      sla: taskClass.sla,
    };
  }

  /**
   * Get initial tags for a task class (from 'open' transition)
   */
  getInitialTags(taskClass: TaskClass): string[] {
    return taskClass.transitions['open'] || [];
  }
}

// Singleton instance
export const taskClassRegistry = new TaskClassRegistry();
