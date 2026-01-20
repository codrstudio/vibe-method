import { DefaultTaskView } from "./default-task-view"

// Registry of custom task views by class name
export const taskViewRegistry: Record<
  string,
  React.ComponentType<{ task: any; taskClass?: any }>
> = {
  // Add custom views here:
  // "document-approval": DocumentApprovalView,
  // "support-ticket": SupportTicketView,
}

// Get the view component for a task class
export function getTaskView(className: string) {
  return taskViewRegistry[className] || DefaultTaskView
}

export { DefaultTaskView }
