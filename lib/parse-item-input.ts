export interface ParsedItemLine {
  name: string;
  quantity: number;
  category?: string;
  assigned_to?: string;
}

/**
 * Parses one quick-add line like "Remeras, 5, Todos, Ropa" (any order).
 * A segment is quantity if numeric, category/assignee if it matches an
 * existing option (case-insensitive) — this part works in any order.
 * Segments that don't match anything existing (new categories/assignees
 * are allowed) fall back to positional order: name, then person, then
 * category, matching the example order above.
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

  const categoryByLower = new Map(categoryOptions.map((c) => [c.toLowerCase(), c]));
  const assigneeByLower = new Map(assigneeOptions.map((a) => [a.toLowerCase(), a]));

  let quantity: number | null = null;
  let category: string | undefined;
  let assignedTo: string | undefined;
  const leftover: string[] = [];

  for (const segment of segments) {
    const asNumber = Number(segment);
    if (quantity === null && Number.isFinite(asNumber)) {
      quantity = Math.max(1, Math.round(asNumber));
      continue;
    }
    const lower = segment.toLowerCase();
    if (category === undefined && categoryByLower.has(lower)) {
      category = categoryByLower.get(lower);
      continue;
    }
    if (assignedTo === undefined && assigneeByLower.has(lower)) {
      assignedTo = assigneeByLower.get(lower);
      continue;
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
  };
}
