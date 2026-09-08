'use client';

import * as React from 'react';

import { Input } from '@/components/ui/input';

interface QuickAddItemInputProps {
  onSubmit: (name: string) => void;
}

export function QuickAddItemInput({ onSubmit }: QuickAddItemInputProps) {
  const [value, setValue] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue('');
    inputRef.current?.focus();
  }

  return (
    <form onSubmit={handleSubmit}>
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Agregar item…"
      />
    </form>
  );
}
