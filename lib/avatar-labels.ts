/** Case- and accent-insensitive key for matching ("Débora" === "debora"). */
export function normalizeForMatch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Maps each name to the label shown on its avatar: just the initial
 * ("D") normally, or "D1"/"D2" (alphabetical order) when several names
 * share that initial.
 */
export function computeAvatarLabels(names: string[]): Map<string, string> {
  const unique = Array.from(new Set(names));
  const groups = new Map<string, string[]>();

  for (const name of unique) {
    const normalized = normalizeForMatch(name);
    if (!normalized) continue;
    const letter = normalized.charAt(0).toUpperCase();
    const group = groups.get(letter);
    if (group) group.push(name);
    else groups.set(letter, [name]);
  }

  const labels = new Map<string, string>();
  for (const [letter, group] of groups) {
    const sorted = [...group].sort((a, b) => normalizeForMatch(a).localeCompare(normalizeForMatch(b)));
    if (sorted.length === 1) {
      labels.set(sorted[0], letter);
    } else {
      sorted.forEach((name, i) => labels.set(name, `${letter}${i + 1}`));
    }
  }
  return labels;
}

/**
 * Resolves a typed token like "d", "d1" or "nico" against known assignees
 * (accent/case-insensitive, matches full names or avatar labels). Returns
 * `ambiguous: true` when a bare initial matches more than one person —
 * that should NOT default to any of them.
 */
export function resolveAssigneeToken(
  token: string,
  assigneeOptions: string[]
): { value?: string; ambiguous?: boolean } {
  const normalizedToken = normalizeForMatch(token);
  if (!normalizedToken) return {};

  const exact = assigneeOptions.find((o) => normalizeForMatch(o) === normalizedToken);
  if (exact) return { value: exact };

  const labels = computeAvatarLabels(assigneeOptions);
  const byLabel = new Map(Array.from(labels, ([name, label]) => [label.toLowerCase(), name]));
  const labelMatch = byLabel.get(normalizedToken);
  if (labelMatch) return { value: labelMatch };

  if (/^[a-z]$/.test(normalizedToken)) {
    const collision = assigneeOptions.some((o) => normalizeForMatch(o).charAt(0) === normalizedToken);
    if (collision) return { ambiguous: true };
  }

  return {};
}
