export function formatDate(dateString: string): string {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString();
}

export function formatHours(hours: number): string {
  if (hours === undefined || hours === null) return '0.00';
  return hours.toFixed(2);
}

export function getInitials(name: string): string {
  if (!name) return '';
  return name
    .split(' ')
    .filter(Boolean)
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
} 