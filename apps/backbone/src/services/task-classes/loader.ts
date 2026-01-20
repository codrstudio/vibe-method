import { readdir, readFile } from 'fs/promises';
import { join, resolve } from 'path';
import { parse as parseYaml } from 'yaml';
import { TaskClassSchema, type TaskClass } from './types.js';

const TASK_CLASSES_DIR = resolve(process.cwd(), '../../specs/task-classes');

/**
 * Loads all task class YAML files from specs/task-classes directory
 */
export async function loadTaskClasses(): Promise<TaskClass[]> {
  const classes: TaskClass[] = [];

  try {
    const files = await readdir(TASK_CLASSES_DIR);
    const yamlFiles = files.filter(
      (f) => (f.endsWith('.yaml') || f.endsWith('.yml')) && !f.startsWith('_')
    );

    for (const file of yamlFiles) {
      try {
        const filePath = join(TASK_CLASSES_DIR, file);
        const content = await readFile(filePath, 'utf-8');
        const parsed = parseYaml(content);

        const validated = TaskClassSchema.parse(parsed);
        classes.push(validated);

        console.log(`[TaskClasses] Loaded class: ${validated.name}`);
      } catch (err) {
        console.error(`[TaskClasses] Error loading ${file}:`, err);
      }
    }
  } catch (err) {
    console.error('[TaskClasses] Error reading task classes directory:', err);
  }

  return classes;
}

/**
 * Loads a single task class by name
 */
export async function loadTaskClass(name: string): Promise<TaskClass | null> {
  const extensions = ['.yaml', '.yml'];

  for (const ext of extensions) {
    try {
      const filePath = join(TASK_CLASSES_DIR, `${name}${ext}`);
      const content = await readFile(filePath, 'utf-8');
      const parsed = parseYaml(content);

      return TaskClassSchema.parse(parsed);
    } catch {
      // Continue to next extension
    }
  }

  return null;
}
