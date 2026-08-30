import { Plus } from 'lucide-react-native';
import * as React from 'react';
import { TextInput } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';

interface QuickAddInputProps {
  onSubmit: (name: string) => void;
  placeholder?: string;
  label?: string;
}

export function QuickAddInput({
  onSubmit,
  placeholder = 'Nombre del item…',
  label = 'Agregar item',
}: QuickAddInputProps) {
  const [active, setActive] = React.useState(false);
  const [value, setValue] = React.useState('');
  const inputRef = React.useRef<TextInput>(null);

  function handleSubmit() {
    const trimmed = value.trim();
    setValue('');
    if (!trimmed) {
      setActive(false);
      return;
    }
    onSubmit(trimmed);
    // Re-focus after the state update so the keyboard stays up for chained adds.
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  if (!active) {
    return (
      <Button variant="secondary" size="sm" onPress={() => setActive(true)}>
        <Icon as={Plus} size={16} />
        <Text>{label}</Text>
      </Button>
    );
  }

  return (
    <Input
      ref={inputRef}
      autoFocus
      value={value}
      onChangeText={setValue}
      onSubmitEditing={handleSubmit}
      onBlur={handleSubmit}
      placeholder={placeholder}
      returnKeyType="done"
      blurOnSubmit={false}
      className="h-9 min-w-40 flex-1"
    />
  );
}
