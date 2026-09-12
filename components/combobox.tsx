'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

interface ComboboxProps {
  value: string;
  options: string[];
  placeholder?: string;
  clearLabel?: string;
  onChange: (value: string) => void;
  className?: string;
}

export function Combobox({ value, options, placeholder, clearLabel = 'Ninguno', onChange, className }: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState(value);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  function openWithCurrentValue() {
    setQuery(value);
    setOpen(true);
  }

  function commit(next: string) {
    setOpen(false);
    const trimmed = next.trim();
    if (trimmed !== value) onChange(trimmed);
  }

  React.useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: PointerEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        commit(query);
      }
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, query]);

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = options.filter((o) => o.toLowerCase().includes(normalizedQuery));
  const exactMatch = options.some((o) => o.toLowerCase() === normalizedQuery);
  const showCreate = query.trim() && !exactMatch;

  return (
    <div ref={wrapperRef} className={cn('relative', className)}>
      <input
        value={open ? query : value}
        onFocus={openWithCurrentValue}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit(query);
          }
          if (e.key === 'Escape') {
            setQuery(value);
            setOpen(false);
          }
        }}
        placeholder={placeholder}
        className="h-8 w-full rounded-full border border-input bg-input/30 px-2.5 text-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
      />
      {open ? (
        <div className="absolute z-10 mt-1 max-h-48 w-max min-w-full overflow-auto rounded-2xl border border-border bg-popover p-1 shadow-md">
          <button
            type="button"
            className="block w-full rounded-lg px-2 py-1 text-left text-xs text-muted-foreground hover:bg-muted"
            onClick={() => commit('')}
          >
            {clearLabel}
          </button>
          {filtered.map((o) => (
            <button
              key={o}
              type="button"
              className="block w-full rounded-lg px-2 py-1 text-left text-xs hover:bg-muted"
              onClick={() => commit(o)}
            >
              {o}
            </button>
          ))}
          {showCreate ? (
            <button
              type="button"
              className="block w-full rounded-lg px-2 py-1 text-left text-xs text-primary hover:bg-muted"
              onClick={() => commit(query)}
            >
              Crear &ldquo;{query.trim()}&rdquo;
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
