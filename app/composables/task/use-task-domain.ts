export function normalizeTaskTitle(title: string): string {
  return title.trim();
}

export function isValidTaskTitle(title: string): boolean {
  return title.trim().length > 0;
}
