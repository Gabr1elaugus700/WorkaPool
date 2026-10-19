export function formatCount(total: number, singular: string, plural: string): string {
  return `${total} ${total === 1 ? singular : plural}`;
}
