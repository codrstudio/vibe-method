import type { TaskClass, TaskWorkflow, TransitionValidation } from './types.js';

/**
 * Validates if a transition from current tags to a target tag is allowed
 */
export function validateTransition(
  workflow: TaskWorkflow,
  currentTags: string[],
  targetTag: string
): TransitionValidation {
  // Get all allowed transitions from current tags
  const allowedTargets = new Set<string>();

  for (const currentTag of currentTags) {
    const targets = workflow.transitions[currentTag];
    if (targets) {
      targets.forEach((t) => allowedTargets.add(t));
    }
  }

  // If no current tags, check 'open' transition
  if (currentTags.length === 0) {
    const openTargets = workflow.transitions['open'];
    if (openTargets) {
      openTargets.forEach((t) => allowedTargets.add(t));
    }
  }

  const allowedArray = Array.from(allowedTargets);

  if (allowedTargets.has(targetTag)) {
    return { valid: true, allowedTargets: allowedArray };
  }

  return {
    valid: false,
    error: `Transition to '${targetTag}' not allowed from current state. Allowed: ${allowedArray.join(', ') || 'none'}`,
    allowedTargets: allowedArray,
  };
}

/**
 * Validates if a task can be closed based on its current tags
 */
export function validateClose(
  workflow: TaskWorkflow,
  currentTags: string[]
): TransitionValidation {
  const closeRequires = workflow.closeRequires || [];

  // If no closeRequires defined, allow closing from any state
  if (closeRequires.length === 0) {
    return { valid: true };
  }

  // Check if any current tag is in closeRequires
  const hasRequiredTag = currentTags.some((tag) => closeRequires.includes(tag));

  if (hasRequiredTag) {
    return { valid: true };
  }

  return {
    valid: false,
    error: `Task cannot be closed. Must be in one of these states: ${closeRequires.join(', ')}`,
    allowedTargets: closeRequires,
  };
}

/**
 * Validates a task class definition for consistency
 */
export function validateTaskClass(taskClass: TaskClass): string[] {
  const errors: string[] = [];

  // Check that all tags in transitions exist in tags array
  const allTags = new Set(taskClass.tags);

  for (const [source, targets] of Object.entries(taskClass.transitions)) {
    // 'open' is a special source, doesn't need to be in tags
    if (source !== 'open' && !allTags.has(source)) {
      errors.push(`Transition source '${source}' not in tags array`);
    }

    for (const target of targets) {
      if (!allTags.has(target)) {
        errors.push(`Transition target '${target}' not in tags array`);
      }
    }
  }

  // Check that closeRequires tags exist in tags array
  if (taskClass.closeRequires) {
    for (const tag of taskClass.closeRequires) {
      if (!allTags.has(tag)) {
        errors.push(`closeRequires tag '${tag}' not in tags array`);
      }
    }
  }

  // Check that tagConfig keys match tags
  if (taskClass.tagConfig) {
    for (const tag of Object.keys(taskClass.tagConfig)) {
      if (!allTags.has(tag)) {
        errors.push(`tagConfig key '${tag}' not in tags array`);
      }
    }
  }

  return errors;
}

/**
 * Get allowed targets for transition from current tags
 */
export function getAllowedTransitions(
  workflow: TaskWorkflow,
  currentTags: string[]
): string[] {
  const allowedTargets = new Set<string>();

  for (const currentTag of currentTags) {
    const targets = workflow.transitions[currentTag];
    if (targets) {
      targets.forEach((t) => allowedTargets.add(t));
    }
  }

  // If no current tags, check 'open' transition
  if (currentTags.length === 0) {
    const openTargets = workflow.transitions['open'];
    if (openTargets) {
      openTargets.forEach((t) => allowedTargets.add(t));
    }
  }

  return Array.from(allowedTargets);
}
