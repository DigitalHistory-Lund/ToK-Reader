import partyColorsConfig from '@/config/partyColors.json';

export function getPartyColor(partyName: string | null): string {
  if (!partyName) return partyColorsConfig.default.color;

  const parties = partyColorsConfig.parties as Record<string, { color: string }>;

  // Try exact match
  if (parties[partyName]) {
    return parties[partyName].color;
  }

  // Try case-insensitive normalized match
  const normalized = partyName.toLowerCase().replace(/\s+/g, '').replace(/ä/g, 'a').replace(/ö/g, 'o');

  for (const [key, config] of Object.entries(parties)) {
    const keyNormalized = key.toLowerCase().replace(/\s+/g, '').replace(/ä/g, 'a').replace(/ö/g, 'o');
    if (keyNormalized === normalized) {
      return config.color;
    }
  }

  return partyColorsConfig.default.color;
}

export function getContrastTextColor(backgroundColor: string): string {
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}
