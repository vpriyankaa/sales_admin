export function formatStatus(status: string | null): string {
  return (status ?? 'Unknown')
    .replace(/[_\s]+/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}


export function formatChange(field: string, oldVal: any, newVal: any): string | null {
  if (oldVal === newVal) return null; // no change

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const fieldCap = capitalize(field);

  const oldIsNull = oldVal === null || oldVal === undefined;
  const newIsNull = newVal === null || newVal === undefined;

  if (oldIsNull && !newIsNull) {
    return `${fieldCap} changed to ${newVal}`;
  } else if (!oldIsNull && newIsNull) {
    return `${fieldCap} changed from ${oldVal} to null`;
  } else {
    return `${fieldCap} changed from ${oldVal}  to "${newVal}"`;
  }
}
