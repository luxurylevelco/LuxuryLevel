export interface BrandIndexEntry {
  name: string;
  normalized: string;
  compact: string;
  tokens: string[];
  tokenCount: number;
}

const decodeHtmlEntities = (value: string): string => {
  return value
    .replace(/&#0*38;|&amp;/gi, "&")
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&nbsp;/gi, " ");
};

const normalizeBrandText = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const decoded = decodeHtmlEntities(value);
  const withoutDiacritics = decoded.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const normalized = withoutDiacritics
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/["'.]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return normalized.length > 0 ? normalized : null;
};

const normalizeBrandCompact = (value: string | null | undefined): string | null => {
  const normalized = normalizeBrandText(value);
  return normalized ? normalized.replace(/\s+/g, "") : null;
};

export const buildBrandIndex = (names: string[]): BrandIndexEntry[] => {
  const entries: BrandIndexEntry[] = [];

  for (const name of names) {
    const normalized = normalizeBrandText(name);
    const compact = normalizeBrandCompact(name);
    if (!normalized || !compact) continue;

    const tokens = normalized.split(" ").filter(Boolean);
    if (tokens.length === 0) continue;

    entries.push({
      name,
      normalized,
      compact,
      tokens,
      tokenCount: tokens.length,
    });
  }

  return entries;
};

const hasTokenSequence = (textTokens: string[], brandTokens: string[]): boolean => {
  if (brandTokens.length === 0 || textTokens.length < brandTokens.length) return false;
  for (let i = 0; i <= textTokens.length - brandTokens.length; i += 1) {
    let matched = true;
    for (let j = 0; j < brandTokens.length; j += 1) {
      if (textTokens[i + j] !== brandTokens[j]) {
        matched = false;
        break;
      }
    }
    if (matched) return true;
  }
  return false;
};

const isNearMatch = (a: string, b: string, maxDistance: number): boolean => {
  if (a === b) return true;
  const lengthDiff = Math.abs(a.length - b.length);
  if (lengthDiff > maxDistance) return false;

  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) dp[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) dp[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[a.length][b.length] <= maxDistance;
};

const scoreMatch = (
  entry: BrandIndexEntry,
  compactText: string,
  textTokens: string[]
): { matches: boolean; score: number } => {
  const tokenMatch = hasTokenSequence(textTokens, entry.tokens);
  const compactMatch = compactText.includes(entry.compact);
  const prefixMatch =
    compactText.length >= 3 && entry.compact.startsWith(compactText);
  const nearMatch =
    compactText.length >= 6 && isNearMatch(compactText, entry.compact, 1);

  if (!tokenMatch && !compactMatch && !prefixMatch && !nearMatch) {
    return { matches: false, score: 0 };
  }

  const baseScore = tokenMatch
    ? 40
    : compactMatch
      ? 30
      : prefixMatch
        ? 20
        : 10;

  const score = baseScore + entry.tokenCount * 2 + entry.compact.length;
  return { matches: true, score };
};

export const matchBrandFromText = (
  index: BrandIndexEntry[],
  text: string | null | undefined
): BrandIndexEntry | null => {
  const normalizedText = normalizeBrandText(text);
  if (!normalizedText) return null;

  const compactText = normalizedText.replace(/\s+/g, "");
  const textTokens = normalizedText.split(" ").filter(Boolean);

  let best: BrandIndexEntry | null = null;
  let bestScore = 0;

  for (const entry of index) {
    const { matches, score } = scoreMatch(entry, compactText, textTokens);
    if (!matches) continue;

    if (!best || score > bestScore) {
      best = entry;
      bestScore = score;
    }
  }

  return best;
};

export const matchBrandFromCandidates = (
  index: BrandIndexEntry[],
  candidates: Array<string | null | undefined>
): string | null => {
  let best: BrandIndexEntry | null = null;
  let bestScore = 0;

  for (const candidate of candidates) {
    const normalizedText = normalizeBrandText(candidate);
    if (!normalizedText) continue;

    const compactText = normalizedText.replace(/\s+/g, "");
    const textTokens = normalizedText.split(" ").filter(Boolean);

    for (const entry of index) {
      const { matches, score } = scoreMatch(entry, compactText, textTokens);
      if (!matches) continue;

      if (!best || score > bestScore) {
        best = entry;
        bestScore = score;
      }
    }
  }

  return best ? best.name : null;
};
