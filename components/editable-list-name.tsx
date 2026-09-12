'use client';

import * as React from 'react';

import { Input } from '@/components/ui/input';

interface EditableListNameProps {
  name: string;
  onRename: (name: string) => void;
}

export function EditableListName({ name, onRename }: EditableListNameProps) {
  const [editing, setEditing] = React.useState(false);
  const [value, setValue] = React.useState(name);
  const inputRef = React.useRef<HTMLInputElement>(null);

  function startEditing() {
    setValue(name);
    setEditing(true);
  }

  React.useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function commit() {
    const trimmed = value.trim();
    setEditing(false);
    if (!trimmed || trimmed === name) {
      setValue(name);
      return;
    }
    onRename(trimmed);
  }

  if (editing) {
    return (
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') {
            setValue(name);
            setEditing(false);
          }
        }}
        className="h-auto px-2 py-0.5 text-xl font-semibold"
      />
    );
  }

  return (
    <h1
      className="cursor-pointer rounded px-2 py-0.5 text-xl font-semibold hover:bg-muted"
      onClick={startEditing}
    >
      {name}
    </h1>
  );
}
