export function getInitials(firstName?: string, lastName?: string, username?: string): string {
  if (firstName || lastName) {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  }
  return username?.charAt(0)?.toUpperCase() || '?';
}
