'use client';

import { Plus } from 'lucide-react';
import * as React from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { avatarColor } from '@/lib/avatar-color';
import { cn } from '@/lib/utils';

interface ComboboxProps {
  value: string;
  options: string[];
  placeholder?: string;
  clearLabel?: string;
  onChange: (value: string) => void;
  className?: string;
  /** 'input' shows the value as a text field; 'avatar' shows a compact avatar trigger (for assignee). */
  variant?: 'input' | 'avatar';
}

export function Combobox({
  value,
  options,
  placeholder,
  clearLabel = 'Ninguno',
  onChange,
  className,
  variant = 'input',
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState(value);
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

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
    if (variant === 'avatar') inputRef.current?.focus();
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

  const optionsList = (
    <div
      className={cn(
        'absolute z-10 mt-1 max-h-48 w-max min-w-full overflow-auto rounded-2xl border border-border bg-popover p-1 shadow-md',
        variant === 'avatar' ? 'right-0' : 'left-0'
      )}
    >
      {variant === 'avatar' ? (
        <input
          ref={inputRef}
          value={query}
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
          className="mb-1 h-8 w-full rounded-full border border-input bg-input/30 px-2.5 text-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
      ) : null}
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
  );

  if (variant === 'avatar') {
    const color = value ? avatarColor(value) : null;
    return (
      <div ref={wrapperRef} className={cn('relative shrink-0', className)}>
        <button type="button" onClick={openWithCurrentValue} title={value || placeholder}>
          <Avatar size="sm">
            {value && color ? (
              <AvatarFallback
                className="font-semibold"
                style={{ backgroundColor: color.bg, color: color.fg }}
              >
                {value.trim().slice(0, 1).toUpperCase()}
              </AvatarFallback>
            ) : (
              <AvatarFallback>
                <Plus className="size-3.5" />
              </AvatarFallback>
            )}
          </Avatar>
        </button>
        {open ? optionsList : null}
      </div>
    );
  }

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
        className={cn(
          'h-8 w-full rounded-full border px-2.5 text-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
          open ? 'border-input bg-input/30' : 'border-transparent bg-transparent hover:bg-muted/50'
        )}
      />
      {open ? optionsList : null}
    </div>
  );
}
