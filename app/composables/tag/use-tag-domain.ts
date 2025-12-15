export function normalizeTagLabel(label: string): string {
  return label.trim().toLowerCase();
}

export function isValidTagLabel(label: string): boolean {
  return label.trim().length > 0;
}
