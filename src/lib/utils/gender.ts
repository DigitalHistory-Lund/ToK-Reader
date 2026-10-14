export function getGenderSymbol(gender: string | null): string {
  if (!gender) return '';
  const lower = gender.toLowerCase();
  if (lower === 'man' || lower === 'män') return '♂';
  if (lower === 'woman' || lower === 'kvinna') return '♀';
  return gender;
}

export function getGenderStyle(gender: string | null): string {
  if (!gender) return 'text-gray-600';
  const lower = gender.toLowerCase();
  if (lower === 'man' || lower === 'män') return 'text-blue-600 font-bold text-lg';
  if (lower === 'woman' || lower === 'kvinna') return 'text-red-600 font-bold text-lg';
  return 'text-gray-600';
}
