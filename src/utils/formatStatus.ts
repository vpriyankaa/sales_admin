export function formatStatus(status: string | null): string {
  return (status ?? 'Unknown')
    .replace(/[_\s]+/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

function stripQuotes(val: any): string {
  if (typeof val !== "string") return String(val);
  return val.replace(/^"(.*)"$/, "$1");
}

export function formatChange(field: string, oldVal: any, newVal: any): string | null {
  if (oldVal === newVal) return null;

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const fieldCap = capitalize(field);

  const oldIsNull = oldVal === null || oldVal === undefined;
  const newIsNull = newVal === null || newVal === undefined;

  const oldStr = stripQuotes(oldVal);
  const newStr = stripQuotes(newVal);

  if (oldIsNull && !newIsNull) {
    return `${fieldCap} changed to ${newStr}`;
  } else if (!oldIsNull && newIsNull) {
    return `${fieldCap} changed from ${oldStr} to empty`;
  } else {
    return `${fieldCap} changed from ${oldStr} to ${newStr}`;
  }
}

