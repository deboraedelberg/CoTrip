import { normalizeForMatch, resolveAssigneeToken } from './avatar-labels';

export interface ParsedItemLine {
  name: string;
  quantity: number;
  category?: string;
  assigned_to?: string;
  warning?: string;
}

/**
 * Parses one quick-add line like "Remeras, 5, Todos, Ropa" (any order).
 * A segment is quantity if numeric, category/assignee if it matches an
 * existing option — matching ignores case and accents, and an assignee can
 * also be given by their avatar letter ("d", or "d1"/"d2" if that letter is
 * shared). Segments that don't match anything existing (new
 * categories/assignees are allowed) fall back to positional order: name,
 * then person, then category, matching the example order above.
 */
export function parseItemLine(
  line: string,
  categoryOptions: string[],
  assigneeOptions: string[]
): ParsedItemLine {
  const segments = line
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (segments.length <= 1) {
    return { name: segments[0] ?? line.trim(), quantity: 1 };
  }

  let quantity: number | null = null;
  let category: string | undefined;
  let assignedTo: string | undefined;
  let warning: string | undefined;
  const leftover: string[] = [];

  for (const segment of segments) {
    const asNumber = Number(segment);
    if (quantity === null && Number.isFinite(asNumber)) {
      quantity = Math.max(1, Math.round(asNumber));
      continue;
    }

    if (category === undefined) {
      const normalizedSegment = normalizeForMatch(segment);
      const categoryMatch = categoryOptions.find((c) => normalizeForMatch(c) === normalizedSegment);
      if (categoryMatch) {
        category = categoryMatch;
        continue;
      }
    }

    if (assignedTo === undefined) {
      const resolved = resolveAssigneeToken(segment, assigneeOptions);
      if (resolved.value) {
        assignedTo = resolved.value;
        continue;
      }
      if (resolved.ambiguous) {
        warning = `"${segment}" es ambiguo (hay más de una persona con esa inicial) — no se asignó.`;
        continue;
      }
    }

    leftover.push(segment);
  }

  const name = leftover.shift() ?? segments[0];
  if (assignedTo === undefined) assignedTo = leftover.shift();
  if (category === undefined) category = leftover.shift();
  const extraName = leftover.length > 0 ? `, ${leftover.join(', ')}` : '';

  return {
    name: name + extraName,
    quantity: quantity ?? 1,
    category,
    assigned_to: assignedTo,
    warning,
  };
}
