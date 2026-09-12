// Fixed palette with pre-checked WCAG contrast against their paired text
// color, so any name/email hashes to a combo that's readable either way.
const AVATAR_PALETTE = [
  { bg: '#dc2626', fg: '#ffffff' }, // red
  { bg: '#c2410c', fg: '#ffffff' }, // orange
  { bg: '#f59e0b', fg: '#111827' }, // amber (dark text — light background)
  { bg: '#15803d', fg: '#ffffff' }, // green
  { bg: '#0f766e', fg: '#ffffff' }, // teal
  { bg: '#2563eb', fg: '#ffffff' }, // blue
  { bg: '#7c3aed', fg: '#ffffff' }, // violet
  { bg: '#db2777', fg: '#ffffff' }, // pink
];

/** Deterministic color for a person's name/email, stable across sessions. */
export function avatarColor(key: string) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}
