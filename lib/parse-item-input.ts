export interface ParsedItemLine {
  name: string;
  quantity: number;
  category?: string;
  assigned_to?: string;
}

/**
 * Parses one quick-add line like "Remeras, 5, Todos, Ropa" (any order).
 * A segment is quantity if numeric, category/assignee if it matches an
 * existing option (case-insensitive); anything left over becomes the name.
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
  const remaining: string[] = [];

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
    remaining.push(segment);
  }

  return {
    name: remaining.length > 0 ? remaining.join(', ') : segments[0],
    quantity: quantity ?? 1,
    category,
    assigned_to: assignedTo,
  };
}
