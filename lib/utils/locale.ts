const displayNameCache = new Map<string, Intl.DisplayNames>();

function getDisplayNames(locale: string, type: "language" | "region") {
  const key = `${locale}:${type}`;
  if (!displayNameCache.has(key)) {
    displayNameCache.set(key, new Intl.DisplayNames([locale], { type }));
  }
  return displayNameCache.get(key)!;
}

export function getCountryName(locale: string, code?: string | null) {
  if (!code) return undefined;
  const normalized = code.toUpperCase();
  try {
    return getDisplayNames(locale, "region").of(normalized) ?? normalized;
  } catch {
    return normalized;
  }
}

export function getLanguageName(locale: string, code?: string | null) {
  if (!code) return undefined;
  const normalized = code.toLowerCase();
  try {
    return getDisplayNames(locale, "language").of(normalized) ?? normalized;
  } catch {
    return normalized;
  }
}
