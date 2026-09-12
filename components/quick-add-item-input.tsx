'use client';

import * as React from 'react';

interface QuickAddItemInputProps {
  /** Raw text, one item per line (e.g. "Remeras, 5, Todos, Ropa"). */
  onSubmit: (raw: string) => void;
}

export function QuickAddItemInput({ onSubmit }: QuickAddItemInputProps) {
  const [value, setValue] = React.useState('');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  function resize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue('');
    requestAnimationFrame(resize);
    textareaRef.current?.focus();
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          resize();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
        rows={1}
        placeholder="Agregar item… (nombre, cantidad, categoría, persona — ⌘+Enter para otra línea)"
        className="h-9 w-full min-w-0 resize-none overflow-hidden rounded-3xl border border-input bg-input/30 px-3 py-2 text-base leading-5 transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm"
      />
    </form>
  );
}
