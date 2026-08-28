import * as React from 'react';
import { TextInput, View } from 'react-native';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface QuickAddInputProps {
  onSubmit: (name: string) => void;
  placeholder?: string;
  bordered?: boolean;
  className?: string;
}

export function QuickAddInput({
  onSubmit,
  placeholder = '+ agregar item…',
  bordered = true,
  className,
}: QuickAddInputProps) {
  const [value, setValue] = React.useState('');
  const inputRef = React.useRef<TextInput>(null);

  function handleSubmit() {
    const trimmed = value.trim();
    setValue('');
    if (!trimmed) {
      inputRef.current?.focus();
      return;
    }
    onSubmit(trimmed);
    // Re-focus after the state update so the keyboard stays up for chained adds.
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  return (
    <View className={cn(bordered && 'border-t border-border px-4 py-3', className)}>
      <Input
        ref={inputRef}
        value={value}
        onChangeText={setValue}
        onSubmitEditing={handleSubmit}
        placeholder={placeholder}
        returnKeyType="done"
        blurOnSubmit={false}
      />
    </View>
  );
}
