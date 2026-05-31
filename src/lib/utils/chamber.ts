export function getChamberLabel(kammare: number | null | undefined): string | null {
  if (kammare === 1) return 'Första kammaren';
  if (kammare === 2) return 'Andra kammaren';
  return null;
}
